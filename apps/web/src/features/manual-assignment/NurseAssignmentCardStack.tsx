import type { ManualBurdenRow, ManualWarningRow } from "./manualBurdenViewModel";
import type { ManualAssignmentNurseCard } from "./manualAssignmentWorkspaceViewModel";

type NurseAssignmentCardStackProps = {
  cards: ManualAssignmentNurseCard[];
  burdenRows: ManualBurdenRow[];
  warnings: ManualWarningRow[];
};

export function NurseAssignmentCardStack({
  cards,
  burdenRows,
  warnings
}: NurseAssignmentCardStackProps) {
  const burdenByNurse = new Map(burdenRows.map((row) => [row.nurseId, row]));
  return (
    <section
      className="manual-assignment-workspace__panel nurse-assignment-card-stack"
      aria-labelledby="nurse-assignment-card-stack-title"
      data-nurse-assignment-card-stack="manual"
    >
      <div className="manual-assignment-workspace__panel-header">
        <div>
          <p className="eyebrow">Nurse assignment cards</p>
          <h3 id="nurse-assignment-card-stack-title">Nurses</h3>
        </div>
      </div>
      <div className="manual-nurse-card-grid" aria-label="Nurse assignment cards">
        {cards.map((card) => {
          const burden = burdenByNurse.get(card.nurseId);
          const relatedWarnings = warnings.filter((warning) =>
            warning.nurseIds.includes(card.nurseId) ||
            warning.roomIds.some((roomId) => card.assignedRoomIds.includes(roomId))
          );
          return (
            <article
              className="manual-nurse-card"
              key={card.nurseId}
              data-manual-nurse-card-id={card.nurseId}
              data-assigned-room-ids={card.assignedRoomIds.join(",")}
              data-assigned-room-labels={card.assignedRoomLabels.join(",")}
              data-burden-score={burden?.totalBurden ?? 0}
              data-walking-burden={card.walkingBurdenUnits}
              style={{ borderColor: card.color }}
            >
              <div className="manual-nurse-card__header">
                <span className="manual-nurse-card__swatch" style={{ background: card.color }} />
                <div>
                  <h3>{card.displayLabel}</h3>
                  <p>
                    {card.assignedRoomCount} assigned / {burden?.occupiedRoomCount ?? 0} occupied / max {card.maxPatientCount}
                  </p>
                  <p>{card.walkingSummary}</p>
                </div>
              </div>
              <dl className="manual-nurse-card__stats">
                <div>
                  <dt>Burden score</dt>
                  <dd>{burden?.totalBurden ?? 0}</dd>
                </div>
                <div>
                  <dt>Walking burden</dt>
                  <dd>{card.walkingBurdenUnits}</dd>
                </div>
                <div>
                  <dt>Qualification status</dt>
                  <dd>{qualificationSummary(card)}</dd>
                </div>
              </dl>
              <ul>
                {card.assignedRoomLabels.length > 0 ? (
                  card.assignedRoomLabels.map((roomLabel) => <li key={roomLabel}>{roomLabel}</li>)
                ) : (
                  <li>None assigned</li>
                )}
              </ul>
              <details className="manual-nurse-card__breakdown" open={relatedWarnings.length > 0}>
                <summary>Why is this high?</summary>
                <p>{burden?.explanation ?? "No elevated burden components."}</p>
                <ul>
                  {relatedWarnings.length > 0 ? (
                    relatedWarnings.map((warning) => <li key={warning.id}>{warning.displayText}</li>)
                  ) : (
                    <li>No active warnings for this nurse.</li>
                  )}
                </ul>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function qualificationSummary(card: ManualAssignmentNurseCard): string {
  return [
    card.traumaQualified ? "trauma" : null,
    card.psychQualified ? "psych" : null,
    card.chargeQualified ? "charge" : null,
    card.active ? null : "inactive"
  ].filter((item): item is string => item != null).join(", ") || "standard";
}
