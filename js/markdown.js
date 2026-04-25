(function () {
  const data = () => window.WISH_DATA;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slug(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function characterTag(key) {
    const character = data().characters?.[key] || data().monsters?.[key] || data().npcs?.[key];
    if (character?.role === "ally" || character?.faction === "ally") return "ally";
    if (character?.role === "enemy" || character?.faction === "enemy") return "enemy";
    return "npc";
  }

  function mention(kind, key, label) {
    const type = kind === "enc" ? "encounter" : kind === "creature" ? characterTag(key) : kind;
    const className = kind === "creature" ? ` mention-${type}` : kind === "enc" ? " mention-encounter" : "";
    return `<button type="button" class="mention${className}" data-open="${kind}" data-key="${escapeHtml(key)}"><span class="prefix">${type}</span>${escapeHtml(label)}</button>`;
  }

  function resolveWiki(label) {
    const clean = String(label || "").trim();
    const key = data().aliases?.[clean] || data().aliases?.[clean.replace(/^The /, "")];
    if (key && data().characters?.[key]) return { kind: "creature", key, label: clean };
    const enc = data().encounterAliases?.[clean] || data().encounters?.[slug(clean)]?.key;
    if (enc && data().encounters?.[enc]) return { kind: "enc", key: enc, label: clean };
    return null;
  }

  function inline(text, opts = {}) {
    let output = escapeHtml(text);

    output = output.replace(/!\[\[([^\]]+)\]\]/g, (_, name) => {
      const src = data().imageMap?.[name];
      if (!src) return `<code>${escapeHtml(name)}</code>`;
      return `<img class="note-image" src="${escapeHtml(src)}" alt="${escapeHtml(name)}" data-open="image" data-key="${escapeHtml(name)}">`;
    });

    output = output.replace(/@(?:monster|npc|ally|enemy|creature|character):([a-z0-9-]+)/gi, (_, key) => {
      const character = data().characters?.[key] || data().monsters?.[key] || data().npcs?.[key];
      return mention("creature", key, character?.name || key);
    });

    output = output.replace(/@(?:enc|encounter):([a-z0-9-]+)/gi, (_, key) => {
      const encounter = data().encounters?.[key];
      return mention("enc", key, encounter?.name || key);
    });

    output = output.replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
      const shown = label || target;
      const resolved = resolveWiki(target);
      if (!resolved) return escapeHtml(shown);
      return mention(resolved.kind, resolved.key, shown);
    });

    output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    if (opts.autoLink !== false) {
      output = autolinkKnownNames(output);
    }
    return output;
  }

  function autolinkKnownNames(html) {
    const aliases = Object.entries(data().aliases || {})
      .filter(([label, key]) => label.length > 3 && data().characters?.[key])
      .sort((a, b) => b[0].length - a[0].length);
    let result = "";
    let insideMention = false;
    const tokens = String(html).split(/(<[^>]+>)/g);
    for (const token of tokens) {
      if (!token) continue;
      if (token.startsWith("<")) {
        if (/^<button\b[^>]*\bclass="[^"]*\bmention\b/.test(token)) insideMention = true;
        result += token;
        if (/^<\/button>/.test(token)) insideMention = false;
        continue;
      }
      result += insideMention ? token : autolinkTextToken(token, aliases);
    }
    return result;
  }

  function autolinkTextToken(text, aliases) {
    let result = text;
    for (const [label, key] of aliases) {
      const escaped = escapeHtml(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(?<![\\w>&;-])(${escaped})(?![\\w<])`, "g");
      let used = false;
      result = result.replace(re, (match, name, offset, full) => {
        if (used) return match;
        used = true;
        return mention("creature", key, name);
      });
    }
    return result;
  }

  const calloutTitle = {
    info: "Info",
    warning: "Combat",
    danger: "Resource",
    tip: "GM Note",
    note: "Note",
    success: "Asset",
    example: "Details",
    quote: "Read Aloud",
    abstract: "Overview"
  };

  function renderBlock(lines) {
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i] || "";
      if (!line.trim()) { i++; continue; }
      if (/^---+$/.test(line.trim())) { out.push("<hr>"); i++; continue; }
      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        const level = Math.min(4, heading[1].length);
        out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
        i++;
        continue;
      }
      if (/^>/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
        const first = (buf[0] || "").trim();
        const cm = first.match(/^\[!(\w+)\]\+?\s*(.*)$/);
        if (cm) {
          const kind = cm[1].toLowerCase();
          const title = cm[2] || calloutTitle[kind] || kind;
          out.push(`<div class="callout callout-${escapeHtml(kind)}"><div class="callout-title">${inline(title)}</div><div>${renderBlock(buf.slice(1))}</div></div>`);
        } else {
          out.push(`<blockquote>${renderBlock(buf)}</blockquote>`);
        }
        continue;
      }
      if (/^\|/.test(line)) {
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
        const useful = rows.filter((r) => !/^[|:\-\s]+$/.test(r));
        const table = useful.map((r, ri) => {
          const tag = ri === 0 ? "th" : "td";
          return `<tr>${r.split("|").slice(1, -1).map((c) => `<${tag}>${inline(c.trim())}</${tag}>`).join("")}</tr>`;
        }).join("");
        out.push(`<table class="note-table"><tbody>${table}</tbody></table>`);
        continue;
      }
      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^[-*]\s+/, ""));
        out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ul>`);
        continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s+/, ""));
        out.push(`<ol>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ol>`);
        continue;
      }
      const para = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|---+$|[-*]\s+|\d+\.\s+|\|)/.test(lines[i])) para.push(lines[i++]);
      out.push(`<p>${inline(para.join(" "))}</p>`);
    }
    return out.join("");
  }

  function splitSecret(lines) {
    const start = lines.findIndex((line) => /^#\s+What Actually Happened\s*$/i.test(line.trim()));
    if (start === -1) return null;
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
      if (/^#\s+/.test(lines[i]) && !/^#\s+What Actually Happened\s*$/i.test(lines[i].trim())) {
        end = i;
        break;
      }
    }
    return {
      before: lines.slice(0, start),
      secret: lines.slice(start + 1, end),
      after: lines.slice(end)
    };
  }

  function renderMarkdown(src, options = {}) {
    const lines = String(src || "").split(/\r?\n/);
    if (options.collapseSecrets) {
      const split = splitSecret(lines);
      if (split) {
        return renderBlock(split.before) +
          `<details class="story-secret"><summary>What Actually Happened</summary><div class="story-secret-body">${renderBlock(split.secret)}</div></details>` +
          renderBlock(split.after);
      }
    }
    return renderBlock(lines);
  }

  window.WishMarkdown = { renderMarkdown, inline, escapeHtml };
})();
