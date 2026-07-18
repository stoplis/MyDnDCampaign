---
name: Wish — Campaign Tools
description: An editorial, ink-on-paper toolkit for running a home D&D 5e campaign, led by the DM Screen.
colors:
  antique-gold: "oklch(0.55 0.15 78)"
  antique-gold-bright: "oklch(0.72 0.13 78)"
  antique-gold-weak: "oklch(0.95 0.045 78)"
  paper: "#faf8f4"
  surface: "#ffffff"
  surface-raised: "#f3f0ea"
  ink: "#141414"
  ink-secondary: "#404040"
  ink-tertiary: "#6b6b6b"
  ink-faint: "#9a9a9a"
  rule: "#e6e1d6"
  rule-strong: "#1a1a1a"
  danger: "oklch(0.55 0.18 25)"
  ok: "oklch(0.55 0.11 150)"
  warn: "oklch(0.65 0.14 75)"
  faction-pc: "oklch(0.55 0.13 245)"
  faction-ally: "oklch(0.52 0.12 155)"
  faction-neutral: "oklch(0.55 0.04 80)"
  faction-enemy: "oklch(0.48 0.17 28)"
typography:
  display:
    fontFamily: "Source Serif 4, Source Serif Pro, Georgia, serif"
    fontSize: "15px–28px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Source Serif 4, Source Serif Pro, Georgia, serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Source Serif 4, Source Serif Pro, Georgia, serif"
    fontSize: "10px–13px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.09em–0.12em"
rounded:
  sm: "3px"
  md: "6px"
  lg: "8px"
  pill: "999px"
  none: "0"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "20px"
  s6: "24px"
  s7: "32px"
  s8: "48px"
  s9: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "7px 12px"
  button-primary-hover:
    backgroundColor: "{colors.antique-gold}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "7px 12px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "7px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "7px 12px"
  card-popover:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "20px 24px"
  pill-mention:
    backgroundColor: "{colors.antique-gold-weak}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "1px 8px"
---

# Design System: Wish — Campaign Tools

## 1. Overview

**Creative North Star: "The Gilded Ledger"**

Wish is a leather campaign ledger, not a game HUD. The DM Screen — the primary surface every other tool inherits from — is built on near-white paper, true-black ink, hairline rules, and a single serif voice carried through headings, body copy, and labels alike. Gold appears the way gold foil appears on a real ledger: rarely, on the spine and the important marks, never as a wash across the page. Buttons rest in ink and only turn gold on hover or focus; a small gold dot pulses on the one action that matters most (starting combat); selection and emphasis borrow gold sparingly. Everything else is disciplined: paper, ink, hairlines.

This system explicitly rejects the aesthetics of a generic SaaS dashboard (card grids, blue gradients, corporate chrome), a bright mobile-game fantasy UI (saturated gem-tone buttons, glossy icons), gritty grimdark (excess darkness, blood-and-grit heaviness), and any cartoonish or kids'-app treatment. It is calm, legible under table lighting, and built to disappear behind the words and numbers it's showing — because the DM Screen has to survive live play without slowing anyone down.

One correction this pass makes explicit: the accent that was actually implemented across every page was a muted terracotta/salmon (`oklch(0.45 0.14 25)`), while the project's own stylesheet comment already called the system "amber." That terracotta has been reassigned to the `danger` semantic role, where its warmth reads as alert rather than identity, and antique gold now carries the single primary accent everywhere.

**Key Characteristics:**
- One serif family (Source Serif 4) does every job — display, body, and label — so hierarchy comes from weight, size, and letter-spacing, never a second typeface.
- Gold is rare by design: hover states, the combat FAB's pulse, selection outlines, mention chips, callout rules — never a resting button fill or a background wash.
- Flat by default; shadows exist only for things that genuinely float (popovers, the floating action button).
- Faction colors (player-blue, ally-green, neutral-tan, enemy-red) and semantic states (ok/warn/danger) are a separate palette from the brand accent — combat and bestiary readability never competes with gold for attention.
- Three built-in themes (light, dark, parchment) share structure; only the neutral ramp and faction saturation shift between them.

## 2. Colors: The Ledger Palette

Mostly paper and ink. One warm accent, used with restraint.

### Primary
- **Antique Gold** (`oklch(0.55 0.15 78)`, ≈ `#a06200`): the one brand accent. Hover state for the primary button and the floating combat action; the pulsing dot that signals "this is the live action"; focus rings on inputs; selected states (initiative row, condition pill); the leading rule on callouts, secrets, and mentions. Never the resting fill of a button or a large surface area.
- **Antique Gold — Bright** (`oklch(0.72 0.13 78)`, ≈ `#d19936`): the lifted variant for dark backgrounds. *(Currently the dark theme reuses the light-mode gold value unchanged — see the Dark-Mode Gold Rule below; this is the value it should resolve to.)*
- **Antique Gold — Weak** (`oklch(0.95 0.045 78)`, ≈ `#ffeccd`): background tint only — mention chips, hover fills, condition-pill "on" state. Never used for text.

