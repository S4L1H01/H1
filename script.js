// ===== SUPABASE =====
const SB_URL = "https://uojbmzwagmojtdddggfz.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvamJtendhZ21vanRkZGRnZ2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzMyODMsImV4cCI6MjA5MTQwOTI4M30.n3vzyV6JiJqqrgUEwASYih5xxxJY1QmiVVbe-TIqkeU";
const sb = supabase.createClient(SB_URL, SB_KEY);

// ===== CONSTANTS =====
const ALL_BUGS = [
    { name: "MERRARI",      img: "Merrari.png",     color: "#ff1a3c" },
    { name: "MASTON KARTIN",img: "MastonKartin.png", color: "#ffd700" },
    { name: "EKLEREN",      img: "Ekleren.png",      color: "#00e5ff" },
    { name: "AASS",         img: "Aass.png",         color: "#ffffff" },
    { name: "RED ROACH",    img: "RedRoach.png",     color: "#ff6600" },
    { name: "MILLYIMS",     img: "Millyıms.png",     color: "#cc00ff" },
];

const BOT_NAMES = ["ROBOACH-1", "ROBOACH-2", "ROBOACH-3", "ROBOACH-4", "ROBOACH-5"];

// ===== STATE =====
let myId = localStorage.getItem('h1_id') || ('p' + Math.floor(Math.random() * 99999));
localStorage.setItem('h1_id', myId);
let myBalance = parseFloat(localStorage.getItem('h1_balance')) || 10000;
let currentRoom = null;
let selectedBug = null;
let isSinglePlayer = false;
let raceSubscription = null;
let raceInterval = null;
let raceState = null; // { racers: [{id, bug, pos, speed, isPlayer, bet}], started, finished }

// ===== INIT =====
updateMenuBalance();

function updateMenuBalance() {
    const el = document.getElementById('menu-balance');
    if (el) el.textContent = formatNum(myBalance);
}

function formatNum(n) {
    return Math.round(n).toLocaleString('tr-TR');
}

// ===== NAVIGATION =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = '';
    });
    const target = document.getElementById(id);
    target.classList.add('active');
    target.style.display = 'flex';
}

function showMainMenu() {
    if (raceSubscription) { raceSubscription.unsubscribe(); raceSubscription = null; }
    if (raceInterval) { clearInterval(raceInterval); raceInterval = null; }
    currentRoom = null; selectedBug = null;
    updateMenuBalance();
    showScreen('main-menu');
}

function showMultiplayerMenu() { showScreen('multi-menu'); }

// ===== SINGLE PLAYER =====
function startSinglePlayer() {
    isSinglePlayer = true;
    currentRoom = null;
    showScreen('lobby-screen');
    document.getElementById('room-badge').classList.add('hidden');
    document.getElementById('my-balance-display').textContent = formatNum(myBalance);
    document.getElementById('selection-hint').textContent = '(1 araç seç)';
    renderBugs([]);
}

// ===== MULTIPLAYER =====
async function createLobby() {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    try {
        const { data, error } = await sb.from('h1_lobby')
            .insert([{ room_code: code, players: [] }])
            .select().single();
        if (error) throw error;
        enterLobby(data);
    } catch (e) {
        alert("Lobi oluşturulamadı: " + e.message);
    }
}

async function joinLobby() {
    const code = document.getElementById('lobby-input').value.trim();
    if (!code || code.length < 4) return alert("4 haneli kod gir!");
    try {
        const { data, error } = await sb.from('h1_lobby').select('*').eq('room_code', code).maybeSingle();
        if (error || !data) return alert("Lobi bulunamadı!");
        enterLobby(data);
    } catch (e) {
        alert("Hata: " + e.message);
    }
}

function enterLobby(room) {
    isSinglePlayer = false;
    currentRoom = room;
    showScreen('lobby-screen');
    document.getElementById('room-badge').classList.remove('hidden');
    document.getElementById('room-code-display').textContent = room.room_code;
    document.getElementById('my-balance-display').textContent = formatNum(myBalance);
    document.getElementById('selection-hint').textContent = '(1 araç seç)';
    renderBugs(room.players || []);
    subscribeRoom(room.room_code);
}

