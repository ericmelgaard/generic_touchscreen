# Generic Touchscreen Template

This project is a generic WAND touchscreen shell driven by CMS and TRM data.

## Core Model

- Home is layer `1`.
- Every non-home page is created dynamically from CMS click-area data.
- Layer pages are identified as `layer_<id>_page` at runtime.
- Layer background image targets are `layer_<id>_content_background`.

No static content pages are required in `index.html` beyond home and global controls.

## Navigation Rules

- If a click area has a valid `targetLayer`, tapping it navigates to that layer.
- If a click area has no `targetLayer`, it is non-interactive.
- Swipe gesture returns to home (layer `1`).
- Global home button (lower-right) returns to home from any non-home page.

## Required CMS Data

Each interactive element should provide a `clickArea` object (single object per item).

See `docs/CMS_CLICK_AREAS.md` for exact schema and examples.

## Runtime Page Creation

At app init:

1. Read CMS items.
2. Normalize `clickArea` data.
3. Discover layers from `sourceLayer` and `targetLayer`.
4. Create missing pages for discovered layers.
5. Render click hotspots for valid click areas.

## Dev/Preview Aids

- Missing layer pages can show placeholders in dev/preview.
- Hotspot debug overlay can be toggled:
  - Right-click menu: `Toggle Hotspot Debug`
  - Keyboard: `Alt+H`

## Files to Know

- `index.html`: minimal shell and script loading
- `js/menuLayout.js`: layer routing, dynamic page creation, hotspot rendering
- `js/imageStoreManager.js`: image binding to `layer_<id>_content_background`
- `js/app.js`, `js/integration.js`: data formatting and `clickArea` normalization
- `style.css`: generic template styling
