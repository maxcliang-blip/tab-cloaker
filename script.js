let settings = { vault: "", panicUrl: "https://google.com", dmActive: false, autoSwitch: false, focusBlur: false };
let dmTimeout = null, inputSeq = "", currentKey = "";

function init() {
    const raw = localStorage.getItem('ghost_v68');
    if(raw) settings = JSON.parse(raw);

    // 1. Contextual Auto-Switcher
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && settings.autoSwitch) {
            window.location.replace(settings.panicUrl); 
        }
    });

    // 2. Focus-Aware Blur
    window.onblur = () => { if(settings.focusBlur) toggleBlur(true); };
    window.onfocus = () => { if(settings.focusBlur) toggleBlur(false); };

    // 3. Network Heartbeat Simulation
    setInterval(() => {
        const hb = document.getElementById('netHeartbeat');
        if(!hb) return;
        const load = Math.random();
        hb.style.background = load > 0.8 ? '#f00' : load > 0.5 ? '#ff0' : '#0f0';
        hb.style.boxShadow = `0 0 8px ${hb.style.background}`;
    }, 2500);

    drawGraph();
    
    window.onkeyup = (e) => {
        if(e.key === "\\") window.location.replace(settings.panicUrl);
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
        if(settings.vault) decryptVault();
    }
}

// 4. Shadow Print (Decoy PDF)
function shadowPrint() {
    const decoyContent = "<h1>CS301 Final Review: Temporal Complexity</h1><p>Algorithm efficiency is measured in O-notation. For Binary Search Trees, average temporal complexity remains O(log n)...</p>";
    const win = window.open('', '_blank');
    win.document.write(`<html><body style="font-family:serif; padding:50px;">${decoyContent}</body></html>`);
    win.document.close();
    win.print();
    win.close();
}

function toggleAutoSwitch() { settings.autoSwitch = document.getElementById('autoSwitchToggle').checked; save(); }
function toggleFocusBlur() { settings.focusBlur = document.getElementById('focusBlurToggle').checked; save(); }

function drawGraph() {
    const ctx = document.getElementById('integrityGraph').getContext('2d');
    let points = Array(40).fill(20);
    setInterval(() => {
        points.shift(); points.push(Math.random() * 30 + 5);
        ctx.clearRect(0,0,300,40);
        ctx.beginPath(); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1;
        points.forEach((v, i) => ctx.lineTo(i * 7.5, v));
        ctx.stroke();
    }, 150);
}

function toggleBlur(force) {
    const isBlurred = force !== undefined ? force : !document.body.classList.contains('blur-active');
    document.body.classList.toggle('blur-active', isBlurred);
    document.getElementById('blurOverlay').style.display = isBlurred ? 'flex' : 'none';
}

function startDeadMan() {
    const mins = document.getElementById('dmTimer').value;
    if(!mins) return;
    settings.dmActive = true;
    resetDeadMan();
    document.getElementById('dmStatus').innerText = "Armed: Panic in " + mins + "m";
}

function resetDeadMan() {
    if(!settings.dmActive) return;
    clearTimeout(dmTimeout);
    dmTimeout = setTimeout(() => window.location.replace(settings.panicUrl), document.getElementById('dmTimer').value * 60000);
}

function saveVault() { if(currentKey) { settings.vault = CryptoJS.AES.encrypt(document.getElementById('vaultNotes').value, currentKey).toString(); save(); } }
function decryptVault() { try { document.getElementById('vaultNotes').value = CryptoJS.AES.decrypt(settings.vault, currentKey).toString(CryptoJS.enc.Utf8); } catch(e){} }
function save() { localStorage.setItem('ghost_v68', JSON.stringify(settings)); }
function openTab(id) { document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active')); document.getElementById(id).classList.add('active'); if(event) event.currentTarget.classList.add('active'); }
function updatePanicUrl() { settings.panicUrl = document.getElementById('panicUrlIn').value || "https://google.com"; save(); }
function panicExport() { localStorage.clear(); window.location.reload(); }