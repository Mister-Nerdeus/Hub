import type { Plan1NurseProfile } from "@nerdeus/shared";

export function NurseProfilePanel({
  nurses,
  onUpdateNurse
}: {
  nurses: Plan1NurseProfile[];
  onUpdateNurse: (nurse: Plan1NurseProfile) => void;
}) {
  return (
    <section className="assignment-panel" aria-labelledby="nurse-profile-panel-title" data-assignment-stage="nurse-profiles">
      <h3 id="nurse-profile-panel-title">Synthetic Nurses</h3>
      <div className="assignment-card-grid">
        {nurses.map((nurse) => (
          <article className="assignment-card" key={nurse.nurseId} data-nurse-id={nurse.nurseId}>
            <span className="assignment-swatch" style={{ backgroundColor: nurse.color }} aria-hidden="true" />
            <h4>{nurse.displayName}</h4>
            <dl>
              <div><dt>Station</dt><dd>{nurse.homeStationId}</dd></div>
            </dl>
            <label>
              Target
              <input
                type="number"
                min="0"
                max={nurse.maxPatientCount}
                value={nurse.targetPatientCount}
                onChange={(event) =>
                  onUpdateNurse({ ...nurse, targetPatientCount: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Max
              <input
                type="number"
                min={nurse.targetPatientCount}
                value={nurse.maxPatientCount}
                onChange={(event) =>
                  onUpdateNurse({ ...nurse, maxPatientCount: Number(event.target.value) })
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={nurse.traumaQualified}
                onChange={(event) => onUpdateNurse({ ...nurse, traumaQualified: event.target.checked })}
              />
              Trauma flag
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
