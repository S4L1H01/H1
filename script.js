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
    if(!selectedBug || bet > myBalance || bet <= 0) return alert("Seçim veya Bakiye geçersiz!");

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
    let racers = ALL_BUGS.map((bug, i) => {
        // Her araç için nadir bir "şanssızlık" ihtimali (Baya nadir) [cite: 2026-04-10]
        const hasBadLuck = Math.random() < 0.08; 
        
        return {
            ...bug,
            pos: -10,
            speed: 0.4 + (Math.random() * 0.3),
            finished: false,
            element: null,
            badLuckZone: hasBadLuck ? (40 + Math.random() * 30) : null,
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
            if (r.pos < 115) {
                allFinished = false;

                // NORMAL HIZLANMA [cite: 2026-04-10]
                let currentStep = r.speed;

                // NADİR OLAY: Motor Teklemesi
                if (r.badLuckZone && r.pos > r.badLuckZone && r.pos < r.badLuckZone + 10) {
                    currentStep *= 0.3; // Sadece o bölgede yavaşlar
                }

                // RED ROACH SABOTAJI: Sona gelince nefesi kesilir [cite: 2026-04-10]
                if (r.name === "RED ROACH" && r.pos > 92) {
                    currentStep *= 0.15;
                }

                // HİLE KODU: Sona doğru atağa kalk
                if (r.isHacked && r.pos > 70) {
                    currentStep *= 2.5;
                }

                r.pos += currentStep;
                r.element.style.bottom = r.pos + "%";
            } else if (!r.finished) {
                r.finished = true;
                r.finishTime = Date.now();
            }
        });

        if (allFinished) {
            clearInterval(raceInterval);
            const winner = racers.sort((a, b) => a.finishTime - b.finishTime)[0];
            const reward = bet * 1.5;

            setTimeout(() => {
                const isWin = (winner.name === selectedBug);
                if(isWin) { myBalance += reward; localStorage.setItem('h1_balance', myBalance); }
                displayResults(winner, reward, isWin);
            }, 600);
        }
    }, 40);
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