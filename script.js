const SB_URL = "https://uojbmzwagmojtdddggfz.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvamJtendhZ21vanRkZGRnZ2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzMyODMsImV4cCI6MjA5MTQwOTI4M30.n3vzyV6JiJqqrgUEwASYih5xxxJY1QmiVVbe-TIqkeU";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

const ALL_BUGS = [
    { name: "MERRARI", img: "Merrari.png" },
    { name: "MASTON KARTIN", img: "MastonKartin.png" },
    { name: "EKLEREN", img: "Ekleren.png" },
    { name: "AASS", img: "Aass.png" },
    { name: "RED ROACH", img: "RedRoach.png" },
    { name: "MILLYIMS", img: "Millyıms.png" }
];

let myId = localStorage.getItem('h1_id') || 'p' + Math.floor(Math.random() * 9999);
localStorage.setItem('h1_id', myId);
let myBalance = parseFloat(localStorage.getItem('h1_balance')) || 10000;
let currentRoom = null;
let selectedBug = null;

async function joinOrCreateLobby() {
    const code = document.getElementById('lobby-input').value.toUpperCase();
    if(!code) return;

    let { data: room } = await supabaseClient.from('h1_lobby').select('*').eq('room_code', code).maybeSingle();
    if(!room) {
        const { data } = await supabaseClient.from('h1_lobby').insert([{ room_code: code, players: [] }]).select().single();
        room = data;
    }
    
    currentRoom = room;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'flex';
    document.getElementById('room-code-display').innerText = code;
    document.getElementById('my-balance-display').innerText = myBalance.toFixed(2);
    renderBugs();
    subscribeRoom(code);
}

function renderBugs() {
    const grid = document.getElementById('bug-grid');
    grid.innerHTML = ALL_BUGS.map(bug => {
        const isTaken = currentRoom.players.find(p => p.bug === bug.name && p.id !== myId);
        return `<div class="bug-card ${isTaken ? 'taken' : ''} ${selectedBug === bug.name ? 'selected' : ''}" onclick="selectBug('${bug.name}')">
            <img src="${bug.img}" style="width:60px;"><p>${bug.name}</p></div>`;
    }).join('');
}

window.selectBug = (n) => { selectedBug = n; renderBugs(); };

async function playerReady() {
    const bet = parseFloat(document.getElementById('bet-amount').value);
    if(bet > myBalance || bet <= 0) return alert("YDL Yetersiz!");
    myBalance -= bet;
    localStorage.setItem('h1_balance', myBalance);
    
    const newPlayers = [...currentRoom.players.filter(p => p.id !== myId), { id: myId, bug: selectedBug, bet: bet, ready: true }];
    await supabaseClient.from('h1_lobby').update({ players: newPlayers }).eq('room_code', currentRoom.room_code);
    document.getElementById('ready-btn').disabled = true;
}

function subscribeRoom(code) {
    supabaseClient.channel('h1').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'h1_lobby' }, payload => {
        currentRoom = payload.new;
        renderBugs();
        if(currentRoom.status === 'racing' && document.getElementById('race-screen').style.display !== 'block') startRace();
        if(currentRoom.status === 'waiting' && currentRoom.players.length >= 2 && currentRoom.players.every(p => p.ready)) {
            if(currentRoom.players[0].id === myId) supabaseClient.from('h1_lobby').update({ status: 'racing' }).eq('room_code', code);
        }
    }).subscribe();
}

function startRace() {
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('race-screen').style.display = 'block';
    const pool = currentRoom.players.reduce((a, b) => a + b.bet, 0);
    const lanes = document.querySelectorAll('.lane');
    let results = [];

    currentRoom.players.forEach((p, i) => {
        const bug = ALL_BUGS.find(b => b.name === p.bug);
        const img = document.createElement('img');
        img.src = bug.img; img.className = 'cockroach';
        lanes[i].appendChild(img);
        const time = (Math.random() * 8 + 7).toFixed(2);
        results.push({ id: p.id, name: p.bug, img: bug.img, time: parseFloat(time) });
        setTimeout(() => { img.style.top = "110vh"; img.style.transition = `top ${time}s linear`; }, 100);
    });

    const winner = results.sort((a, b) => a.time - b.time)[0];
    setTimeout(() => {
        if(winner.id === myId) { myBalance += pool; localStorage.setItem('h1_balance', myBalance); }
        showWinner(winner, pool);
    }, winner.time * 1000);
}

function showWinner(w, p) {
    document.getElementById('race-screen').style.display = 'none';
    document.getElementById('winner-screen').style.display = 'flex';
    document.getElementById('win-img').src = w.img;
    document.getElementById('win-name').innerText = w.name;
    document.getElementById('profit-info').innerText = (w.id === myId) ? `KAZANDIN: +${p} YDL` : "KAYBETTİN";
}