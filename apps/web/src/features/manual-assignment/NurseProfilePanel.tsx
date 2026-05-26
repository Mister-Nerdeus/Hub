import type { NurseProfileCardViewModel } from "./nurseProfileViewModel";

type NurseProfilePanelProps = {
  nurses: NurseProfileCardViewModel[];
};

export function NurseProfilePanel({ nurses }: NurseProfilePanelProps) {
  return (
    <section className="manual-assignment-proof__panel" aria-labelledby="manual-nurse-profile-title" data-assignment-stage="nurse-profiles">
      <div className="manual-assignment-proof__section-header">
        <h3 id="manual-nurse-profile-title">Synthetic Nurse Profiles</h3>
      </div>
      <div className="manual-assignment-proof__cards">
        {nurses.map((nurse) => (
          <article className="assignment-card" key={nurse.nurseId} data-nurse-id={nurse.nurseId}>
            <div className="assignment-card__header">
              <span className="assignment-card__swatch" style={{ background: nurse.color }} aria-hidden="true" />
              <div>
                <h4>{nurse.displayLabel}</h4>
                <p>
                  {nurse.role} target {nurse.targetPatientCount} max {nurse.maxPatientCount}
                </p>
              </div>
            </div>
            <dl>
              <div>
                <dt>Assigned</dt>
                <dd>{nurse.assignedPatientCount}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{nurse.activeLabel}</dd>
              </div>
              <div>
                <dt>Qualified</dt>
                <dd>{nurse.qualificationLabels.length > 0 ? nurse.qualificationLabels.join(", ") : "Standard"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