// ===== RENDER BUGS =====
function renderBugs(takenPlayers) {
    const grid = document.getElementById('bug-grid');
    grid.innerHTML = ALL_BUGS.map(bug => {
        const takenByOther = takenPlayers.some(p => p.bug === bug.name && p.id !== myId);
        const isSelected = selectedBug === bug.name;
        return `<div class="bug-card ${takenByOther ? 'taken' : ''} ${isSelected ? 'selected' : ''}"
                     onclick="selectBug('${bug.name}')">
            <img src="${bug.img}" alt="${bug.name}" draggable="false">
            <div class="bug-name">${bug.name}</div>
        </div>`;
    }).join('');
}

window.selectBug = function(name) {
    if (isSinglePlayer) {
        selectedBug = name;
        renderBugs([]);
    } else {
        const taken = (currentRoom?.players || []).filter(p => p.id !== myId);
        if (taken.some(p => p.bug === name)) return;
        selectedBug = name;
        renderBugs(currentRoom?.players || []);
    }
};

// ===== BET ADJUST =====
function adjustBet(delta) {
    const input = document.getElementById('bet-amount');
    let val = parseFloat(input.value) || 500;
    val = Math.max(100, Math.min(myBalance, val + delta));
    input.value = Math.round(val);
}

// ===== READY =====
async function playerReady() {
    if (!selectedBug) return alert("Önce bir araç seç!");
    const bet = parseFloat(document.getElementById('bet-amount').value) || 500;
    if (bet > myBalance) return alert("Yeterli bakiye yok!");

    if (isSinglePlayer) {
        startRaceSingle(bet);
    } else {
        // Deduct balance
        myBalance -= bet;
        localStorage.setItem('h1_balance', myBalance);

        const newPlayers = [
            ...(currentRoom.players || []).filter(p => p.id !== myId),
            { id: myId, bug: selectedBug, bet: bet, ready: true }
        ];

        const { data, error } = await sb.from('h1_lobby')
            .update({ players: newPlayers })
            .eq('room_code', currentRoom.room_code)
            .select().single();

        if (error) { myBalance += bet; localStorage.setItem('h1_balance', myBalance); alert("Hata!"); return; }
        currentRoom = data;

        document.getElementById('ready-btn').textContent = 'BEKLENİYOR...';
        document.getElementById('ready-btn').disabled = true;

        // Show waiting overlay
        document.getElementById('waiting-overlay').classList.remove('hidden');
        document.getElementById('waiting-sub').textContent = `${newPlayers.length} oyuncu hazır — Başlamak için herkesin hazır olması lazım`;

        checkStartCondition(data);
    }
}

function checkStartCondition(room) {
    const players = room.players || [];
    if (players.length >= 2 && players.every(p => p.ready)) {
        setTimeout(() => startRaceMulti(room), 800);
    }
}

// ===== REALTIME SUBSCRIPTION =====
function subscribeRoom(code) {
    if (raceSubscription) raceSubscription.unsubscribe();
    raceSubscription = sb.channel('room-' + code)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'h1_lobby',
            filter: `room_code=eq.${code}`
        }, payload => {
            currentRoom = payload.new;
            const players = currentRoom.players || [];
            renderBugs(players);
            document.getElementById('waiting-sub').textContent =
                `${players.filter(p=>p.ready).length}/${players.length} hazır`;
            checkStartCondition(currentRoom);
        })
        .subscribe();
}

// ===== SINGLE PLAYER RACE START =====
function startRaceSingle(bet) {
    // Pick 3 random bots from remaining bugs
    const remaining = ALL_BUGS.filter(b => b.name !== selectedBug);
    const shuffled = remaining.sort(() => Math.random() - 0.5).slice(0, 3);

    const racers = [
        { id: myId, bug: ALL_BUGS.find(b => b.name === selectedBug), bet: bet, isPlayer: true },
        ...shuffled.map((bug, i) => ({ id: 'bot' + i, bug, bet: 0, isPlayer: false }))
    ];

    // Deduct balance
    myBalance -= bet;
    localStorage.setItem('h1_balance', myBalance);

    launchRace(racers);
}

// ===== MULTIPLAYER RACE START =====
function startRaceMulti(room) {
    const players = room.players || [];
    const racers = players.map(p => ({
        id: p.id,
        bug: ALL_BUGS.find(b => b.name === p.bug),
        bet: p.bet,
        isPlayer: p.id === myId
    })).filter(r => r.bug);

    launchRace(racers);
}