### Secondary — Semantic State
- **Ledger Red** (`oklch(0.55 0.18 25)`, ≈ `#932b2a`): `danger`. This is the color that used to be the brand accent; it now exclusively means "bad" — low HP, destructive actions, failed saves.
- **Moss** (`oklch(0.55 0.11 150)`): `ok` — healthy HP, success states.
- **Ochre** (`oklch(0.65 0.14 75)`): `warn` — bloodied HP, caution states. Sits close to gold in hue; kept distinct by lower chroma and its exclusive use inside HP bars/condition badges, never near a real gold accent on the same surface.

### Tertiary — Faction Roles
- **Party Blue** (`oklch(0.55 0.13 245)`): player characters in the bestiary and combat tracker.
- **Ally Green** (`oklch(0.52 0.12 155)`): allied NPCs.
- **Neutral Tan** (`oklch(0.55 0.04 80)`): neutral NPCs — low-chroma on purpose so it never reads as a second gold.
- **Enemy Red** (`oklch(0.48 0.17 28)`): hostile creatures. Close to Ledger Red by design — both mean "danger," one for HP state, one for faction.

### Neutral
- **Paper** (`#faf8f4`): the page background — warm off-white, not stark white.
- **Surface** (`#ffffff`): cards, popovers, the topbar — one step brighter than paper so structure reads without a border.
- **Surface Raised** (`#f3f0ea`): hover fill for rows and secondary buttons.
- **Ink** (`#141414`): primary text, and the resting fill of the primary button.
- **Ink Secondary** (`#404040`) / **Ink Tertiary** (`#6b6b6b`) / **Ink Faint** (`#9a9a9a`): body copy, meta text, and placeholder/disabled text, in descending emphasis.
- **Rule** (`#e6e1d6`): hairline dividers — the system's only default border.
- **Rule Strong** (`#1a1a1a`): high-contrast borders reserved for emphasis (rare).

### Named Rules
**The Reserved Gold Rule.** Gold is not a fill color. It appears on hover, focus, selection, and small marks (dots, chip prefixes, leading rules) — never as the resting background of a button, card, or panel. If gold is covering more than a hairline or a small badge, it's being overused.

**The Dark-Mode Gold Rule.** `--accent` must be explicitly overridden per theme, not left to fall through from `:root`. At light-mode gold's exact value, text and hover-state contrast against the dark surface (`#181b20`) lands under 4:1 — below the 4.5:1 body-text floor. The dark theme should set `--accent` to Antique Gold — Bright (`oklch(0.72 0.13 78)`), not inherit the light-mode value.

## 3. Typography

**Display Font:** Source Serif 4 (with Source Serif Pro, Georgia, Times New Roman fallback)
**Body Font:** Source Serif 4 (same stack)
**Label Font:** Source Serif 4 (same stack, uppercase + tracked instead of a distinct face)

**Character:** One serif voice throughout — no sans, no real monospace, even where the CSS variable is named `--mono`. It reads like a well-typeset book: italics for meta detail (creature type lines, subtitles), weight and tracking for hierarchy, never a second typeface competing for attention.

### Hierarchy
- **Display** (600, 22–28px, line-height 1.1, −0.01em): stat block names, section headers inside notes, the app brand mark.
- **Headline** (600, 18–20px, line-height 1.1): popover titles, chapter headers.
- **Title** (600, 15px, −0.01em): party member names, row titles.
- **Body** (400, 14px, line-height 1.5): chapter notes, statblock prose. Cap prose measure at 65–75ch inside the notes pane.
- **Label** (500, 10–13px, letter-spacing 0.09–0.12em, uppercase): rail-header titles, callout titles, mono-hint meta, scratchpad head. This is the system's substitute for a monospace/UI face — tracking and case do the differentiation work a second typeface would normally do.

### Named Rules
**The One Voice Rule.** `--serif`, `--sans`, and `--mono` all resolve to Source Serif 4. Do not introduce a second family for "UI" or "data" text — build hierarchy with weight, size, tracking, and case instead. If a screen needs a face to feel more "technical," reach for uppercase + letter-spacing on the label role, not a new font.

## 4. Elevation

Flat by default. The page itself has no shadows — rows, panels, and rails are separated by 1px hairline rules (`--rule`) against the paper/surface distinction, not depth. Shadows are reserved for things that are genuinely floating above the page: modal popovers and the floating combat button. State feedback (hover, focus, selection) is communicated with background-color shifts and outlines, never a shadow.

### Shadow Vocabulary
- **Popover / Modal** (`box-shadow: 0 24px 64px rgba(0,0,0,0.3)`): the stat-block and party-sheet popovers, over a blurred backdrop (`backdrop-filter: blur(2px)` on a 50%-ink scrim).
- **Floating Action** (`box-shadow: 0 8px 24px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.08)`): the "Start Combat" button — the one persistent floating element on screen.
- **Pulse Ring** (`box-shadow: 0 0 0 0 var(--accent)` animating outward): not elevation, but the same box-shadow property used for the FAB's live-attention dot. Treat it as a motion token, not a depth token.

