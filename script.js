// ===== SUPABASE =====
const SB_URL = "https://uojbmzwagmojtdddggfz.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvamJtendhZ21vanRkZGRnZ2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzMyODMsImV4cCI6MjA5MTQwOTI4M30.n3vzyV6JiJqqrgUEwASYih5xxxJY1QmiVVbe-TIqkeU";
const sb = supabase.createClient(SB_URL, SB_KEY);

// ===== CONSTANTS =====
const ALL_BUGS = [
    { name: "MERRARI",       img: "Merrari.png",      color: "#ff1a3c" },
    { name: "MASTON KARTIN", img: "MastonKartin.png",  color: "#ffd700" },
    { name: "EKLEREN",       img: "Ekleren.png",       color: "#00e5ff" },
    { name: "AASS",          img: "Aass.png",          color: "#ffffff" },
    { name: "RED ROACH",     img: "RedRoach.png",      color: "#ff6600" },
    { name: "MILLYIMS",      img: "Millyıms.png",      color: "#cc00ff" },
];

// ===== STATE =====
let myId = localStorage.getItem('h1_id') || ('p' + Math.floor(Math.random() * 99999));
localStorage.setItem('h1_id', myId);
let myBalance = parseFloat(localStorage.getItem('h1_balance')) || 10000;
let currentRoom = null;
let selectedBug = null;
let isSinglePlayer = false;
let raceSubscription = null;
let raceInterval = null;
let raceState = null;

// ===== AUDIO ENGINE =====
// Uses <Audio> elements + Web Audio API MediaElementSourceNode.
// This approach works on file:// (no fetch needed).
let audioCtx = null;
let racerSources = {}; // id -> { audioEl, source, gain }
let audioReady = false;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioReady = true;
    } catch(e) {
        console.warn('AudioContext açılamadı:', e);
    }
}

async function loadSound() {
    // Nothing to pre-load — Audio elements load on demand
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
}

function playRacerSound(racerId, pitchRate = 1.0) {
    if (!audioCtx || !audioReady) return;
    stopRacerSound(racerId);

    try {
        const audioEl = new Audio('h1ses.mp3');
        audioEl.loop = true;
        audioEl.volume = 1.0; // controlled by gain node
        audioEl.playbackRate = pitchRate;

        const source = audioCtx.createMediaElementSource(audioEl);
        const gain = audioCtx.createGain();
        gain.gain.value = 0.0;

        source.connect(gain);
        gain.connect(audioCtx.destination);

        // Fade in
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.22, audioCtx.currentTime + 0.4);

        audioEl.play().catch(e => console.warn('Ses çalınamadı:', e));

        racerSources[racerId] = { audioEl, source, gain };
    } catch(e) {
        console.warn('playRacerSound hatası:', e);
    }
}

function updateRacerSoundSpeed(racerId, speed, baseSpeed) {
    const s = racerSources[racerId];
    if (!s || !audioCtx) return;
    const ratio = Math.max(0.3, speed / baseSpeed);
    // Pitch: 0.85 (slow) → 1.3 (boost)
    const pitch = Math.max(0.5, Math.min(2.0, 0.85 + ratio * 0.45));
    s.audioEl.playbackRate = pitch;
    // Volume
    const vol = Math.max(0.10, Math.min(0.28, 0.18 + (ratio - 1) * 0.05));
    s.gain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.12);
}

function stopRacerSound(racerId) {
    const s = racerSources[racerId];
    if (!s) return;
    try {
        s.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.25);
        setTimeout(() => {
            try { s.audioEl.pause(); s.audioEl.src = ''; } catch(e) {}
        }, 300);
    } catch(e) {}
    delete racerSources[racerId];
}