// ===== CORE RACE ENGINE =====
function launchRace(racers) {
    showScreen('race-screen');

    // Setup race state
    const totalBet = racers.reduce((s, r) => s + r.bet, 0);
    const betInfo = document.getElementById('race-bet-info');
    betInfo.textContent = `TOPLAM HAVUZ: ${formatNum(totalBet)} YDL`;

    // Build track
    buildTrack(racers.length);

    // Init racer positions
    const trackEl = document.getElementById('track-container');
    const trackH = trackEl.clientHeight - 100; // 50px hud top + bottom
    const FINISH_Y = trackH; // % progress = 0..1 mapped to bottom..top
    const START_Y = 60; // pixels from bottom start

    raceState = {
        racers: racers.map((r, i) => ({
            ...r,
            progress: 0,       // 0 = start, 1 = finish
            speed: 0,
            lane: i,
            finished: false,
            finishOrder: -1,
        })),
        finishCount: 0,
        totalBet,
        started: false,
        done: false,
    };

    // Render racers
    const layer = document.getElementById('racers-layer');
    layer.innerHTML = '';
    const laneCount = racers.length;
    raceState.racers.forEach((r, i) => {
        const el = document.createElement('div');
        el.className = 'racer' + (r.isPlayer ? ' player-racer' : '');
        el.id = 'racer-' + i;
        el.style.left = getLaneX(i, laneCount) + 'px';
        el.style.bottom = START_Y + 'px';
        el.innerHTML = `<img src="${r.bug.img}" alt="${r.bug.name}">
                        <div class="racer-label">${r.bug.name.split(' ')[0]}</div>`;
        layer.appendChild(el);
        r.el = el;
    });

    // Show positions bar
    updatePositionsBar();

    // COUNTDOWN
    const overlay = document.getElementById('countdown-overlay');
    const numEl = document.getElementById('countdown-num');
    overlay.classList.remove('hidden');

    let count = 3;
    numEl.textContent = count;
    numEl.style.animation = 'none';
    void numEl.offsetWidth;
    numEl.style.animation = 'cdPulse 0.9s ease-out';

    const cdInterval = setInterval(() => {
        count--;
        if (count > 0) {
            numEl.textContent = count;
            numEl.style.animation = 'none';
            void numEl.offsetWidth;
            numEl.style.animation = 'cdPulse 0.9s ease-out';
        } else {
            clearInterval(cdInterval);
            numEl.textContent = 'GİT!';
            numEl.style.color = '#00ff88';
            numEl.style.animation = 'none';
            void numEl.offsetWidth;
            numEl.style.animation = 'cdPulse 0.9s ease-out';
            setTimeout(() => {
                overlay.classList.add('hidden');
                numEl.style.color = '';
                startRaceLoop();
            }, 600);
        }
    }, 900);
}

function getLaneX(laneIndex, laneCount) {
    const trackEl = document.getElementById('track-container');
    const w = trackEl.clientWidth || window.innerWidth;
    const laneW = w / laneCount;
    return laneW * laneIndex + laneW / 2 - 28; // 28 = half racer width
}

function buildTrack(laneCount) {
    const scroll = document.getElementById('track-scroll');
    scroll.innerHTML = '';

    // Lane dividers
    for (let i = 1; i < laneCount; i++) {
        const div = document.createElement('div');
        div.className = 'lane-col';
        div.style.left = (100 / laneCount * i) + '%';
        scroll.appendChild(div);
    }

    // Road center lines — animated
    for (let lane = 0; lane < laneCount; lane++) {
        for (let j = 0; j < 6; j++) {
            const line = document.createElement('div');
            line.className = 'road-line';
            const lanePercent = 100 / laneCount;
            line.style.left = (lanePercent * lane + lanePercent / 2 - 0.1) + '%';
            line.style.top = (j * -80) + 'px';
            line.style.animationDuration = (1.2 + Math.random() * 0.4) + 's';
            line.style.animationDelay = (j * -0.2) + 's';
            line.style.opacity = 0.12;
            scroll.appendChild(line);
        }
    }

    // Finish line
    const fb = document.getElementById('finish-banner');
    fb.classList.remove('hidden');
    fb.classList.remove('visible');
}

