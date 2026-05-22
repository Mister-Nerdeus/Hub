import "./ManualAssignmentProof.css";

import type { ManualAssignmentViewModel } from "./manualAssignmentViewModel";

type ManualAssignmentProofProps = {
  viewModel: ManualAssignmentViewModel;
};

export function ManualAssignmentProof({ viewModel }: ManualAssignmentProofProps) {
  return (
    <section className="manual-assignment-proof" aria-labelledby="manual-assignment-title">
      <div className="manual-assignment-proof__header">
        <div>
          <p className="eyebrow">Phase 3 local proof</p>
          <h2 id="manual-assignment-title">{viewModel.assignmentSetName}</h2>
        </div>
        <dl className="manual-assignment-proof__summary">
          <div>
            <dt>Occupied</dt>
            <dd>{viewModel.occupiedRoomCount}</dd>
          </div>
          <div>
            <dt>Assigned</dt>
            <dd>{viewModel.assignedOccupiedRoomCount}</dd>
          </div>
          <div>
            <dt>Warnings</dt>
            <dd>{viewModel.warnings.length}</dd>
          </div>
        </dl>
      </div>

      <div className="manual-assignment-proof__grid">
        <section className="manual-assignment-proof__panel" aria-labelledby="assignment-cards-title">
          <h3 id="assignment-cards-title">Assignments</h3>
          <div className="manual-assignment-proof__cards">
            {viewModel.nurseCards.map((nurse) => (
              <article className="assignment-card" key={nurse.nurseId}>
                <div className="assignment-card__header">
                  <span className="assignment-card__swatch" style={{ background: nurse.color }} />
                  <div>
                    <h4>{nurse.name}</h4>
                    <p>
                      {nurse.role} target {nurse.targetPatients} max {nurse.maxPatients}
                    </p>
                  </div>
                </div>
                <ul>
                  {nurse.assignedRooms.map((room) => (
                    <li key={room.roomId}>
                      <span>{room.label}</span>
                      <strong>{room.occupied ? room.burden : 0}</strong>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="manual-assignment-proof__panel" aria-labelledby="warnings-title">
          <h3 id="warnings-title">Warnings</h3>
          <ul className="warning-list">
            {viewModel.warnings.map((warning) => (
              <li className={`warning-list__item warning-list__item--${warning.severity}`} key={warning.id}>
                <span>{warning.code}</span>
                <p>{warning.displayMessage}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="manual-assignment-proof__panel" aria-labelledby="burden-title">
        <div className="manual-assignment-proof__section-header">
          <h3 id="burden-title">Nurse Burden</h3>
          {viewModel.sameCountDifferentBurdenProof.visible ? (
            <p>
              {viewModel.sameCountDifferentBurdenProof.nurseNames.join(" and ")} each carry{" "}
              {viewModel.sameCountDifferentBurdenProof.occupiedRoomCount} occupied rooms with
              burdens {viewModel.sameCountDifferentBurdenProof.burdens.join(" and ")}.
            </p>
          ) : null}
        </div>
        <div className="burden-table" role="table" aria-label="Per nurse burden">
          <div className="burden-table__row burden-table__row--head" role="row">
            <span role="columnheader">Nurse</span>
            <span role="columnheader">Rooms</span>
            <span role="columnheader">Acuity</span>
            <span role="columnheader">Special</span>
            <span role="columnheader">Ratio</span>
            <span role="columnheader">Total</span>
          </div>
          {viewModel.burdenRows.map((row) => (
            <div className="burden-table__row" role="row" key={row.nurseId}>
              <span role="cell">{row.nurseName}</span>
              <span role="cell">{row.occupiedRoomCount}</span>
              <span role="cell">{row.totalAcuityBurden}</span>
              <span role="cell">{row.totalSpecialBurden}</span>
              <span role="cell">{row.overRatioPenalty + row.traumaMismatchPenalty}</span>
              <strong role="cell">{row.totalBurden}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="manual-assignment-proof__panel" aria-labelledby="unassigned-title">
        <h3 id="unassigned-title">Unassigned Occupied Rooms</h3>
        <ul className="unassigned-list">
          {viewModel.unassignedOccupiedRooms.map((room) => (
            <li key={room.roomId}>
              <span>{room.label}</span>
              <strong>{room.burden}</strong>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
