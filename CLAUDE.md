# D&D Campaign Tools — Project Instructions

## What this project is
A set of browser-based tools for running a D&D 5e campaign. Most tools are single-file HTML apps. The DM Screen is a multi-file vanilla JS app. All tools run directly from a static file host with no build step. The project is deployed via Cloudflare Workers at **mydndcampaign.stoplis.workers.dev** and hosted in the GitHub repo **https://github.com/stoplis/MyDnDCampaign.git**.

The campaign is set in a D&D 5e world inspired by Pinocchio — but the tools must **never reference Pinocchio or campaign spoilers** because players use them too.

---

## File locations

| Location | Purpose |
|---|---|
| `~/DnD/DnD Steve Tools/` | The main project folder — all tool HTML files live here |
| `~/DnD/5etools-src/` | Local 5etools database for looking up D&D rules and items |
| `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/DnD - Wish/` | Obsidian vault — source of truth for chapter notes, images, magic items, and player data |
| `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/DnD - Wish/Claude/` | My working notes: vault index, tool specs, chapter sync guide, kept up-to-date |
| `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/DnD - Wish/Players/` | Player character notes — source of truth for `js/data.js` party array; update at each level-up |
| `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/DnD - Wish/Chapters/` | Campaign chapter notes — sync to `notes/chapters/` when updated (see Chapter Sync Guide in vault) |
| `~/DnD/DnD Steve Tools/notes/` | Campaign notes copied into the repo for the DM Screen |
| `~/DnD/DnD Steve Tools/images/` | Campaign images copied into the repo |

After any session with file changes, create a PR and remind Stephen to `git push` from Mac Terminal.

---

## Tools

### Landing page — `index.html`
Links to all player-facing tools. DM Screen is password-gated (password: **"Coachman"**).

### Character Creator — `character-creator.html`
Player-facing. Lets players build their D&D character for the campaign.

### Campaign Journal — `campaign-journal.html`
Player-facing. Progressive reveal tool — the DM gives out passwords during play to unlock chapter sections and individual entries (images of characters, locations, etc.).
- Chapter passwords unlock the chapter and all `autoUnlock: true` entries within it
- Individual entry passwords unlock specific images
- Hidden entries (`hidden: true`) show as "???" until unlocked
- Unlocks persist in localStorage
- All config (chapters, entries, passwords) is in the `JOURNAL` array near the top of the file

### Fast Crafting — `fast-crafting.html`
Player-facing. Item browser for a player with fast crafting ability. Lists 21 craftable items (adventuring gear + simple weapons) with full 2024 PHB stats and descriptions. No passwords needed.

### Spell Book — `spell-book.html`
Player-facing. Searchable spell reference for the Sorcerer and Bard players. Currently shows cantrips and level 1 spells from the 2024 PHB (XPHB). Filterable by class (Sorcerer / Bard / Shared), spell level, and school. Expand to level 2 when characters reach level 3. All spell data is embedded in the file — no external requests needed.

### DM Screen — `dm-screen.html` + `css/` + `js/`
DM only (password-gated from landing page). A multi-file vanilla JS app (no framework, no build step). Features:
- **Party rail** — left panel with the 4 PCs, HP bars, quick HP/AC edits, full character sheet popover
- **Chapter notes** — central pane renders Obsidian-flavored markdown for the selected chapter; supports callouts, tables, image embeds (`![[filename]]`), character links (`@creature:key`, `[[Name]]`), and encounter links (`@enc:key`). "What Actually Happened" sections collapse by default.
- **Bestiary tab** — right rail, chapter-relevant enemies/NPCs/allies grouped by role; each row opens a stat block popover
- **Encounters tab** — configured encounters with wave support; preview → deploy into combat
- **Combat tracker** — round-based overlay; drag-reorder initiative, HP/temp HP/AC editing, conditions, death saves, wave spawning
- All campaign data (party, notes, stat blocks, encounters, image map) is embedded in `js/data.js`
- State persisted to localStorage under key `wish-dm-console-v2`

