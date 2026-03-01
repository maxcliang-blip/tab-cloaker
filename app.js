// Simple "hash": base64 of password (not secure crypto)
function hashPass(p) {
    return btoa(unescape(encodeURIComponent(p)));
}

const DEFAULT_SETTINGS = {
    masterHash: "",
    tabTitle: "Classes",
    tabFavicon: "https://ssl.gstatic.com",
    profiles: {
        "default": {
            uvBase: "",
            favs: [] // { u: base64(url), p: preview, name: nickname }
        }
    },
    activeProfile: "default"
};

let settings = null;

// DOM refs
let shadow, mainUI, pswdInput, controlsDiv, unlockBtn, changePwBtn;
let uvBaseInput, targetInput, targetNameInput, favListDiv, panicInput, useProxyCheckbox, statusMsg;
let profileSelect, exportArea, tabPresetSelect, tabTitleInput, tabFaviconInput, faviconLink;

function loadSettings() {
    try {
        const raw = localStorage.getItem('cloakerSettings');
        if (!raw) return structuredClone(DEFAULT_SETTINGS);
        const parsed = JSON.parse(raw);
        const merged = structuredClone(DEFAULT_SETTINGS);
        Object.assign(merged, parsed);
        if (!merged.profiles || typeof merged.profiles !== 'object') {
            merged.profiles = structuredClone(DEFAULT_SETTINGS.profiles);
        }
        if (!merged.activeProfile || !merged.profiles[merged.activeProfile]) {
            merged.activeProfile = "default";
        }
        return merged;
    } catch {
        return structuredClone(DEFAULT_SETTINGS);
    }
}

function saveSettings() {
    localStorage.setItem('cloakerSettings', JSON.stringify(settings));
}

function currentProfile() {
    return settings.profiles[settings.activeProfile];
}

function init() {
    shadow = document.getElementById('shadow');
    mainUI = document.getElementById('mainUI');
    pswdInput = document.getElementById('pswd');
    controlsDiv = document.getElementById('controls');
    unlockBtn = document.getElementById('unlckBtn');
    changePwBtn = document.getElementById('changePwBtn');

    uvBaseInput = document.getElementById('uvBase');
    targetInput = document.getElementById('target');
    targetNameInput = document.getElementById('targetName');
    favListDiv = document.getElementById('favList');
    panicInput = document.getElementById('panic');
    useProxyCheckbox = document.getElementById('useProxy');
    statusMsg = document.getElementById('statusMsg');

    profileSelect = document.getElementById('profileSelect');
    exportArea = document.getElementById('exportArea');
    tabPresetSelect = document.getElementById('tabPreset');
    tabTitleInput = document.getElementById('tabTitleInput');
    tabFaviconInput = document.getElementById('tabFaviconInput');
    faviconLink = document.getElementById('appFavicon');

    settings = loadSettings();
    applyTabAppearance();
    populateProfilesUI();
    loadProfileToUI();
    checkSecurity();

    window.addEventListener('keydown', globalPanicHandler);

    if (tabTitleInput) {
        tabTitleInput.addEventListener('input', () => {
            settings.tabTitle = tabTitleInput.value;
            tabPresetSelect.value = "custom";
            saveSettings();
            applyTabAppearance();
        });
    }

    if (tabFaviconInput) {
        tabFaviconInput.addEventListener('input', () => {
            settings.tabFavicon = tabFaviconInput.value;
            tabPresetSelect.value = "custom";
            saveSettings();
            applyTabAppearance();
        });
    }
}

function unlock() {
    shadow.style.display = 'none';
    mainUI.style.display = 'flex';
    document.title = settings.tabTitle || "Classes";
}

function isValidUrl(str) {
    try { new URL(str); return true; } catch { return false; }
}

function verify() {
    const lockUntil = parseInt(localStorage.getItem('lockUntil') || "0", 10);
    if (Date.now() < lockUntil) {
        alert("System locked. Try again later.");
        return;
    }

    const input = pswdInput.value.trim();
    if (!input) {
        alert("Enter a password.");
        return;
    }
    const inputHash = hashPass(input);

    if (!settings.masterHash) {
        settings.masterHash = inputHash;
        saveSettings();
    }

    if (inputHash === settings.masterHash) {
        localStorage.setItem('failCount', "0");
        controlsDiv.style.display = 'block';
        unlockBtn.style.display = 'none';
        pswdInput.style.display = 'none';
        changePwBtn.style.display = 'inline-block';
        renderFavs();
        loadProfileToUI();
    } else {
        let failCount = parseInt(localStorage.getItem('failCount') || "0", 10);
        failCount++;
        localStorage.setItem('failCount', String(failCount));
        if (failCount >= 5) {
            const lockForMs = 10 * 60 * 1000;
            localStorage.setItem('lockUntil', String(Date.now() + lockForMs));
            alert("Too many attempts. Locked for 10 minutes.");
            location.reload();
        } else {
            alert("Incorrect key.");
        }
    }
}

