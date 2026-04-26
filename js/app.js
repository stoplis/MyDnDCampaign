(function () {
  const STORAGE_KEY = "wish-dm-console-v2";
  const OLD_KEY = "wish-dm-console-v1";
  const root = document.getElementById("root");
  const overlayEl = document.getElementById("wish-popover-overlay");
  const d = window.WISH_DATA;

  function loadState() {
    try {
      const fresh = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (fresh) return fresh;
      const old = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
      if (old) return { chapterId: old.chapterId, party: old.party, scratch: old.scratch || {}, combat: null };
    } catch (err) {
      console.warn("Could not load saved Wish state", err);
    }
    return {};
  }

  function reconcileParty(savedParty) {
    const savedById = new Map((savedParty || []).map((pc) => [pc.id, pc]));
    return d.party.map((pc) => {
      const saved = savedById.get(pc.id);
      const next = structuredClone(pc);
      if (saved && Number.isFinite(Number(saved.hp))) next.hp = Number(saved.hp);
      return next;
    });
  }

  function reconcileCombat(combat, party) {
    if (!combat) return null;
    const partyById = new Map(party.map((pc) => [pc.id, pc]));
    return {
      ...combat,
      combatants: (combat.combatants || []).map((combatant) => {
        if (combatant.refKind !== "pc") return combatant;
        const pc = partyById.get(combatant.refId);
        if (!pc) return combatant;
        return {
          ...combatant,
          name: pc.name,
          subtitle: `${pc.race || "Adventurer"} ${pc.class}`,
          ac: Number(pc.ac) || combatant.ac,
          hpMax: Number(pc.hpMax) || combatant.hpMax
        };
      })
    };
  }

  const savedState = loadState();
  const savedParty = reconcileParty(savedState.party);

  const state = {
    chapterId: "ch1",
    party: savedParty,
    scratch: {},
    drawerOpen: false,
    rightTab: "encounters",
    popover: null,
    combat: null,
    dragId: null,
    ...savedState,
    party: savedParty,
    combat: reconcileCombat(savedState.combat, savedParty)
  };
  d.party = state.party;
  let renderedChapterId = state.chapterId;

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      chapterId: state.chapterId,
      party: state.party,
      scratch: state.scratch,
      combat: state.combat
    }));
  }

  function esc(v) { return WishMarkdown.escapeHtml(v); }

  function mod(score) {
    const m = Math.floor(((score || 10) - 10) / 2);
    return `${m >= 0 ? "+" : ""}${m}`;
  }

  function parseSaves(saves) {
    const out = {};
    if (!saves || typeof saves !== "string") return out;
    for (const part of saves.split(",")) {
      const m = part.trim().match(/^([A-Za-z]{3})\s*([+-]?\d+)$/);
      if (m) out[m[1].toUpperCase()] = (m[2].startsWith("-") ? "" : "+") + m[2].replace(/^\+/, "");
    }
    return out;
  }

  function statBlock(mon) {
    const abilities = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
    const saveMap = parseSaves(mon.saves);
    return `<div class="statblock">
      <div class="sb-head"><h2 class="sb-name">${esc(mon.name)}</h2><div class="sb-meta">${esc(mon.size)} ${esc(mon.type)}, ${esc(mon.alignment || "Unaligned")}</div></div>
      <div class="sb-rule-thick"></div>
      <dl class="sb-top-stats"><dt>AC</dt><dd>${mon.ac}</dd><dt>HP</dt><dd>${mon.hp} <span style="color:var(--ink-4)">(${esc(mon.hpFormula || "")})</span></dd><dt>Speed</dt><dd>${esc(mon.speed || "30 ft.")}</dd></dl>
      <div class="sb-abilities" style="margin-top:var(--s3)"><div class="hdr col0"></div>${abilities.map((a) => `<div class="hdr">${a}</div>`).join("")}<div class="col0">Mod</div>${abilities.map((a) => `<div class="mod-primary">${mod(mon.abilities?.[a])}</div>`).join("")}<div class="col0">Save</div>${abilities.map((a) => `<div class="score-secondary">${saveMap[a] || mod(mon.abilities?.[a])}</div>`).join("")}</div>
      <div class="sb-rule-thin"></div>
      <dl class="sb-attrs">${mon.saves ? `<dt>Saving Throws</dt><dd>${esc(mon.saves)}</dd>` : ""}${mon.skills ? `<dt>Skills</dt><dd>${esc(mon.skills)}</dd>` : ""}${mon.vulnerabilities ? `<dt>Vulnerabilities</dt><dd>${esc(mon.vulnerabilities)}</dd>` : ""}${mon.resistances ? `<dt>Resistances</dt><dd>${esc(mon.resistances)}</dd>` : ""}${mon.immunities ? `<dt>Immunities</dt><dd>${esc(mon.immunities)}</dd>` : ""}<dt>Senses</dt><dd>${esc(mon.senses || "Passive Perception 10")}</dd><dt>Languages</dt><dd>${esc(mon.languages || "—")}</dd><dt>CR</dt><dd>${esc(mon.cr || "0")} (${esc(mon.xp || 0)} XP, PB +${esc(mon.prof || 2)})</dd></dl>
      ${entries("Traits", mon.traits)}${entries("Actions", mon.actions)}${entries("Reactions", mon.reactions)}
      ${mon.legendary ? `<div class="sb-section-head">Legendary Actions</div><div class="sb-entry"><em>${esc(mon.legendary.perRound || 1)} per round, after another creature's turn.</em></div>${(mon.legendary.actions || []).map(entry).join("")}` : ""}
    </div>`;
  }

  function pcStatBlock(pc) {
    if (!pc) return "<p>No player sheet found.</p>";
    const abilities = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
    const { rows, body } = extractPcStats(pc.sheet || "");
    return `<div class="statblock pc-statblock">
      <div class="sb-head"><h2 class="sb-name">${esc(pc.name)}</h2><div class="sb-meta">Level ${pc.level} ${esc(pc.race || "Adventurer")} ${esc(pc.class)} — ${esc(pc.player || "")}</div></div>
      <div class="sb-rule-thick"></div>
      <dl class="sb-top-stats">
        <dt>AC</dt><dd>${pc.ac}${pc.acArmoured ? `/${pc.acArmoured}` : ""}</dd>
        <dt>HP</dt><dd>${pc.hp} / ${pc.hpMax}</dd>
        <dt>Initiative</dt><dd>${esc(pc.initiative)}</dd>
        <dt>Passive Perception</dt><dd>${pc.passive}</dd>
      </dl>
      <div class="sb-abilities" style="margin-top:var(--s3)"><div class="hdr col0"></div>${abilities.map((a) => `<div class="hdr">${a}</div>`).join("")}<div class="col0">Mod</div>${abilities.map((a) => `<div class="mod-primary">${esc(rows[a]?.mod || "+0")}</div>`).join("")}<div class="col0">Save</div>${abilities.map((a) => `<div class="score-secondary">${esc(rows[a]?.save || rows[a]?.mod || "+0")}</div>`).join("")}</div>
      <div class="sb-rule-thin"></div>
      <div class="pc-sheet-body">${WishMarkdown.renderMarkdown(body)}</div>
    </div>`;
  }

  function extractPcStats(sheet) {
    const rows = {};
    let body = sheet
      .replace(/^---\n[\s\S]*?\n---\s*\n/, "")
      .replace(/^\s*#\s+[^\n]*\n/, "");
    const re = /## Stats\s*\n\s*\|[^\n]*\|\s*\n\s*\|[-:|\s]+\|\s*\n((?:\|[^\n]*\|\s*\n)+)/;
    const match = body.match(re);
    if (match) {
      for (const line of match[1].split("\n")) {
        const cells = line.split("|").map((s) => s.trim()).filter(Boolean);
        if (cells.length < 3) continue;
        const ability = cells[0].replace(/\*\*/g, "").toUpperCase();
        rows[ability] = { mod: cells[1], save: cells[2] };
      }
      body = body.replace(re, "");
    }
    body = body.replace(/\n{3,}/g, "\n\n").trim();
    return { rows, body };
  }

  function entry(item) {
    return `<div class="sb-entry"><span class="name">${esc(item.name)}.</span> ${esc(item.desc)}</div>`;
  }

  function entries(title, items) {
    return items?.length ? `<div class="sb-section-head">${title}</div>${items.map(entry).join("")}` : "";
  }

  window.WishAppTemplates = { statBlock, pcStatBlock };

  function hpClass(current, max) {
    const ratio = max ? Number(current) / Number(max) : 1;
    if (ratio <= 0.25) return "danger";
    if (ratio <= 0.5) return "warn";
    return "";
  }

  function render(options = {}) {
    const previousNotes = root.querySelector(".notes-pane");
    const previousScroll = previousNotes ? previousNotes.scrollTop : null;
    const previousChapter = renderedChapterId;
    d.party = state.party;
    d.__state = state;
    const chapter = d.chapters.find((c) => c.id === state.chapterId) || d.chapters[0];
    document.body.dataset.theme = "light";
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.font = "serif";
    root.innerHTML = `${renderShell(chapter)}${state.drawerOpen ? renderDrawer(chapter) : ""}${state.combat ? WishCombat.renderCombat(state) : '<button class="start-combat-fab btn primary" data-action="start-empty-combat"><span class="dot"></span>Start combat</button>'}`;
    overlayEl.innerHTML = renderPopover();
    const preserveNotesScroll = options.preserveNotesScroll !== false;
    if (preserveNotesScroll && previousChapter === state.chapterId && previousScroll !== null) {
      const nextNotes = root.querySelector(".notes-pane");
      if (nextNotes) nextNotes.scrollTop = previousScroll;
    }
    renderedChapterId = state.chapterId;
    save();
  }

  function renderPopoverOnly() {
    overlayEl.innerHTML = renderPopover();
  }

  function currentChapter() {
    return d.chapters.find((c) => c.id === state.chapterId) || d.chapters[0];
  }

  function renderPartyOnly() {
    const partyRail = root.querySelector(".party-rail");
    if (partyRail) partyRail.outerHTML = renderParty();
  }

  function updatePartyRowMeters(pc) {
    const row = root.querySelector(`.party-row[data-key="${CSS.escape(pc.id)}"]`);
    if (!row) return;
    const bar = row.querySelector(".hp-bar");
    const fill = row.querySelector(".hp-bar .fill");
    if (!bar || !fill) return;
    const width = Math.max(0, Math.min(100, Math.round((Number(pc.hp) / Math.max(1, Number(pc.hpMax))) * 100)));
    bar.classList.toggle("warn", hpClass(pc.hp, pc.hpMax) === "warn");
    bar.classList.toggle("danger", hpClass(pc.hp, pc.hpMax) === "danger");
    fill.style.width = `${width}%`;
  }

  function renderRightRailOnly() {
    const rightRail = root.querySelector(".right-rail");
    if (rightRail) rightRail.outerHTML = renderRightRail(currentChapter());
    save();
  }

  function renderDrawerOnly() {
    root.querySelector(".drawer-backdrop")?.remove();
    if (state.drawerOpen) root.insertAdjacentHTML("beforeend", renderDrawer(currentChapter()));
    save();
  }

  function renderCombatLayerOnly(options = {}) {
    d.party = state.party;
    d.__state = state;
    if (options.updateParty) renderPartyOnly();
    root.querySelector(".combat-overlay")?.remove();
    root.querySelector(".start-combat-fab")?.remove();
    root.insertAdjacentHTML("beforeend", state.combat ? WishCombat.renderCombat(state) : '<button class="start-combat-fab btn primary" data-action="start-empty-combat"><span class="dot"></span>Start combat</button>');
    save();
  }

  function renderShell(chapter) {
    return `<div class="app" data-rail="true">
      <header class="topbar">
        <a class="back-link" href="index.html">Back</a>
        <span class="brand" style="white-space:nowrap">Wish <em>DM Console</em></span>
        <div class="sep"></div>
        <button class="chapter-switcher" data-action="toggle-drawer"><span class="num">Ch ${String(chapter.n).padStart(2, "0")}</span><span class="name">${esc(chapter.title)}</span><span class="chev">▾</span></button>
        <div class="spacer"></div>
        <button class="btn ghost" data-action="reset-state">Reset saved state</button>
      </header>
      ${renderParty()}
      <main class="notes-pane">
        <div class="chapter-label">Chapter ${String(chapter.n).padStart(2, "0")} · ${esc(chapter.title)}</div>
        ${WishMarkdown.renderMarkdown(d.notes[chapter.id] || `# ${chapter.title}\n\n${chapter.summary}`, { collapseSecrets: true })}
        <div class="scratchpad"><div class="scratch-head">DM Scratch Notes</div><textarea data-action="scratch" data-chapter="${chapter.id}" placeholder="Private notes for this chapter...">${esc(state.scratch[chapter.id] || "")}</textarea></div>
      </main>
      ${renderRightRail(chapter)}
    </div>`;
  }

  function renderParty() {
    return `<aside class="party-rail"><div class="rail-header"><span class="title">The Party</span><span class="count">${state.party.length}</span></div><div class="party-table">
      ${state.party.map((pc) => `<div class="party-row" data-action="open-pc" data-key="${pc.id}">
        <div>
          <button class="pc-name-button pc-name" data-action="open-pc" data-key="${pc.id}">${esc(pc.name)}</button>
          <div class="pc-sub">${esc(pc.race || "Adventurer")} ${esc(pc.class)} · Level ${pc.level} · ${esc(pc.player || "")}</div>
        </div>
        <div class="hp-inline">
          <input aria-label="${esc(pc.name)} HP" data-action="party-input" data-id="${pc.id}" data-field="hp" value="${pc.hp}">
          <span class="max">/ ${pc.hpMax}</span>
        </div>
        <div class="hp-bar ${hpClass(pc.hp, pc.hpMax)}"><div class="fill" style="width:${Math.max(0, Math.min(100, Math.round((Number(pc.hp) / Math.max(1, Number(pc.hpMax))) * 100)))}%"></div></div>
        <div class="stat-row">
          <div class="stat-cell"><span class="label">AC</span><span class="value">${pc.ac}${pc.acArmoured ? `/${pc.acArmoured}` : ""}</span></div>
          <div class="stat-cell"><span class="label">Passv</span><span class="value">${pc.passive}</span></div>
        </div>
      </div>`).join("")}
    </div><div class="party-rail-foot">Click a row for full stats. Click HP to edit.</div></aside>`;
  }

  function renderRightRail(chapter) {
    const encounters = (chapter.encounters || []).map((key) => ({ key, enc: d.encounters[key] })).filter((x) => x.enc);
    const chapterKeys = new Set(chapter.monsters || []);
    const all = Object.entries(d.characters || {}).filter(([key]) => chapterKeys.size ? chapterKeys.has(key) : true);
    const groups = {
      enemy: all.filter(([, c]) => c.role === "enemy"),
      npc: all.filter(([, c]) => c.role === "npc"),
      ally: all.filter(([, c]) => c.role === "ally")
    };
    return `<aside class="right-rail">
      <div class="rail-header" style="border-bottom:none;padding-bottom:0"><span class="title">Chapter</span><span class="count">Ch. ${String(chapter.n).padStart(2, "0")}</span></div>
      <div class="rail-tabs"><button class="${state.rightTab === "encounters" ? "active" : ""}" data-action="right-tab" data-tab="encounters">Encounters (${encounters.length})</button><button class="${state.rightTab === "bestiary" ? "active" : ""}" data-action="right-tab" data-tab="bestiary">Bestiary (${all.length})</button></div>
      <div class="rail-body">
        ${state.rightTab === "encounters" ? `<div class="encounters-pane">${encounters.length ? encounters.map(({ key, enc }) => renderEncounterRow(key, enc)).join("") : '<div class="empty-note">No configured encounters yet for this chapter.</div>'}</div>` : ""}
        ${state.rightTab === "bestiary" ? `<div class="bestiary-pane">${["enemy", "npc", "ally"].map((kind) => renderBestiaryGroup(kind, groups[kind])).join("")}</div>` : ""}
      </div>
    </aside>`;
  }

  function renderEncounterRow(key, enc) {
    const roster = (enc.monsters || []).map((x) => `${x.count || 1}× ${d.characters?.[x.key]?.name || x.key}`).join(", ");
    return `<div class="encounter-row"><div class="meta" data-open="enc" data-key="${key}"><span class="name">${esc(enc.name)}</span><span class="mini">${esc(roster)}</span>${enc.waves?.length ? `<span class="mini mono-hint">+${enc.waves.length} wave${enc.waves.length > 1 ? "s" : ""}</span>` : ""}</div><button class="btn sm primary" data-action="deploy-encounter" data-key="${key}">Deploy →</button></div>`;
  }

  function renderBestiaryGroup(kind, rows) {
    const title = kind === "enemy" ? "Enemies" : kind === "npc" ? "NPCs" : "Allies";
    return `<div class="bestiary-group"><div class="bestiary-group-title">${title} (${rows.length})</div>${rows.length ? rows.map(([key, c]) => `<div class="monster-row fac-${c.faction}" data-open="creature" data-key="${key}"><div class="fac-stripe"></div><div class="meta"><span class="name">${esc(c.name)} ${chip(c.faction)}</span><span class="tags">${esc(c.size || "Medium")} · ${esc(c.type || c.role)} · HP ${esc(c.hp || "—")} · AC ${esc(c.ac || "—")}</span></div><span class="cr-badge">${c.cr ? `CR ${esc(c.cr)}` : c.role.toUpperCase()}</span></div>`).join("") : '<div class="empty-note">None yet.</div>'}</div>`;
  }

  function chip(faction) {
    const label = faction === "pc" ? "PC" : faction === "ally" ? "Ally" : faction === "enemy" ? "Enemy" : "Neut";
    return `<span class="faction-chip fac-${faction || "neutral"}">${label}</span>`;
  }

  function renderDrawer(chapter) {
    return `<div class="drawer-backdrop" data-action="close-drawer"><aside class="chapter-drawer"><div class="drawer-head"><h2>Chapters</h2><button class="btn ghost" data-action="close-drawer">Close</button></div>${d.chapters.map((c) => `<button class="chapter-card ${c.id === chapter.id ? "active" : ""}" data-action="pick-chapter" data-key="${c.id}"><span class="num">Chapter ${c.n}</span><strong>${esc(c.title)}</strong><span>${esc(c.summary)}</span></button>`).join("")}</aside></div>`;
  }

  function renderPopover() {
    if (!state.popover) return "";
    const p = state.popover;
    let body = "";
    if (p.kind === "creature") {
      const creature = d.characters?.[p.key] || d.monsters?.[p.key] || d.npcs?.[p.key];
      body = creature ? statBlock(creature) : `<div style="padding:24px">No character found for ${esc(p.key)}.</div>`;
    }
    if (p.kind === "pc") body = renderPcPopover(state.party.find((pc) => pc.id === p.key));
    if (p.kind === "enc") body = renderEncounterPreview(p.key);
    if (p.kind === "image") body = `<div class="image-pop"><img src="${esc(d.imageMap[p.key])}" alt="${esc(p.key)}"><div>${esc(p.key)}</div></div>`;
    return `<div class="popover-backdrop" data-action="close-popover"><div class="popover">${body}</div></div>`;
  }

  function renderPcPopover(pc) {
    if (!pc) return "<div style='padding:24px'>No player found.</div>";
    return pcStatBlock(pc);
  }

  function renderEncounterPreview(key) {
    const enc = d.encounters[key];
    if (!enc) return `<div style="padding:24px">Encounter not found.</div>`;
    const roster = (enc.monsters || []).map((x) => {
      const c = d.characters?.[x.key];
      return `<li class="fac-${x.faction || c?.faction || "enemy"}"><span class="count">${x.count || 1}×</span><span class="name">${esc(c?.name || x.key)}</span>${chip(x.faction || c?.faction || "enemy")}<span class="cr-badge">${c?.cr ? `CR ${esc(c.cr)}` : ""}</span></li>`;
    }).join("");
    return `<div style="padding:var(--s6)"><div class="mono-hint">Encounter</div><h2 class="sb-name">${esc(enc.name)}</h2><div class="enc-section-head">Combatants</div><ul class="enc-roster">${roster}</ul>${enc.notes ? `<p>${esc(enc.notes)}</p>` : ""}<button class="btn primary" data-action="deploy-encounter" data-key="${key}">Deploy encounter →</button></div>`;
  }

  function startCombatFromEncounter(key) {
    const enc = d.encounters[key];
    state.combat = {
      encounterKey: key,
      encounterName: enc?.name || "Encounter",
      round: 1,
      selectedId: null,
      waves: structuredClone(enc?.waves || []),
      combatants: WishCombat.combatantsFromEncounter(enc, state.party),
      quickAddSearch: ""
    };
    state.popover = null;
    renderPopoverOnly();
    renderCombatLayerOnly();
  }

  function startEmptyCombat() {
    state.combat = {
      encounterKey: null,
      encounterName: "Open Encounter",
      round: 1,
      selectedId: null,
      waves: [],
      combatants: state.party.map((pc) => WishCombat.newCombatant({ kind: "pc", pc })),
      quickAddSearch: ""
    };
    renderCombatLayerOnly();
  }

  function updateCombatant(id, patch) {
    const c = state.combat?.combatants.find((x) => x.id === id);
    if (!c) return;
    Object.assign(c, patch);
    syncPartyFromCombatant(c);
    renderCombatLayerOnly({ updateParty: true });
  }

  function syncPartyFromCombatant(c) {
    if (!c || c.refKind !== "pc") return;
    const pc = state.party.find((p) => p.id === c.refId);
    if (!pc) return;
    pc.hp = Number(c.hp) || 0;
    pc.hpMax = Number(c.hpMax) || pc.hpMax;
    pc.ac = Number(c.ac) || pc.ac;
  }

  function syncCombatantsFromParty(pc) {
    if (!pc || !state.combat) return;
    state.combat.combatants.forEach((c) => {
      if (c.refKind !== "pc" || c.refId !== pc.id) return;
      c.hp = Number(pc.hp) || 0;
      c.hpMax = Number(pc.hpMax) || c.hpMax;
      c.ac = Number(pc.ac) || c.ac;
    });
  }

  root.addEventListener("click", (event) => {
    const open = event.target.closest("[data-open]");
    if (open) {
      state.popover = { kind: open.dataset.open, key: open.dataset.key };
      renderPopoverOnly();
      return;
    }
    const el = event.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (["party-input", "scratch", "combat-number", "death-save", "hp-amount", "combat-select", "combat-add-search"].includes(action)) return;
    if (action === "toggle-drawer") {
      state.drawerOpen = !state.drawerOpen;
      renderDrawerOnly();
      return;
    }
    if (action === "right-tab") {
      state.rightTab = el.dataset.tab;
      renderRightRailOnly();
      return;
    }
    if (action === "close-drawer") {
      if (el.classList.contains("drawer-backdrop") && event.target !== el) return;
      state.drawerOpen = false;
      renderDrawerOnly();
      return;
    }
    if (action === "pick-chapter") {
      state.chapterId = el.dataset.key;
      state.drawerOpen = false;
      render({ preserveNotesScroll: false });
      return;
    }
    if (action === "reset-state") {
      if (confirm("Reset local Wish DM Console saved state?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
      return;
    }
    if (action === "open-pc") {
      state.popover = { kind: "pc", key: el.dataset.key };
      renderPopoverOnly();
      return;
    }
    if (action === "close-popover") {
      if (event.target !== el) return;
      state.popover = null;
      renderPopoverOnly();
      return;
    }
    if (action === "start-empty-combat") {
      startEmptyCombat();
      return;
    }
    if (action === "deploy-encounter") {
      startCombatFromEncounter(el.dataset.key);
      return;
    }
    if (action === "close-combat") {
      state.combat = null;
      renderCombatLayerOnly();
      return;
    }
    if (action === "round-up") state.combat.round += 1;
    if (action === "round-down") state.combat.round = Math.max(1, state.combat.round - 1);
    if (action === "roll-init") state.combat.combatants = WishCombat.rollInitiative(state.combat.combatants);
    if (action === "select-combatant") { state.combat.selectedId = el.dataset.id; state.combat.quickAddOpen = false; state.combat.quickAddSearch = ""; }
    if (action === "remove-combatant") state.combat.combatants = state.combat.combatants.filter((c) => c.id !== el.dataset.id);
    if (action === "toggle-add-combatant") { state.combat.quickAddOpen = !state.combat.quickAddOpen; state.combat.quickAddSearch = ""; }
    if (action === "add-combatant") {
      if (el.dataset.kind === "pc") {
        const pc = state.party.find((p) => p.id === el.dataset.key);
        if (pc) state.combat.combatants.push(WishCombat.newCombatant({ kind: "pc", pc }));
      } else {
        const mon = d.characters?.[el.dataset.key] || d.monsters?.[el.dataset.key];
        if (mon) state.combat.combatants.push(WishCombat.newCombatant({ kind: "creature", key: el.dataset.key, monster: mon, faction: el.dataset.faction || mon.faction || "enemy" }));
      }
      state.combat.quickAddOpen = false;
    }
    if (action === "set-faction") {
      const c = state.combat.combatants.find((x) => x.id === el.dataset.id);
      if (c) c.faction = el.dataset.faction;
    }
    if (action === "toggle-condition-menu") state.combat.conditionMenuFor = state.combat.conditionMenuFor === el.dataset.id ? null : el.dataset.id;
    if (action === "toggle-condition") {
      const c = state.combat.combatants.find((x) => x.id === el.dataset.id);
      c.conditions = c.conditions || [];
      c.conditions = c.conditions.includes(el.dataset.condition) ? c.conditions.filter((x) => x !== el.dataset.condition) : c.conditions.concat(el.dataset.condition);
      state.combat.conditionMenuFor = null;
    }
    if (action === "damage" || action === "heal") {
      const input = root.querySelector(`[data-action="hp-amount"][data-id="${CSS.escape(el.dataset.id)}"]`);
      const amount = parseInt(input?.value || "0", 10) || 0;
      const c = state.combat.combatants.find((x) => x.id === el.dataset.id);
      if (c && amount && action === "damage") {
        const tempHit = Math.min(c.temp || 0, amount);
        c.temp = Math.max(0, (c.temp || 0) - tempHit);
        c.hp = Math.max(0, c.hp - (amount - tempHit));
      }
      if (c && amount && action === "heal") c.hp = Math.min(c.hpMax, c.hp + amount);
      syncPartyFromCombatant(c);
    }
    if (action === "full-heal") {
      const c = state.combat.combatants.find((x) => x.id === el.dataset.id);
      if (c) { c.hp = c.hpMax; c.temp = 0; }
      syncPartyFromCombatant(c);
    }
    if (action === "adv-state") {
      const c = state.combat.combatants.find((x) => x.id === el.dataset.id);
      if (c) c.advState = c.advState === el.dataset.state ? "none" : el.dataset.state;
    }
    if (action === "spawn-wave") {
      const wave = state.combat.waves[Number(el.dataset.wave)];
      if (wave && !wave.spawned) {
        (wave.monsters || []).forEach((entry) => {
          const mon = d.characters?.[entry.key] || d.monsters?.[entry.key];
          for (let i = 0; i < (entry.count || 1); i++) state.combat.combatants.push(WishCombat.newCombatant({ kind: "creature", key: entry.key, monster: mon, faction: entry.faction || "enemy" }));
        });
        wave.spawned = true;
      }
    }
    if (action === "add-creature") {
      const key = prompt("Creature key to add (example: great-serpent, rabbit, magnifico)");
      const mon = d.characters?.[key] || d.monsters?.[key];
      if (mon) state.combat.combatants.push(WishCombat.newCombatant({ kind: "creature", key, monster: mon, faction: mon.faction || "enemy" }));
    }
    const combatRenderActions = new Set(["round-up", "round-down", "roll-init", "select-combatant", "remove-combatant", "toggle-add-combatant", "add-combatant", "set-faction", "toggle-condition-menu", "toggle-condition", "damage", "heal", "full-heal", "adv-state", "spawn-wave", "add-creature"]);
    if (combatRenderActions.has(action)) {
      renderCombatLayerOnly({ updateParty: ["damage", "heal", "full-heal"].includes(action) });
      return;
    }
    save();
  });

  overlayEl.addEventListener("click", (event) => {
    const el = event.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (action === "close-popover") {
      if (event.target !== el) return;
      state.popover = null;
      renderPopoverOnly();
    }
    if (action === "deploy-encounter") {
      startCombatFromEncounter(el.dataset.key);
    }
  });

  root.addEventListener("input", (event) => {
    const el = event.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (action === "party-input") {
      const pc = state.party.find((p) => p.id === el.dataset.id);
      if (pc) {
        pc[el.dataset.field] = ["hp", "ac"].includes(el.dataset.field) ? Number(el.value) || 0 : el.value;
        syncCombatantsFromParty(pc);
        updatePartyRowMeters(pc);
        if (state.combat) renderCombatLayerOnly();
      }
    }
    if (action === "scratch") state.scratch[el.dataset.chapter] = el.value;
    if (action === "combat-number") updateCombatant(el.dataset.id, { [el.dataset.field]: Number(el.value) || 0 });
    if (action === "death-save") {
      const c = state.combat.combatants.find((x) => x.id === el.dataset.id);
      c.deathSaves = c.deathSaves || { succ: 0, fail: 0 };
      c.deathSaves[el.dataset.field] = Number(el.value) || 0;
    }
    if (action === "combat-add-search" && state.combat) {
      const selStart = el.selectionStart;
      const selEnd = el.selectionEnd;
      state.combat.quickAddSearch = el.value;
      renderCombatLayerOnly();
      const newInput = root.querySelector("[data-action='combat-add-search']");
      if (newInput) { newInput.focus(); newInput.setSelectionRange(selStart, selEnd); }
      return;
    }
    save();
  });

  root.addEventListener("change", (event) => {
    const el = event.target.closest("[data-action]");
    if (!el) return;
    if (el.dataset.action === "combat-select") {
      updateCombatant(el.dataset.id, { [el.dataset.field]: el.value });
    }
  });

  root.addEventListener("dragstart", (event) => {
    const row = event.target.closest(".init-row");
    if (!row) return;
    state.dragId = row.dataset.id;
    row.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  });
  root.addEventListener("dragend", (event) => event.target.closest(".init-row")?.classList.remove("dragging"));
  root.addEventListener("dragover", (event) => {
    if (event.target.closest(".init-row")) event.preventDefault();
  });
  root.addEventListener("drop", (event) => {
    const row = event.target.closest(".init-row");
    if (!row || !state.dragId || row.dataset.id === state.dragId) return;
    event.preventDefault();
    const list = state.combat.combatants;
    const from = list.findIndex((c) => c.id === state.dragId);
    const to = list.findIndex((c) => c.id === row.dataset.id);
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    state.dragId = null;
    renderCombatLayerOnly();
  });

  render();
})();
