# Authoring Workflow

This template is now fully data-driven:

- Layer `1` is the home layer.
- Non-home layers are created at runtime from data.
- Click hotspots are generated from `menuItems[].clickArea` objects.
- Layer visuals are loaded from TRM asset zones by layer id.

- `layer10-home-promo.png`
- `page20-seasonal.jpg`

The runtime looks for `layer` or `page` followed by digits in the file name and maps to:


TRM zones should set `layerZOrder` to the matching layer id.

For each interactive region, author a `clickArea` with:

- `x`, `y`, `width`, `height`
- `sourceLayer`
- `targetLayer`

See `docs/CMS_CLICK_AREAS.md` for schema.
- `sourceLayer` chooses where hotspot is rendered.
- `targetLayer` controls navigation destination.
- Missing or invalid `targetLayer` creates a non-actionable hotspot.

## 3. Nested Zones and Layer Chains
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

- Destinations navigate correctly

## 5. Runtime Expectations
- Missing `targetLayer` means no action.
- Swipe and home button always return to layer `1`.

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

## 8. Content Forecaster Hotspot Authoring

When this asset runs inside the authenticated QA Content Forecaster iframe, `hotspot_controller.js` enables authoring for the shared text menu item named `Hotspot Data`.

The controller stores one JSON document in the text value of that menu item:

```json
{
	"version": 1,
	"hotspots": [
		{
			"id": "hotspot-example",
			"name": "Seasonal menu",
			"x": 120,
			"y": 340,
			"width": 420,
			"height": 180,
			"sourceLayer": 1,
			"targetLayer": 20
		}
	]
}
```

The parent `Hotspot Data` menu item is created at the current concept when it does not exist. A pricing detail is resolved separately for the selected Concept, Company, Group, or Store level. If that detail does not exist, the first Apply creates it with `id: 0`; later Apply operations update the resolved detail ID.

All detail writes use the authenticated `MenuItemBatchEditRequest` endpoint. The controller reads `MostRecentCCGS` from local storage and does not use hard-coded location IDs. The parent app remains responsible for authentication cookies.

Authoring controls are unavailable in external preview and outside an authenticated QA Content Forecaster iframe. In authoring mode, right-clicking an existing hotspot opens its editor, dragging moves it, the lower-right handle resizes it, and right-clicking open space exposes `Create hotspot` through the existing options menu. Apply persists immediately; Revert restores the last saved in-memory document.
