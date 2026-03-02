// Simple "hash": base64 of password (not secure crypto)
function hashPass(p) {
    return btoa(unescape(encodeURIComponent(p)));
}

const DEFAULT_SETTINGS = {
    masterHash: "",
    tabTitle: "Classes",
    tabFavicon: "https://ssl.gstatic.com",
    theme: "dark",
    profiles: {
        "default": {
            uvBase: "",
            favs: [] // { u: base64(url), p: preview, name: nickname }
        }
    },
    activeProfile: "default"
};

let settings = null;
let recentLaunches = []; // session-only: { url, time }
let toastContainer;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
let idleTimer = null;

// DOM refs
let shadow, mainUI, pswdInput, controlsDiv, unlockBtn, changePwBtn;
let uvBaseInput, targetInput, targetNameInput, favListDiv, panicInput, useProxyCheckbox, statusMsg;
let profileSelect, exportArea, tabPresetSelect, tabTitleInput, tabFaviconInput, faviconLink;
let themeSelect, favSearchInput, recentListDiv;

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
        if (!merged.theme) merged.theme = "dark";
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
    themeSelect = document.getElementById('themeSelect');
    favSearchInput = document.getElementById('favSearch');
    recentListDiv = document.getElementById('recentList');

    settings = loadSettings();
    applyTheme();
    applyTabAppearance();
    populateProfilesUI();
    loadProfileToUI();
    checkSecurity();

    window.addEventListener('keydown', globalPanicHandler);

    // Idle timer listeners
    ['click', 'keydown', 'mousemove'].forEach(evt => {
        window.addEventListener(evt, resetIdleTimer);
    });

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
    // Direct DOM access (works from 404 page before init())
    const shadowEl = document.getElementById('shadow');
    const mainUIEl = document.getElementById('mainUI');
    
    if (shadowEl && mainUIEl) {
        shadowEl.style.display = 'none';
        mainUIEl.style.display = 'flex';
        document.title = "Classes";
        console.log("404 unlocked!"); // Debug
    }
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
        showToast("Enter a password.");
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
        resetIdleTimer();
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
            showToast("Incorrect key.");
        }
    }
}

function startChangePassword() {
    const old = prompt("Enter current password:");
    if (!old) return;
    if (hashPass(old) !== settings.masterHash) {
        showToast("Wrong current password.");
        return;
    }
    const np = prompt("Enter new password:");
    if (!np) return;
    const np2 = prompt("Confirm new password:");
    if (np !== np2) {
        showToast("Passwords do not match.");
        return;
    }
    settings.masterHash = hashPass(np);
    saveSettings();
    showToast("Password changed.");
}

/* Toast notifications */
function showToast(message, timeout = 2000) {
    if (!toastContainer) {
        toastContainer = document.getElementById('toastContainer');
    }
    if (!toastContainer) return;
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = message;
    toastContainer.appendChild(div);
    setTimeout(() => {
        if (div.parentNode) div.parentNode.removeChild(div);
    }, timeout);
}

/* Theme */
function applyTheme() {
    const theme = settings.theme || "dark";
    document.body.setAttribute('data-theme', theme);
    if (themeSelect) themeSelect.value = theme;
}

function changeTheme() {
    const theme = themeSelect.value;
    settings.theme = theme;
    saveSettings();
    applyTheme();
}

/* Profiles */
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
    showToast("Switched profile to " + value);
}

function addProfile() {
    const name = prompt("New profile name:");
    if (!name) return;
    if (settings.profiles[name]) {
        showToast("Profile already exists.");
        return;
    }
    settings.profiles[name] = { uvBase: "", favs: [] };
    settings.activeProfile = name;
    saveSettings();
    populateProfilesUI();
    loadProfileToUI();
    showToast("Created profile: " + name);
}

function renameProfile() {
    const oldName = settings.activeProfile;
    const newName = prompt("New name for profile '" + oldName + "':", oldName);
    if (!newName || newName === oldName) return;
    if (settings.profiles[newName]) {
        showToast("A profile with that name already exists.");
        return;
    }
    settings.profiles[newName] = settings.profiles[oldName];
    delete settings.profiles[oldName];
    settings.activeProfile = newName;
    saveSettings();
    populateProfilesUI();
    loadProfileToUI();
    showToast("Renamed to: " + newName);
}

