(function () {
  const CONDITIONS = [
    "Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated",
    "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained",
    "Stunned", "Unconscious", "Concentrating", "Blessed", "Hasted"
  ];

  function uid(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function initBonusFromPc(pc) {
    return parseInt(String(pc.initiative || "0").replace(/[^\-+\d]/g, ""), 10) || 0;
  }

  function newCombatant(source) {
    if (source.kind === "pc") {
      const pc = source.pc;
      return {
        id: uid(`pc-${pc.id}`),
        refKind: "pc",
        refId: pc.id,
        faction: "pc",
        name: pc.name,
        subtitle: `${pc.race || "Adventurer"} ${pc.class}`,
        initiative: 0,
        ac: Number(pc.ac) || 10,
        hp: Number(pc.hp) || Number(pc.hpMax) || 1,
        hpMax: Number(pc.hpMax) || Number(pc.hp) || 1,
        temp: 0,
        advState: "none",
        conditions: [],
        deathSaves: { succ: 0, fail: 0 },
        dead: false
      };
    }
    const mon = source.monster || {};
    return {
      id: uid(`m-${source.key}`),
      refKind: "creature",
      refId: source.key,
      faction: source.faction || mon.faction || "enemy",
      name: source.label || mon.name || source.key,
      subtitle: `${mon.size || "Medium"} ${mon.type || "Creature"}${mon.cr ? ` · CR ${mon.cr}` : ""}`,
      initiative: 0,
      ac: Number(mon.ac) || 10,
      hp: Number(mon.hp) || 1,
      hpMax: Number(mon.hp) || 1,
      temp: 0,
      advState: "none",
      conditions: [],
      deathSaves: { succ: 0, fail: 0 },
      dead: false
    };
  }

  function combatantsFromEncounter(encounter, party) {
    const d = window.WISH_DATA;
    const rows = party.map((pc) => newCombatant({ kind: "pc", pc }));
    (encounter?.monsters || []).forEach((entry) => {
      const mon = d.characters?.[entry.key] || d.monsters?.[entry.key];
      for (let i = 0; i < (entry.count || 1); i++) {
        rows.push(newCombatant({
          kind: "creature",
          key: entry.key,
          monster: mon,
          faction: entry.faction || mon?.faction || "enemy",
          label: (entry.count || 1) > 1 ? `${mon?.name || entry.key} ${i + 1}` : mon?.name
        }));
      }
    });
    (encounter?.allies || []).forEach((entry) => {
      const mon = d.characters?.[entry.key] || d.monsters?.[entry.key];
      rows.push(newCombatant({ kind: "creature", key: entry.key, monster: mon, faction: "ally" }));
    });
    return rows;
  }

  function rollInitiative(combatants) {
    const d = window.WISH_DATA;
    return combatants.map((c) => {
      let bonus = 0;
      if (c.refKind === "pc") {
        const pc = d.party.find((p) => p.id === c.refId);
        bonus = pc ? initBonusFromPc(pc) : 0;
      } else {
        const mon = d.characters?.[c.refId] || d.monsters?.[c.refId];
        bonus = Math.floor(((mon?.abilities?.DEX || 10) - 10) / 2);
      }
      return { ...c, initiative: Math.floor(Math.random() * 20) + 1 + bonus };
    }).sort((a, b) => b.initiative - a.initiative);
  }

  function hpClass(c) {
    const ratio = c.hpMax ? c.hp / c.hpMax : 1;
    if (ratio <= 0.25) return "danger";
    if (ratio <= 0.5) return "warn";
    return "";
  }

  function factionChip(faction) {
    const label = faction === "pc" ? "PC" : faction === "ally" ? "Ally" : faction === "enemy" ? "Enemy" : "Neut";
    return `<span class="faction-chip fac-${faction || "neutral"}">${label}</span>`;
  }

  function advIndicator(c) {
    if (c.advState === "adv") return '<span class="adv-indicator adv-adv">ADV</span>';
    if (c.advState === "dis") return '<span class="adv-indicator adv-dis">DIS</span>';
    return "";
  }

  function renderConditionChips(c) {
    if (!c.conditions?.length) return "";
    return `<div class="conditions-row">${c.conditions.map((cond) => `<span class="cond-chip">${WishMarkdown.escapeHtml(cond)}<button class="x" data-action="toggle-condition" data-id="${c.id}" data-condition="${WishMarkdown.escapeHtml(cond)}">×</button></span>`).join("")}</div>`;
  }

  function renderQuickAdd(s, chapterId) {
    if (!s.quickAddOpen) return "";
    const data = window.WISH_DATA;
    const chapter = data.chapters.find((c) => c.id === chapterId);
    const keys = [...new Set(chapter?.monsters || [])];
    const creatures = keys.map((key) => ({ key, c: data.characters?.[key] || data.monsters?.[key] })).filter((x) => x.c);
    return `<div class="context-menu combat-add-menu">
      <div class="qa-group">Players</div>
      ${data.party.map((pc) => `<button data-action="add-combatant" data-kind="pc" data-key="${pc.id}">${WishMarkdown.escapeHtml(pc.name)} <span class="qa-hint">${WishMarkdown.escapeHtml(pc.class)}</span></button>`).join("")}
      ${creatures.length ? `<div class="qa-group border-t">Chapter roster</div>${creatures.map(({ key, c }) => `<button data-action="add-combatant" data-kind="creature" data-key="${key}" data-faction="${c.faction || "enemy"}">${WishMarkdown.escapeHtml(c.name)} <span class="qa-hint">${WishMarkdown.escapeHtml(c.cr ? `CR ${c.cr}` : c.role || c.faction || "NPC")}</span></button>`).join("")}` : ""}
    </div>`;
  }

  function renderCombat(state) {
    const s = state.combat;
    const selected = s.combatants.find((c) => c.id === s.selectedId) || s.combatants[0];
    if (selected && !s.selectedId) s.selectedId = selected.id;
    const rows = s.combatants.map((c) => {
      const pct = Math.max(0, Math.min(100, Math.round((c.hp / Math.max(1, c.hpMax)) * 100)));
      return `<div class="init-row fac-${c.faction} ${c.id === s.selectedId ? "selected" : ""}" draggable="true" data-id="${c.id}" data-action="select-combatant">
        <div class="fac-stripe"></div>
        <div class="handle">⋮⋮</div>
        <div class="init-value"><input data-action="combat-number" data-field="initiative" data-id="${c.id}" value="${c.initiative}"></div>
        <div class="row-main">
          <div class="name">
            <span>${WishMarkdown.escapeHtml(c.name)}</span>
            ${factionChip(c.faction)}
            ${advIndicator(c)}
          </div>
          <div class="sub"><span class="ac">AC ${c.ac}</span><span>·</span><span>${WishMarkdown.escapeHtml(c.subtitle || "")}</span></div>
        </div>
        <div class="hp-mini">
          <div class="hp-text hp-val"><span class="cur">${c.hp}${c.temp ? ` +${c.temp}` : ""}</span><span class="max"> / ${c.hpMax}</span></div>
          <div class="hp-track"><div class="hp-fill ${hpClass(c)}" style="width:${pct}%"></div></div>
        </div>
        ${renderConditionChips(c)}
      </div>`;
    }).join("");

    return `<div class="combat-overlay">
      <div class="combat-topbar">
        <button class="combat-exit" data-action="close-combat">← Exit</button>
        <h1>Combat Tracker</h1>
        <div class="round-control"><button data-action="round-down">−</button><strong><span class="round-label">Round</span><span class="round-num">${s.round}</span></strong><button data-action="round-up">+</button></div>
        <div class="combat-encounter-name">
          ${WishMarkdown.escapeHtml(s.encounterName || "Open Encounter")}
        </div>
        <div class="combat-actions">
          <button class="btn" data-action="roll-init">Roll all initiative</button>
          <div class="combat-add-wrap"><button class="btn" data-action="toggle-add-combatant">+ Add combatant</button>${renderQuickAdd(s, state.chapterId)}</div>
        </div>
      </div>
      ${renderWaves(s)}
      <div class="combat-layout">
        <section class="combat-list"><div class="combat-list-head"><span>Initiative Order</span><span>${s.combatants.length} creature${s.combatants.length === 1 ? "" : "s"}</span></div>${rows || '<div class="empty-note">No combatants yet.</div>'}<div class="combat-list-foot">Click a row to open details. Drag ⋮⋮ to reorder.</div></section>
        <section class="combat-detail">${selected ? renderDetail(selected) : '<div class="empty-note">Select a combatant.</div>'}</section>
      </div>
    </div>`;
  }

  function renderWaves(s) {
    if (!s.waves?.length) return "";
    return `<div class="waves-bar"><span class="waves-label">Waves</span>${s.waves.map((wave, i) => {
      const roster = (wave.monsters || []).map((m) => `${m.count || 1}x ${window.WISH_DATA.characters?.[m.key]?.name || m.key}`).join(", ");
      return `<div class="wave-item ${wave.spawned ? "spawned" : ""}">
        <div class="wave-label">${WishMarkdown.escapeHtml(wave.label || `Wave ${i + 1}`)}</div>
        <div class="wave-roster">${WishMarkdown.escapeHtml(roster)}</div>
        <div class="wave-hint">${WishMarkdown.escapeHtml(wave.hint || "")}</div>
        <button class="btn sm" data-action="spawn-wave" data-wave="${i}" ${wave.spawned ? "disabled" : ""}>Spawn</button>
      </div>`;
    }).join("")}</div>`;
  }

  function renderDetail(c) {
    const isPc = c.refKind === "pc";
    const ref = isPc ? window.WISH_DATA.party.find((p) => p.id === c.refId) : window.WISH_DATA.characters?.[c.refId];
    return `<div class="combat-card">
      <div class="combatant-detail-head">
        <div><h2>${WishMarkdown.escapeHtml(c.name)}</h2><div class="tags">${WishMarkdown.escapeHtml(c.subtitle || "")} ${factionChip(c.faction)}</div></div>
        <button class="combat-remove" data-action="remove-combatant" data-id="${c.id}">Remove</button>
      </div>
      <div class="faction-picker">
        <span class="label-cap">Faction</span>
        ${["pc", "ally", "neutral", "enemy"].map((fac) => `<button class="fac-pick fac-${fac} ${c.faction === fac ? "active" : ""}" data-action="set-faction" data-id="${c.id}" data-faction="${fac}">${fac === "pc" ? "PC" : fac[0].toUpperCase() + fac.slice(1)}</button>`).join("")}
      </div>
      <div class="detail-grid">
        <label>AC <input class="ac-input" data-action="combat-number" data-field="ac" data-id="${c.id}" value="${c.ac}"></label>
        <label>HP <input class="hp-number-input" data-action="combat-number" data-field="hp" data-id="${c.id}" value="${c.hp}"> / <input class="hp-number-input" data-action="combat-number" data-field="hpMax" data-id="${c.id}" value="${c.hpMax}"></label>
        <label>Temp <input class="temp-input" data-action="combat-number" data-field="temp" data-id="${c.id}" value="${c.temp || 0}"></label>
      </div>
      <div class="combat-controls">
        <div class="hp-editor">
          <button class="btn sm danger" data-action="damage" data-id="${c.id}">− damage</button>
          <input data-action="hp-amount" data-id="${c.id}" placeholder="0">
          <button class="btn sm" data-action="heal" data-id="${c.id}">+ heal</button>
        </div>
        <button class="btn sm" data-action="full-heal" data-id="${c.id}">Full heal</button>
        <div class="condition-menu-wrap"><button class="btn sm" data-action="toggle-condition-menu" data-id="${c.id}">+ Condition</button>${renderConditionMenu(c)}</div>
        <div class="adv-control-wrap">
          <span class="next-roll-label">Next roll</span>
          <button class="roll-state ${c.advState === "adv" ? "on" : ""}" data-action="adv-state" data-id="${c.id}" data-state="adv">Adv</button>
          <button class="roll-state ${c.advState === "dis" ? "on" : ""}" data-action="adv-state" data-id="${c.id}" data-state="dis">Dis</button>
        </div>
      </div>
      ${c.conditions?.length ? `<div class="condition-list selected-conditions">${c.conditions.map((cond) => `<button class="condition-pill on" data-action="toggle-condition" data-id="${c.id}" data-condition="${WishMarkdown.escapeHtml(cond)}">${WishMarkdown.escapeHtml(cond)} ×</button>`).join("")}</div>` : ""}
      ${isPc && c.hp <= 0 ? renderDeathSaves(c) : ""}
      <div class="enc-section-head">Reference</div>
      ${isPc ? window.WishAppTemplates.pcStatBlock(ref) : (ref ? window.WishAppTemplates.statBlock(ref) : "<p>No stat block found.</p>")}
    </div>`;
  }

  function renderConditionMenu(c) {
    const state = window.WISH_DATA && window.WISH_DATA.__state;
    const open = state?.combat?.conditionMenuFor === c.id;
    if (!open) return "";
    return `<div class="context-menu condition-menu">
      ${CONDITIONS.map((cond) => `<button data-action="toggle-condition" data-id="${c.id}" data-condition="${WishMarkdown.escapeHtml(cond)}">${c.conditions?.includes(cond) ? "✓ " : ""}${WishMarkdown.escapeHtml(cond)}</button>`).join("")}
    </div>`;
  }

  function renderDeathSaves(c) {
    return `<div class="enc-section-head">Death Saves</div>
    <div class="death-save-grid">
      <label>Successes <input class="hp-number-input" data-action="death-save" data-field="succ" data-id="${c.id}" value="${c.deathSaves?.succ || 0}"></label>
      <label>Failures <input class="hp-number-input" data-action="death-save" data-field="fail" data-id="${c.id}" value="${c.deathSaves?.fail || 0}"></label>
    </div>`;
  }

  window.WishCombat = { newCombatant, combatantsFromEncounter, rollInitiative, renderCombat };
})();
