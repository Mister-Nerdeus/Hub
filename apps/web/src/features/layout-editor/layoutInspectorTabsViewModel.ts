import type { LayoutEditorSelectableObjectType } from "./layoutEditorState";

export type LayoutInspectorTabId = "room" | "door" | "assignment" | "validation";

export type LayoutInspectorTab = {
  id: LayoutInspectorTabId;
  label: string;
};

export const LAYOUT_INSPECTOR_TABS: LayoutInspectorTab[] = [
  { id: "room", label: "Room" },
  { id: "door", label: "Door" },
  { id: "assignment", label: "Assignment" },
  { id: "validation", label: "Validation" }
];

export function defaultInspectorTabForSelection(
  selectedObjectType: LayoutEditorSelectableObjectType | null
): LayoutInspectorTabId {
  if (selectedObjectType === "door") return "door";
  if (selectedObjectType === "entry_exit") return "door";
  if (selectedObjectType === "perimeter_wall") return "room";
  if (selectedObjectType === "split_bay") return "room";
  if (selectedObjectType === "split_room_parent") return "room";
  if (selectedObjectType === "bed_position") return "room";
  if (selectedObjectType === "outer_wall") return "room";
  if (selectedObjectType === "station") return "room";
  if (selectedObjectType === "room") return "room";
  return "validation";
}
