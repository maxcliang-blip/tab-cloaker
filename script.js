let settings = { 
    vault: "", theme: "light", panicKey: "\\",
    identity: { title: "404 Not Found", icon: "https://ssl.gstatic.com/favicon.ico" },
    decoy: { main: "Semester Study Planner" }
};
let inputSeq = "";
let pomoInterval = null;

function init() {
    const raw = localStorage.getItem('cloaker_v59_multi');
    if(raw) settings = JSON.parse(raw);
    
    // Apply Identity & Decoy
    applyIdentity();
    document.getElementById('decoyMainTitle').textContent = settings.decoy.main;
    document.getElementById('editMainTitle').value = settings.decoy.main;
    document.body.setAttribute('data-theme', settings.theme);
    document.getElementById('vaultNotes').value = settings.vault;
    
    // Keyboard Listeners
    window.onkeyup = (e) => {
        inputSeq += e.key.toLowerCase();
        if(inputSeq.endsWith("cloak")) {
            document.getElementById('shadow').style.display = 'none';
            const main = document.getElementById('mainUI');
            main.style.display = 'flex';
            setTimeout(() => main.style.opacity = '1', 10);
        }
        if(e.key === settings.panicKey) location.reload();
    };
}

function verify() {
    const p = document.getElementById('pswd').value;
    if(p === "1234") {
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    } else if (p === "planner2026") {
        document.getElementById('mainUI').style.display = 'none';
        document.getElementById('decoyUI').style.display = 'block';
    }
}

function applyIdentity() {
    document.title = settings.identity.title;
    document.getElementById('tabIcon').href = settings.identity.icon;
    document.getElementById('tabNameIn').value = settings.identity.title;
    document.getElementById('tabIconIn').value = settings.identity.icon;
}

function updateIdentity() {
    settings.identity.title = document.getElementById('tabNameIn').value || "404 Not Found";
    settings.identity.icon = document.getElementById('tabIconIn').value || "https://ssl.gstatic.com/favicon.ico";
    applyIdentity();
    save();
}

function updateDecoy() {
    settings.decoy.main = document.getElementById('editMainTitle').value;
    document.getElementById('decoyMainTitle').textContent = settings.decoy.main;
    save();
}

function saveVault() {
    settings.vault = document.getElementById('vaultNotes').value;
    const status = document.getElementById('saveStatus');
    status.textContent = "Saving...";
    save();
    setTimeout(() => status.textContent = "Saved", 1000);
}

function save() { 
    localStorage.setItem('cloaker_v59_multi', JSON.stringify(settings)); 
}

function openTab(id) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.currentTarget.classList.add('active');
}

function startTimer(mins) {
    clearInterval(pomoInterval);
    let time = mins * 60;
    pomoInterval = setInterval(() => {
        const m = Math.floor(time / 60);
        const s = time % 60;
        document.getElementById('pomoDisplay').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        if(time-- <= 0) clearInterval(pomoInterval);
    }, 1000);
}

function launch() {
    const t = document.getElementById('target').value;
    if(!t) return;
    const win = window.open('about:blank', '_blank');
    win.document.write(`<iframe src="${t}" style="width:100%;height:100%;border:none;position:fixed;inset:0;"></iframe>`);
}

function panicExport() {
    const blob = new Blob([JSON.stringify(settings)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'emergency_vault.json';
    a.click();
    localStorage.clear();
    window.location.replace("https://google.com");
}

function toggleTheme() {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', settings.theme);
    save();
}

function setPanicKey() {
    const disp = document.getElementById('pkDisp');
    disp.textContent = "Press any key...";
    window.onkeydown = (e) => {
        settings.panicKey = e.key;
        disp.textContent = "Panic Key: " + e.key;
        save();
        window.onkeydown = null;
    };
}
