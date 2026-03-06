let settings = { 
    vault: "", theme: "light", panicKey: "\\",
    identity: { title: "404 Not Found", icon: "https://ssl.gstatic.com/favicon.ico" },
    decoy: { main: "Semester Study Planner" },
    history: [], stash: [], restoreSession: false, lastUrl: ""
};

let inputSeq = ""; 
let pomoInterval = null;

function init() {
    const raw = localStorage.getItem('cloaker_v60');
    if(raw) settings = JSON.parse(raw);
    
    applyIdentity();
    document.getElementById('decoyMainTitle').textContent = settings.decoy.main;
    document.body.setAttribute('data-theme', settings.theme);
    document.getElementById('vaultNotes').value = settings.vault;
    document.getElementById('restoreCheck').checked = settings.restoreSession;
    
    renderHistory();
    renderStash();
    setupDropZone();

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
        if(settings.restoreSession && settings.lastUrl) launch(settings.lastUrl);
    } else if (p === "planner2026") {
        document.getElementById('mainUI').style.display = 'none';
        document.getElementById('decoyUI').style.display = 'block';
    }
}

function launch(url) {
    const t = url || document.getElementById('target').value;
    if(!t) return;
    
    settings.lastUrl = t;
    if(!settings.history.includes(t)) {
        settings.history.unshift(t);
        if(settings.history.length > 8) settings.history.pop();
    }
    save(); 
    renderHistory();
    
    const win = window.open('about:blank', '_blank');
    win.document.write(`<iframe src="${t}" style="width:100%;height:100%;border:none;position:fixed;inset:0;"></iframe>`);
}

function renderHistory() {
    const histCont = document.getElementById('historyList');
    if (histCont) {
        histCont.innerHTML = settings.history.map(url => 
            `<span class="hist-tag" onclick="launch('${url}')">${url.split('//')[1]?.substring(0,15) || url.substring(0,15)}...</span>`
        ).join('');
    }
}

function setupDropZone() {
    const dz = document.getElementById('dropZone');
    if(!dz) return;
    dz.ondragover = () => { dz.classList.add('dragover'); return false; };
    dz.ondragleave = () => { dz.classList.remove('dragover'); return false; };
    dz.ondrop = (e) => {
        dz.classList.remove('dragover');
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            settings.stash.push({ name: file.name, data: event.target.result });
            save(); renderStash();
        };
        reader.readAsDataURL(file);
    };
}

function renderStash() {
    const stashCont = document.getElementById('fileList');
    if (stashCont) {
        stashCont.innerHTML = settings.stash.map((file, i) => `
            <div class="file-item">
                <span>${file.name}</span>
                <div>
                    <button onclick="downloadFile(${i})" style="width:auto; padding:2px 5px; font-size:0.6rem;">Open</button>
                    <button onclick="deleteFile(${i})" style="width:auto; padding:2px 5px; background:red; font-size:0.6rem;">X</button>
                </div>
            </div>
        `).join('');
    }
}

function downloadFile(i) {
    const file = settings.stash[i];
    const win = window.open();
    win.document.write(`<iframe src="${file.data}" frameborder="0" style="border:0; top:0px; left:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
}

function deleteFile(i) { settings.stash.splice(i, 1); save(); renderStash(); }

function applyIdentity() {
    document.title = settings.identity.title;
    const iconEl = document.getElementById('tabIcon');
    if(iconEl) iconEl.href = settings.identity.icon;
    const nameIn = document.getElementById('tabNameIn');
    const iconIn = document.getElementById('tabIconIn');
    if(nameIn) nameIn.value = settings.identity.title;
    if(iconIn) iconIn.value = settings.identity.icon;
}

function updateIdentity() {
    settings.identity.title = document.getElementById('tabNameIn').value || "404 Not Found";
    settings.identity.icon = document.getElementById('tabIconIn').value || "https://ssl.gstatic.com/favicon.ico";
    applyIdentity();
    save();
}

function saveVault() {
    settings.vault = document.getElementById('vaultNotes').value;
    const status = document.getElementById('saveStatus');
    status.textContent = "• Saving...";
    save();
    setTimeout(() => status.textContent = "• Saved", 800);
}

function updateRestore() { settings.restoreSession = document.getElementById('restoreCheck').checked; save(); }
function save() { localStorage.setItem('cloaker_v60', JSON.stringify(settings)); }

function openTab(id) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (event && event.currentTarget) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }
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

function panicExport() {
    const blob = new Blob([JSON.stringify(settings)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'backup.json'; a.click();
    localStorage.clear();
    window.location.replace("https://google.com");
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
