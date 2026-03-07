let settings = { 
    vault: "", skin: "default", 
    identity: { title: "404 Not Found" },
    history: [], lastUrl: ""
};

let currentKey = "";
let inputSeq = "";

function init() {
    const raw = localStorage.getItem('cloaker_v63');
    if(raw) settings = JSON.parse(raw);
    
    // Sync UI to Settings
    document.title = settings.identity.title;
    document.body.setAttribute('data-skin', settings.skin);
    document.getElementById('skinSelect').value = settings.skin;
    document.getElementById('tabNameIn').value = settings.identity.title;
    
    renderHistory();

    window.onkeyup = (e) => {
        // Simple escape to hide everything
        if(e.key === "Escape") location.reload();
        
        // Sequence 'cloak' to show login
        inputSeq += e.key.toLowerCase();
        if(inputSeq.endsWith("cloak")) {
            document.getElementById('shadow').style.display = 'none';
            document.getElementById('mainUI').style.opacity = '1';
        }
    };
}

function verify() {
    const p = document.getElementById('pswd').value;
    if(p === "1234") {
        currentKey = p;
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        decryptVault();
    } else if(p === "planner") {
        document.getElementById('mainUI').style.display = 'none';
        document.getElementById('decoyUI').style.display = 'block';
    }
}

// --- GHOST LAUNCHER ---
function launch(url) {
    let t = url || document.getElementById('target').value;
    if(!t) return;
    const mode = document.getElementById('stealthMode').value;

    if(mode === 'null') {
        const meta = '<meta name="referrer" content="no-referrer">';
        const script = `<script>window.location.replace("${t}");<\/script>`;
        t = 'data:text/html;base64,' + btoa(meta + script);
    } else if(mode === 'proxy') {
        t = `https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`;
    }

    if(!settings.history.includes(t)) {
        settings.history.unshift(t);
        if(settings.history.length > 5) settings.history.pop();
    }
    save(); renderHistory();
    
    const win = window.open('about:blank', '_blank');
    win.document.write(`<iframe src="${t}" style="width:100%;height:100%;border:none;position:fixed;inset:0;"></iframe>`);
}

// --- CLI TERMINAL ---
function handleCmd() {
    const input = document.getElementById('termInput');
    const out = document.getElementById('terminalOutput');
    const cmd = input.value.trim().toLowerCase();
    input.value = '';

    out.innerHTML += `\n<span style="color:#888">$ ${cmd}</span>`;
    
    if(cmd === 'help') {
        out.innerHTML += `\n- launch [url]\n- logs (Generate Activity Report)\n- clear\n- panic`;
    } else if(cmd.startsWith('launch ')) {
        launch(cmd.split(' ')[1]);
    } else if(cmd === 'logs') {
        const time = new Date().toLocaleTimeString();
        out.innerHTML += `\n[${time}] Checking System Integrity... PASS`;
        out.innerHTML += `\n[${time}] Background Tasks... SECURE`;
        out.innerHTML += `\n[${time}] No unauthorized access detected.`;
    } else if(cmd === 'clear') {
        out.innerHTML = 'GhostOS v63.1 Ready...';
    } else {
        out.innerHTML += `\nUnknown command. Type 'help'.`;
    }
    out.scrollTop = out.scrollHeight;
}

// --- TAB MIRRORING ---
function buildMirror() {
    const u1 = document.getElementById('m1').value;
    const u2 = document.getElementById('m2').value;
    if(!u1 || !u2) return;

    document.getElementById('frameLeft').src = u1;
    document.getElementById('frameRight').src = u2;
    document.getElementById('mainContainer').style.display = 'none';
    document.getElementById('mirrorView').style.display = 'flex';
}

function closeMirror() {
    document.getElementById('mirrorView').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
}

// --- VAULT ---
function saveVault() {
    const txt = document.getElementById('vaultNotes').value;
    if(currentKey) {
        settings.vault = CryptoJS.AES.encrypt(txt, currentKey).toString();
        save();
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

// --- UTILS ---
function openTab(id) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.currentTarget.classList.add('active');
}

function updateSkin() { 
    settings.skin = document.getElementById('skinSelect').value; 
    document.body.setAttribute('data-skin', settings.skin); 
    save(); 
}

function updateIdentity() { 
    settings.identity.title = document.getElementById('tabNameIn').value || "404 Not Found"; 
    document.title = settings.identity.title; 
    save(); 
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if(list) list.innerHTML = settings.history.map(h => `<div style="font-size:0.6rem; color:#888; overflow:hidden; white-space:nowrap;">• ${h.substring(0,60)}</div>`).join('');
}

function save() { localStorage.setItem('cloaker_v63', JSON.stringify(settings)); }
function panicExport() { localStorage.clear(); location.reload(); }