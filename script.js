let settings = { 
    vault: "", skin: "default", panicKey: "\\", panicUrl: "https://google.com",
    identity: { title: "404 Not Found" },
    history: [], bookmarks: [], ghostVault: false, dmActive: false
};

let currentKey = "";
let inputSeq = "";
let dmTimeout = null;
let essayIndex = 0;
const fakeEssay = "The implications of data structures in modern computational theory are vast. Binary search trees offer O(log n) temporal complexity. Resource management remains at the heart of OS design...";

function init() {
    const raw = localStorage.getItem('cloaker_v66');
    if(raw) settings = JSON.parse(raw);
    
    document.title = settings.identity.title;
    document.body.setAttribute('data-skin', settings.skin);
    
    if(document.getElementById('skinSelect')) {
        document.getElementById('skinSelect').value = settings.skin;
        document.getElementById('panicUrlIn').value = settings.panicUrl;
        document.getElementById('ghostToggle').checked = settings.ghostVault;
    }
    
    if(settings.ghostVault) document.getElementById('vaultNotes').classList.add('ghost-active');
    
    renderHistory();
    renderBookmarks();
    startFakeLogs();
    drawGraph();

    window.onkeydown = (e) => {
        resetDeadMan();
        if(e.key.toLowerCase() === 'b' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            toggleBlur();
        }
        const decoy = document.getElementById('decoyUI');
        if (decoy && decoy.style.display === 'block') {
            document.getElementById('liveTicker').innerHTML = `<span>${fakeEssay.substring(0, essayIndex)}|</span>`;
            essayIndex += 4;
            if (essayIndex > fakeEssay.length) essayIndex = 0;
        }
    };

    window.onkeyup = (e) => {
        if(e.key === "Escape" || e.key === settings.panicKey) {
            window.location.replace(settings.panicUrl);
        }
        inputSeq += e.key.toLowerCase();
        if(inputSeq.endsWith("cloak")) {
            document.getElementById('shadow').style.display = 'none';
            document.getElementById('mainUI').style.opacity = '1';
            inputSeq = "";
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
        renderBookmarks();
    } else if(p === "301") {
        document.getElementById('mainUI').style.display = 'none';
        document.getElementById('decoyUI').style.display = 'block';
    }
}

function addBookmark() {
    const name = prompt("Name:");
    const url = prompt("URL:");
    if(name && url && currentKey) {
        const encryptedUrl = CryptoJS.AES.encrypt(url, currentKey).toString();
        settings.bookmarks.push({ name, url: encryptedUrl });
        save(); renderBookmarks();
    } else { alert("Unlock with Key first."); }
}

function renderBookmarks() {
    const list = document.getElementById('bookmarkList');
    if(list) list.innerHTML = settings.bookmarks.map((bm, i) => `
        <div class="bm-item" onclick="launchBookmark('${bm.url}')">
            <span>🔖 ${bm.name}</span>
            <span onclick="deleteBookmark(${i}); event.stopPropagation();" style="color:var(--danger); opacity:0.5;">[X]</span>
        </div>`).join('');
}

function launchBookmark(encUrl) {
    try {
        const bytes = CryptoJS.AES.decrypt(encUrl, currentKey);
        launch(bytes.toString(CryptoJS.enc.Utf8));
    } catch(e) { alert("Decryption Error."); }
}

function deleteBookmark(i) { settings.bookmarks.splice(i, 1); save(); renderBookmarks(); }

function startDeadMan() {
    const mins = document.getElementById('dmTimer').value;
    if(!mins) return;
    settings.dmActive = true;
    resetDeadMan();
    document.getElementById('dmStatus').textContent = `Armed: ${mins}m limit`;
    document.getElementById('dmStatus').style.color = "var(--danger)";
}

function resetDeadMan() {
    if(!settings.dmActive) return;
    clearTimeout(dmTimeout);
    const ms = document.getElementById('dmTimer').value * 60000;
    dmTimeout = setTimeout(() => window.location.replace(settings.panicUrl), ms);
}

function drawGraph() {
    const canvas = document.getElementById('integrityGraph');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let points = Array(50).fill(25);
    setInterval(() => {
        points.shift(); points.push(Math.random() * 40 + 5);
        ctx.clearRect(0,0,400,50);
        ctx.beginPath(); ctx.strokeStyle = '#0f0';
        for(let i=0; i<points.length; i++) ctx.lineTo(i * 8, points[i]);
        ctx.stroke();
    }, 150);
}

async function toggleSentinel() {
    const active = document.getElementById('sentinelToggle').checked;
    const status = document.getElementById('sentinelStatus');
    const video = document.getElementById('sentinelFeed');
    if (active) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            status.textContent = "Camera: ACTIVE";
            setInterval(() => { if (document.hidden) toggleBlur(); }, 2000);
        } catch (err) { status.textContent = "Camera: ERROR"; }
    }
}

function launch(url) {
    let t = url || document.getElementById('target').value;
    if(!t) return;
    const mode = document.getElementById('stealthMode').value;
    if(mode === 'null') {
        const script = `<script>window.location.replace("${t}");<\/script>`;
        t = 'data:text/html;base64,' + btoa('<meta name="referrer" content="no-referrer">' + script);
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
    if(cmd === 'help') out.innerHTML += `\n- launch [url]\n- clear\n- blur`;
    else if(cmd === 'blur') toggleBlur();
    else if(cmd === 'clear') out.innerHTML = 'GhostOS Ready...';
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
    if(currentKey) {
        settings.vault = CryptoJS.AES.encrypt(document.getElementById('vaultNotes').value, currentKey).toString();
        save();
    }
}

function decryptVault() {
    if(settings.vault && currentKey) {
        try {
            const bytes = CryptoJS.AES.decrypt(settings.vault, currentKey);
            document.getElementById('vaultNotes').value = bytes.toString(CryptoJS.enc.Utf8);
        } catch(e) {}
    }
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if(list) list.innerHTML = settings.history.map(h => `<div class="hist-item" onclick="launch('${h}')"><span>${h.substring(0,35)}...</span><span>GO ↗</span></div>`).join('');
}

function startFakeLogs() {
    const assets = ['/favicon.ico', '/robots.txt', '/sitemap.xml'];
    setInterval(() => {
        if (document.getElementById('shadow').style.display !== 'none') {
            console.error(`GET ${window.location.origin}${assets[Math.floor(Math.random() * assets.length)]} 404 (Not Found)`);
        }
    }, 8000);
}

function clearHistory() { settings.history = []; save(); renderHistory(); }
function updateSkin() { settings.skin = document.getElementById('skinSelect').value; document.body.setAttribute('data-skin', settings.skin); save(); }
function updateIdentity() { settings.identity.title = document.getElementById('tabNameIn').value || "404 Not Found"; document.title = settings.identity.title; save(); }
function updatePanicUrl() { settings.panicUrl = document.getElementById('panicUrlIn').value || "https://google.com"; save(); }
function save() { localStorage.setItem('cloaker_v66', JSON.stringify(settings)); }
function openTab(id) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (event) event.currentTarget.classList.add('active');
}
function panicExport() { localStorage.clear(); window.location.replace(settings.panicUrl); }