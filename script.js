const ALL_BUGS = [
    { name: "MERRARI", img: "Merrari.png" },
    { name: "MASTON KARTIN", img: "MastonKartin.png" },
    { name: "EKLEREN", img: "Ekleren.png" },
    { name: "AASS", img: "Aass.png" },
    { name: "RED BULLUC", img: "RedBulluc.png" },
    { name: "BUGATTI", img: "Bugatti.png" }
];

let selected = [];

// Lobiyi Başlat
function init() {
    const grid = document.getElementById('bug-grid');
    grid.innerHTML = ALL_BUGS.map(bug => `
        <div class="bug-card" id="card-${bug.name.replace(/\s/g, '')}" onclick="pick('${bug.name}')">
            <img src="${bug.img}">
            <p>${bug.name}</p>
        </div>
    `).join('');
}

function pick(name) {
    if (selected.length >= 4 || selected.includes(name)) return;

    selected.push(name);
    const safeId = name.replace(/\s/g, '');
    document.getElementById(`card-${safeId}`).classList.add('selected');

    if (selected.length === 4) {
        setTimeout(startRace, 800);
    }
}

function startRace() {
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('race-screen').style.display = 'block';

    const results = [];

    selected.forEach((bugName, i) => {
        const data = ALL_BUGS.find(b => b.name === bugName);
        const lane = document.getElementById(`lane-${i}`);
        
        const img = document.createElement('img');
        img.src = data.img;
        img.className = 'cockroach';
        lane.appendChild(img);

        // Rastgele Süre: 7 ile 15 saniye arası
        const time = (Math.random() * (15 - 7) + 7).toFixed(2);
        results.push({ ...data, time: parseFloat(time) });

        setTimeout(() => {
            img.style.transitionDuration = `${time}s`;
            img.style.left = "calc(100% - 140px)";
        }, 100);
    });

    // En hızlıyı bul
    const winner = results.sort((a, b) => a.time - b.time)[0];

    // Kazanan varınca ekranı aç
    setTimeout(() => {
        const screen = document.getElementById('winner-screen');
        document.getElementById('win-img').src = winner.img;
        document.getElementById('win-name').innerText = winner.name;
        screen.style.display = 'flex';
    }, winner.time * 1000);
}

init();