function stopAllSounds() {
    Object.keys(racerSources).forEach(stopRacerSound);
}

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
    stopAllSounds();
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
async function createLobby(btn) {
    if (btn) { btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none'; }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const errBox = document.getElementById('multi-error');
    if (errBox) errBox.style.display = 'none';

    try {
        const { data, error } = await sb
            .from('h1_lobby')
            .insert({ room_code: code, players: [] })
            .select()
            .single();

        if (error) throw new Error(error.message || JSON.stringify(error));
        enterLobby(data);
    } catch (e) {
        console.error('createLobby hatası:', e);
        if (errBox) {
            errBox.textContent = '⚠ ' + e.message;
            errBox.style.display = 'block';
        } else {
            alert('Lobi oluşturulamadı:\n' + e.message);
        }
    } finally {
        if (btn) { btn.style.opacity = ''; btn.style.pointerEvents = ''; }
    }
}

async function joinLobby() {
    const code = document.getElementById('lobby-input').value.trim();
    if (!code || code.length < 4) return alert('4 haneli kod gir!');

    try {
        const { data, error } = await sb
            .from('h1_lobby')
            .select('*')
            .eq('room_code', code)
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) return alert('Lobi bulunamadı! Kod: ' + code);

        enterLobby(data);
    } catch (e) {
        alert('Hata: ' + e.message);
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

function adjustBet(delta) {
    const input = document.getElementById('bet-amount');
    let val = parseFloat(input.value) || 500;
    val = Math.max(100, Math.min(myBalance, val + delta));
    input.value = Math.round(val);
}

// ===== READY =====
async function playerReady() {
    if (!selectedBug) return alert('Önce bir araç seç!');
    const bet = parseFloat(document.getElementById('bet-amount').value) || 500;
    if (bet > myBalance) return alert('Yeterli bakiye yok!');

    // Init audio on user gesture
    initAudio();
    await loadSound();

    if (isSinglePlayer) {
        startRaceSingle(bet);
    } else {
        myBalance -= bet;
        localStorage.setItem('h1_balance', myBalance);

        const newPlayers = [
            ...(currentRoom.players || []).filter(p => p.id !== myId),
            { id: myId, bug: selectedBug, bet, ready: true }
        ];

        const { data, error } = await sb
            .from('h1_lobby')
            .update({ players: newPlayers })
            .eq('room_code', currentRoom.room_code)
            .select()
            .single();

        if (error) {
            myBalance += bet;
            localStorage.setItem('h1_balance', myBalance);
            alert('Hata: ' + error.message);
            return;
        }

        currentRoom = data;
        document.getElementById('ready-btn').textContent = 'BEKLENİYOR...';
        document.getElementById('ready-btn').disabled = true;
        document.getElementById('waiting-overlay').classList.remove('hidden');
        document.getElementById('waiting-sub').textContent =
            newPlayers.length + ' oyuncu hazır — Başlamak için herkesin hazır olması lazım';

        checkStartCondition(data);
    }
}

function checkStartCondition(room) {
    const players = room.players || [];
    if (players.length >= 2 && players.every(p => p.ready)) {
        setTimeout(() => startRaceMulti(room), 800);
    }
}

// ===== REALTIME =====
function subscribeRoom(code) {
    if (raceSubscription) raceSubscription.unsubscribe();
    raceSubscription = sb.channel('room-' + code)
        .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'h1_lobby',
            filter: `room_code=eq.${code}`
        }, payload => {
            currentRoom = payload.new;
            const players = currentRoom.players || [];
            renderBugs(players);
            const readyCount = players.filter(p => p.ready).length;
            const subEl = document.getElementById('waiting-sub');
            if (subEl) subEl.textContent = readyCount + '/' + players.length + ' hazır';
            checkStartCondition(currentRoom);
        })
        .subscribe();
}

// ===== SINGLE PLAYER START =====
function startRaceSingle(bet) {
    const remaining = ALL_BUGS.filter(b => b.name !== selectedBug).sort(() => Math.random() - 0.5).slice(0, 3);
    const racers = [
        { id: myId, bug: ALL_BUGS.find(b => b.name === selectedBug), bet, isPlayer: true },
        ...remaining.map((bug, i) => ({ id: 'bot' + i, bug, bet: 0, isPlayer: false }))
    ];
    myBalance -= bet;
    localStorage.setItem('h1_balance', myBalance);
    launchRace(racers);
}

// ===== MULTI START =====
function startRaceMulti(room) {
    const racers = (room.players || [])
        .map(p => ({ id: p.id, bug: ALL_BUGS.find(b => b.name === p.bug), bet: p.bet, isPlayer: p.id === myId }))
        .filter(r => r.bug);
    launchRace(racers);
}

