type ManualAssignmentControlsProps = {
  canAddAssignment: boolean;
  onAddAssignment: () => void;
  onSaveAssignmentSet: () => void;
};

export function ManualAssignmentControls({
  canAddAssignment,
  onAddAssignment,
  onSaveAssignmentSet
}: ManualAssignmentControlsProps) {
  return (
    <div className="manual-foundation-controls">
      <button type="button" disabled={!canAddAssignment} onClick={onAddAssignment}>
        Add assignment
      </button>
      <button type="button" onClick={onSaveAssignmentSet}>
        Save assignment set
      </button>
    </div>
  );
}