function deleteProfile() {
    const name = settings.activeProfile;
    if (name === "default") {
        showToast("You cannot delete the default profile.");
        return;
    }
    if (!confirm("Delete profile '" + name + "'?")) return;
    delete settings.profiles[name];
    settings.activeProfile = "default";
    saveSettings();
    populateProfilesUI();
    loadProfileToUI();
    showToast("Deleted profile: " + name);
}

/* Favorites */
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
        showToast("Enter a valid URL.");
        return;
    }
    let favs = getFavs();
    const enc = btoa(url);

    if (favs.some(f => f.u === enc)) {
        showToast("That link is already saved.");
        return;
    }

    const preview = await fetchPreview(url);
    favs.push({ u: enc, p: preview, name: nickname });
    setFavs(favs);
    targetNameInput.value = "";
    renderFavs();
    showToast("Link saved.");
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
    showToast("Link removed.");
}

function moveFav(index, delta) {
    let favs = getFavs();
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= favs.length) return;
    const [item] = favs.splice(index, 1);
    favs.splice(newIndex, 0, item);
    setFavs(favs);
    renderFavs();
}

function renderFavs() {
    const favs = getFavs();
    favListDiv.innerHTML = '';

    const query = favSearchInput ? favSearchInput.value.trim().toLowerCase() : "";
    const filtered = favs
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => {
            const dec = atob(item.u);
            const nickname = item.name || "";
            return !query ||
                dec.toLowerCase().includes(query) ||
                nickname.toLowerCase().includes(query);
        });

    if (!filtered.length) {
        favListDiv.textContent = 'No Saved Links';
        return;
    }

    filtered.forEach(({ item, idx }) => {
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

        const buttonsWrap = document.createElement('div');

        const upBtn = document.createElement('button');
        upBtn.className = 'small-btn';
        upBtn.textContent = '↑';
        upBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            moveFav(idx, -1);
        });

        const downBtn = document.createElement('button');
        downBtn.className = 'small-btn';
        downBtn.textContent = '↓';
        downBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            moveFav(idx, 1);
        });

        const rmBtn = document.createElement('button');
        rmBtn.className = 'fav-remove';
        rmBtn.textContent = 'X';
        rmBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFav(idx);
        });

        buttonsWrap.appendChild(upBtn);
        buttonsWrap.appendChild(downBtn);
        buttonsWrap.appendChild(rmBtn);

        mainRow.appendChild(linkSpan);
        mainRow.appendChild(buttonsWrap);
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

/* Recent launches */
function addRecent(url) {
    const now = new Date();
    recentLaunches.unshift({
        url,
        time: now.toLocaleTimeString()
    });
    if (recentLaunches.length > 10) recentLaunches.pop();
    renderRecent();
}

function renderRecent() {
    if (!recentListDiv) return;
    recentListDiv.innerHTML = '';

    if (!recentLaunches.length) {
        recentListDiv.textContent = 'No recent launches';
        return;
    }

    recentLaunches.forEach((item) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'recent-item';

        const linkSpan = document.createElement('span');
        linkSpan.className = 'recent-link';
        linkSpan.textContent = item.url.slice(0, 60) + (item.url.length > 60 ? '...' : '');
        linkSpan.addEventListener('click', () => {
            targetInput.value = item.url;
        });

        const timeSpan = document.createElement('span');
        timeSpan.className = 'recent-time';
        timeSpan.textContent = item.time;

        wrapper.appendChild(linkSpan);
        wrapper.appendChild(timeSpan);
        recentListDiv.appendChild(wrapper);
    });
}

/* Export / Import */
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
    showToast("Profile exported.");
}

function importProfile() {
    const text = exportArea.value.trim();
    if (!text) {
        showToast("Paste a JSON profile first.");
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
        showToast("Profile imported as " + name + ".");
    } catch {
        showToast("Invalid JSON.");
    }
}

/* Launch */
function launch() {
    setStatus("");
    const baseRaw = (uvBaseInput.value || '').trim();
    const uvBase = baseRaw.replace(/\/$/, "");
    const targetUrl = targetInput.value.trim();
    const esc = (panicInput.value.trim() || "https://classroom.google.com");
    const useProxy = useProxyCheckbox.checked;

    if (!isValidUrl(targetUrl)) {
        showToast("Enter a valid target URL.");
        return;
    }

    if (useProxy) {
        if (!uvBase) {
            showToast("Set your proxy base URL first or uncheck 'Use proxy'.");
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
           
