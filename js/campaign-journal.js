/*
     * Campaign Journal app logic.
     * Chapter and entry config lives in js/journal-data.js as window.JOURNAL.
     */
// ── State ──────────────────────────────────────────────
    const STORAGE_KEY = 'dnd-journal-unlocks';
    let unlocks = {};  // { "chapter-1": true, "chapter-1:crawfish": true, ... }
    let openChapters = {};

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) unlocks = JSON.parse(raw);
        } catch(e) { unlocks = {}; }
    }
    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocks));
    }

    function isChapterUnlocked(ch) { return unlocks[ch.id] === true; }
    function isEntryUnlocked(ch, entry) {
        if (entry.autoUnlock && isChapterUnlocked(ch)) return true;
        return unlocks[ch.id + ':' + entry.password] === true;
    }

    // ── Rendering ──────────────────────────────────────────
    const app = document.getElementById('app');

    function render() {
        app.innerHTML = '';
        window.JOURNAL.forEach(ch => {
            const section = document.createElement('div');
            section.className = 'chapter';

            const unlocked = isChapterUnlocked(ch);
            const isOpen = openChapters[ch.id];

            // Chapter header
            const header = document.createElement('div');
            header.className = 'chapter-header' + (unlocked ? ' unlocked' : '');
            header.innerHTML = `
                <span class="${unlocked ? 'unlock-icon' : 'lock-icon'}">${unlocked ? 'Open' : 'Locked'}</span>
                <span class="chapter-title">${ch.title}</span>
                ${unlocked ? `<span class="chevron ${isOpen ? 'open' : ''}">&#9654;</span>` : ''}
            `;
            if (unlocked) {
                header.addEventListener('click', () => {
                    openChapters[ch.id] = !openChapters[ch.id];
                    render();
                });
            }
            section.appendChild(header);

            // Entries grid
            if (unlocked && isOpen) {
                const grid = document.createElement('div');
                grid.className = 'entries';

                ch.entries.forEach(entry => {
                    const eu = isEntryUnlocked(ch, entry);
                    const card = document.createElement('div');
                    card.className = 'entry' + (eu ? ' unlocked' : '');

                    if (eu) {
                        card.innerHTML = `
                            <img class="entry-thumb" src="${entry.image}" alt="${entry.name}" loading="lazy">
                            <div class="entry-name">${entry.name}</div>
                        `;
                        card.addEventListener('click', () => openViewer(entry.name, entry.image));
                    } else {
                        const displayName = entry.hidden ? '???' : entry.name;
                        card.innerHTML = `
                            <div class="entry-placeholder">???</div>
                            <div class="entry-name locked">${displayName}</div>
                        `;
                    }
                    grid.appendChild(card);
                });

                section.appendChild(grid);
            }

            app.appendChild(section);
        });
    }

    // ── Viewer ─────────────────────────────────────────────
    const viewer = document.getElementById('viewer');
    const viewerImg = document.getElementById('viewer-img');
    const viewerTitle = document.getElementById('viewer-title');

    function openViewer(name, src) {
        viewerTitle.textContent = name;
        viewerImg.src = src;
        viewer.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeViewer() {
        viewer.classList.remove('active');
        viewerImg.src = '';
        document.body.style.overflow = '';
    }

    document.getElementById('viewer-close').addEventListener('click', closeViewer);
    viewer.addEventListener('click', e => { if (e.target === viewer) closeViewer(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeViewer(); });

    // ── Toast ──────────────────────────────────────────────
    const toast = document.getElementById('toast');
    let toastTimer;
    function showToast(msg) {
        clearTimeout(toastTimer);
        toast.textContent = msg;
        toast.classList.add('show');
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    // ── Password handling ──────────────────────────────────
    const pwInput = document.getElementById('pw-input');
    const pwBtn = document.getElementById('pw-btn');

    function tryUnlock() {
        const val = pwInput.value.trim().toLowerCase();
        if (!val) return;

        let found = false;

        // Check chapter passwords
        window.JOURNAL.forEach(ch => {
            if (String(ch.password).toLowerCase() === val && !unlocks[ch.id]) {
                unlocks[ch.id] = true;
                openChapters[ch.id] = true;
                found = true;
                showToast(ch.title + ' unlocked!');
            }
        });

        // Check entry passwords (only in unlocked chapters)
        window.JOURNAL.forEach(ch => {
            if (!isChapterUnlocked(ch)) return;
            ch.entries.forEach(entry => {
                const key = ch.id + ':' + entry.password;
                if (String(entry.password).toLowerCase() === val && !unlocks[key]) {
                    unlocks[key] = true;
                    found = true;
                    showToast(entry.name + ' unlocked!');
                }
            });
        });

        if (found) {
            saveState();
            render();
            pwInput.value = '';
        } else {
            pwInput.classList.add('error');
            setTimeout(() => pwInput.classList.remove('error'), 400);
        }
    }

    pwBtn.addEventListener('click', tryUnlock);
    pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });

    // ── Reset ──────────────────────────────────────────────
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (confirm('Reset all unlocked entries? This cannot be undone.')) {
            unlocks = {};
            openChapters = {};
            localStorage.removeItem(STORAGE_KEY);
            render();
            showToast('Journal reset');
        }
    });

    // ── Init ───────────────────────────────────────────────
    loadState();
    // Auto-open any unlocked chapters
    window.JOURNAL.forEach(ch => { if (isChapterUnlocked(ch)) openChapters[ch.id] = true; });
    render();