// ===== RACE LAUNCH =====
function launchRace(racers) {
    showScreen('race-screen');

    const totalBet = racers.reduce((s, r) => s + r.bet, 0);
    document.getElementById('race-bet-info').textContent =
        'HAVUZ: ' + formatNum(totalBet) + ' YDL';

    buildTrack(racers.length);

    // ── PHYSICS INIT ──
    // Each racer gets a unique base speed so outcomes aren't predetermined,
    // but the spread is tight enough that anyone can win until the last 20%.
    // Variance comes from luck events, not just initial speed.
    const BASE     = 0.0030;   // minimum tick speed
    const SPREAD   = 0.0020;   // random spread on top of base
    const TOP      = 0.0160;   // hard cap
    const SLOWDOWN = 0.0008;   // max stumble deduction per tick
    const BOOST_TICK = 0.0055; // burst added on boost event

    raceState = {
        racers: racers.map((r, i) => {
            // Give each racer a base that's within a tight band
            const base = BASE + Math.random() * SPREAD;
            return {
                ...r,
                progress:    0,
                speed:       base,
                baseSpeed:   base,       // "natural" cruising speed
                momentum:    0,          // cumulative boost/stumble modifier
                finished:    false,
                finishOrder: -1,
                lane:        i,
                el:          null,
                // Per-racer luck weights (set once, shape their personality)
                boostChance:   0.012 + Math.random() * 0.010,
                stumbleChance: 0.010 + Math.random() * 0.010,
                boostMag:      0.9  + Math.random() * 0.6,
                recoveryRate:  0.04 + Math.random() * 0.04,
            };
        }),
        finishCount: 0,
        totalBet,
        done: false,
        BASE, SPREAD, TOP, SLOWDOWN, BOOST_TICK,
    };

    // Build DOM racers
    const layer = document.getElementById('racers-layer');
    layer.innerHTML = '';
    const laneCount = racers.length;

    raceState.racers.forEach((r, i) => {
        const el = document.createElement('div');
        el.className = 'racer' + (r.isPlayer ? ' player-racer' : '');
        el.id = 'racer-' + i;
        el.style.left = getLaneX(i, laneCount) + 'px';
        el.style.bottom = '60px';
        el.innerHTML = `<img src="${r.bug.img}" alt="${r.bug.name}">
                        <div class="racer-label">${r.bug.name.split(' ')[0]}</div>`;
        layer.appendChild(el);
        r.el = el;
    });

    updatePositionsBar();
    runCountdown();
}

function getLaneX(i, count) {
    const w = (document.getElementById('track-container').clientWidth || window.innerWidth);
    const lw = w / count;
    return lw * i + lw / 2 - 28;
}

function buildTrack(laneCount) {
    const scroll = document.getElementById('track-scroll');
    scroll.innerHTML = '';
    for (let i = 1; i < laneCount; i++) {
        const d = document.createElement('div');
        d.className = 'lane-col';
        d.style.left = (100 / laneCount * i) + '%';
        scroll.appendChild(d);
    }
    for (let lane = 0; lane < laneCount; lane++) {
        for (let j = 0; j < 7; j++) {
            const line = document.createElement('div');
            line.className = 'road-line';
            const lp = 100 / laneCount;
            line.style.left = (lp * lane + lp / 2 - 0.1) + '%';
            line.style.top  = (j * -80) + 'px';
            line.style.animationDuration  = (1.0 + Math.random() * 0.5) + 's';
            line.style.animationDelay     = (j * -0.18) + 's';
            line.style.opacity = '0.1';
            scroll.appendChild(line);
        }
    }
    const fb = document.getElementById('finish-banner');
    fb.classList.remove('hidden');
    fb.classList.remove('visible');
}

// ===== COUNTDOWN =====
function runCountdown() {
    const overlay = document.getElementById('countdown-overlay');
    const numEl   = document.getElementById('countdown-num');
    overlay.classList.remove('hidden');
    let count = 3;

    const tick = () => {
        numEl.textContent = count;
        numEl.style.color = '';
        numEl.style.animation = 'none';
        void numEl.offsetWidth;
        numEl.style.animation = 'cdPulse 0.85s ease-out';

        if (count === 0) {
            numEl.textContent = 'GİT!';
            numEl.style.color = '#00ff88';
            setTimeout(() => {
                overlay.classList.add('hidden');
                numEl.style.color = '';
                startRaceLoop();
            }, 550);
            return;
        }
        count--;
        setTimeout(tick, 850);
    };
    tick();
}

