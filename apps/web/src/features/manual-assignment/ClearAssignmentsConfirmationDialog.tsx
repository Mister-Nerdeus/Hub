type ClearAssignmentsConfirmationDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function ClearAssignmentsConfirmationDialog({
  onCancel,
  onConfirm
}: ClearAssignmentsConfirmationDialogProps) {
  return (
    <div className="manual-assignment-clear-confirmation" data-clear-assignments-confirmation="required">
      <span>Clear all room-to-nurse assignments for this draft assignment set.</span>
      <button type="button" onClick={onConfirm}>
        Confirm Clear Assignments
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
