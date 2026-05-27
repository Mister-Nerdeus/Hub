export type PrimaryWorkflowAction = {
  actionId: "review-floorplan" | "edit-working-copy" | "manual-assignment" | "scenario-comparison";
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
};

type PrimaryWorkflowActionsProps = {
  actions: readonly PrimaryWorkflowAction[];
};

export function PrimaryWorkflowActions({ actions }: PrimaryWorkflowActionsProps) {
  return (
    <div className="primary-workflow-actions" data-primary-workflow-actions="canonical-plan-1">
      {actions.map((action) => (
        <button
          key={action.actionId}
          type="button"
          disabled={action.disabled}
          onClick={action.onSelect}
          data-workflow-action-id={action.actionId}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
