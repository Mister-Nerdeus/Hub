import type { Plan1NurseAssignmentSummary } from "@nerdeus/shared";
import { AssignmentWalkingPreview } from "./AssignmentWalkingPreview";

export function NurseAssignmentCards({ summaries }: { summaries: Plan1NurseAssignmentSummary[] }) {
  return (
    <section className="assignment-panel" aria-labelledby="nurse-assignment-cards-title" data-assignment-stage="nurse-cards">
      <h3 id="nurse-assignment-cards-title">Nurse Assignment Cards</h3>
      <div className="assignment-card-grid">
        {summaries.map((summary) => (
          <article className="assignment-card" key={summary.nurseId} data-nurse-id={summary.nurseId}>
            <span className="assignment-swatch" style={{ backgroundColor: summary.color }} aria-hidden="true" />
            <h4>{summary.displayName}</h4>
            <p>{summary.assignedRoomLabels.join(", ") || "No assigned rooms"}</p>
            <dl>
              <div><dt>Occupied</dt><dd>{summary.occupiedRoomCount}</dd></div>
              <div><dt>Target/Max</dt><dd>{summary.targetPatientCount}/{summary.maxPatientCount}</dd></div>
              <div><dt>Warnings</dt><dd>{summary.warningCodes.join(", ") || "none"}</dd></div>
            </dl>
            {summary.walkingPreview == null ? <p>{summary.walkingPreviewPlaceholder}</p> : <AssignmentWalkingPreview preview={summary.walkingPreview} />}
          </article>
        ))}
      </div>
    </section>
  );
}
