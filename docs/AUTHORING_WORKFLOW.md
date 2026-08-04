# Authoring Workflow

## 1. Define Layer Art in CMS/TRM

Name assets so layer images can be resolved by layer id (example patterns):

- `layer10-home-promo.png`
- `page20-seasonal.jpg`

The runtime looks for `layer` or `page` followed by digits in the file name.

## 2. Define Click Areas

For each interactive region, author a `clickArea` with:

- `x`, `y`, `width`, `height`
- `sourceLayer`
- `targetLayer`

See `docs/CMS_CLICK_AREAS.md` for schema.

## 3. Validate in Dev

Use hotspot debug overlay:

- Right-click -> `Toggle Hotspot Debug`
- or press `Alt+H`

Confirm:

- Hotspot bounds align with art
- Labels show correct layer transitions (`Lx -> Ly`)
- Destinations navigate correctly

## 4. Runtime Expectations

- Home is layer `1`.
- All non-home pages are generated from data.
- Missing `targetLayer` means no action.
- Swipe and home button always return to layer `1`.

## 5. Troubleshooting

If a layer does not show:

1. Check click area has valid `targetLayer`.
2. Check destination layer image file naming includes `layerNN` or `pageNN`.
3. Toggle hotspot debug and verify `sourceLayer`/`targetLayer` labels.
4. Check browser console for normalization warnings/errors.
