export const LAYOUT_EDITOR_RENDER_LAYER_ORDER = [
  "grid",
  "reference_overlay",
  "outer_walls_locked_boundaries",
  "hallways",
  "support_areas",
  "rooms_split_rooms",
  "bed_positions",
  "doors_access_points",
  "stations",
  "labels",
  "selection_handles",
  "popovers"
] as const;

export type LayoutEditorRenderLayerId = (typeof LAYOUT_EDITOR_RENDER_LAYER_ORDER)[number];

export function renderLayerOrderIndex(layer: LayoutEditorRenderLayerId): number {
  return LAYOUT_EDITOR_RENDER_LAYER_ORDER.indexOf(layer);
}
