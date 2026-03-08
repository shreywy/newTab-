# newTab+ — Claude Reference

Private dev notes for AI-assisted development. Not committed to git.

---

## Project Overview

Browser extension (Chrome/Firefox MV2) that replaces the new tab page. React 18 SPA bundled with esbuild, styled with Tailwind v3. No backend, no API keys — all data stored in `chrome.storage.local`.

**Entry point:** `index.html` → `dist/bundle.js` + `dist/style.css`
**Source:** `src/`
**Build output:** `dist/` (committed, users load this as unpacked extension)

---

## Build

```bash
npm run build       # one-shot production build
npm run watch       # esbuild + tailwind watch (development)
```

esbuild config: `build.js` and `build.watch.js`
Tailwind config: `tailwind.config.js` (has custom keyframes: blob, wiggle, glow, fadeIn, slideUp)
CSS entry: `src/index.css` → `dist/style.css`

---

## Architecture

### File Map

```
src/
  main.jsx                          React 18 entry (ReactDOM.createRoot)
  App.jsx                           Root — state, storage, layout layers
  index.css                         Tailwind + .glass, .glass-hover, .hide-scrollbar

  components/
    Clock.jsx                       Time, date, greeting (updates every 1s)
    SearchBar.jsx                   Google search (submits to google.com/search?q=)
    WeatherWidget.jsx               open-meteo + nominatim, hover-expand 5-day forecast
    TileGrid.jsx                    DnD context, transform-scroll, grid layout
    TileCard.jsx                    Two-layer tile (outer layout div + inner motion.div)
    AddTileModal.jsx                Add/edit tile modal, auto-favicon, brand color map
    SettingsPanel.jsx               Appearance panel (slide in from right)

    backgrounds/
      AuroraShader.jsx              THREE.js WebGL aurora (transparent overlay)
      FallingPattern.jsx            framer-motion CSS radial-gradient falling lines
```

### Layer Z-Index Stack (App.jsx)

| z-index | Layer |
|---|---|
| z-0 | Static background (solid blobs / gradient / image) |
| z-1 | Shader overlay (aurora / falling) |
| z-10 | Main content (clock, search, tile grid) |
| z-20 | Header (weather widget) |
| z-30 | FAB (pencil / check / settings buttons) |
| z-39 | Settings click-outside backdrop |
| z-40 | Settings panel |
| z-50 | Tile modal |

---

## State & Storage

**Storage keys:**
- `ntplus_tiles` — array of tile objects
- `ntplus_settings` — settings object (deep-merged with DEFAULT_SETTINGS on load)

**Settings shape** (DEFAULT_SETTINGS in App.jsx):
```js
{
  background: {
    type: 'solid',        // 'solid' | 'gradient' | 'image'
    color: '#020617',
    blobColor: '#2596be',
    showBlobs: true,
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    imageUrl: '',
    imageBlur: 8,
    imageDarkness: 50,
  },
  shader: {
    type: 'none',         // 'aurora' | 'falling' | 'none'
    speed: 1.0,
    color: '#2596be',
    opacity: 0.9,
  },
  tiles: {
    size: 100,            // px, icon tile size
    columns: 7,
    gap: 16,              // px
  },
}
```

**Tile object shape:**
```js
{
  id: 'tile-1234567890',   // generated on save
  name: 'GitHub',
  url: 'https://github.com',
  icon: '',                // emoji string (used when iconMode = 'emoji')
  iconUrl: 'https://...',  // image URL (used when iconMode = 'auto')
  color: '#6e40c9',        // hex, used for tint + letter fallback
}
```

Storage uses a compat wrapper (`getStorage()` in App.jsx) that handles both `browser.storage.local` (Firefox) and `chrome.storage.local` (Chrome), and handles both callback and Promise APIs.

---

## Key Components — Notes

### TileGrid.jsx
**Critical:** Uses transform-based scroll (`translateY`) instead of CSS `overflow-y` to avoid clipping tile hover scale animations. The outer div has `overflow: hidden` + `padding: OVERFLOW_PADDING (28px)` + compensating negative margin. The inner div uses `overflow: visible` so tiles can scale freely.

`effectiveCols = Math.min(totalItems, columns)` ensures the grid is centered when there are fewer tiles than columns.

