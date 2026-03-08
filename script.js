let settings = {
    activeProfile: "default",
    profiles: {
        default: { vault: "", bookmarks: [], title: "404 Not Found" },
        research: { vault: "", bookmarks: [], title: "Research Portal" },
        dev: { vault: "", bookmarks: [], title: "Dev Documentation" }
    },
    skin: "default",
    panicUrl: "https://google.com",
    // ... other global settings
};
let dmTimeout = null, inputSeq = "", currentKey = "";

function init() {
    const raw = localStorage.getItem('ghost_v68');
    if (raw) settings = JSON.parse(raw);

    // 1. Contextual Auto-Switcher
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && settings.autoSwitch) {
            window.location.replace(settings.panicUrl);
        }
    });

    // 2. Focus-Aware Blur
    window.onblur = () => { if (settings.focusBlur) toggleBlur(true); };
    window.onfocus = () => { if (settings.focusBlur) toggleBlur(false); };

    // 3. Network Heartbeat Simulation
    setInterval(() => {
        const hb = document.getElementById('netHeartbeat');
        if (!hb) return;
        const load = Math.random();
        hb.style.background = load > 0.8 ? '#f00' : load > 0.5 ? '#ff0' : '#0f0';
        hb.style.boxShadow = `0 0 8px ${hb.style.background}`;
    }, 2500);

    drawGraph();

    window.onkeyup = (e) => {
        if (e.key === "\\") window.location.replace(settings.panicUrl);
        inputSeq += e.key.toLowerCase();
        if (inputSeq.endsWith("cloak")) {
            document.getElementById('shadow').style.display = 'none';
            document.getElementById('mainUI').style.opacity = '1';
        }
    };
}

function verify() {
    const p = document.getElementById('pswd').value;
    if (p === "1234") { // Replace with your actual key
        currentKey = p;
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';

        // Initialize secure data
        decryptVault();
        renderBookmarks();
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
        ctx.clearRect(0, 0, 300, 40);
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
    if (!mins) return;
    settings.dmActive = true;
    resetDeadMan();
    document.getElementById('dmStatus').innerText = "Armed: Panic in " + mins + "m";
}

function resetDeadMan() {
    if (!settings.dmActive) return;
    clearTimeout(dmTimeout);
    dmTimeout = setTimeout(() => window.location.replace(settings.panicUrl), document.getElementById('dmTimer').value * 60000);
}
// --- SHADOW BOOKMARKS LOGIC ---

function addBookmark() {
    if (!currentKey) return alert("System Locked. Unlock with Key first.");

    const name = prompt("Bookmark Name (e.g., 'Research Notes'):");
    const url = prompt("Target URL:");

    if (name && url) {
        // Encrypt the URL before saving to localStorage
        const encryptedUrl = CryptoJS.AES.encrypt(url, currentKey).toString();
        settings.bookmarks.push({ name, url: encryptedUrl });
        save();
        renderBookmarks();
    }
}

function renderBookmarks() {
    const list = document.getElementById('bookmarkList');
    if (!list) return;

    if (settings.bookmarks.length === 0) {
        list.innerHTML = `<p style="font-size:0.5rem; color:#888; text-align:center; margin:10px;">No encrypted bookmarks.</p>`;
        return;
    }

    list.innerHTML = settings.bookmarks.map((bm, i) => `
        <div class="bm-item" onclick="launchBookmark('${bm.url}')">
            <span>🔖 ${bm.name}</span>
            <span class="bm-delete" onclick="deleteBookmark(${i}); event.stopPropagation();">[ REMOVE ]</span>
        </div>
    `).join('');
}

function launchBookmark(encUrl) {
    try {
        // Decrypt the URL using the session's currentKey
        const bytes = CryptoJS.AES.decrypt(encUrl, currentKey);
        const originalUrl = bytes.toString(CryptoJS.enc.Utf8);

        if (!originalUrl) throw new Error();

        // Use the stealth launcher
        const win = window.open('about:blank', '_blank');
        win.document.write(`<iframe src="${originalUrl}" style="width:100%;height:100%;border:none;position:fixed;inset:0;"></iframe>`);
    } catch (e) {
        alert("Decryption failed. Session may be corrupted.");
    }
}

function deleteBookmark(index) {
    if (confirm("Permanently delete this bookmark?")) {
        settings.bookmarks.splice(index, 1);
        save();
        renderBookmarks();
    }
}
function switchProfile() {
    const selected = document.getElementById('profileSelect').value;

    // Save current profile data before switching
    saveProfileData();

    settings.activeProfile = selected;
    document.body.setAttribute('data-profile', selected);
    document.getElementById('profileStatus').innerText = `Active: ${selected}`;

    // Load new profile data
    loadProfileData();
    save();
}

function saveProfileData() {
    const current = settings.activeProfile;
    settings.profiles[current].vault = CryptoJS.AES.encrypt(document.getElementById('vaultNotes').value, currentKey).toString();
    // Bookmarks are updated in real-time by add/delete functions
}

function loadProfileData() {
    const data = settings.profiles[settings.activeProfile];

    // Update Tab Title
    document.title = data.title;

    // Decrypt Vault
    try {
        if (data.vault && currentKey) {
            const bytes = CryptoJS.AES.decrypt(data.vault, currentKey);
            document.getElementById('vaultNotes').value = bytes.toString(CryptoJS.enc.Utf8);
        } else {
            document.getElementById('vaultNotes').value = "";
        }
    } catch (e) { document.getElementById('vaultNotes').value = ""; }

    renderBookmarks();
}

function renameProfile() {
    const newName = prompt("Enter custom title for this Profile's browser tab:");
    if (newName) {
        settings.profiles[settings.activeProfile].title = newName;
        document.title = newName;
        save();
    }
}

// Update your existing renderBookmarks to use profile-specific data
function renderBookmarks() {
    const list = document.getElementById('bookmarkList');
    const profileBookmarks = settings.profiles[settings.activeProfile].bookmarks;

    if (!list) return;
    list.innerHTML = profileBookmarks.map((bm, i) => `
        <div class="bm-item" onclick="launchBookmark('${bm.url}')">
            <span>🔖 ${bm.name}</span>
            <span class="bm-delete" onclick="deleteBookmark(${i}); event.stopPropagation();">[X]</span>
        </div>
    `).join('') || '<p style="font-size:0.5rem; text-align:center; opacity:0.5;">Empty</p>';
}

function saveVault() { if (currentKey) { settings.vault = CryptoJS.AES.encrypt(document.getElementById('vaultNotes').value, currentKey).toString(); save(); } }
function decryptVault() { try { document.getElementById('vaultNotes').value = CryptoJS.AES.decrypt(settings.vault, currentKey).toString(CryptoJS.enc.Utf8); } catch (e) { } }
function save() { localStorage.setItem('ghost_v68', JSON.stringify(settings)); }
function openTab(id) { document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active')); document.getElementById(id).classList.add('active'); if (event) event.currentTarget.classList.add('active'); }
function updatePanicUrl() { settings.panicUrl = document.getElementById('panicUrlIn').value || "https://google.com"; save(); }
function panicExport() { localStorage.clear(); window.location.reload(); }