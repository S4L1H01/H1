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
    if(!selectedBug) return alert("Aracını seç!");
    const bet = parseFloat(document.getElementById('bet-amount').value);
    if(bet > myBalance || bet <= 0) return alert("Geçersiz bakiye!");

    myBalance -= bet;
    localStorage.setItem('h1_balance', myBalance);
    
    const audio = document.getElementById('race-sound');
    audio.volume = 0.2;
    audio.play();

    runRaceEngine(bet);
}

function runRaceEngine(bet) {
    showScreen('race-screen');
    const lanes = document.querySelectorAll('.lane');
    lanes.forEach(l => l.innerHTML = ''); 
    
    let results = [];
    const CHEAT_CODES = [8731, 4431]; 

    ALL_BUGS.forEach((bug) => {
        let time;
        // Heyecan faktörü: Rastgele ek süreler (Sona yaklaşınca yavaşlama hissi için) [cite: 2026-04-10]
        const chaos = Math.random() * 1.5;

        if(bug.name === "RED ROACH") {
            time = (9.5 + chaos + 2.0).toFixed(3); // Hep 11 sn üstü ama yakından kaybediyor [cite: 2026-04-10]
        } 
        else if(CHEAT_CODES.includes(bet) && bug.name === selectedBug) {
            time = (8.0 + (Math.random() * 0.3)).toFixed(3); // Hileli araç garantili ama heyecanlı süre
        }
        else {
            time = (8.5 + chaos).toFixed(3); // Normal araçlar
        }
        results.push({ name: bug.name, img: bug.img, time: parseFloat(time) });
    });

    // Araçları Pistte Yürüt
    results.forEach((racer, i) => {
        const img = document.createElement('img');
        img.src = racer.img;
        img.className = 'cockroach';
        lanes[i].appendChild(img);

        // Dinamik Hareket: Önce fırlar, sonra hafif yavaşlar, sonra bitirir [cite: 2026-04-10]
        setTimeout(() => {
            img.style.transition = `bottom ${racer.time}s cubic-bezier(0.2, 0.8, 0.4, 1)`;
            img.style.bottom = "120vh"; 
        }, 100);
    });

    const winner = [...results].sort((a, b) => a.time - b.time)[0];
    const reward = bet * 1.5; // Yeni Kazanç Çarpanı: 0.50 kat fazlası [cite: 2026-04-10]

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
    document.getElementById('profit-info').innerText = isWin ? `+${reward.toFixed(0)} YDL KAZANDIN` : "YDL GİTTİ";
}