### Named Rules
**The Flat-By-Default Rule.** If it's sitting on the page, it's flat. Shadows appear only on the small set of elements that visually detach from the page flow (popovers, the FAB) — never on rows, cards, or rails.

## 5. Components

Quiet and precise: minimal chrome, hairline borders, restrained hover states. Nothing shouts — including gold.

### Buttons
- **Shape:** 6px radius (`{rounded.md}`); small variant keeps the radius and drops padding to 4px 8px.
- **Primary (`.btn.primary`):** ink background, paper text at rest — **not** gold. On hover, background and border shift to Antique Gold with white text. This is the system's core discipline: importance is ink, not color; gold is reserved for the moment of interaction.
- **Secondary (`.btn`):** 1px `--rule` border, surface background, ink text. Hover raises the border to `--ink-3` and fills with `--surface-raised`.
- **Ghost (`.btn.ghost`):** transparent border at rest, `--rule` border on hover — for the lowest-emphasis actions (icon buttons, inline toggles).
- **Danger (`.btn.danger`):** ink text swapped for `--danger`, border tinted toward danger — reserved for destructive actions, and the only button variant allowed to use a semantic color instead of ink/gold.

### Chips / Pills
- **Mention chip:** pill radius (999px), `--rule` border, Antique Gold — Weak background, ink text; an uppercase gold-colored prefix label inside. Hover deepens the border to full gold.
- **Condition pill:** rectangular badge; "on" state gets a gold border and Antique Gold — Weak fill, matching the mention chip's restraint.

### Cards / Popovers
- **Corner style:** sharp, 0 radius — popovers are the one place the system deliberately breaks from the 6px button/input radius, reading as a printed page rather than a rounded app panel.
- **Background:** surface (`#ffffff`), over a blurred ink-tinted scrim.
- **Shadow strategy:** see Elevation — the popover shadow is the system's heaviest, by design, since it's the one element meant to feel lifted off the page.
- **Internal padding:** `--s5 --s6` (20px 24px).

### Inputs / Fields
- **Style:** 1px `--rule` border (or, for inline edit fields, a transparent bottom border), surface background, no radius beyond the shared 6px where boxed.
- **Focus:** border color shifts to Antique Gold — the same accent used for button hover, keeping "you're interacting with this" consistent across the system.
- **Error:** not separately themed yet — inherits the danger color where used, but no dedicated input-error state exists in the current CSS.

### Navigation (Topbar)
- **Style:** surface background, 1px bottom rule, brand mark in display serif (18px, −0.01em) with an italic secondary clause in `--ink-3`. Back-link and chapter-switcher are bordered pill/rect buttons matching the secondary button treatment.

### Party Rail HP Bar (signature component)
6px-tall bar, 2px radius, `--rule` track. The fill is `--ok` (moss) by default, swapping to `--warn` (ochre) or `--danger` (ledger red) by threshold — this is the one place in the system where color carries life-or-death meaning, and it is deliberately kept out of gold's hue family so a glance never confuses "low HP" with "selected" or "important."

## 6. Do's and Don'ts

### Do:
- **Do** treat the DM Screen (`css/dm-console.css`) as the source of truth. Every other tool (Campaign Journal, Spell Book, Fast Crafting, Spider Merchant, the landing page) should inherit its tokens rather than maintaining a parallel copy — currently each ships its own duplicated `:root` block with the same values, which is how the terracotta accent drifted across five files at once.
- **Do** use Antique Gold (`oklch(0.55 0.15 78)`) as the one primary accent, reserved for hover, focus, selection, and small marks.
- **Do** keep the system flat by default; add shadow only to elements that float above the page (popovers, the FAB).
- **Do** build hierarchy with weight, size, tracking, and case within the single Source Serif 4 family.
- **Do** keep faction and semantic (ok/warn/danger) colors visually distinct from the gold accent — combat/bestiary readability must never compete with brand color.
- **Do** override `--accent` per theme (light/dark/parchment) rather than letting dark mode inherit an under-contrast value.

### Don't:
- **Don't** use the old terracotta/salmon (`oklch(0.45 0.14 25)`, `#932b2a`) as a brand accent anywhere — it is now `--danger` only.
- **Don't** fill a button, card, or panel with gold at rest. Gold is an interaction/emphasis color, not a surface color.
- **Don't** design toward a generic SaaS dashboard look — card grids, blue gradients, corporate-tool chrome.
- **Don't** design toward a bright mobile-game fantasy UI — saturated gem-tone buttons, glossy icons, freemium-RPG polish.
- **Don't** design toward gritty grimdark — excess darkness or blood-and-grit heaviness; this is a family table.
- **Don't** design toward cartoonish or kids'-app styling — overly playful, rounded, illustrated-for-children treatments.
- **Don't** introduce a second typeface for "UI" or "data" text. Use the label role (uppercase + tracked) instead.
- **Don't** add rounded corners to popovers/modals — their sharp, printed-page corner is a deliberate departure from the 6px button/input radius.
