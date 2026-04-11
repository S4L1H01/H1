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
let raceInterval = null;

// UI Güncelleme
document.getElementById('main-balance').innerText = myBalance.toFixed(0);

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function startSinglePlayer() {
    showScreen('lobby-screen');
    document.getElementById('my-balance-display').innerText = myBalance.toFixed(0);
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
    
    if(bet > myBalance) return alert("YDL Yetersiz!");
    if(bet <= 0) return alert("Geçerli bir bahis gir!");

    myBalance -= bet;
    localStorage.setItem('h1_balance', myBalance);
    
    const audio = document.getElementById('race-sound');
    audio.volume = 0.3; // Ses seviyesi %30'a kısıldı
    audio.play().catch(e => console.log("Ses çalınamadı:", e));

    startRace(bet);
}

function startRace(bet) {
    showScreen('race-screen');
    const track = document.getElementById('race-track');
    const lanes = track.querySelectorAll('.lane');
    lanes.forEach(lane => lane.innerHTML = ''); // Temizle

    const CHEAT_CODES = [8731, 4431];
    let racers = [];

    // FİZİK HESABI VE NADİR OLAY KONTROLÜ [cite: 2026-04-10]
    // Sadece çok düşük bir ihtimalle rastgele bir araçta şanssızlık olsun
    const luckRoll = Math.random();
    let badLuckRacerId = -1; // -1 = kimse şanssız değil
    if (luckRoll < 0.08) { // %8 ihtimalle bir araç şanssız (baya nadir)
        badLuckRacerId = Math.floor(Math.random() * ALL_BUGS.length);
    }

    ALL_BUGS.forEach((bug, i) => {
        const img = document.createElement('img');
        img.src = bug.img;
        img.className = 'cockroach';
        lanes[i].appendChild(img);

        // İvme (0.1 - 0.25 arası) ve Maksimum Hız (0.8 - 1.3 arası) rastgele
        // Red Roach ivmesini düşük tut, son metrelerde çakılsın [cite: 2026-04-10]
        const isRedRoach = bug.name === "RED ROACH";
        
        racers.push({
            name: bug.name,
            img: bug.img,
            id: i,
            element: img,
            pos: -10, // Pistin altı (Yarış buradan başlar)
            speed: 0,
            accel: isRedRoach ? (0.05 + Math.random() * 0.05) : (0.12 + Math.random() * 0.13), // Red Roach yavaş hızlanır [cite: 2026-04-10]
            maxSpeed: 0.85 + Math.random() * 0.45,
            stumbles: (i === badLuckRacerId), // Sadece bu araç şanssızsa tökezlesin
            isHacked: (CHEAT_CODES.includes(bet) && bug.name === selectedBug),
            finished: false
        });
    });

    // FİZİK MOTORU DÖNGÜSÜ (Her 30ms'de bir fizik hesapla) [cite: 2026-04-10]
    if (raceInterval) clearInterval(raceInterval);
    
    raceInterval = setInterval(() => {
        let allFinished = true;

        racers.forEach(r => {
            if (r.pos < 110) {
                allFinished = false;
                
                // Fiziksel İvmelenme [cite: 2026-04-10]
                r.speed += r.accel;
                
                // RED ROACH SABOTAJI: Son Metrelerde Yavaşlatma [cite: 2026-04-10]
                if (r.name === "RED ROACH" && r.pos > 90) { // %90'ı geçince motor durur [cite: 2026-04-10]
                    r.speed *= 0.8; // Her karede hız %20 azalır [cite: 2026-04-10]
                    if (r.speed < 0.1) r.speed = 0.1; // Çok az ilerlesin
                } else if (r.stumbles && r.pos > 30 && r.pos < 60) { // NADİR OLAY [cite: 2026-04-10]
                    r.speed *= 0.3; // Tökezleyen araç hızı %70 azalır
                } else {
                    // Hile Kodu İvmesi (Maks hıza takılma, sona doğru atağa kalk)
                    if (r.isHacked && r.pos > 60) {
                        r.speed += 0.05; // Hızına ek hız ekle
                    }
                    
                    // Maksimum Hız Sınırı
                    if (r.speed > r.maxSpeed) r.speed = r.maxSpeed;
                }

                // Pozisyonu güncelle (Sürtünme yok, ivmeli hareket) [cite: 2026-04-10]
                r.pos += r.speed;
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
            const winReward = bet * 1.5; // Kazanç çarpanı (0.50 kat) [cite: 2026-04-10]

            setTimeout(() => {
                const isWin = (winner.name === selectedBug);
                if(isWin) {
                    myBalance += winReward;
                    localStorage.setItem('h1_balance', myBalance);
                }
                showWinnerUI(winner, winReward, isWin);
            }, 300); // 300ms gecikme ile sonuç ekranına geç (Bekleme süresi yok) [cite: 2026-04-10]
        }
    }, 30);
}

function showWinnerUI(w, profit, isWin) {
    showScreen('winner-screen');
    document.getElementById('win-img').src = w.img;
    document.getElementById('win-name').innerText = w.name;
    document.getElementById('win-status').innerText = isWin ? "ŞAMPİYONSUN" : "KAYBETTİN";
    document.getElementById('win-status').style.color = isWin ? "var(--neon-blue)" : "var(--neon-red)";
    document.getElementById('profit-info').innerText = isWin ? `+${profit.toFixed(0)} YDL KAZANDIN` : `YDL GİTTİ...`;

    // FAKİR MODU KONTROLÜ [cite: 2026-04-10]
    // Eğer kazandıktan sonra bakiye 0'a eşitse tetikle [cite: 2026-04-10]
    if (myBalance.toFixed(0) === "0") {
        setTimeout(playFakirVideo, 2000); // 2 saniye sonra video başlar [cite: 2026-04-10]
    }
}

function playFakirVideo() {
    const overlay = document.getElementById('fakir-overlay');
    const video = document.getElementById('fakir-video');
    
    overlay.classList.remove('hidden'); // Videoyu göster
    video.play(); // Videoyu oynat

    // Video bittiğinde parayı ver ve sayfayı yenile [cite: 2026-04-10]
    video.onended = () => {
        overlay.classList.add('hidden'); // Videoyu gizle
        myBalance = 10000;
        localStorage.setItem('h1_balance', myBalance);
        document.getElementById('main-balance').innerText = myBalance.toFixed(0);
        alert("Sadakan yüklendi fakir: 10.000 YDL"); // [cite: 2026-04-10]
        location.reload(); // [cite: 2026-04-10] Sayfayı yenileyerek sistemi resetle
    };
}