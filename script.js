// [cite: 2026-04-10]
const ALL_BUGS = [
    { name: "MERRARI", img: "Merrari.png" },
    { name: "MASTON KARTIN", img: "MastonKartin.png" },
    { name: "EKLEREN", img: "Ekleren.png" },
    { name: "AASS", img: "Aass.png" },
    { name: "RED ROACH", img: "RedRoach.png" }, 
    { name: "MILLYIMS", img: "Millyıms.png" }
];

let myBalance = parseFloat(localStorage.getItem('h1_balance')) || 10000;
let selectedBug = null;

document.getElementById('main-balance').innerText = Math.floor(myBalance);

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function startSinglePlayer() {
    showScreen('lobby-screen');
    document.getElementById('my-balance-display').innerText = Math.floor(myBalance);
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
    const bet = parseFloat(document.getElementById('bet-amount').value);
    if(!selectedBug || bet > myBalance || bet <= 0) return alert("Seçim veya Bakiye hatası!");

    myBalance -= bet;
    localStorage.setItem('h1_balance', myBalance);
    document.getElementById('race-sound').volume = 0.2;
    document.getElementById('race-sound').play();

    runRaceEngine(bet);
}

function runRaceEngine(bet) {
    showScreen('race-screen');
    const lanes = document.querySelectorAll('.lane');
    lanes.forEach(l => l.innerHTML = ''); 
    
    const CHEAT_CODES = [8731, 4431];
    let racers = ALL_BUGS.map((bug, i) => ({
        ...bug,
        pos: -10, // Başlangıç pozisyonu (pist altı)
        speed: 0,
        accel: Math.random() * 0.05 + 0.02, // İvmelenme
        finished: false,
        element: null,
        isHacked: (CHEAT_CODES.includes(bet) && bug.name === selectedBug)
    }));

    // Araçları oluştur
    racers.forEach((r, i) => {
        const img = document.createElement('img');
        img.src = r.img;
        img.className = 'cockroach';
        img.style.bottom = r.pos + "%";
        lanes[i].appendChild(img);
        r.element = img;
    });

    // Yarış Döngüsü (Her 30ms'de bir fizik hesapla) [cite: 2026-04-10]
    const raceInterval = setInterval(() => {
        let allFinished = true;

        racers.forEach(r => {
            if (r.pos < 110) {
                allFinished = false;

                // FİZİK HESAPLAMA [cite: 2026-04-10]
                // 1. Rastgele "Yalpalanma" (Gerçekçilik için hız dalgalanması)
                let noise = (Math.random() - 0.5) * 0.1;
                
                // 2. Red Roach Sabotajı: Bitişe yaklaşınca hızı kes [cite: 2026-04-10]
                if (r.name === "RED ROACH" && r.pos > 90) {
                    r.speed *= 0.85; // %15 yavaşlama her karede
                    r.accel = 0.001;
                } else {
                    r.speed += r.accel + noise;
                }

                // 3. Hile Kodu: Sona doğru inanılmaz ivme [cite: 2026-04-10]
                if (r.isHacked && r.pos > 60) {
                    r.speed += 0.08;
                }

                // Hız sınırı (Kontrolden çıkmasınlar)
                if (r.speed > 1.2) r.speed = 1.2;
                if (r.speed < 0.1) r.speed = 0.1;

                r.pos += r.speed;
                r.element.style.bottom = r.pos + "%";
            } else if (!r.finished) {
                r.finished = true;
                r.finishTime = Date.now();
            }
        });

        if (allFinished) {
            clearInterval(raceInterval);
            finishRace(racers, bet);
        }
    }, 30);
}

function finishRace(racers, bet) {
    const winner = racers.sort((a, b) => a.finishTime - b.finishTime)[0];
    const reward = bet * 1.5; // Bahis + 0.50 kazanç [cite: 2026-04-10]

    setTimeout(() => {
        const isWin = (winner.name === selectedBug);
        if(isWin) { myBalance += reward; localStorage.setItem('h1_balance', myBalance); }
        displayResults(winner, reward, isWin);
    }, 500);
}

function displayResults(w, reward, isWin) {
    showScreen('winner-screen');
    document.getElementById('win-img').src = w.img;
    document.getElementById('win-name').innerText = w.name;
    const status = document.getElementById('win-status');
    status.innerText = isWin ? "ŞAMPİYONSUN!" : "KAYBETTİN!";
    status.style.color = isWin ? "#00f3ff" : "#ff003c";
    document.getElementById('profit-info').innerText = isWin ? `+${reward.toFixed(0)} YDL KAZANDIN` : "BAHİS PATLADI";
}