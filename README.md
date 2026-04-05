# D&D Campaign Tools

A collection of browser-based tools for running a D&D 5e campaign. No build step, no dependencies — just static HTML files served directly.

## Tools

- **Character Creator** — Players build their characters for the campaign (race, class, stats, backstory).
- **Campaign Journal** — Players unlock entries (characters, locations, items) as they progress. The DM gives out passwords during play to reveal images and info chapter by chapter. Unlocks persist in the browser.
- **DM Screen** — Encounter manager, dice roller, condition tracker, document viewer, and more. Password-protected (DM only). Notes and images are loaded from the repo automatically — no more manual uploads.

## File Structure

```
index.html              ← Landing page (links to each tool)
character-creator.html  ← Character Creator app
campaign-journal.html   ← Campaign Journal (player-facing, password-gated)
dm-screen.html          ← DM Screen app
manifest.json           ← Auto-generated index of notes & images
images/                 ← Campaign images organised by chapter
  chapter-1/
  chapter-2/
  chapter-3/
  hundred-acre-wood/
notes/                  ← Campaign markdown notes
  chapters/             ← Chapter notes
  characters/           ← NPC/creature stat blocks
  locations/            ← Location descriptions
```

## Tech Stack

Single-file HTML apps — no npm, no bundler, runs from `file://` or any static host.

- React 18 (CDN)
- Tailwind CSS 2 (CDN)
- Babel standalone (CDN) for JSX
- marked.js (CDN) for markdown rendering (DM Screen)

## Adding Content

**Images:** Drop new image files into the relevant `images/` subfolder.

**Notes:** Add markdown files to `notes/chapters/`, `notes/characters/`, or `notes/locations/`.

**Manifest:** After adding files, regenerate `manifest.json` so the DM Screen can browse them:

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

**Campaign Journal entries:** Edit the `JOURNAL` array inside `campaign-journal.html` to add chapters, entries, and passwords.

## Cloudflare Pages Deployment

### First-time setup

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/) and sign in (or create a free account).
2. Click **Workers & Pages** in the sidebar, then **Create**.
3. Select the **Pages** tab, then **Connect to Git**.
4. Authorise Cloudflare to access your GitHub account and select the **MyDnDCampaign** repository.
5. Configure the build settings:

| Setting | Value |
|---|---|
| **Production branch** | `main` |
| **Build command** | *(leave blank)* |
| **Build output directory** | `/` |

6. Click **Save and Deploy**. Cloudflare will deploy in a few seconds.
7. Your site will be live at `https://<project-name>.pages.dev`. You can add a custom domain later from the project settings.

### Subsequent deploys

Every `git push` to `main` triggers an automatic redeploy — no manual steps needed.

### Custom domain (optional)

In your Cloudflare Pages project → **Custom domains** → **Set up a custom domain**, then follow the DNS instructions.
