// School colours for dot
    const SCHOOL_COLOUR = {
        Abjuration:'#3b82f6', Conjuration:'#f59e0b', Divination:'#8b5cf6',
        Enchantment:'#ec4899', Evocation:'#ef4444', Illusion:'#06b6d4',
        Necromancy:'#22c55e', Transmutation:'#f97316'
    };

    const CLASS_FILTERS = ['All', 'Sorcerer', 'Bard', 'Shared'];
    const LEVEL_FILTERS = ['All', 'Cantrip', 'Level 1'];
    const SCHOOLS = ['All', ...Array.from(new Set(window.SPELLS.map(s => s.school))).sort()];

    let activeClass = 'All', activeLevel = 'All', activeSchool = 'All';
    let openCards = new Set();
    let searchTerm = '';

    // Build filter buttons
    function renderFilterRow(containerId, options, active, onClick) {
        const el = document.getElementById(containerId);
        el.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn' + (opt === active ? ' active' : '');
            if (containerId === 'school-filters' && opt !== 'All') {
                btn.innerHTML = `<span class="school-dot" style="background:${SCHOOL_COLOUR[opt]||'#888'}"></span>${opt}`;
            } else {
                btn.textContent = opt;
            }
            btn.addEventListener('click', () => onClick(opt));
            el.appendChild(btn);
        });
    }

    function matchesClass(sp) {
        if (activeClass === 'All') return true;
        if (activeClass === 'Sorcerer') return sp.classes === 'sorcerer' || sp.classes === 'both';
        if (activeClass === 'Bard')     return sp.classes === 'bard'     || sp.classes === 'both';
        if (activeClass === 'Shared')   return sp.classes === 'both';
        return true;
    }

    function filtered() {
        return window.SPELLS.filter(sp => {
            if (!matchesClass(sp)) return false;
            if (activeLevel === 'Cantrip' && sp.level !== 0) return false;
            if (activeLevel === 'Level 1' && sp.level !== 1) return false;
            if (activeSchool !== 'All' && sp.school !== activeSchool) return false;
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                return sp.name.toLowerCase().includes(q) ||
                       sp.desc.toLowerCase().includes(q) ||
                       sp.school.toLowerCase().includes(q);
            }
            return true;
        });
    }

    const HIGHLIGHT_TERMS = [
        'Temporary Hit Points', 'Opportunity Attacks', 'Difficult Terrain',
        'Heavily Obscured', 'Bright Light', 'Dim Light', 'Total Cover',
        'Bonus Action', 'Magic action', 'Study action', 'Dash action',
        'saving throw', 'attack roll', 'spell attack', 'Hit Points',
        'Concentration', 'Reaction', 'Advantage', 'Disadvantage',
        'Charmed', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible',
        'Poisoned', 'Prone', 'Unconscious', 'Attunement', 'Truesight',
        'AC', 'Speed'
    ];
    const HIGHLIGHT_RE = new RegExp(
        '\\b(?:\\d+d\\d+(?:\\s*[+\\-]\\s*\\d+)?|[+\\-]\\d+|' +
        HIGHLIGHT_TERMS
            .sort((a, b) => b.length - a.length)
            .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
            .join('|') +
        ')\\b',
        'gi'
    );

    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }

    function formatSpellText(text) {
        return escapeHtml(text).replace(HIGHLIGHT_RE, '<span class="text-token">$&</span>');
    }

    function renderList() {
        const list = document.getElementById('list');
        const spells = filtered();
        list.innerHTML = '';

        if (!spells.length) {
            list.innerHTML = '<div class="no-results">No spells match your filters.</div>';
            return;
        }

        spells.forEach(sp => {
            const isOpen = openCards.has(sp.name);
            const levelLabel = sp.level === 0 ? 'C' : sp.level.toString();
            const levelClass = sp.level === 0 ? 'cantrip' : 'lv' + sp.level;

            // Class tags
            let classTags = '';
            if (sp.classes === 'both') {
                classTags = '<span class="class-tag both-s">Sorcerer</span><span class="class-tag both-b">Bard</span>';
            } else if (sp.classes === 'sorcerer') {
                classTags = '<span class="class-tag sorcerer">Sorcerer</span>';
            } else {
                classTags = '<span class="class-tag bard">Bard</span>';
            }

            // Ritual / concentration badges
            let badges = '';
            if (sp.concentration) badges += '<span class="spell-pill conc">Conc.</span> ';
            if (sp.ritual)        badges += '<span class="spell-pill ritual">Ritual</span>';

            const card = document.createElement('div');
            card.className = 'spell-card';
            card.innerHTML = `
                <div class="spell-summary">
                    <div class="spell-level-badge ${levelClass}">${levelLabel}</div>
                    <div class="spell-info">
                        <div class="spell-name">${sp.name}</div>
                        <div class="spell-sub">
                            <span class="school-dot" style="background:${SCHOOL_COLOUR[sp.school]||'#888'}"></span>
                            ${sp.school} &nbsp; ${classTags} ${badges}
                        </div>
                    </div>
                    <span class="spell-chevron${isOpen ? ' open' : ''}">&#9654;</span>
                </div>
                <div class="spell-detail${isOpen ? ' open' : ''}">
                    <div class="stat-grid">
                        <div class="stat-cell"><div class="stat-label">Casting Time</div><div class="stat-value">${sp.castingTime}</div></div>
                        <div class="stat-cell"><div class="stat-label">Range</div><div class="stat-value">${sp.range}</div></div>
                        <div class="stat-cell"><div class="stat-label">Components</div><div class="stat-value">${sp.components}</div></div>
                        <div class="stat-cell"><div class="stat-label">Duration</div><div class="stat-value">${sp.duration}</div></div>
                    </div>
                    <div class="spell-desc">${formatSpellText(sp.desc).replace(/\n/g, '<br><br>')}</div>
                    ${sp.higherLevel ? `<div class="higher-level"><div class="higher-label">Using a Higher-Level Slot</div>${formatSpellText(sp.higherLevel)}</div>` : ''}
                </div>
            `;
            card.querySelector('.spell-summary').addEventListener('click', () => {
                if (openCards.has(sp.name)) openCards.delete(sp.name);
                else openCards.add(sp.name);
                renderList();
            });
            list.appendChild(card);
        });
    }

    function renderAll() {
        renderFilterRow('class-filters', CLASS_FILTERS, activeClass, v => { activeClass = v; renderAll(); });
        renderFilterRow('level-filters', LEVEL_FILTERS, activeLevel, v => { activeLevel = v; renderAll(); });
        renderFilterRow('school-filters', SCHOOLS, activeSchool, v => { activeSchool = v; renderAll(); });
        renderList();
    }

    document.getElementById('search').addEventListener('input', e => {
        searchTerm = e.target.value;
        renderList();
    });

    renderAll();
