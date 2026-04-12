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
            // Normal araç hızları
            speed: 0.8 + (Math.random() * 0.4),
            finished: false,
            element: null,
            isHacked: (CHEAT_CODES.includes(bet) && bug.name === selectedBug)
        };
    });

    // RED BULL HEDEF HIZ HESABI [cite: 2026-04-12]
    // En yavaş normal aracın hızını bul ve Red Bull'u ondan biraz daha yavaş yap
    const normalSpeeds = racers.filter(r => r.name !== "RED ROACH").map(r => r.speed);
    const slowestSpeed = Math.min(...normalSpeeds);
    const redBullRacer = racers.find(r => r.name === "RED ROACH");
    if(redBullRacer) {
        // En yavaştan %15-20 daha yavaş, böylece sonda yavaşlamasına gerek kalmaz
        redBullRacer.speed = slowestSpeed * 0.82; 
    }

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

                // Hile kodu atağı
                if (r.isHacked && r.pos > 60) step *= 2.4;
                
                // Doğallık katmak için küçük sapmalar
                step += (Math.random() - 0.5) * 0.04;

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
    
    // VİDEO TETİKLEYİCİ - KESİN ÇÖZÜM [cite: 2026-04-12]
    if (Math.floor(myBalance) <= 0) {
        console.log("BAKİYE SIFIR, VİDEO BAŞLIYOR");
        playFakirVideo();
    }
}

function playFakirVideo() {
    const overlay = document.getElementById('fakir-overlay');
    const video = document.getElementById('fakir-video');
    
    // Her denemede videoyu sıfırla ve göster
    overlay.style.display = 'flex';
    video.currentTime = 0;
    
    const startPlay = () => {
        video.play().catch(() => {
            // Tarayıcı hala engelliyorsa sessizce başlatır
            video.muted = true;
            video.play();
        });
    };

    // 1 saniye sonra başlat (UI geçişi tamamlansın)
    setTimeout(startPlay, 1000);

    video.onended = () => {
        overlay.style.display = 'none';
        myBalance = 10000;
        localStorage.setItem('h1_balance', myBalance);
        updateUI();
        alert("Sadakan yüklendi: 10.000 YDL");
        location.reload();
    };
}