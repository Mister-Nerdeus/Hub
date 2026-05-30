import type { ManualBurdenRow } from "./manualBurdenViewModel";

type NurseBurdenTableProps = {
  rows: ManualBurdenRow[];
};

export function NurseBurdenTable({ rows }: NurseBurdenTableProps) {
  return (
    <div className="manual-burden-table" role="table" aria-label="Manual burden score components">
      <div className="manual-burden-table__row manual-burden-table__row--head" role="row">
        <span role="columnheader">Nurse</span>
        <span role="columnheader">Assigned</span>
        <span role="columnheader">Acuity</span>
        <span role="columnheader">Trauma</span>
        <span role="columnheader">Special</span>
        <span role="columnheader">Walk</span>
        <span role="columnheader">Spread</span>
        <span role="columnheader">Ratio</span>
        <span role="columnheader">Total</span>
      </div>
      {rows.map((row) => (
        <div
          className="manual-burden-table__row"
          role="row"
          key={row.nurseId}
          data-burden-nurse-id={row.nurseId}
          data-burden-room-ids={row.assignedRoomIds.join(",")}
        >
          <span role="cell">{row.displayLabel}</span>
          <span role="cell">{row.assignedRoomCount}</span>
          <span role="cell">{row.acuityBurden}</span>
          <span role="cell">{row.traumaBurden}</span>
          <span role="cell">{row.specialBurden}</span>
          <span role="cell">{row.walkingBurden}</span>
          <span role="cell">{row.roomSpreadPenalty}</span>
          <span role="cell">{row.overRatioPenalty}</span>
          <strong role="cell">{row.totalBurden}</strong>
          <small role="cell">{row.explanation}</small>
        </div>
      ))}
    </div>
  );
}
