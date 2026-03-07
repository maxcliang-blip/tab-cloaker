let settings = { vault: "", skin: "default", panicKey: "\\", panicUrl: "https://google.com", history: [], bookmarks: [], dmActive: false };
let currentKey = "", inputSeq = "", dmTimeout = null, essayIndex = 0;
const fakeEssay = "Advanced Data Structures: Binary Trees and Temporal Complexity Analysis. In O(log n) environments, resource allocation is prioritized through recursive traversal...";

function init() {
    const raw = localStorage.getItem('cloaker_v67');
    if(raw) settings = JSON.parse(raw);
    document.body.setAttribute('data-skin', settings.skin);
    startFakeLogs();
    drawGraph();

    window.onkeydown = (e) => {
        if(settings.dmActive) resetDeadMan();
        if(e.key.toLowerCase() === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); toggleBlur(); }
        if(document.getElementById('decoyUI').style.display === 'block') {
            document.getElementById('liveTicker').innerHTML = `<span>${fakeEssay.substring(0, essayIndex)}|</span>`;
            essayIndex += 4; if(essayIndex > fakeEssay.length) essayIndex = 0;
        }
    };
    window.onkeyup = (e) => {
        if(e.key === settings.panicKey) window.location.replace(settings.panicUrl);
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
        decryptVault(); renderBookmarks();
    } else if(p === "301") { 
        document.getElementById('mainUI').style.display = 'none'; 
        document.getElementById('decoyUI').style.display = 'block'; 
    }
}

function launch() {
    const url = document.getElementById('target').value;
    const cammo = document.getElementById('cammoSelect').value;
    const win = window.open('about:blank', '_blank');
    win.document.write(`<html><head><style>
        body { margin: 0; background: ${cammo==='wiki'?'#f6f6f6':cammo==='docs'?'#eee':'#fff'}; 
        ${cammo==='wiki'?'border-left: 160px solid #eee;':''} ${cammo==='docs'?'padding: 50px;':''} }
        iframe { width: 100%; height: 100%; border: none; ${cammo==='docs'?'box-shadow: 0 0 15px rgba(0,0,0,0.2);':''} }
    </style></head><body><iframe src="${url}"></iframe></body></html>`);
}

function buildMirror() {
    const cammo = document.getElementById('cammoSelect').value;
    const wrap = document.getElementById('mirrorWrapper');
    wrap.className = "mirror-grid " + (cammo !== 'none' ? 'cammo-' + cammo : '');
    document.getElementById('frameLeft').src = document.getElementById('m1').value;
    document.getElementById('frameRight').src = document.getElementById('m2').value;
    document.getElementById('mainContainer').style.display = 'none';
    document.getElementById('mirrorView').style.display = 'flex';
}

function toggleGrayscale() {
    const grid = document.getElementById('mirrorWrapper');
    grid.style.filter = grid.style.filter.includes('grayscale') ? 'none' : 'grayscale(100%)';
}

function closeMirror() { document.getElementById('mirrorView').style.display = 'none'; document.getElementById('mainContainer').style.display = 'block'; }
function toggleBlur() { const b = document.body.classList.toggle('blur-active'); document.getElementById('blurOverlay').style.display = b ? 'flex' : 'none'; }
function saveVault() { if(currentKey) { settings.vault = CryptoJS.AES.encrypt(document.getElementById('vaultNotes').value, currentKey).toString(); save(); } }
function decryptVault() { if(settings.vault && currentKey) { try { document.getElementById('vaultNotes').value = CryptoJS.AES.decrypt(settings.vault, currentKey).toString(CryptoJS.enc.Utf8); } catch(e){} } }

function startDeadMan() { settings.dmActive = true; resetDeadMan(); document.getElementById('dmStatus').innerText = "Armed"; document.getElementById('dmStatus').style.color = "var(--danger)"; }
function resetDeadMan() { clearTimeout(dmTimeout); const ms = document.getElementById('dmTimer').value * 60000; dmTimeout = setTimeout(() => window.location.replace(settings.panicUrl), ms); }

function drawGraph() {
    const ctx = document.getElementById('integrityGraph').getContext('2d');
    let p = Array(50).fill(20);
    setInterval(() => {
        p.shift(); p.push(Math.random()*30 + 5);
        ctx.clearRect(0,0,400,50); ctx.beginPath(); ctx.strokeStyle='#0f0'; ctx.lineWidth=1;
        p.forEach((v,i) => ctx.lineTo(i*8, v)); ctx.stroke();
    }, 150);
}

function startFakeLogs() { setInterval(() => { if(document.getElementById('shadow').style.display !== 'none') console.error(`GET ${window.location.origin}/favicon.ico 404 (Not Found)`); }, 8000); }
function updateSkin() { settings.skin = document.getElementById('skinSelect').value; document.body.setAttribute('data-skin', settings.skin); save(); }
function updatePanicUrl() { settings.panicUrl = document.getElementById('panicUrlIn').value || "https://google.com"; save(); }
function save() { localStorage.setItem('cloaker_v67', JSON.stringify(settings)); }
function openTab(id) { document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active')); document.getElementById(id).classList.add('active'); if(event) event.currentTarget.classList.add('active'); }
function panicExport() { localStorage.clear(); window.location.reload(); }
function addBookmark() { /* Logic for adding encrypted URLs */ }
function renderBookmarks() { /* Implementation for UI display */ }