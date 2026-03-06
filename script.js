let settings = { 
    vault: "", theme: "light", panicKey: "\\",
    identity: { title: "404 Not Found", icon: "https://ssl.gstatic.com/favicon.ico" },
    decoy: { main: "Semester Study Planner" },
    history: [], stash: [], restoreSession: false, lastUrl: ""
};
let inputSeq = ""; let pomoInterval = null;

function init() {
    const raw = localStorage.getItem('cloaker_v60');
    if(raw) settings = JSON.parse(raw);
    
    applyIdentity();
    document.getElementById('decoyMainTitle').textContent = settings.decoy.main;
    document.body.setAttribute('data-theme', settings.theme);
    document.getElementById('vaultNotes').value = settings.vault;
    document.getElementById('restoreCheck').checked = settings.restoreSession;
    
    renderHistory();
    renderStash();
    setupDropZone();

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
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        if(settings.restoreSession && settings.lastUrl) launch(settings.lastUrl);
    } else if (p === "planner2026") {
        document.getElementById('mainUI').style.display = 'none';
        document.getElementById('decoyUI').style.display = 'block';
    }
}

function launch(url) {
    const t = url || document.getElementById('target').value;
    if(!t) return;
    settings.lastUrl = t;
    if(!settings.history.includes(t)) {
        settings.history.unshift(t);
        if(settings.history.length > 8) settings.history.pop();
    }
    save(); renderHistory();
    const win = window.open('about:blank', '_blank');
    win.document.write(`<iframe src="${t}" style="width:100%;height:100%;border:none;position:fixed;inset:0;"></iframe>`);
}

function renderHistory() {
    document.getElementById('historyList').innerHTML = settings.history.map(url => 
        `<span class="hist-tag" onclick="launch('${url}')">${url.split('//')[1]?.substring(0,15) || url.substring(0,15)}...</span>`
    ).join('');
}

// File Stash Logic
function setupDropZone() {
    const dz = document.getElementById('dropZone');
    dz.ondragover = () => { dz.classList.add('dragover'); return false; };
    dz.ondragleave = () => { dz.classList.remove('dragover'); return false; };
    dz.ondrop = (e) => {
        dz.classList.remove('dragover');
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
    document.getElementById('fileList').innerHTML = settings.stash.map((file, i) => `
        <div class="file-item">
            <span>${file.name}</span>
            <div>
                <button onclick="downloadFile(${i})" style="width:auto; padding:2px 5px; font-size:0.6rem;">Open</button>
                <button onclick="deleteFile(${i})" style="width:auto; padding:2px 5px; background:red; font-size:0.6rem;">X</button>
            </div>
        </div>
    `).join('');
}

function downloadFile(i) {
    const file = settings.stash[i];
    const win = window.open();
    win.document.write(`<iframe src="${file.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
}

function deleteFile(i) { settings.stash.splice(i, 1); save(); renderStash(); }
function updateRestore() { settings.restoreSession = document.getElementById('restoreCheck').checked; save(); }
function saveVault() { settings.vault = document.getElementById('vaultNotes').value; save(); }
function save() { localStorage.setItem('cloaker_v60', JSON.stringify(settings)); }
function openTab(id) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.currentTarget.classList.add('active');
}
// ... (Identity/Theme/Panic functions from v59 remain the same)
