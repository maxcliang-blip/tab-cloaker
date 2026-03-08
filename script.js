let settings = {
    activeProfile: "default",
    profiles: {
        default: { vault: "", bookmarks: [], title: "404 Not Found" },
        research: { vault: "", bookmarks: [], title: "JSTOR | Database" },
        dev: { vault: "", bookmarks: [], title: "Localhost:8080" }
    },
    panicUrl: "https://google.com",
    autoSwitch: false,
    focusBlur: false,
    dmActive: false
};

let currentKey = "", dmTimeout = null, inputSeq = "";

function init() {
    const raw = localStorage.getItem('ghost_v68_final');
    if (raw) settings = JSON.parse(raw);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && settings.autoSwitch) window.location.replace(settings.panicUrl);
    });

    window.onblur = () => { if (settings.focusBlur) toggleBlur(true); };
    window.onfocus = () => { if (settings.focusBlur) toggleBlur(false); };

    setInterval(() => {
        const hb = document.getElementById('netHeartbeat');
        if (!hb) return;
        const load = Math.random();
        hb.style.background = load > 0.8 ? '#f00' : load > 0.4 ? '#ff0' : '#0f0';
    }, 2000);

    drawGraph();

    window.onkeyup = (e) => {
        inputSeq += e.key.toLowerCase();
        if (inputSeq.endsWith("cloak")) {
            document.getElementById('shadow').style.display = 'none';
            document.getElementById('mainUI').style.opacity = '1';
        }
    };
}

function verify() {
    const p = document.getElementById('pswd').value;
    if (p === "1234") {
        currentKey = p;
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadProfileData();
    }
}

function switchProfile() {
    saveProfileData();
    settings.activeProfile = document.getElementById('profileSelect').value;
    document.body.setAttribute('data-profile', settings.activeProfile);
    loadProfileData();
    save();
}

function saveProfileData() {
    const p = settings.profiles[settings.activeProfile];
    p.vault = CryptoJS.AES.encrypt(document.getElementById('vaultNotes').value, currentKey).toString();
}

function loadProfileData() {
    const p = settings.profiles[settings.activeProfile];
    document.title = p.title;
    try {
        if (p.vault) {
            const bytes = CryptoJS.AES.decrypt(p.vault, currentKey);
            document.getElementById('vaultNotes').value = bytes.toString(CryptoJS.enc.Utf8);
        } else { document.getElementById('vaultNotes').value = ""; }
    } catch (e) { document.getElementById('vaultNotes').value = ""; }
    renderBookmarks();
}

function addBookmark() {
    const name = prompt("Name:");
    const url = prompt("URL:");
    if (name && url && currentKey) {
        const enc = CryptoJS.AES.encrypt(url, currentKey).toString();
        settings.profiles[settings.activeProfile].bookmarks.push({ name, url: enc });
        save(); renderBookmarks();
    }
}

function renderBookmarks() {
    const list = document.getElementById('bookmarkList');
    const bms = settings.profiles[settings.activeProfile].bookmarks;
    list.innerHTML = bms.map((b, i) => `
        <div class="bm-item" onclick="launchBookmark('${b.url}')">
            <span>🔖 ${b.name}</span>
            <span onclick="deleteBookmark(${i}); event.stopPropagation();" style="opacity:0.5;">[X]</span>
        </div>`).join('') || '<p style="font-size:0.5rem; text-align:center; padding:10px;">Empty</p>';
}

function launchBookmark(enc) {
    const bytes = CryptoJS.AES.decrypt(enc, currentKey);
    const url = bytes.toString(CryptoJS.enc.Utf8);
    const win = window.open('about:blank', '_blank');
    win.document.write(`<iframe src="${url}" style="width:100%;height:100%;border:none;position:fixed;inset:0;"></iframe>`);
}

function deleteBookmark(i) { settings.profiles[settings.activeProfile].bookmarks.splice(i, 1); save(); renderBookmarks(); }

function shadowPrint() {
    const win = window.open('', '_blank');
    win.document.write(`<html><body style="font-family:serif; padding:40px;"><h1>Lecture Notes: CS301</h1><p>Binary Search Tree analysis...</p></body></html>`);
    win.print(); win.close();
}

function drawGraph() {
    const ctx = document.getElementById('integrityGraph').getContext('2d');
    let pts = Array(40).fill(20);
    setInterval(() => {
        pts.shift(); pts.push(Math.random() * 25 + 5);
        ctx.clearRect(0, 0, 300, 40); ctx.beginPath(); ctx.strokeStyle = '#0f0';
        pts.forEach((v, i) => ctx.lineTo(i * 7.5, v)); ctx.stroke();
    }, 150);
}

function toggleBlur(f) { const b = f !== undefined ? f : !document.body.classList.contains('blur-active'); document.body.classList.toggle('blur-active', b); document.getElementById('blurOverlay').style.display = b ? 'flex' : 'none'; }
function toggleAutoSwitch() { settings.autoSwitch = document.getElementById('autoSwitchToggle').checked; save(); }
function toggleFocusBlur() { settings.focusBlur = document.getElementById('focusBlurToggle').checked; save(); }
function save() { localStorage.setItem('ghost_v68_final', JSON.stringify(settings)); }
function saveVault() { if (currentKey) saveProfileData(); save(); }
function renameProfile() { const t = prompt("Tab Title:"); if (t) { settings.profiles[settings.activeProfile].title = t; document.title = t; save(); } }
function panicExport() { localStorage.clear(); window.location.reload(); }
function startDeadMan() { settings.dmActive = true; resetDeadMan(); }
function resetDeadMan() { clearTimeout(dmTimeout); dmTimeout = setTimeout(() => window.location.replace(settings.panicUrl), document.getElementById('dmTimer').value * 60000); }
function openTab(id) { document.querySelectorAll('.tab-content, .tab-btn').forEach(e => e.classList.remove('active')); document.getElementById(id).classList.add('active'); event.currentTarget.classList.add('active'); }