type ManualScenarioControlsProps = {
  renameValue: string;
  canCreate: boolean;
  canDuplicate: boolean;
  canRename: boolean;
  onCreateScenario: () => void;
  onDuplicateScenario: () => void;
  onSaveScenarios: () => void;
  onRenameValueChange: (value: string) => void;
  onRenameScenario: () => void;
};

export function ManualScenarioControls({
  renameValue,
  canCreate,
  canDuplicate,
  canRename,
  onCreateScenario,
  onDuplicateScenario,
  onSaveScenarios,
  onRenameValueChange,
  onRenameScenario
}: ManualScenarioControlsProps) {
  return (
    <div className="manual-scenario-controls">
      <button type="button" onClick={onCreateScenario} disabled={!canCreate}>Create scenario</button>
      <button type="button" onClick={onDuplicateScenario} disabled={!canDuplicate}>Duplicate scenario</button>
      <button type="button" onClick={onSaveScenarios}>Save scenarios</button>
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
