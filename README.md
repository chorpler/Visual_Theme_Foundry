# Visual Theme Foundry — v2.0.0

A local-first tool for previewing and exporting Material Design 3 themes, typography, fonts, and icons for web applications.

Run it locally, configure your theme visually, export a clean scaffold package. No cloud, no npm, no framework lock-in.

**Supported platforms:** Windows x64 · macOS x64 · macOS arm64 (Apple Silicon) · Linux x64 · Linux arm64.
Requires Python 3.10+. Node.js required only for TypeScript compilation.

---

## What It Does

**Color themes** — Load Material Design 3 theme JSON files from `color_themes/`. Switch between all six scheme variants (light, light-medium-contrast, light-high-contrast, dark, dark-medium-contrast, dark-high-contrast) in real time. OS light/dark/high-contrast is detected automatically on first load.

**Typography Studio** — Configure type roles (display, headline, title, body, label), base size, line height, and responsive scaling mode. A global font selection pushes to all roles; per-role overrides are tracked independently.

**Fonts** — Load local TTF/OTF/WOFF/WOFF2 files from `fonts/`. Preview them live. Selected fonts are included in the export.

**Icon Role Browser** — Assign normalized SVG icons to 18 main-primary UI roles (Home, Search, Menu, Close, Add, Edit, Delete, Save, Settings, User, People, Notifications, Message, Calendar, Document, Folder, Upload/Download, Share). Choose glyph variant and stroke weight (light / normal / medium) per role. Drop your own SVGs into the drag-and-drop zone at the bottom — they are normalized and added to the inventory immediately.

**Component preview** — Buttons, inputs, chips, cards, dialogs, tabs, navigation bars, and more. All themed live from the active scheme.

**Theme Gallery** — A separate full-page component showcase (`/color_themes/theme-palette-gallery-test.html`) that demonstrates how Material Design 3 semantic color pairs behave across realistic UI compositions. Includes a hero carousel, five themed sections (Content, Forms, Feedback, Navigation & Overlay, Data), and SVG illustration recoloring tied to the active primary. Sync toggle keeps builder and gallery in lockstep.

**Export** — Downloads a zip scaffold with the selected theme, typography, fonts, and the specific icons assigned to each role.

---

## Offline-First Design

- No runtime calls to external CDNs.
- No npm. No `node_modules`. No `package.json`.
- TypeScript and Dart Sass are vendored under `_imports/` for local use. Node.js is the runtime for `tsc` only — npm is neutered via `_imports/noop_npm.cmd`.
- The exported package has no runtime dependencies.

---

## Quick Start

```bash
python server.py
```

Open in browser:

```
http://127.0.0.1:9000
```

**Workflow (right to left):**

1. Select a color theme file and scheme variant.
2. Load a font and configure Typography Studio roles.
3. Assign icons to roles in the Icon Roles section.
4. Click **Export Theme Package** (top of right panel, always visible).

---

## Project Name and Theme File

Type a project name in the "Enter project name" field and press Enter (or tab away). The active theme JSON file is renamed on disk to `material-theme-{name}.json`.

---

## Theme Gallery

Click **Theme Gallery** in the builder (top of the right panel) or navigate to `/color_themes/theme-palette-gallery-test.html` directly.

The gallery is a Practical Blend component showcase — not a swatch map. It shows how semantic color pairs are used in realistic component compositions:

| Section | What it demonstrates |
| --- | --- |
| Hero carousel | primary, surfaceContainerHigh, tertiaryContainer — three carousel slides with themed SVG illustrations |
| Content | Card grid (primary / secondary / tertiary), list-group navigation sidebar |
| Forms | Full POSH form — input, email, datalist, select/optgroup, textarea, output, fieldset/legend, validation states |
| Feedback | Semantic alerts (info / success / warning / danger), spinners, progress bars, toast triggers, CSS tooltips |
| Navigation & Overlay | Breadcrumb, pagination, dropdown, button variants, modal (native dialog), offcanvas panel |
| Data | Striped/hover table, datetime-local, number, and range inputs |

**Controls:** prev/next theme buttons, six scheme variant selectors, scheme badge pill. **Sync toggle** shares the active theme file and scheme with the builder page via `localStorage` (last-write-wins).

SVG illustrations in `static/images/` are recolored at runtime to match the active primary — accent color replaced, grayscale ramp HSL-tinted to match primary hue at matching luminance.

---

## Adding Color Themes

1. Open the Material Theme Builder at `https://material-foundation.github.io/material-theme-builder/`
2. Export the Material theme JSON.
3. Drop the file into `color_themes/`.
4. Refresh the app and select the new theme.
5. Note: 11 color themes come pre-installed

---

## Adding Fonts

Drop font files (TTF, OTF, WOFF, WOFF2) into `fonts/`. The app discovers them on load.

---

## Adding Icons

Drop SVG files into the drag-and-drop zone at the bottom of the Icon Roles section. They are normalized to a 200×200 canvas at three stroke weights (light/normal/medium) and added to the inventory immediately.

The active icon set lives in `icons/normalized/`. It contains the role-relevant variants only. The full reference library is in `_references/normalized-icons/` (not committed to git).

---

## Export Package Contents

```
material-theme-export-{timestamp}.zip
├── css/
│   └── theme.css            ← compiled, drop-in ready
├── js/
│   └── behaviors.js         ← optional vanilla JS behaviors
├── src/
│   ├── scss/
│   │   ├── _tokens.scss     ← color tokens from selected theme
│   │   ├── _typography.scss ← font roles from Typography Studio
│   │   └── components/      ← component base styles
│   └── ts/
│       └── behaviors.ts     ← TypeScript source for behaviors.js
├── fonts/                   ← selected font files
├── icons/                   ← the icons assigned to the 18 UI roles
├── theme.json               ← selected color theme JSON
└── typography.json          ← Typography Studio configuration
```

Drop-in integration (no toolchain required):

```html
<link rel="stylesheet" href="css/theme.css" />
<script src="js/behaviors.js"></script>
<!-- optional -->
```

Use `src/` if you have Dart Sass and TypeScript in your build pipeline. SCSS requires Dart Sass — LibSass and Ruby Sass are not supported. TypeScript targets ES2022.

`behaviors.js` adds ripple effects on interactive elements, dialog open/close toggle, and animated focus rings on keyboard navigation. Skip it if your framework already handles that layer.

The export includes only the icons you assigned — not the full normalized library.

---

## How the Build Tools Run

| Tool                | How it runs                                                   | Node needed? |
| ------------------- | ------------------------------------------------------------- | ------------ |
| TypeScript compiler | `node _imports/typescript/lib/tsc.js --project tsconfig.json` | Yes          |
| Dart Sass           | `_imports/dart-sass/src/dart.exe sass.snapshot ...`           | No           |
| Server              | `python server.py`                                            | No           |

---

## Licensing

Assets in this repository are open source. If you add licensed assets, verify they are legally redistributable for your use case before distributing.

Attribution and source credit: `attributions.md`

---

## Use and Warranty

Free to use and redistribute. Attribution not required. Provided as-is with no warranty.
