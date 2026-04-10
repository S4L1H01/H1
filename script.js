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

// İlk açılışta bakiye yazdır
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
    const betInput = document.getElementById('bet-amount');
    const bet = parseFloat(betInput.value);
    
    if(!selectedBug) return alert("ARACINI SEÇ!");
    if(bet > myBalance) return alert("YETERSİZ BAKİYE!");
    if(bet <= 0) return alert("GEÇERSİZ BAHİS!");

    myBalance -= bet;
    localStorage.setItem('h1_balance', myBalance);
    
    const audio = document.getElementById('race-sound');
    audio.volume = 0.2;
    audio.play().catch(() => {});

    runRaceEngine(bet);
}

function runRaceEngine(bet) {
    showScreen('race-screen');
    const lanes = document.querySelectorAll('.lane');
    lanes.forEach(l => l.innerHTML = ''); 
    
    const CHEAT_CODES = [8731, 4431];
    
    let racers = ALL_BUGS.map((bug) => {
        // NADİR OLAY: %5 ihtimalle motor arızası [cite: 2026-04-10]
        const hasBadLuck = Math.random() < 0.05; 
        
        return {
            ...bug,
            pos: -5,
            // Hızları artırdık (0.8 - 1.2 arası), yarış seri bitsin diye
            speed: 0.8 + (Math.random() * 0.4), 
            finished: false,
            element: null,
            badLuckZone: hasBadLuck ? (30 + Math.random() * 40) : null,
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
            if (r.pos < 100) { // Araç ekran tepesine gelince durur [cite: 2026-04-10]
                allFinished = false;
                let step = r.speed;

                // Nadir Şanssızlık (Motor Teklemesi)
                if (r.badLuckZone && r.pos > r.badLuckZone && r.pos < r.badLuckZone + 7) {
                    step *= 0.25;
                }

                // RED ROACH SABOTAJI: Sona gelince hızı çakılır [cite: 2026-04-10]
                if (r.name === "RED ROACH" && r.pos > 88) {
                    step *= 0.1;
                }

                // HİLE KODU: Sona doğru %200 performans
                if (r.isHacked && r.pos > 65) {
                    step *= 2.2;
                }

                r.pos += step;
                r.element.style.bottom = r.pos + "%";
            } else if (!r.finished) {
                r.finished = true;
                r.finishTime = Date.now();
            }
        });

        // Tüm araçlar çizgiyi geçtiği an beklemeden bitir [cite: 2026-04-10]
        if (allFinished) {
            clearInterval(raceInterval);
            const winner = racers.sort((a, b) => a.finishTime - b.finishTime)[0];
            const reward = bet * 1.5; // Kazanç çarpanı: 0.50 kat fazlası [cite: 2026-04-10]

            setTimeout(() => {
                const isWin = (winner.name === selectedBug);
                if(isWin) { 
                    myBalance += reward; 
                    localStorage.setItem('h1_balance', myBalance); 
                }
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
    document.getElementById('profit-info').innerText = isWin ? `+${reward.toFixed(0)} YDL KAZANDIN` : "BAHİS PATLADI";
}