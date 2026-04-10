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
    if(!selectedBug || bet > myBalance || bet <= 0) return alert("Hata: Seçim veya Bakiye geçersiz!");

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
    
    let results = [];
    const CHEAT_CODES = [8731, 4431]; 

    ALL_BUGS.forEach((bug) => {
        let finalTime;
        // 1. Durum: RED ROACH (Red Bull) Sabotajı - Tam kazanacakken kaybeder [cite: 2026-04-10]
        if(bug.name === "RED ROACH") {
            finalTime = (10.5 + Math.random() * 1.5).toFixed(3); 
        } 
        // 2. Durum: Hile Kodları - Son anda atağa kalkar [cite: 2026-04-10]
        else if(CHEAT_CODES.includes(bet) && bug.name === selectedBug) {
            finalTime = (8.0 + Math.random() * 0.2).toFixed(3); 
        }
        // 3. Durum: Normal Yarışçılar [cite: 2026-04-10]
        else {
            finalTime = (8.5 + Math.random() * 3.5).toFixed(3); 
        }
        results.push({ name: bug.name, img: bug.img, time: parseFloat(finalTime) });
    });

    results.forEach((racer, i) => {
        const img = document.createElement('img');
        img.src = racer.img;
        img.className = 'cockroach';
        lanes[i].appendChild(img);

        // DINAMIK ANIMASYON: 3 Aşamalı Hareket [cite: 2026-04-10]
        // Aşama 1: Fırlama
        setTimeout(() => {
            img.style.transition = `bottom ${racer.time * 0.4}s ease-in`;
            img.style.bottom = "40%"; 
        }, 100);

        // Aşama 2: Çekişme (Hız değişikliği)
        setTimeout(() => {
            const chaosFactor = Math.random() * 0.5 + 0.8; // Rastgele ivme
            img.style.transition = `bottom ${racer.time * 0.3}s cubic-bezier(0.68, -0.55, 0.27, 1.55)`;
            img.style.bottom = "75%";
        }, racer.time * 400);

        // Aşama 3: Bitiş (Son atak veya yorulma)
        setTimeout(() => {
            // Red Roach tam burada yorulur [cite: 2026-04-10]
            const finishEase = (racer.name === "RED ROACH") ? "ease-out" : "cubic-bezier(0.17, 0.67, 0.83, 0.67)";
            img.style.transition = `bottom ${racer.time * 0.3}s ${finishEase}`;
            img.style.bottom = "120vh"; 
        }, racer.time * 700);
    });

    const winner = [...results].sort((a, b) => a.time - b.time)[0];
    const reward = bet * 1.5; 

    setTimeout(() => {
        const isWin = (winner.name === selectedBug);
        if(isWin) { myBalance += reward; localStorage.setItem('h1_balance', myBalance); }
        displayResults(winner, reward, isWin);
    }, winner.time * 1000 + 200);
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