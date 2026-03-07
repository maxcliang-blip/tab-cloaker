let settings = { 
    vault: "", skin: "default", panicKey: "\\",
    identity: { title: "404 Not Found", icon: "https://ssl.gstatic.com/favicon.ico" },
    decoy: { main: "Semester Study Planner" },
    history: [], stash: [], snippets: [], restoreSession: false, lastUrl: "", hbActive: true, ghostMode: false
};

let inputSeq = ""; 
let pomoInterval = null;
let currentKey = "";
let ghostTimeout;

function init() {
    const raw = localStorage.getItem('cloaker_v62');
    if(raw) settings = JSON.parse(raw);
    
    applyIdentity();
    document.getElementById('decoyMainTitle').textContent = settings.decoy.main;
    document.body.setAttribute('data-skin', settings.skin);
    document.getElementById('skinSelect').value = settings.skin;
    document.getElementById('restoreCheck').checked = settings.restoreSession;
    document.getElementById('hbCheck').checked = settings.hbActive;
    document.getElementById('ghostCheck').checked = settings.ghostMode;
    
    renderHistory();
    renderStash();
    renderSnippets();
    setupDropZone();
    if(settings.hbActive) startHeartbeat();
    if(settings.ghostMode) initGhostCursor();

    window.onkeyup = (e) => {
        inputSeq += e.key.toLowerCase();
        if(inputSeq.endsWith("cloak")) {
            document.getElementById('shadow').style.display = 'none';
            document.getElementById('mainUI').style.display = 'flex';
            setTimeout(() => document.getElementById('mainUI').style.opacity = '1', 10);
        }
        if(e.key === settings.panicKey) location.reload();
    };
}

function verify() {
    const p = document.getElementById('pswd').value;
    if(p === "1234") {
        currentKey = p;
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        decryptVault();
        if(settings.restoreSession && settings.lastUrl) launch(settings.lastUrl);
    } else if (p === "planner2026") {
        document.getElementById('mainUI').style.display = 'none';
        document.getElementById('decoyUI').style.display = 'block';
    }
}

// --- LAUNCHER ---
function launch(url) {
    let t = url || document.getElementById('target').value;
    if(!t) return;
    const mode = document.getElementById('proxyToggle').value;
    if(mode === 'proxy') t = `https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`;

    settings.lastUrl = t;
    if(!settings.history.includes(t)) {
        settings.history.unshift(t);
        if(settings.history.length > 8) settings.history.pop();
    }
    save(); renderHistory();
    const win = window.open('about:blank', '_blank');
    win.document.write(`<iframe src="${t}" style="width:100%;height:100%;border:none;position:fixed;inset:0;"></iframe>`);
}

// --- GHOST CURSOR ---
function initGhostCursor() {
    document.onmousemove = () => {
        document.body.classList.remove('ghost-active');
        clearTimeout(ghostTimeout);
        if(settings.ghostMode) ghostTimeout = setTimeout(() => document.body.classList.add('ghost-active'), 3000);
    };
}
function updateGhost() { settings.ghostMode = document.getElementById('ghostCheck').checked; save(); if(settings.ghostMode) initGhostCursor(); }

// --- ENCRYPTED VAULT ---
function saveVault() {
    const rawText = document.getElementById('vaultNotes').value;
    if(currentKey) {
        settings.vault = CryptoJS.AES.encrypt(rawText, currentKey).toString();
        save();
        document.getElementById('saveStatus').textContent = "• Encrypted";
    }
}
function decryptVault() {
    if(settings.vault && currentKey) {
        try {
            const bytes = CryptoJS.AES.decrypt(settings.vault, currentKey);
            document.getElementById('vaultNotes').value = bytes.toString(CryptoJS.enc.Utf8);
        } catch(e) { console.warn("Vault locked."); }
    }
}

// --- STASH & SNIPPETS ---
function setupDropZone() {
    const dz = document.getElementById('dropZone');
    if(!dz) return;
    dz.ondragover = () => { dz.classList.add('dragover'); return false; };
    dz.ondrop = (e) => {
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
    document.getElementById('fileList').innerHTML = settings.stash.map((f, i) => `
        <div class="file-item"><span>${f.name}</span><button onclick="openFile(${i})" style="width:auto;padding:2px 5px;">Open</button></div>
    `).join('');
}
function openFile(i) {
    const win = window.open();
    win.document.write(`<iframe src="${settings.stash[i].data}" style="width:100%;height:100%;border:none;"></iframe>`);
}
function addSnippet() {
    const val = document.getElementById('newClip').value;
    if(val) { settings.snippets.push(val); document.getElementById('newClip').value=''; save(); renderSnippets(); }
}
function renderSnippets() {
    document.getElementById('clipboardList').innerHTML = settings.snippets.map(s => `<span class="clip-tag" onclick="navigator.clipboard.writeText('${s}')">${s.substring(0,10)}...</span>`).join('');
}

// --- SYSTEM UTILS ---
function applyIdentity() {
    document.title = settings.identity.title;
    document.getElementById('tabIcon').href = settings.identity.icon;
}
function updateIdentity() {
    settings.identity.title = document.getElementById('tabNameIn').value || "404 Not Found";
    settings.identity.icon = document.getElementById('tabIconIn').value || "https://ssl.gstatic.com/favicon.ico";
    applyIdentity(); save();
}
function updateSkin() { settings.skin = document.getElementById('skinSelect').value; document.body.setAttribute('data-skin', settings.skin); save(); }
function updateHB() { settings.hbActive = document.getElementById('hbCheck').checked; save(); }
function updateRestore() { settings.restoreSession = document.getElementById('restoreCheck').checked; save(); }
function renderHistory() { document.getElementById('historyList').innerHTML = settings.history.map(url => `<span class="hist-tag" onclick="launch('${url}')">${url.substring(0,15)}...</span>`).join(''); }
function save() { localStorage.setItem('cloaker_v62', JSON.stringify(settings)); }
function openTab(id) { 
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(event) event.currentTarget.classList.add('active');
}
function startHeartbeat() { setInterval(() => { if(settings.hbActive) fetch('https://api.ipify.org?format=json'); }, 300000); }
function startTimer(m) { clearInterval(pomoInterval); let t=m*60; pomoInterval=setInterval(()=>{ let min=Math.floor(t/60),sec=t%60; document.getElementById('pomoDisplay').textContent=`${min}:${sec<10?'0':''}${sec}`; if(t--<=0)clearInterval(pomoInterval); },1000); }
function setPanicKey() { window.onkeydown=(e)=>{ settings.panicKey=e.key; document.getElementById('pkDisp').textContent="Panic: "+e.key; save(); window.onkeydown=null; }; }
function panicExport() { const blob=new Blob([JSON.stringify(settings)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='backup.json'; a.click(); localStorage.clear(); window.location.replace("https://google.com"); }