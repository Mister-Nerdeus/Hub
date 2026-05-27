import type { ManualAssignmentNurseCard } from "./manualAssignmentWorkspaceViewModel";

type NurseAssignmentCardsProps = {
  cards: ManualAssignmentNurseCard[];
};

export function NurseAssignmentCards({ cards }: NurseAssignmentCardsProps) {
  return (
    <div className="manual-nurse-card-grid" aria-label="Nurse assignment cards">
      {cards.map((card) => (
        <article className="manual-nurse-card" key={card.nurseId} style={{ borderColor: card.color }}>
          <div className="manual-nurse-card__header">
            <span className="manual-nurse-card__swatch" style={{ background: card.color }} />
            <div>
              <h3>{card.displayLabel}</h3>
              <p>
                {card.assignedRoomCount} assigned / target {card.targetPatientCount} / max {card.maxPatientCount}
              </p>
              <p>{card.walkingSummary}</p>
            </div>
          </div>
          <ul>
            {card.assignedRoomLabels.length > 0 ? (
              card.assignedRoomLabels.map((roomLabel) => <li key={roomLabel}>{roomLabel}</li>)
            ) : (
              <li>None assigned</li>
            )}
          </ul>
        </article>
      ))}
    </div>
  );
}
