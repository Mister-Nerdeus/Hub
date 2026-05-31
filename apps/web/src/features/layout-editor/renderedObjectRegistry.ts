import type { GeometryLayer, RenderedObjectContract } from "@nerdeus/shared";

export type RenderedObjectNormalCategory =
  | "editable_selectable_geometry"
  | "selectable_locked_geometry"
  | "reference_background_overlay"
  | "measurement_grid_label_overlay";

export type RenderedObjectRegistryEntry = RenderedObjectContract & {
  selector: string;
  visibleInNormalEditorMode: boolean;
  normalEditorCategory: RenderedObjectNormalCategory;
};

const EDITABLE_LAYER: GeometryLayer = "editable_geometry";
const REFERENCE_LAYER: GeometryLayer = "reference_overlay";
const MEASUREMENT_LAYER: GeometryLayer = "measurement_overlay";
const LABEL_LAYER: GeometryLayer = "label_overlay";
const SELECTION_HANDLE_LAYER: GeometryLayer = "selection_handles";
const POPOVER_LAYER: GeometryLayer = "popover_overlay";

export const RENDERED_OBJECT_REGISTRY: readonly RenderedObjectRegistryEntry[] = [
  measurementOverlay("viewport-frame", ".layout-editor-stage__viewport-frame"),
  lockedGeometry("outer-wall-boundary", ".layout-editor-stage__wall"),
  measurementOverlay("grid", ".layout-editor-stage__grid", "grid"),
  labelOverlay("grid-labels", ".layout-editor-stage__labels"),
  referenceOverlay("floorplan-reference-overlay", ".layout-editor-stage__reference-overlay"),
  editableGeometry("hallway", ".layout-editor-stage__hallway"),
  editableGeometry("support-area", ".layout-editor-stage__support-area"),
  editableGeometry("split-room-parent", ".layout-editor-stage__split-bay"),
  editableGeometry("room", ".layout-editor-stage__room"),
  editableGeometry("door", ".layout-editor-stage__door"),
  editableGeometry("support-access", ".layout-editor-stage__support-access"),
  editableGeometry("nurse-station", ".layout-editor-stage__station"),
  selectionOverlay("selection-handles", ".layout-editor-stage__resize-handles"),
  measurementOverlay("door-wall-guide", "[data-door-wall-guide]"),
  measurementOverlay("object-placement-preview", ".object-placement-preview"),
  popoverOverlay("canvas-object-popover", ".canvas-object-popover-shell")
];

export const ALLOWED_NORMAL_EDITOR_RENDERED_OBJECT_CATEGORIES: readonly RenderedObjectNormalCategory[] = [
  "editable_selectable_geometry",
  "selectable_locked_geometry",
  "reference_background_overlay",
  "measurement_grid_label_overlay"
];

export function renderedObjectRegistryEntriesForNormalEditor(): readonly RenderedObjectRegistryEntry[] {
  return RENDERED_OBJECT_REGISTRY.filter((entry) => entry.visibleInNormalEditorMode);
}

export function unclassifiedNormalEditorRenderedObjects(
  registry: readonly RenderedObjectRegistryEntry[] = RENDERED_OBJECT_REGISTRY
): readonly RenderedObjectRegistryEntry[] {
  return registry.filter(
    (entry) =>
      entry.visibleInNormalEditorMode &&
      !ALLOWED_NORMAL_EDITOR_RENDERED_OBJECT_CATEGORIES.includes(entry.normalEditorCategory)
  );
}

function editableGeometry(renderId: string, selector: string): RenderedObjectRegistryEntry {
  return {
    renderId,
    selector,
    visibleInNormalEditorMode: true,
    normalEditorCategory: "editable_selectable_geometry",
    layer: EDITABLE_LAYER,
    sourceKind: "editable",
    sourceObjectId: renderId,
    selectable: true,
    editable: true,
    removable: true
  };
}

function referenceOverlay(renderId: string, selector: string): RenderedObjectRegistryEntry {
  return {
    renderId,
    selector,
    visibleInNormalEditorMode: true,
    normalEditorCategory: "reference_background_overlay",
    layer: REFERENCE_LAYER,
    sourceKind: "reference",
    sourceObjectId: renderId,
    selectable: true,
    editable: false,
    removable: false,
    reasonLocked: "Reference overlay is locked background evidence."
  };
}

function lockedGeometry(renderId: string, selector: string): RenderedObjectRegistryEntry {
  return {
    renderId,
    selector,
    visibleInNormalEditorMode: true,
    normalEditorCategory: "selectable_locked_geometry",
    layer: "locked_geometry",
    sourceKind: "locked",
    sourceObjectId: renderId,
    selectable: true,
    editable: false,
    removable: false,
    reasonLocked: "Locked geometry can be selected for inspection but not edited in normal mode."
  };
}

function measurementOverlay(
  renderId: string,
  selector: string,
  layer: GeometryLayer = MEASUREMENT_LAYER
): RenderedObjectRegistryEntry {
  return {
    renderId,
    selector,
    visibleInNormalEditorMode: true,
    normalEditorCategory: "measurement_grid_label_overlay",
    layer,
    sourceKind: "measurement",
    selectable: false,
    editable: false,
    removable: false,
    reasonLocked: "Measurement overlays annotate the editor and are not saved geometry."
  };
}

function labelOverlay(renderId: string, selector: string): RenderedObjectRegistryEntry {
  return {
    renderId,
    selector,
    visibleInNormalEditorMode: true,
    normalEditorCategory: "measurement_grid_label_overlay",
    layer: LABEL_LAYER,
    sourceKind: "label",
    selectable: false,
    editable: false,
    removable: false,
    reasonLocked: "Labels describe visible geometry and route selection through the labeled object."
  };
}

function selectionOverlay(renderId: string, selector: string): RenderedObjectRegistryEntry {
  return measurementOverlay(renderId, selector, SELECTION_HANDLE_LAYER);
}

function popoverOverlay(renderId: string, selector: string): RenderedObjectRegistryEntry {
  return measurementOverlay(renderId, selector, POPOVER_LAYER);
}
