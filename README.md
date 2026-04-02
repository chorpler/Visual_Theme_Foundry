# Work In Progress

This repository is currently in active development. Documentation and workflow details may change before the first publication-ready release.

## Material Theme Builder Utility

An all-in-one theme, typography, font, icon, and UI component preview/export tool for web applications that use HTML and CSS.

The utility is based on Material Design 3 tokens and components, with support for custom themes and local assets.

## Offline-First Design

- This utility is designed to run locally with no required runtime calls to external CDNs.
- Material Web runtime dependencies are vendored from material-web.
- End users do not need to install or download dependencies to run the utility.
- Optional web interaction is user-initiated only (for example opening the external Material Theme Builder link to create new theme JSON files).
- Typescript and Sass build tools are vendored for local use, but the runtime output is framework-free.

## How this Utility runs

Node.js is needed, but npm is not. Here's what's actually happening:

| Tool                | How it runs                                                   | Node needed?           |
| ------------------- | ------------------------------------------------------------- | ---------------------- |
| TypeScript compiler | `node _imports/typescript/lib/tsc.js --project tsconfig.json` | Yes                    |
| Dart Sass           | `_imports/dart-sass/src/dart.exe sass.snapshot ...`           | No (standalone binary) |
| Flask dev server    | `python server.py`                                            | No                     |

- `_imports/` vendoring exercise was specifically to avoid npm dependency — TypeScript and its compiler are local files, not an npm-managed package. Node is just the runtime to execute the vendored tsc.js. No package.json, no node_modules, no npm install step.
- Node LTS installed = correct and needed.
- npm itself is **not used**
- npm is actively neutered via` _imports/noop_npm.cmd` as a guard against the tsserver typings installer trying to reach out.

## What This Tool Does

- Loads Material theme (color theme) JSON files and applies schemes in real time.
- Lets you preview Material Web component variants in one place.
- Lets you load and test local fonts and icons.
- Includes Typography Studio controls for role-level type settings.
- Exports a project-ready package that includes:
  - Selected theme JSON
  - Typography JSON
  - Sass files
  - TypeScript file (when needed by your workflow)
  - Selected fonts
  - Selected icons

## What the Export Package Contains

The exported scaffold is designed to be framework-agnostic and dependency-free. Your project only needs to include the compiled CSS to get the full theme applied:

```html
<link rel="stylesheet" href="theme.css" />
```

No npm. No Lit. No framework assumption. The tokens and component base styles work with React, Vue, HTMX, plain HTML — whatever you're building with.

### What the scaffold provides

- **Color roles** — all Material Design 3 color tokens as CSS custom properties (`--md-sys-color-primary`, etc.)
- **Typography scale** — typescale roles as CSS classes (`.md-typescale-body-large`, etc.) with your selected fonts baked in
- **Component base styles** — geometry, spacing, border radius, and color for common UI elements, all driven by the token variables
- **State layer behavior** — hover, focus, and pressed state opacity via CSS only

### What the scaffold leaves to you

- **Interactive behaviors** — ripple on tap, dialog open/close, animated focus rings. These require JavaScript and are handled by `behaviors.js` (see below).
- **ARIA and accessibility** — semantic markup and ARIA attributes depend on how you structure your components.
- **Framework reactivity** — the scaffold has no opinion on how your components manage state.

If you later want to layer Material Web's Lit-based components on top, install `@material/web` in your project and the token names will align. If you prefer a React MD3 library, a Vue implementation, or nothing at all, the scaffold works the same way.

### Export structure

Every export includes both compiled output and source files:

```
exported-theme/
├── css/
│   └── theme.css          ← compiled, drop-in ready
├── js/
│   └── behaviors.js       ← compiled, optional (see below)
├── src/
│   ├── scss/
│   │   ├── _tokens.scss
│   │   ├── _typography.scss
│   │   └── _components.scss
│   └── ts/
│       └── behaviors.ts
├── fonts/
├── icons/
├── theme.json
└── typography.json
```

Use `css/` and `js/` for a drop-in integration. Use `src/` if you have a Sass and TypeScript build pipeline and want to extend or integrate the source directly.

> **Note — `src/` toolchain requirements:** The SCSS source files are written for **Dart Sass** specifically. LibSass and the legacy Ruby Sass compiler are not supported and may produce incorrect output or errors. The TypeScript source targets ES2022 and requires the **TypeScript compiler** (`tsc`). If you are not already using Dart Sass and TypeScript in your project, use the compiled `css/` and `js/` output instead — they have no toolchain requirements.

### Optional: behaviors.js

Some UI behaviors are not achievable with CSS alone. The export package optionally includes `behaviors.js`, a small vanilla JavaScript file (no dependencies) that adds:

- Ripple effect on interactive elements
- Dialog open/close toggle
- Animated focus ring on keyboard navigation

Include it in your project if you want these behaviors out of the box. Skip it if your framework or component library already handles that layer.

```html
<!-- optional — include only if needed -->
<script src="behaviors.js"></script>
```

## Quick Start

1. Start the local server:

```bash
python server.py
```

2. Open the app in your browser:

```text
http://127.0.0.1:9000
```

3. Choose a theme, scheme, font, icon source, and component visibility options.
4. Click Export Theme Package.

## Adding Additional Color Themes

1. Open the Material Theme Builder:

```text
https://material-foundation.github.io/material-theme-builder/
```

2. Generate and download the Material theme JSON file.
3. Drop the JSON file into:

```text
color_themes/
```

4. Refresh the app and select the new theme from the Theme File list.

## Adding Fonts and Icons

- Add font files to:

```text
fonts/
```

- Add icon files to:

```text
icons/
```

The app will discover supported files automatically.

## Licensing and Distribution Notes

- The assets included in this repository are intended to be open source.
- If you add licensed (non-open-source) assets, you are responsible for attaching the correct license terms and redistribution permissions (this utility will export any licenses added with fonts icons HTML components etc. with the exported package).
- Before publishing or distributing, verify that every added asset is legally redistributable for your use case (this is a caution for users, I have no control over third-party licenses).

## Attribution

Attribution and source credit are documented in:

```text
attributions.md
```

Legacy upstream attribution content is also retained in `attribution.md`.

No authorship is claimed for upstream Material Design components, icon sets, or external font families.

## Use and Warranty

- This utility is free to use and redistribute.
- Attribution to the project author is not required.
- The software is provided as-is, with no warranty or guarantee of fitness for a particular purpose.
