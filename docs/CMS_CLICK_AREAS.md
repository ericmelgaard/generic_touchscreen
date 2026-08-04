# CMS Click Areas

This template uses one `clickArea` object per item.

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

## Notes

- Coordinates are authored against `1080x1920`.
- `sourceLayer` is the layer where the hotspot appears.
- `targetLayer` is the destination layer.
- `targetLayer` is required for navigation.

## Normalization Behavior

The app accepts common alias fields and normalizes them:

- Position aliases: `position.x`, `position.y`
- Size aliases: `size.width`, `size.height`
- Source aliases: `source`, `source_layer`, `layer`, `parentLayer`
- Target aliases: `target`, `target_layer`

If coordinates or size are invalid, the click area is ignored.

## Disabled Actions

If `targetLayer` is missing or invalid:

- The hotspot is not actionable.
- No page is created for that destination.

## Layer Discovery

During startup, the app discovers layers from both:

- `clickArea.sourceLayer`
- `clickArea.targetLayer`

For each discovered layer greater than `1`, the app creates `layer_<id>_page` if it does not exist.
