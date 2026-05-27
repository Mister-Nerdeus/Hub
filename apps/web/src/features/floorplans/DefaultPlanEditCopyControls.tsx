export type DefaultPlanEditCopyControlsProps = {
  planId: string;
  readOnly: boolean;
  protectedActionUnlocked?: boolean;
  onDuplicateForEditing: (planId: string) => void;
};

export function DefaultPlanEditCopyControls({
  planId,
  readOnly,
  protectedActionUnlocked = true,
  onDuplicateForEditing
}: DefaultPlanEditCopyControlsProps) {
  return (
    <section className="default-plan-edit-copy-controls" aria-label="Default plan edit copy controls">
      <button type="button" disabled={!readOnly || !protectedActionUnlocked} onClick={() => onDuplicateForEditing(planId)}>
        Edit Working Copy
      </button>
    </section>
  );
}
