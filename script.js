let settings = { 
    vault: "", skin: "default", panicKey: "\\", panicUrl: "https://google.com",
    identity: { title: "404 Not Found" },
    history: [], ghostVault: false
};

let currentKey = "";
let inputSeq = "";

function init() {
    const raw = localStorage.getItem('cloaker_v64');
    if(raw) settings = JSON.parse(raw);
    
    document.title = settings.identity.title;
    document.body.setAttribute('data-skin', settings.skin);
    document.getElementById('skinSelect').value = settings.skin;
    document.getElementById('tabNameIn').value = settings.identity.title;
    document.getElementById('panicUrlIn').value = settings.panicUrl;
    document.getElementById('ghostToggle').checked = settings.ghostVault;
    if(settings.ghostVault) document.getElementById('vaultNotes').classList.add('ghost-active');
    
    renderHistory();

    window.onkeydown = (e) => {
        // Hotkey: Ctrl+B for Blur
        if(e.key.toLowerCase() === 'b' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            toggleBlur();
        }
    };

    window.onkeyup = (e) => {
        // Panic Redirect
        if(e.key === "Escape" || e.key === settings.panicKey) {
            window.location.replace(settings.panicUrl);
        }
        
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
    } else if(p === "301") {
        document.getElementById('mainUI').style.display = 'none';
        document.getElementById('decoyUI').style.display = 'block';
    }
}

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
        if(settings.history.length > 6) settings.history.pop();
    }
    save(); renderHistory();
    const win = window.open('about:blank', '_blank');
    win.document.write(`<iframe src="${t}" style="width:100%;height:100%;border:none;position:fixed;inset:0;"></iframe>`);
}

function toggleGhostMode() {
    settings.ghostVault = document.getElementById('ghostToggle').checked;
    const vn = document.getElementById('vaultNotes');
    settings.ghostVault ? vn.classList.add('ghost-active') : vn.classList.remove('ghost-active');
    save();
}

function toggleBlur() {
    const isBlurred = document.body.classList.toggle('blur-active');
    document.getElementById('blurOverlay').style.display = isBlurred ? 'flex' : 'none';
}

function handleCmd() {
    const input = document.getElementById('termInput');
    const out = document.getElementById('terminalOutput');
    const cmd = input.value.trim().toLowerCase();
    input.value = '';
    out.innerHTML += `\n<span style="color:#666">$ ${cmd}</span>`;
    if(cmd === 'help') out.innerHTML += `\n- launch [url]\n- logs\n- clear\n- blur`;
    else if(cmd === 'blur') toggleBlur();
    else if(cmd === 'clear') out.innerHTML = 'GhostOS v64 Ready...';
    else out.innerHTML += `\nCommand unknown.`;
    out.scrollTop = out.scrollHeight;
}

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

function renderHistory() {
    const list = document.getElementById('historyList');
    if(list) list.innerHTML = settings.history.map(h => `<div class="hist-item" onclick="launch('${h}')"><span>${h.substring(0,40)}...</span><span>GO ↗</span></div>`).join('');
}

function clearHistory() { if(confirm("Clear history?")) { settings.history = []; save(); renderHistory(); } }
function updateSkin() { settings.skin = document.getElementById('skinSelect').value; document.body.setAttribute('data-skin', settings.skin); save(); }
function updateIdentity() { settings.identity.title = document.getElementById('tabNameIn').value || "404 Not Found"; document.title = settings.identity.title; save(); }
function updatePanicUrl() { settings.panicUrl = document.getElementById('panicUrlIn').value || "https://google.com"; save(); }
function save() { localStorage.setItem('cloaker_v64', JSON.stringify(settings)); }
function openTab(id) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.currentTarget.classList.add('active');
}
function panicExport() { localStorage.clear(); window.location.replace(settings.panicUrl); }