Mouse wheel + click-drag-to-scroll both work. Drag-to-scroll is disabled in edit mode (dnd-kit takes over).

### TileCard.jsx
**Critical:** Two-layer architecture. The outer `<div>` holds the dnd-kit ref/attributes/listeners and has fixed `width/height = tileSize`. The inner `<motion.div>` does `whileHover={{ scale: 1.08, y: -5 }}` and all visual effects. This prevents overflow clipping without requiring `overflow: visible` on any ancestor.

No `boxShadow` on hover — glow was removed per user preference.

### AuroraShader.jsx
THREE.js with `alpha: true` + `setClearColor(0,0,0,0)` for transparent background. Fragment shader computes alpha from `o.r*0.4 + o.g*0.5 + o.b*0.6`. `speed` prop passed via `speedRef` (avoids stale closure in the animation loop).

### FallingPattern.jsx
`backgroundRepeat: 'repeat'` is critical — was previously `repeat-y` which only covered half the screen (pattern tile is 300px wide).

### WeatherWidget.jsx
Single combined fetch: `open-meteo` (weather + 6-day daily) + `nominatim` (reverse geocoding) in `Promise.all`. Forecast shown on hover via `AnimatePresence` with `height: 0 → 'auto'`. Loads with 0.1s delay.

### SettingsPanel.jsx
Glassmorphism: `rgba(6,8,18,0.55)` + `backdrop-filter: blur(48px) saturate(180%)`. Slides in from right with spring animation. Click-outside closes via a backdrop div in App.jsx (z-39, behind the panel).

Import/Export: `tiles` and `onImportTiles` props passed from App.jsx. Export downloads `newtab-links.json` (strips IDs). Import reads JSON, validates `name`+`url` present, replaces all tiles.

---

## Entrance Animation Timing (App.jsx)

| Element | Delay | Duration |
|---|---|---|
| Background (solid/gradient/image) | 0s | 1.6s |
| Shader overlay | 0.2s | 2.4s (aurora) / 2.0s (falling) |
| Weather widget | 0.55s | 0.7s |
| Clock | 0.4s | 0.75s |
| Search bar | 0.58s | 0.7s |
| Tile grid | 0.72s | 0.65s |

---

## FAB (Floating Action Button)

Bottom-right corner. Appears when mouse is within 120px of the bottom-right corner, OR when `editMode` is true. Shows:
- Pencil icon → click to enter edit mode
- Check icon (when in edit mode) → click to exit
- Settings gear (only in edit mode) → toggles settings panel

---

## APIs Used

| API | URL | Auth | Usage |
|---|---|---|---|
| open-meteo | `api.open-meteo.com/v1/forecast` | None | Weather + daily forecast |
| Nominatim | `nominatim.openstreetmap.org/reverse` | None | Reverse geocode lat/lon → city name |
| Google S2 Favicon | `google.com/s2/favicons?domain=X&sz=64` | None | Auto-fetch tile icons |

---

## Common Tasks

**Add a new background type:**
1. Add the type to `PillGroup` in `SettingsPanel.jsx`
2. Add rendering logic in `App.jsx` (between LAYER 1 comments)
3. Add settings fields in `SettingsPanel.jsx`
4. Add default values in `DEFAULT_SETTINGS` in `App.jsx`

**Add a new shader:**
1. Create component in `src/components/backgrounds/`
2. Add to `PillGroup` options in `SettingsPanel.jsx`
3. Add rendering block in `App.jsx` (between LAYER 2 comments)

**Add a new color preset:**
- `THEME_PRESETS` array in `SettingsPanel.jsx` — `{ name, type: 'solid', color, blobColor }`
- `GRADIENT_PRESETS` array — `{ name, gradient }`

**Add a new brand color:**
- `BRAND_COLORS` object in `AddTileModal.jsx` — `'domain.com': '#hexcolor'`

---

## User Preferences

- No glow effects on tile hover (was removed, don't re-add)
- Default shader = none (aurora is available but off by default)
- FAB is pencil icon only, no text label
- Tiles always square with rounded corners
- Settings panel glassmorphism — translucent blur, not opaque
- No emoji as UI icons — use Lucide SVG icons throughout