// ===== RACE LOOP =====
function startRaceLoop() {
    raceState.started = true;
    const { TOP, SLOWDOWN, BOOST_TICK } = raceState;
    const trackEl = document.getElementById('track-container');

    // Start engine sounds for all racers
    raceState.racers.forEach((r, i) => {
        // Each racer gets a slightly different pitch (personality)
        const basePitch = 0.88 + i * 0.06 + Math.random() * 0.04;
        r.pitchBase = basePitch;
        playRacerSound(r.id, basePitch);
    });

    const TICK = 48;

    raceInterval = setInterval(() => {
        if (raceState.done) return;
        const trackH = trackEl.clientHeight - 110;

        raceState.racers.forEach(r => {
            if (r.finished) return;

            // ── LUCK EVENTS ──
            const roll = Math.random();
            if (roll < r.boostChance) {
                // Burst of speed
                r.momentum += BOOST_TICK * r.boostMag;
                r.el.classList.add('boost-effect');
                setTimeout(() => r.el && r.el.classList.remove('boost-effect'), 380);
            } else if (roll < r.boostChance + r.stumbleChance) {
                // Stumble — bleeds momentum
                r.momentum -= SLOWDOWN * (1.5 + Math.random());
            }

            // Decay momentum back toward 0 (rubber-band feel)
            r.momentum *= (1 - r.recoveryRate);

            // Compute effective speed
            r.speed = Math.max(0.0005, Math.min(TOP, r.baseSpeed + r.momentum));

            // Tiny random jitter every tick (cockroach unpredictability)
            r.speed += (Math.random() - 0.49) * 0.0006;
            r.speed = Math.max(0.0005, Math.min(TOP, r.speed));

            r.progress += r.speed;

            // Update sound pitch based on current speed
            updateRacerSoundSpeed(r.id, r.speed, r.baseSpeed);

            if (r.progress >= 1) {
                r.progress = 1;
                r.finished = true;
                raceState.finishCount++;
                r.finishOrder = raceState.finishCount;
                stopRacerSound(r.id);

                if (raceState.finishCount === 1) {
                    const fb = document.getElementById('finish-banner');
                    fb.classList.add('visible');
                }
            }

            r.el.style.bottom = (60 + r.progress * trackH) + 'px';
        });

        updatePositionsBar();

        if (raceState.finishCount >= raceState.racers.length) {
            clearInterval(raceInterval);
            raceInterval = null;
            raceState.done = true;
            stopAllSounds();
            setTimeout(showWinner, 1200);
        }
    }, TICK);
}

function updatePositionsBar() {
    const bar = document.getElementById('live-positions');
    const sorted = [...raceState.racers].sort((a, b) => b.progress - a.progress);
    bar.innerHTML = sorted.map((r, idx) => {
        let cls = 'pos-chip';
        if (idx === 0) cls += ' leader';
        if (r.isPlayer) cls += ' player-chip';
        return `<div class="${cls}">
            <div class="pos-num">${idx + 1}</div>
            <div>${r.bug.name.split(' ')[0]}</div>
        </div>`;
    }).join('');
}

// ===== WINNER =====
function showWinner() {
    const winner = raceState.racers.find(r => r.finishOrder === 1);
    const player = raceState.racers.find(r => r.isPlayer);

    showScreen('winner-screen');

    document.getElementById('win-img').src  = winner.bug.img;
    document.getElementById('win-name').textContent = winner.bug.name;

    const winStatus = document.getElementById('win-status');
    const profitEl  = document.getElementById('profit-info');
    profitEl.className = 'profit-chip';

    if (player && winner.id === player.id) {
        winStatus.textContent = 'ŞAMPİYONSUN!';
        winStatus.style.color = '#ffd700';
        const winnings = isSinglePlayer
            ? Math.round(player.bet * 2.5)
            : Math.round(raceState.totalBet * 0.85);
        myBalance += winnings;
        localStorage.setItem('h1_balance', myBalance);
        const profit = winnings - player.bet;
        profitEl.textContent = '+ ' + formatNum(profit) + ' YDL KAZANDIN';
        profitEl.classList.add('positive');
    } else if (player) {
        winStatus.textContent = 'KAYBETTİN';
        winStatus.style.color = 'var(--red)';
        profitEl.textContent  = '- ' + formatNum(player.bet) + ' YDL KAYBETTİN';
        profitEl.classList.add('negative');
    } else {
        winStatus.textContent = 'KAZANAN';
        winStatus.style.color = 'var(--text)';
        profitEl.textContent  = winner.bug.name;
        profitEl.classList.add('neutral');
    }

    if (!isSinglePlayer && currentRoom) {
        sb.from('h1_lobby').delete().eq('room_code', currentRoom.room_code).then(() => {});
    }
}