# D&D Campaign Tools

**Version 26.04.25.4**

A collection of browser-based tools for running a D&D 5e campaign. No framework and no compile step — just static HTML/CSS/JS files served directly from Cloudflare.

---

## Tools

- **Campaign Journal** — Progressive reveal tool. The DM gives out passwords during play to unlock chapter sections and individual entries (character portraits, location images, handouts). Unlocks persist in the browser.
- **Fast Crafting** — Item browser for a player with the fast crafting ability. Lists 21 craftable items (adventuring gear + simple weapons) with full 2024 PHB stats and descriptions.
- **Spell Book** — Searchable spell reference for the Sorcerer and Bard players. Cantrips and level 1 spells from the 2024 PHB, filterable by class, level, and school.
- **Spider Merchant** — Password-gated magic item shop. Players browse 33 items (filterable by rarity) and choose 1 for free. Each item shows flavour text separately from mechanics, with key terms bolded.
- **DM Screen** — Password-protected DM tool with encounter manager, condition tracker, and document viewer. Chapter notes and images load from the repo automatically via Browse Notes.

---

## File Structure

```
index.html              ← Landing page (links to all tools, version number)
campaign-journal.html   ← Campaign Journal (password-gated progressive reveal)
fast-crafting.html      ← Fast Crafting item browser
spell-book.html         ← Spell Book (Sorcerer + Bard, cantrips + level 1)
spider-merchant.html    ← Spider Merchant shop (33 magic items, password-gated)
dm-screen.html          ← DM Screen (password: "Coachman")
manifest.json           ← Auto-generated index of notes & images (for DM Screen)
wrangler.jsonc          ← Cloudflare Workers config
CLAUDE.md               ← Project instructions for AI assistant context
css/
  landing.css           ← Landing page styles
  campaign-journal.css  ← Campaign Journal styles
  spell-book.css        ← Spell Book styles
  dm-console.css        ← DM Screen styles
js/
  landing.js            ← Landing page password gates
  journal-data.js       ← Campaign Journal chapter/entry config
  campaign-journal.js   ← Campaign Journal unlock/render/viewer logic
  spells-data.js        ← Spell data
  spell-book.js         ← Spell Book search/filter/highlighting
  app.js                ← DM Screen app controller
  data.js               ← DM Screen campaign data
  combat.js             ← DM Screen combat tracker
  markdown.js           ← DM Screen markdown renderer
images/
  chapter-1/            ← 15 images
  chapter-2/            ← 7 images
  chapter-3/            ← 12 images
  chapter-2-5/          ← 10 images
  chapter-3/            ← 12 images
notes/
  chapters/             ← Chapter 1–3 + Chapter 2.5 markdown notes
```

---

## Adding Content

### New campaign images
Drop image files into the relevant `images/` subfolder, then regenerate `manifest.json` (see below).

### New chapter notes
Copy updated markdown files into `notes/chapters/`, then regenerate `manifest.json`.

### Regenerate manifest.json
Run this from `~/DnD/DnD Steve Tools/` after adding or removing notes or images:

```bash
python3 -c "
import json, os
manifest = {'notes': [], 'images': {}}
for root, dirs, files in os.walk('notes'):
    dirs[:] = sorted(dirs)
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

### Campaign Journal entries
Edit the `window.JOURNAL` array in `js/journal-data.js`. Entry flags:
- `autoUnlock: true` — reveals automatically when the chapter password is entered
- `hidden: true` — shows as "???" until individually unlocked
- Passwords are case-insensitive

### Spell Book
All spell data is embedded in `js/spells-data.js` as `window.SPELLS`. To add level 2 spells when characters reach level 3, ask Claude to query the 5etools database and update that data file.

---

## Cloudflare Deployment

### Build settings

In the **Cloudflare Pages dashboard → Settings → Build & deployments**, set:

| Setting | Value |
|---|---|
| **Build command** | `bash build.sh` |
| **Deploy command** | `npx wrangler deploy` |
| **Path** | `/` |

`build.sh` (committed to the repo) copies all HTML, JSON, Markdown, images, notes, CSS, and JS into `dist/`. The `wrangler.jsonc` sets `assets.directory` to `dist`, so `.git` and other non-site files are never deployed.

> **Why `build.sh` instead of an inline command?** The DM Screen is a multi-file app (`css/` and `js/` folders). A script in the repo is easier to keep in sync with the file structure than a command typed into the Cloudflare dashboard.

### Deploying changes

Every `git push` to `main` triggers an automatic redeploy:

```bash
cd ~/DnD/DnD\ Steve\ Tools
git add -A
git commit -m "Your message here"
git push
```

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 26.04.25.4 | 25 Apr 2026 | Refreshed landing page visuals; split Campaign Journal, Spell Book, and landing page into HTML/CSS/JS files |
| 26.04.21.1 | 21 Apr 2026 | DM Screen: removed dice roller, manual upload, and Rules section; renamed campaign to "Wish"; added Ch.2.5; updated chapter notes |
| 26.04.17.1 | 17 Apr 2026 | Removed Character Creator; added Spider Merchant shop (33 items, rarity filter, flavour/mechanics split, bolded key terms) |
| 26.04.10.3 | 10 Apr 2026 | Added version number to landing page |
| 26.04.10.2 | 10 Apr 2026 | Added Spell Book (Sorcerer + Bard, cantrips + level 1, 2024 PHB) |
| 26.04.10.1 | 10 Apr 2026 | Added Fast Crafting item browser (21 items, 2024 PHB) |
| 26.04.05.4 | 5 Apr 2026 | PHB/DMG auto-load on Rules tab; removed from Browse Notes |
| 26.04.05.3 | 5 Apr 2026 | Fixed green toast in Campaign Journal; restored lock emoji |
| 26.04.05.2 | 5 Apr 2026 | Campaign Journal reset button; DM Screen chapter auto-load; PHB/DMG added |
| 26.04.05.1 | 5 Apr 2026 | Initial launch: landing page, Campaign Journal, Character Creator, DM Screen with server-hosted notes/images |