function startChangePassword() {
    const old = prompt("Enter current password:");
    if (!old) return;
    if (hashPass(old) !== settings.masterHash) {
        alert("Wrong current password.");
        return;
    }
    const np = prompt("Enter new password:");
    if (!np) return;
    const np2 = prompt("Confirm new password:");
    if (np !== np2) {
        alert("Passwords do not match.");
        return;
    }
    settings.masterHash = hashPass(np);
    saveSettings();
    alert("Password changed.");
}

// Profiles

function populateProfilesUI() {
    profileSelect.innerHTML = "";
    for (const name in settings.profiles) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (name === settings.activeProfile) opt.selected = true;
        profileSelect.appendChild(opt);
    }
}

function loadProfileToUI() {
    const prof = currentProfile();
    uvBaseInput.value = prof.uvBase || "";
    renderFavs();
}

function changeProfile() {
    const value = profileSelect.value;
    if (!value) return;
    settings.activeProfile = value;
    saveSettings();
    loadProfileToUI();
    setStatus("Switched to profile: " + value);
}

function addProfile() {
    const name = prompt("New profile name:");
    if (!name) return;
    if (settings.profiles[name]) {
        alert("Profile already exists.");
        return;
    }
    settings.profiles[name] = { uvBase: "", favs: [] };
    settings.activeProfile = name;
    saveSettings();
    populateProfilesUI();
    loadProfileToUI();
}

function renameProfile() {
    const oldName = settings.activeProfile;
    const newName = prompt("New name for profile '" + oldName + "':", oldName);
    if (!newName || newName === oldName) return;
    if (settings.profiles[newName]) {
        alert("A profile with that name already exists.");
        return;
    }
    settings.profiles[newName] = settings.profiles[oldName];
    delete settings.profiles[oldName];
    settings.activeProfile = newName;
    saveSettings();
    populateProfilesUI();
    loadProfileToUI();
}

function deleteProfile() {
    const name = settings.activeProfile;
    if (name === "default") {
        alert("You cannot delete the default profile.");
        return;
    }
    if (!confirm("Delete profile '" + name + "'?")) return;
    delete settings.profiles[name];
    settings.activeProfile = "default";
    saveSettings();
    populateProfilesUI();
    loadProfileToUI();
}

// Favorites

function getFavs() {
    const prof = currentProfile();
    return prof.favs || [];
}

function setFavs(arr) {
    currentProfile().favs = arr;
    saveSettings();
}

async function saveLink() {
    const url = targetInput.value.trim();
    const nickname = targetNameInput.value.trim();
    if (!isValidUrl(url)) {
        alert("Enter a valid URL.");
        return;
    }
    let favs = getFavs();
    const enc = btoa(url);

    if (favs.some(f => f.u === enc)) {
        alert("That link is already saved.");
        return;
    }

    const preview = await fetchPreview(url);
    favs.push({ u: enc, p: preview, name: nickname });
    setFavs(favs);
    targetNameInput.value = "";
    renderFavs();
}

async function fetchPreview(url) {
    try {
        const res = await fetch(url, { method: 'GET' });
        const text = await res.text();
        const match = text.match(/<title[^>]*>([^<]*)<\/title>/i);
        if (match && match[1]) return match[1].trim().slice(0, 80);
    } catch {}
    try {
        const u = new URL(url);
        return u.hostname;
    } catch {
        return url.slice(0, 80);
    }
}

function removeFav(index) {
    let favs = getFavs();
    if (index < 0 || index >= favs.length) return;
    favs.splice(index, 1);
    setFavs(favs);
    renderFavs();
}

function renderFavs() {
    const favs = getFavs();
    favListDiv.innerHTML = '';

    if (!favs.length) {
        favListDiv.textContent = 'No Saved Links';
        return;
    }

    favs.forEach((item, idx) => {
        const dec = atob(item.u);
        const nickname = item.name || "";
        const previewText = item.p || "";

        const wrapper = document.createElement('div');
        wrapper.className = 'fav-item';

        const mainRow = document.createElement('div');
        mainRow.className = 'fav-main';

        const linkSpan = document.createElement('span');
        linkSpan.className = 'fav-link';
        linkSpan.textContent = nickname ? (nickname + " — " + dec) : dec;
        linkSpan.addEventListener('click', () => {
            targetInput.value = dec;
            targetNameInput.value = nickname;
        });

        const rmBtn = document.createElement('button');
        rmBtn.className = 'fav-remove';
        rmBtn.textContent = 'Remove';
        rmBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFav(idx);
        });

        mainRow.appendChild(linkSpan);
        mainRow.appendChild(rmBtn);
        wrapper.appendChild(mainRow);

        if (previewText) {
            const prev = document.createElement('div');
            prev.className = 'fav-preview';
            prev.textContent = previewText;
            wrapper.appendChild(prev);
        }

        favListDiv.appendChild(wrapper);
    });
}

// Export / Import

