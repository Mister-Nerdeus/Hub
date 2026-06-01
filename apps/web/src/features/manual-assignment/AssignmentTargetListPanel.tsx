import type { AssignmentFoundationTargetContract } from "@nerdeus/shared";

type AssignmentTargetListPanelProps = {
  assignmentTargets: readonly AssignmentFoundationTargetContract[];
  selectedAssignmentTargetId: string;
  onSelectAssignmentTarget: (assignmentTargetId: string) => void;
};

export function AssignmentTargetListPanel({
  assignmentTargets,
  selectedAssignmentTargetId,
  onSelectAssignmentTarget
}: AssignmentTargetListPanelProps) {
  return (
    <section className="manual-foundation-panel" aria-labelledby="manual-target-title">
      <h3 id="manual-target-title">Assignment target</h3>
      <div className="manual-foundation-list" role="list">
        {assignmentTargets.map((target) => (
          <button
            aria-pressed={target.assignmentTargetId === selectedAssignmentTargetId}
            className="manual-foundation-list__item"
            data-assignment-target-id={target.assignmentTargetId}
            data-assignment-target-kind={target.targetKind}
            key={target.assignmentTargetId}
            type="button"
            onClick={() => onSelectAssignmentTarget(target.assignmentTargetId)}
          >
            <strong>{target.displayLabel}</strong>
            <span>{target.targetKind === "bed_position" ? "Bed position" : target.targetKind === "room" ? "Room" : target.targetKind}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
