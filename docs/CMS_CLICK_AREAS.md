# CMS Click Areas

This template uses one `clickArea` object per item.

Hotspots are generated at runtime from `menuItems[].clickArea`.

## Supported Shape

```json
{
  "clickArea": {
    "id": "optional-id",
    "name": "optional label",
    "x": 120,
    "y": 340,
    "width": 420,
    "height": 180,
    "sourceLayer": 1,
    "targetLayer": 10
  }
}
```

## Typical Menu Item Example

```json
{
  "displayName": "Home Promo",
  "clickArea": {
    "id": "home-promo-1",
    "name": "Home to Layer 20",
    "x": 120,
    "y": 340,
    "width": 420,
    "height": 180,
    "sourceLayer": 1,
    "targetLayer": 20
  }
}
```

## Notes

- Coordinates are authored against `1080x1920`.
- `sourceLayer` is the layer where the hotspot appears.
- `targetLayer` is the destination layer.
- `targetLayer` is required for navigation.

## Alias-Friendly Shape

The runtime also accepts these equivalent fields:

```json
{
  "clickArea": {
    "position": { "x": 120, "y": 340 },
    "size": { "width": 420, "height": 180 },
    "source_layer": 1,
    "target": 20
  }
}
```

## Normalization Behavior

The app accepts common alias fields and normalizes them:

- Position aliases: `position.x`, `position.y`
- Size aliases: `size.width`, `size.height`
- Source aliases: `source`, `source_layer`, `layer`, `parentLayer`
- Target aliases: `target`, `target_layer`

If coordinates or size are invalid, the click area is ignored.

If `sourceLayer` is missing or invalid, it defaults to layer `1`.

## Disabled Actions

If `targetLayer` is missing or invalid:

- The hotspot is not actionable.
- No page is created for that destination.

## Layer Discovery

During startup, the app discovers layers from both:

- `clickArea.sourceLayer`
- `clickArea.targetLayer`

For each discovered layer greater than `1`, the app creates `layer_<id>_page` if it does not exist.

## Implementation Assistance

Use this when configuring CMS/TRM teams:

1. Author all hotspot geometry in 1080x1920 coordinates.
2. Keep layer ids numeric and consistent across click areas and TRM layer z-orders.
3. Treat nested navigation as layer chains (`1 -> 20 -> 35 -> 50`).
4. Use debug labels (`Lx -> Ly`) to confirm source/destination mapping.
5. Do not create static destination pages in markup; runtime creates them.
