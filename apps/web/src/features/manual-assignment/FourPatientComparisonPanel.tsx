import { createFourPatientComparisonViewModel } from "./fourPatientComparisonViewModel";

export function FourPatientComparisonPanel() {
  const viewModel = createFourPatientComparisonViewModel();
  return (
    <section className="four-patient-comparison" aria-labelledby="four-patient-comparison-title">
      <h3 id="four-patient-comparison-title">Four Rooms Comparison</h3>
      <div className="four-patient-comparison__grid">
        {viewModel.rows.map((row) => (
          <article className="four-patient-comparison__card" key={row.nurseId}>
            <h4>{row.label}</h4>
            <dl>
              <div>
                <dt>Rooms</dt>
                <dd>{row.assignedRoomCount}</dd>
              </div>
              <div>
                <dt>Acuity</dt>
                <dd>{row.acuityBurden}</dd>
              </div>
              <div>
                <dt>Special</dt>
                <dd>{row.specialBurden}</dd>
              </div>
              <div>
                <dt>Walk</dt>
                <dd>{row.walkingBurden}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{row.totalBurden}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <p className="four-patient-comparison__warnings">Warnings: {viewModel.warningCodes.join(", ")}</p>
    </section>
  );
}
