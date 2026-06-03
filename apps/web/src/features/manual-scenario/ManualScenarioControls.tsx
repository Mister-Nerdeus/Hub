type ManualScenarioControlsProps = {
  renameValue: string;
  canDuplicate: boolean;
  canRename: boolean;
  onCreateScenario: () => void;
  onDuplicateScenario: () => void;
  onRenameValueChange: (value: string) => void;
  onRenameScenario: () => void;
};

export function ManualScenarioControls({
  renameValue,
  canDuplicate,
  canRename,
  onCreateScenario,
  onDuplicateScenario,
  onRenameValueChange,
  onRenameScenario
}: ManualScenarioControlsProps) {
  return (
    <div className="manual-scenario-controls">
      <button type="button" onClick={onCreateScenario}>Create scenario</button>
      <button type="button" onClick={onDuplicateScenario} disabled={!canDuplicate}>Duplicate scenario</button>
      <label>
        <span>Rename scenario</span>
        <input
          type="text"
          value={renameValue}
          onChange={(event) => onRenameValueChange(event.currentTarget.value)}
        />
      </label>
      <button type="button" onClick={onRenameScenario} disabled={!canRename}>Rename scenario</button>
    </div>
  );
}
