const SB_URL = "https://uojbmzwagmojtdddggfz.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvamJtendhZ21vanRkZGRnZ2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzMyODMsImV4cCI6MjA5MTQwOTI4M30.n3vzyV6JiJqqrgUEwASYih5xxxJY1QmiVVbe-TIqkeU";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

const ALL_BUGS = [
    { name: "MERRARI", img: "Merrari.png" }, { name: "MASTON KARTIN", img: "MastonKartin.png" },
    { name: "EKLEREN", img: "Ekleren.png" }, { name: "AASS", img: "Aass.png" },
    { name: "RED ROACH", img: "RedRoach.png" }, { name: "MILLYIMS", img: "Millyıms.png" }
];

let myId = localStorage.getItem('h1_id') || 'p' + Math.floor(Math.random() * 9999);
let myBalance = parseFloat(localStorage.getItem('h1_balance')) || 10000;
let currentRoom = null;
let selectedBug = null;
let isSinglePlayer = false;

// Navigasyon Fonksiyonları [cite: 2026-04-10]
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showMultiplayerMenu() { showScreen('multi-menu'); }
function showMainMenu() { showScreen('main-menu'); }

// TEK OYUNCULU MOD [cite: 2026-04-10]
function startSinglePlayer() {
    isSinglePlayer = true;
    currentRoom = { players: [], room_code: "BOTS" };
    showScreen('lobby-screen');
    renderBugs();
}

// ÇOK OYUNCULU LOBİ [cite: 2026-04-10]
async function createLobby() {
    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 haneli sayı kodu [cite: 2026-04-10]
    const { data } = await supabaseClient.from('h1_lobby').insert([{ room_code: code, players: [] }]).select().single();
    joinLobbyProcess(data);
}

async function joinLobby() {
    const code = document.getElementById('lobby-input').value;
    const { data } = await supabaseClient.from('h1_lobby').select('*').eq('room_code', code).maybeSingle();
    if(data) joinLobbyProcess(data); else alert("Lobi bulunamadı!");
}

function joinLobbyProcess(room) {
    currentRoom = room;
    isSinglePlayer = false;
    showScreen('lobby-screen');
    document.getElementById('room-code-display').innerText = currentRoom.room_code;
    document.getElementById('my-balance-display').innerText = myBalance.toFixed(2);
    renderBugs();
    subscribeRoom(room.room_code);
}

function renderBugs() {
    const grid = document.getElementById('bug-grid');
    grid.innerHTML = ALL_BUGS.map(bug => {
        const isTaken = currentRoom.players.some(p => p.bug === bug.name && p.id !== myId);
        return `<div class="bug-card ${isTaken ? 'taken' : ''} ${selectedBug === bug.name ? 'selected' : ''}" onclick="selectBug('${bug.name}')">
            <img src="${bug.img}" width="80"><p>${bug.name}</p></div>`;
    }).join('');
}

window.selectBug = (n) => { selectedBug = n; renderBugs(); };

async function playerReady() {
    if(!selectedBug) return alert("Araç seç!");
    if(isSinglePlayer) {
        startRaceSingle();
    } else {
        const bet = parseFloat(document.getElementById('bet-amount').value);
        myBalance -= bet;
        localStorage.setItem('h1_balance', myBalance);
        const newPlayers = [...currentRoom.players.filter(p => p.id !== myId), { id: myId, bug: selectedBug, bet: bet, ready: true }];
        await supabaseClient.from('h1_lobby').update({ players: newPlayers }).eq('room_code', currentRoom.room_code);
        document.getElementById('ready-btn').innerText = "BEKLENİYOR...";
    }
}

// Yarış ve Realtime mantığı daha önce kurduğumuz şekilde devam ediyor...
// (Sadece görselleri ve geçişleri showScreen('race-screen') ile tetikliyoruz)