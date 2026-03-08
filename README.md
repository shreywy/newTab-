# newTab+

A fast, beautiful new tab page for Chrome and Firefox. Replaces your default new tab with a glassmorphism dashboard — quick-launch tiles, live weather, and full visual customization.

![Banner](img/banner.png)

---

## Features

- **Quick-launch tile grid** — Add, edit, and drag-to-reorder bookmarks as icon tiles
- **Auto-icons** — Automatically fetches favicons from any URL; paste a custom image URL to override
- **Live weather widget** — Current conditions + hover to expand 5-day forecast (uses open-meteo, no API key needed)
- **Backgrounds** — Solid color, CSS gradient, or image URL with blur and darkness controls
- **Shader overlays** — Aurora (WebGL/THREE.js) or Falling Lines (CSS animation) layered on top of the background
- **10 color presets** — Catppuccin Mocha, Nord, Dracula, Tokyo Night, Gruvbox, and more
- **8 gradient presets** — Cosmic, Northern, Ocean Deep, Purple Haze, and more
- **Tile customization** — Icon size, column count, and gap sliders
- **Import / Export links** — Save and restore your tiles as a JSON file; use an export as a template
- **Staggered entrance animation** — Everything gracefully fades in on each new tab open
- **No telemetry, no accounts** — All data stored locally via `chrome.storage.local`

---

## Installation

### Load as Unpacked Extension (Chrome / Edge)

1. Clone or download this repo
2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Open `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select this folder

### Firefox

1. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on**
2. Select `manifest.json` from this folder

---

## Usage

- **Add tiles** — Click the pencil icon (bottom-right corner, appears on hover) to enter edit mode, then click **+**
- **Edit / delete a tile** — In edit mode, hover a tile and click the pencil badge
- **Reorder tiles** — Drag tiles in edit mode
- **Customize appearance** — In edit mode, click the settings icon to open the appearance panel
- **Import / Export links** — In the settings panel under **Links**, export your current tiles as `newtab-links.json` or import a previously exported file
- **Weather** — Hover the weather widget (top-right) to see a 5-day forecast

### Link Template Format

The exported JSON can be edited and re-imported. Each entry follows this structure:

```json
[
  {
    "name": "GitHub",
    "url": "https://github.com",
    "icon": "",
    "iconUrl": "https://www.google.com/s2/favicons?domain=github.com&sz=64",
    "color": "#6e40c9"
  }
]
```

- `icon` — emoji character (used when iconMode is "emoji"), otherwise leave empty
- `iconUrl` — image URL for the tile icon (auto-filled from favicon service, or paste any image URL)
- `color` — hex color used for the tile background tint and letter fallback

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 |
| Animations | framer-motion |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| Shader (Aurora) | THREE.js WebGL fragment shader |
| Shader (Falling) | framer-motion CSS gradient animation |
| Styling | Tailwind CSS v3 |
| Bundler | esbuild |
| Weather API | open-meteo (free, no key) |
| Geocoding | Nominatim / OpenStreetMap (free, no key) |
| Storage | chrome.storage.local / browser.storage.local |

---

## Development

```bash
npm install
npm run watch     # esbuild + Tailwind in watch mode
npm run build     # production build → dist/
```

Output goes to `dist/bundle.js` and `dist/style.css`. The extension loads `index.html` as the new tab page.

---

## License

MIT — see `LICENSE`.