// ===== RACE LOOP =====
function startRaceLoop() {
    raceState.started = true;
    const trackEl = document.getElementById('track-container');

    const TICK = 50; // ms per tick
    const BASE_SPEED = 0.003;   // progress per tick baseline
    const TOP_SPEED = 0.018;
    const ACCEL = 0.0008;
    const BOOST_CHANCE = 0.015;
    const STUMBLE_CHANCE = 0.012;

    // Init random base speeds
    raceState.racers.forEach(r => {
        r.speed = BASE_SPEED + Math.random() * 0.004;
        r.baseSeg = r.speed;
    });

    raceInterval = setInterval(() => {
        if (raceState.done) return;
        const trackH = (trackEl.clientHeight - 110); // usable race height

        raceState.racers.forEach((r, i) => {
            if (r.finished) return;

            // Speed modulation
            if (Math.random() < BOOST_CHANCE) {
                r.speed = Math.min(TOP_SPEED, r.speed * (1.3 + Math.random() * 0.4));
                r.el.classList.add('boost-effect');
                setTimeout(() => r.el && r.el.classList.remove('boost-effect'), 400);
            } else if (Math.random() < STUMBLE_CHANCE) {
                r.speed = Math.max(0.001, r.speed * 0.6);
            } else {
                // Drift back toward base
                r.speed += (r.baseSeg - r.speed) * 0.05 + (Math.random() - 0.48) * ACCEL;
                r.speed = Math.max(0.001, Math.min(TOP_SPEED, r.speed));
            }

            r.progress += r.speed;

            if (r.progress >= 1) {
                r.progress = 1;
                r.finished = true;
                raceState.finishCount++;
                r.finishOrder = raceState.finishCount;

                if (raceState.finishCount === 1) {
                    // Show finish banner
                    const fb = document.getElementById('finish-banner');
                    fb.classList.add('visible');
                }
            }

            // Update DOM position
            const bottomPx = 60 + r.progress * trackH;
            r.el.style.bottom = bottomPx + 'px';
        });

        updatePositionsBar();

        // Race done when all finished
        if (raceState.finishCount >= raceState.racers.length) {
            clearInterval(raceInterval);
            raceInterval = null;
            raceState.done = true;
            setTimeout(() => showWinner(), 1200);
        }
    }, TICK);
}

function updatePositionsBar() {
    const bar = document.getElementById('live-positions');
    // Sort by progress descending
    const sorted = [...raceState.racers].sort((a, b) => b.progress - a.progress);
    bar.innerHTML = sorted.map((r, idx) => {
        const isPlayer = r.isPlayer;
        const isLeader = idx === 0;
        let cls = 'pos-chip';
        if (isLeader) cls += ' leader';
        if (isPlayer) cls += ' player-chip';
        return `<div class="${cls}">
            <div class="pos-num">${idx + 1}</div>
            <div>${r.bug.name.split(' ')[0]}</div>
        </div>`;
    }).join('');
}

// ===== WINNER SCREEN =====
function showWinner() {
    // Find overall winner (finishOrder === 1)
    const winner = raceState.racers.find(r => r.finishOrder === 1);
    const player = raceState.racers.find(r => r.isPlayer);

    showScreen('winner-screen');

    document.getElementById('win-img').src = winner.bug.img;
    document.getElementById('win-name').textContent = winner.bug.name;

    // Determine win/loss for player
    const winStatus = document.getElementById('win-status');
    const profitEl = document.getElementById('profit-info');
    profitEl.className = 'profit-chip';

    if (player && winner.id === player.id) {
        // Player won!
        winStatus.textContent = 'ŞAMPİYONSUN!';
        winStatus.style.color = '#ffd700';

        const totalPool = raceState.totalBet;
        const playerBet = player.bet;
        const winnings = isSinglePlayer
            ? Math.round(playerBet * 2.5)
            : Math.round(totalPool * 0.85); // 85% of pool to winner (house takes 15%)

        myBalance += winnings;
        localStorage.setItem('h1_balance', myBalance);

        const profit = winnings - playerBet;
        profitEl.textContent = `+ ${formatNum(profit)} YDL KAZANDIN`;
        profitEl.classList.add('positive');
    } else if (player) {
        // Player lost
        winStatus.textContent = 'KAYBETTİN';
        winStatus.style.color = 'var(--red)';
        const lostAmt = player.bet;
        profitEl.textContent = `- ${formatNum(lostAmt)} YDL KAYBETTİN`;
        profitEl.classList.add('negative');
    } else {
        // Spectating
        winStatus.textContent = 'YARIŞÇI';
        winStatus.style.color = 'var(--text)';
        profitEl.textContent = `KAZANAN: ${winner.bug.name}`;
        profitEl.classList.add('neutral');
    }

    // Update DB if multiplayer
    if (!isSinglePlayer && currentRoom) {
        sb.from('h1_lobby').delete().eq('room_code', currentRoom.room_code).then(() => {});
    }
}