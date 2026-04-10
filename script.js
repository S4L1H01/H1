const VEHICLE_DATA = [
    { name: "MERRARI", img: "Merrari.png" },
    { name: "MASTON KARTIN", img: "MastonKartin.png" },
    { name: "EKLEREN", img: "Ekleren.png" },
    { name: "AASS", img: "Aass.png" },
    { name: "RED ROACH", img: "RedRoach.png" }, // <--- Lanetli Araç
    { name: "MILLYIMS", img: "Millyıms.png" }
];

let myBalance = parseFloat(localStorage.getItem('h1_balance')) || 10000;
let userSelection = null;

// UI Başlatma
document.getElementById('main-balance-val').textContent = myBalance.toFixed(0);

function switchScreen(targetId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
}

function initSinglePlayer() {
    switchScreen('garage-screen');
    updateBalanceUI();
    renderVehicles();
}

function renderVehicles() {
    const grid = document.getElementById('vehicle-grid');
    grid.innerHTML = VEHICLE_DATA.map(v => `
        <div class="v-card ${userSelection === v.name ? 'selected' : ''}" onclick="selectVehicle('${v.name}')">
            <img src="${v.img}" width="100">
            <p>${v.name}</p>
        </div>
    `).join('');
}

window.selectVehicle = (name) => {
    userSelection = name;
    renderVehicles();
};

function launchSequence() {
    const bet = parseFloat(document.getElementById('bet-field').value);
    if (!userSelection) return alert("BİR ARAÇ SEÇMELİSİN!");
    if (bet > myBalance) return alert("YETERSİZ BAKİYE!");
    if (bet < 100) return alert("MİNİMUM BAHİS 100 YDL!");

    myBalance -= bet;
    saveBalance();
    
    // Ses Efekti
    const sfx = document.getElementById('race-sound');
    sfx.currentTime = 0;
    sfx.play();

    startRaceCore(bet);
}

function startRaceCore(bet) {
    switchScreen('race-track-screen');
    const lanes = document.querySelectorAll('.lane');
    let raceStats = [];

    // 1. ADIM: Başlangıç Sürelerini Ata [cite: 2026-04-10]
    VEHICLE_DATA.forEach((car) => {
        // Algoritma: 6.5 - 11.5 saniye arası rastgele bitiş
        const duration = (Math.random() * 5 + 6.5).toFixed(3);
        raceStats.push({ name: car.name, img: car.img, time: parseFloat(duration) });
    });

    // 2. ADIM: RED ROACH SABOTAJI (Kritik Bölge) [cite: 2026-04-10]
    const redRoachIndex = raceStats.findIndex(car => car.name === "RED ROACH");
    
    // Geçici olarak kazananı bul
    const tempWinner = [...raceStats].sort((a, b) => a.time - b.time);

    // Eğer kazanan Red Roach ise, süresini sabote et ve onu sonuncu yap [cite: 2026-04-10]
    if (tempWinner.name === "RED ROACH") {
        console.log("⚠️ Sabotaj Devrede: Red Roach'un birinciliği engellendi.");
        
        // Diğer en yavaş aracın süresini bul
        const slowestTime = [...raceStats].sort((a, b) => b.time - a.time).time;
        
        // Red Roach'u ondan bile daha yavaş yap (örn: 2 saniye daha yavaş) [cite: 2026-04-10]
        raceStats.time = slowestTime + 2.0; 
    }

    // 3. ADIM: Animasyonları Başlat [cite: 2026-04-10]
    raceStats.forEach((carStats, index) => {
        const lanes = document.querySelectorAll('.lane');
        const sprite = document.createElement('img');
        sprite.src = carStats.img;
        sprite.className = 'racer-sprite';
        lanes.appendChild(sprite);

        setTimeout(() => {
            sprite.style.transition = `top ${carStats.time}s cubic-bezier(0.45, 0.05, 0.55, 0.95)`;
            sprite.style.top = "110vh";
        }, 100);
    });

    // 4. ADIM: Gerçek Kazananı Hesapla ve Göster [cite: 2026-04-10]
    const finalWinner = [...raceStats].sort((a, b) => a.time - b.time);
    const winMultiplier = 5; 

    setTimeout(() => {
        const isUserWinner = (finalWinner.name === userSelection);
        if (isUserWinner) {
            const reward = bet * winMultiplier;
            myBalance += reward;
            saveBalance();
            displayResults(finalWinner, reward, true);
        } else {
            displayResults(finalWinner, 0, false);
        }
    }, finalWinner.time * 1000);
}

function displayResults(winner, cash, isWin) {
    switchScreen('result-screen');
    document.getElementById('winner-image').src = winner.img;
    document.getElementById('winner-car-name').textContent = winner.name;
    
    const statusText = document.getElementById('race-outcome');
    const infoText = document.getElementById('payout-info');

    if (isWin) {
        statusText.textContent = "ŞAMPİYONSUN!";
        statusText.style.color = "var(--cyan)";
        infoText.textContent = `+${cash} YDL HESABINA AKTARILDI`;
    } else {
        statusText.textContent = "KAYBETTİN";
        statusText.style.color = "var(--red)";
        infoText.textContent = `${winner.name} KAZANDI, BAHİS BOŞA GİTTİ`;
    }
}

function updateBalanceUI() {
    document.getElementById('garage-balance-val').textContent = myBalance.toFixed(0);
}

function saveBalance() {
    localStorage.setItem('h1_balance', myBalance);
}

function resetToMenu() {
    location.reload();
}