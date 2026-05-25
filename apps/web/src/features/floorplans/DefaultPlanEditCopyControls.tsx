export type DefaultPlanEditCopyControlsProps = {
  planId: string;
  readOnly: boolean;
  onDuplicateForEditing: (planId: string) => void;
};

export function DefaultPlanEditCopyControls({
  planId,
  readOnly,
  onDuplicateForEditing
}: DefaultPlanEditCopyControlsProps) {
  return (
    <section className="default-plan-edit-copy-controls" aria-label="Default plan edit copy controls">
      <button type="button" disabled={!readOnly} onClick={() => onDuplicateForEditing(planId)}>
        Duplicate/Edit Copy
      </button>
    </section>
  );
}
