# D&D Campaign Tools

A collection of browser-based tools for running a D&D 5e campaign. No build step, no dependencies — just static HTML files served directly.

## Tools

- **Character Creator** — Players build their characters for the campaign (race, class, stats, backstory).
- **DM Screen** — Encounter manager, dice roller, condition tracker, document viewer, and more. Password-protected (DM only).

## File Structure

```
index.html              ← Landing page (links to each tool)
character-creator.html  ← Character Creator app
dm-screen.html          ← DM Screen app
```

## Tech Stack

Single-file HTML apps — no npm, no bundler, runs from `file://` or any static host.

- React 18 (CDN)
- Tailwind CSS 2 (CDN)
- Babel standalone (CDN) for JSX
- marked.js (CDN) for markdown rendering (DM Screen)

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
