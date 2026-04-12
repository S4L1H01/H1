// [cite: 2026-04-12]
const ALL_BUGS = [
    { name: "MERRARI", img: "Merrari.png" },
    { name: "MASTON KARTIN", img: "MastonKartin.png" },
    { name: "EKLEREN", img: "Ekleren.png" },
    { name: "AASS", img: "Aass.png" },
    { name: "RED ROACH", img: "RedRoach.png" }, 
    { name: "MILLYIMS", img: "Millyıms.png" }
];

let myBalance = Math.floor(parseFloat(localStorage.getItem('h1_balance'))) || 10000;
let selectedBug = null;

updateUI();

function updateUI() {
    ['main-balance', 'my-balance-display'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = Math.floor(myBalance);
    });
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function startSinglePlayer() {
    showScreen('lobby-screen');
    updateUI();
    renderBugs();
}

function renderBugs() {
    const grid = document.getElementById('bug-grid');
    grid.innerHTML = ALL_BUGS.map(bug => `
        <div class="bug-card ${selectedBug === bug.name ? 'selected' : ''}" onclick="selectBug('${bug.name}')">
            <img src="${bug.img}"><p>${bug.name}</p>
        </div>`).join('');
}

window.selectBug = (n) => { selectedBug = n; renderBugs(); };

function launchRace() {
    const betInput = document.getElementById('bet-amount');
    const val = betInput.value.trim();

    // Hile Kodu
    if(val === "banaparaverlavuk") {
        myBalance += 31000;
        localStorage.setItem('h1_balance', myBalance);
        updateUI();
        alert("31.000 YDL Yüklendi!");
        betInput.value = "500";
        return;
    }

    const bet = Math.floor(parseFloat(val));
    if(!selectedBug) return alert("ARACINI SEÇ!");
    if(bet > Math.floor(myBalance)) return alert("YETERSİZ BAKİYE!");
    if(bet <= 0 || isNaN(bet)) return alert("BAHİS GİR!");

    myBalance -= bet;
    localStorage.setItem('h1_balance', myBalance);
    updateUI();
    
    document.getElementById('race-sound').volume = 0.2;
    document.getElementById('race-sound').play().catch(() => {});

    runRaceEngine(bet);
}

function runRaceEngine(bet) {
    showScreen('race-screen');
    const lanes = document.querySelectorAll('.lane');
    lanes.forEach(l => l.innerHTML = ''); 
    
    const CHEAT_CODES = [8731, 4431];
    let racers = ALL_BUGS.map((bug) => {
        return {
            ...bug,
            pos: -5,
            speed: 0.75 + (Math.random() * 0.4),
            finished: false,
            element: null,
            isHacked: (CHEAT_CODES.includes(bet) && bug.name === selectedBug)
        };
    });

    racers.forEach((r, i) => {
        const img = document.createElement('img');
        img.src = r.img;
        img.className = 'cockroach';
        img.style.bottom = r.pos + "%";
        lanes[i].appendChild(img);
        r.element = img;
    });

    const raceInterval = setInterval(() => {
        let allFinished = true;

        racers.forEach(r => {
            if (r.pos < 105) {
                allFinished = false;
                let step = r.speed;

                // Gizli Red Bull Sabotajı (Daha doğal) [cite: 2026-04-12]
                if (r.name === "RED ROACH") {
                    if(r.pos > 30 && r.pos < 50) step *= 1.3; // Önce atağa kalkıp umut verir
                    if(r.pos > 92) step *= 0.1; // Son milimetrede nefesi kesilir
                }

                if (r.isHacked && r.pos > 60) step *= 2.3;
                step += (Math.random() - 0.5) * 0.06;

                r.pos += step;
                r.element.style.bottom = r.pos + "%";
            } else if (!r.finished) {
                r.finished = true;
                r.finishTime = Date.now();
            }
        });

        if (allFinished) {
            clearInterval(raceInterval);
            const winner = racers.sort((a, b) => a.finishTime - b.finishTime)[0];
            const reward = Math.floor(bet * 1.5);

            setTimeout(() => {
                const isWin = (winner.name === selectedBug);
                if(isWin) { 
                    myBalance += reward; 
                    localStorage.setItem('h1_balance', myBalance);
                }
                updateUI();
                displayResults(winner, reward, isWin);
            }, 400);
        }
    }, 35);
}

function displayResults(w, reward, isWin) {
    showScreen('winner-screen');
    document.getElementById('win-img').src = w.img;
    document.getElementById('win-name').innerText = w.name;
    const status = document.getElementById('win-status');
    status.innerText = isWin ? "ŞAMPİYONSUN!" : "KAYBETTİN!";
    status.style.color = isWin ? "#00f3ff" : "#ff003c";
    document.getElementById('profit-info').innerText = isWin ? `+${reward} YDL KAZANDIN` : "YDL GİTTİ";
    
    // Video Garanti Mekanizması [cite: 2026-04-12]
    if (Math.floor(myBalance) <= 0) {
        console.log("Para bitti, video hazırlanıyor...");
        setTimeout(playFakirVideo, 1000);
    }
}

function playFakirVideo() {
    const overlay = document.getElementById('fakir-overlay');
    const video = document.getElementById('fakir-video');
    
    overlay.style.display = 'flex';
    video.currentTime = 0; // Videoyu başa sar
    video.muted = false;

    // Videoyu zorla başlat
    const playPromise = video.play();

    if (playPromise !== undefined) {
        playPromise.catch(() => {
            video.muted = true; // Tarayıcı engellerse sessiz başlatıp devam et
            video.play();
        });
    }

    video.onended = () => {
        overlay.style.display = 'none';
        myBalance = 10000;
        localStorage.setItem('h1_balance', myBalance);
        updateUI();
        alert("Sadakan yüklendi: 10.000 YDL");
        location.reload();
    };
}