export const LAYOUT_EDITOR_MODES = ["edit", "assignment", "presentation"] as const;

export type LayoutEditorMode = (typeof LAYOUT_EDITOR_MODES)[number];

export const DEFAULT_LAYOUT_EDITOR_MODE: LayoutEditorMode = "edit";

export function isLayoutEditorMode(value: string): value is LayoutEditorMode {
  return LAYOUT_EDITOR_MODES.some((mode) => mode === value);
}

export function layoutEditorModeLabel(mode: LayoutEditorMode): string {
  switch (mode) {
    case "edit":
      return "Edit Geometry";
    case "assignment":
      return "Assignment View";
    case "presentation":
      return "Presentation View";
  }
}
