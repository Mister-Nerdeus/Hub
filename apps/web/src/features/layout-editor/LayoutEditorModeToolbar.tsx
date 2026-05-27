import {
  LAYOUT_EDITOR_MODES,
  layoutEditorModeLabel,
  type LayoutEditorMode
} from "./layoutEditorMode";

type LayoutEditorModeToolbarProps = {
  mode: LayoutEditorMode;
  onModeChange: (mode: LayoutEditorMode) => void;
};

export function LayoutEditorModeToolbar({ mode, onModeChange }: LayoutEditorModeToolbarProps) {
  return (
    <div className="layout-editor-mode-toolbar" aria-label="Editor mode">
      {LAYOUT_EDITOR_MODES.map((candidate) => (
        <button
          key={candidate}
          type="button"
          className={candidate === mode ? "layout-editor-mode-toolbar__button--active" : ""}
          aria-pressed={candidate === mode}
          onClick={() => onModeChange(candidate)}
        >
          {layoutEditorModeLabel(candidate)}
        </button>
      ))}
    </div>
  );
}
