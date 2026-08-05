# Authoring Workflow

This template is now fully data-driven:

- Layer `1` is the home layer.
- Non-home layers are created at runtime from data.
- Click hotspots are generated from `menuItems[].clickArea` objects.
- Layer visuals are loaded from TRM asset zones by layer id.

## 1. Define Layer Art in CMS/TRM

Name assets so layer images can be resolved by layer id (example patterns):

- `layer10-home-promo.png`
- `page20-seasonal.jpg`

The runtime looks for `layer` or `page` followed by digits in the file name and maps to:

- `layer_<id>_content_background` (media container)
- `layer_<id>_page` (runtime page container, for layers > 1)

TRM zones should set `layerZOrder` to the matching layer id.

## 2. Define Click Areas

For each interactive region, author a `clickArea` with:

- `x`, `y`, `width`, `height`
- `sourceLayer`
- `targetLayer`

See `docs/CMS_CLICK_AREAS.md` for schema.

Important behavior:

- `sourceLayer` chooses where hotspot is rendered.
- `targetLayer` controls navigation destination.
- Missing or invalid `targetLayer` creates a non-actionable hotspot.

## 3. Nested Zones and Layer Chains

Nested experiences are represented as layer-to-layer chains in data.

Example flow:

1. Home hotspot: `sourceLayer: 1`, `targetLayer: 20`
2. Layer 20 hotspot: `sourceLayer: 20`, `targetLayer: 35`
3. Layer 35 hotspot: `sourceLayer: 35`, `targetLayer: 50`

No nested static HTML is required. Each destination page is created dynamically.

## 4. Validate in Dev

Use hotspot debug overlay:

- Press `Alt+H`
- or call `window.toggleHotspotDebug()` in the console

Confirm:

- Hotspot bounds align with art
- Labels show correct layer transitions (`Lx -> Ly`)
- Destinations navigate correctly

## 5. Runtime Expectations

- Home is layer `1`.
- All non-home pages are generated from data.
- Missing `targetLayer` means no action.
- Swipe and home button always return to layer `1`.

The canonical runtime navigation path is `menuLayout.navigateToLayer(layerId, resetHistory)`.

## 6. Implementation Assistance

Use this migration checklist when converting legacy touchscreen builds:

1. Remove static feature cards and static page markup.
2. Keep only a home layer container and a dynamic page root in markup.
3. Ensure TRM assets use numeric `layerZOrder` values for every visual layer.
4. Ensure CMS `menuItems` include valid `clickArea` objects for interactive areas.
5. Validate source/target layer chains using hotspot debug (`Alt+H`).
6. Confirm every destination layer has corresponding media naming (`layerNN` or `pageNN`).

## 7. Troubleshooting

If a layer does not show:

1. Check click area has valid `targetLayer`.
2. Check destination layer image file naming includes `layerNN` or `pageNN`.
3. Toggle hotspot debug and verify `sourceLayer`/`targetLayer` labels.
4. Check browser console for normalization warnings/errors.

If a hotspot appears but does not navigate:

1. Verify `targetLayer` parses to a positive integer.
2. Confirm destination layer media exists in TRM for that layer id.
3. Confirm the hotspot is not marked disabled in debug mode.
