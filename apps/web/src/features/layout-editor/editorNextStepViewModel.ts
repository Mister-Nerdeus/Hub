import type { LayoutEditorSelectableObjectType } from "./layoutEditorState";
import type { LayoutEditorMode } from "./layoutEditorMode";

export type EditorNextStepViewModelInput = {
  hasActiveFloorplan: boolean;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  editorMode: LayoutEditorMode;
  validationWarningCount: number;
};

export type EditorNextStepViewModel = {
  title: "What do I do next?";
  status: "no-floorplan" | "room" | "door" | "presentation" | "validation" | "idle";
  primaryStep: string;
  secondarySteps: readonly string[];
};

export function buildEditorNextStep({
  hasActiveFloorplan,
  selectedObjectType,
  editorMode,
  validationWarningCount
}: EditorNextStepViewModelInput): EditorNextStepViewModel {
  if (!hasActiveFloorplan) {
    return buildStep("no-floorplan", "Open a floorplan.", ["Use a saved editable copy for layout changes."]);
  }
  if (editorMode === "presentation") {
    return buildStep("presentation", "Export screenshot.", ["Review labels and presentation styling."]);
  }
  if (validationWarningCount > 0) {
    return buildStep("validation", "Open validation drawer.", ["Review grouped warnings before export."]);
  }
  if (selectedObjectType === "room") {
    return buildStep("room", "Edit room / add door / assign nurse.", ["Use the inspector for dimensions and room type."]);
  }
  if (selectedObjectType === "door") {
    return buildStep("door", "Move / nudge / center / delete.", ["Use door tools for wall and offset edits."]);
  }
  return buildStep("idle", "Select a room or door.", ["Use Add Object for new layout elements."]);
}

function buildStep(
  status: EditorNextStepViewModel["status"],
  primaryStep: string,
  secondarySteps: readonly string[]
): EditorNextStepViewModel {
  return {
    title: "What do I do next?",
    status,
    primaryStep,
    secondarySteps
  };
}
