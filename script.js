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

window.selectBug = (n) => {
    selectedBug = n;
    renderBugs();
};

function launchRace() {
    if(!selectedBug) return alert("Önce aracını seçmelisin!");
    const bet = parseFloat(document.getElementById('bet-amount').value);
    
    if(bet > myBalance) return alert("YDL Yetersiz!");
    if(bet <= 0) return alert("Geçerli bir bahis gir!");

    myBalance -= bet;
    localStorage.setItem('h1_balance', myBalance);
    
    const audio = document.getElementById('race-sound');
    audio.volume = 0.2;
    audio.play().catch(e => console.log("Ses çalınamadı:", e));

    runRaceEngine(bet);
}

function runRaceEngine(bet) {
    showScreen('race-screen');
    const lanes = document.querySelectorAll('.lane');
    lanes.forEach(l => l.innerHTML = ''); 
    
    let results = [];
    const CHEAT_CODE = 8731; // Gizli Bahis Kodu [cite: 2026-04-10]

    ALL_BUGS.forEach((bug) => {
        let time;

        // 1. Durum: RED ROACH Her Zaman Kaybeder [cite: 2026-04-10]
        if(bug.name === "RED ROACH") {
            time = (Math.random() * 2 + 13).toFixed(3); // En yavaş (13+ sn)
        } 
        // 2. Durum: 8731 Basıldıysa ve Red Roach değilse kazandır [cite: 2026-04-10]
        else if(bet === CHEAT_CODE && bug.name === selectedBug) {
            time = (Math.random() * 0.2 + 6.0).toFixed(3); // En hızlı (6.0 - 6.2 sn)
        }
        // 3. Durum: Normal Yarışçılar
        else {
            time = (Math.random() * 4 + 7.5).toFixed(3); // Normal hız (7.5 - 11.5 sn)
        }
        
        results.push({ name: bug.name, img: bug.img, time: parseFloat(time) });
    });

    // Animasyonu Başlat (Aşağıdan Yukarı)
    results.forEach((racer, i) => {
        const img = document.createElement('img');
        img.src = racer.img;
        img.className = 'cockroach';
        lanes[i].appendChild(img);

        setTimeout(() => {
            img.style.transition = `bottom ${racer.time}s cubic-bezier(0.4, 0, 0.2, 1)`;
            img.style.bottom = "120vh"; 
        }, 100);
    });

    const winner = [...results].sort((a, b) => a.time - b.time)[0];
    const reward = bet * 4;

    setTimeout(() => {
        const isUserWinner = (winner.name === selectedBug);
        if(isUserWinner) {
            myBalance += reward;
            localStorage.setItem('h1_balance', myBalance);
        }
        displayResults(winner, reward, isUserWinner);
    }, winner.time * 1000);
}

function displayResults(w, reward, isWin) {
    showScreen('winner-screen');
    document.getElementById('win-img').src = w.img;
    document.getElementById('win-name').innerText = w.name;
    const status = document.getElementById('win-status');
    status.innerText = isWin ? "ŞAMPİYONSUN!" : "KAYBETTİN!";
    status.style.color = isWin ? "#00f3ff" : "#ff003c";
    document.getElementById('profit-info').innerText = isWin ? `+${reward} YDL KAZANDIN` : "BAHİS PATLADI";
}