function exportProfile() {
    const profName = settings.activeProfile;
    const prof = currentProfile();
    const obj = {
        name: profName,
        uvBase: prof.uvBase || "",
        favs: prof.favs || []
    };
    exportArea.value = JSON.stringify(obj, null, 2);
    setStatus("Profile exported to text area.");
}

function importProfile() {
    const text = exportArea.value.trim();
    if (!text) {
        alert("Paste a JSON profile first.");
        return;
    }
    try {
        const obj = JSON.parse(text);
        const name = obj.name || prompt("Profile name to import as:", "imported");
        if (!name) return;
        settings.profiles[name] = {
            uvBase: obj.uvBase || "",
            favs: Array.isArray(obj.favs) ? obj.favs : []
        };
        settings.activeProfile = name;
        saveSettings();
        populateProfilesUI();
        loadProfileToUI();
        setStatus("Profile imported as: " + name);
    } catch {
        alert("Invalid JSON.");
    }
}

// Launch

function launch() {
    setStatus("");
    const baseRaw = (uvBaseInput.value || '').trim();
    const uvBase = baseRaw.replace(/\/$/, "");
    const targetUrl = targetInput.value.trim();
    const esc = (panicInput.value.trim() || "https://classroom.google.com");
    const useProxy = useProxyCheckbox.checked;

    if (!isValidUrl(targetUrl)) {
        alert("Enter a valid target URL.");
        return;
    }

    if (useProxy) {
        if (!uvBase) {
            alert("Set your proxy base URL first or uncheck 'Use proxy'.");
            return;
        }
        currentProfile().uvBase = uvBase;
        saveSettings();
    }

    let finalUrl;
    if (useProxy) {
        const encodedUrl = btoa(targetUrl)
            .replace(/\//g, '_')
            .replace(/\+/g, '-')
            .replace(/=/g, '');
        finalUrl = `${uvBase}/${encodedUrl}`;
    } else {
        finalUrl = targetUrl;
    }

    const pageHTML = `
        <html>
        <head>
            <title>${settings.tabTitle || "Classes"}</title>
            <link rel="icon" type="image/png" href="${settings.tabFavicon || "https://ssl.gstatic.com"}">
            <style>body,html{margin:0;padding:0;height:100%;overflow:hidden;background:#000;}iframe{width:100%;height:100%;border:none;}</style>
        </head>
        <body>
            <iframe src="${finalUrl}"></iframe>
            <script>
                window.onbeforeunload = () => "Safety";
                window.addEventListener('keydown', (e) => {
                    if (e.code === 'Backslash') {
                        window.onbeforeunload = null;
                        window.location.replace("${esc}");
                    }
                });
            <\\/script>
        </body>
        </html>
    `;

    const blob = new Blob([pageHTML], { type: 'text/html' });
    const win = window.open('about:blank', '_blank');
    if (!win) {
        alert("Popup blocked. Allow popups for this site.");
        setStatus("Popup blocked by browser.");
        return;
    }
    win.location.href = URL.createObjectURL(blob);
    setStatus("Launched.");
}

// Misc

function checkSecurity() {
    const lockUntil = parseInt(localStorage.getItem('lockUntil') || "0", 10);
    if (Date.now() < lockUntil) {
        document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:100px;'>SYSTEM LOCKED</h1>";
    }
}

function globalPanicHandler(e) {
    if (e.ctrlKey && e.key === '\\') {
        const esc = (panicInput && panicInput.value) || "https://classroom.google.com";
        window.location.replace(esc);
    }
}

// Tab appearance

function applyTabAppearance() {
    document.title = settings.tabTitle || "Classes";
    if (faviconLink) faviconLink.href = settings.tabFavicon || "https://ssl.gstatic.com";

    tabTitleInput.value = settings.tabTitle || "";
    tabFaviconInput.value = settings.tabFavicon || "";

    const t = (settings.tabTitle || "").toLowerCase();
    let preset = "custom";
    if (t === "classes") preset = "classes";
    else if (t.includes("docs")) preset = "docs";
    else if (t.includes("drive")) preset = "drive";
    else if (!t) preset = "blank";
    tabPresetSelect.value = preset;
}

function applyTabPreset() {
    const val = tabPresetSelect.value;
    if (val === "classes") {
        settings.tabTitle = "Classes";
        settings.tabFavicon = "https://ssl.gstatic.com";
    } else if (val === "docs") {
        settings.tabTitle = "Untitled document - Google Docs";
        settings.tabFavicon = "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png";
    } else if (val === "drive") {
        settings.tabTitle = "My Drive - Google Drive";
        settings.tabFavicon = "https://ssl.gstatic.com/drive/icons/shortcut-2020q4-32dp.png";
    } else if (val === "blank") {
        settings.tabTitle = "";
        settings.tabFavicon = "about:blank";
    }
    if (val !== "custom") {
        tabTitleInput.value = settings.tabTitle;
        tabFaviconInput.value = settings.tabFavicon;
    }
    saveSettings();
    applyTabAppearance();
}

function setStatus(msg) {
    statusMsg.textContent = msg || "";
}
