export type EditorPopupMode = "auto" | "canvas" | "docked";

export type EditorPopupModeControlProps = {
  mode: EditorPopupMode;
  onModeChange: (mode: EditorPopupMode) => void;
};

const OPTIONS: readonly { mode: EditorPopupMode; label: string }[] = [
  { mode: "auto", label: "Auto" },
  { mode: "canvas", label: "On canvas" },
  { mode: "docked", label: "Docked" }
];

export function EditorPopupModeControl({ mode, onModeChange }: EditorPopupModeControlProps) {
  return (
    <fieldset className="editor-popup-mode-control" data-popup-mode-control="true">
      <legend>Popup mode</legend>
      <div>
        {OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            aria-pressed={mode === option.mode}
            onClick={() => onModeChange(option.mode)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
