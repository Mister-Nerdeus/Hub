import type { LayoutEditorAction } from "./layoutEditorReducer";
import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";
import type { LayoutSelectionObjectType } from "./layoutSelectionModel";

export type LayoutStageObjectSelection = {
  objectType: LayoutSelectionObjectType;
  objectId: string;
};

export function buildSelectObjectActionFromRenderItem(
  item: Pick<LayoutObjectRenderItem, "objectType" | "objectId">
): Extract<LayoutEditorAction, { type: "selectObject" }> {
  return {
    type: "selectObject",
    objectType: item.objectType,
    objectId: item.objectId
  };
}

export function selectionFromShapeClick(
  objectType: LayoutSelectionObjectType,
  objectId: string
): LayoutStageObjectSelection {
  if (objectId.length === 0) {
    throw new Error("objectId must be a non-empty string");
  }
  return { objectType, objectId };
}