**File layout for the DM Screen:**
```
dm-screen.html      ← Entry point (19 lines — loads css/ and js/)
css/
  dm-console.css    ← Light/amber/serif design system
js/
  app.js            ← State, rendering, event handling
  data.js           ← All campaign data (152KB JSON)
  combat.js         ← Combat tracker logic
  markdown.js       ← Obsidian markdown renderer
```

**To update notes or encounters:** edit `js/data.js` — the `notes` object (keyed by chapter id), `encounters`, `monsters`, `npcs`, `aliases`, `encounterAliases`, and `imageMap` are all in that file.

**To add a new chapter:** add an entry to `data.chapters[]` and a corresponding key in `data.notes{}`. Update `imageMap` if new images are added to `images/`.

---

## Repo structure

```
index.html                  ← Landing page
character-creator.html      ← Character Creator
campaign-journal.html       ← Campaign Journal
fast-crafting.html          ← Fast Crafting
spell-book.html             ← Spell Book
dm-screen.html              ← DM Screen (entry point)
manifest.json               ← Notes/images index (used by Campaign Journal)
wrangler.jsonc              ← Cloudflare Workers config (assets directory: dist)
README.md                   ← Setup and Cloudflare Pages instructions
CLAUDE.md                   ← This file
css/
  dm-console.css            ← DM Screen styles
js/
  app.js                    ← DM Screen app controller
  data.js                   ← All DM Screen campaign data
  combat.js                 ← Combat tracker
  markdown.js               ← Obsidian markdown renderer
images/
  chapter-1/                ← 15 images
  chapter-2/                ← 7 images
  chapter-2-5/              ← 10 images (Interlude)
  chapter-3/                ← 12 images
  chapter-8/                ← 1 image
  hundred-acre-wood/        ← 10 images
notes/
  chapters/                 ← Chapter 1–4 markdown notes (reference copies)
  rules/                    ← Player's Handbook (2024).md, Dungeon Master's Guide (2024).md
```

---

## Cloudflare deployment

- **Build command:** `mkdir -p dist && cp -r *.html *.json *.md images notes css js dist/`
- **Deploy command:** `npx wrangler deploy`
- **Path:** `/`
- The `wrangler.jsonc` sets `assets.directory` to `dist` so `.git` is never deployed

---

## manifest.json

The DM Screen Browse Notes menu is driven by `manifest.json`. Regenerate it after adding/removing notes or images:

```bash
cd ~/DnD/DnD\ Steve\ Tools
python3 -c "
import json, os
manifest = {'notes': [], 'images': {}}
for root, dirs, files in os.walk('notes'):
    dirs[:] = [d for d in sorted(dirs) if d != 'rules']
    for f in sorted(files):
        if f.endswith('.md') and not f.startswith('.'):
            path = os.path.join(root, f).replace(os.sep, '/')
            name = f.replace('.md', '')
            rel = os.path.relpath(root, 'notes')
            category = 'root' if rel == '.' else rel.split(os.sep)[0]
            manifest['notes'].append({'name': name, 'path': path, 'category': category})
for root, dirs, files in os.walk('images'):
    dirs[:] = sorted(dirs)
    for f in sorted(files):
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')) and not f.startswith('.'):
            path = os.path.join(root, f).replace(os.sep, '/')
            manifest['images'][f] = path
with open('manifest.json', 'w') as fp:
    json.dump(manifest, fp, indent=2)
print('manifest.json updated')
"
```

---

## Adding new Campaign Journal entries

Edit the `JOURNAL` array in `campaign-journal.html`. Each chapter looks like:

```javascript
{
    id: "chapter-1",
    title: "Chapter 1",
    password: "krat",           // unlocks the chapter
    entries: [
        { name: "The Innkeeper", password: "crawfish", image: "images/chapter-1/The Innkeeper.png" },
        { name: "Rabbit",        password: "rabbit",   image: "images/chapter-1/Rabbit.png", hidden: true },
        { name: "Town Map",      password: "map",      image: "images/chapter-1/Town Map.png", autoUnlock: true },
    ]
}
```

- `autoUnlock: true` — entry unlocks automatically when the chapter is unlocked
- `hidden: true` — name shows as "???" until unlocked
- Passwords are case-insensitive

