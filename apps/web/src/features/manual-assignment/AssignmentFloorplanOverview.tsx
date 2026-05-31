import type { ReactNode } from "react";
import type { AssignmentSetContract } from "@nerdeus/shared";
import { AssignmentColorLegend } from "./AssignmentColorLegend";
import type { ManualAssignmentColorLegendItem, ManualAssignmentNurseOption } from "./manualAssignmentWorkspaceViewModel";

type AssignmentFloorplanOverviewProps = {
  activeLayoutId: string | null;
  activeFloorplanVersionId: string | null;
  assignmentSet: AssignmentSetContract | null;
  assignedRoomCount: number;
  unassignedOccupiedRoomCount: number;
  roomCount: number;
  splitParentIds: string[];
  colorLegend: ManualAssignmentColorLegendItem[];
  nurseOptions: ManualAssignmentNurseOption[];
  onSelectNurse: (nurseId: string) => void;
  clearAssignmentsControl: ReactNode;
};

export function AssignmentFloorplanOverview({
  activeLayoutId,
  activeFloorplanVersionId,
  assignmentSet,
  assignedRoomCount,
  unassignedOccupiedRoomCount,
  roomCount,
  splitParentIds,
  colorLegend,
  nurseOptions,
  onSelectNurse,
  clearAssignmentsControl
}: AssignmentFloorplanOverviewProps) {
  return (
    <section
      className="manual-assignment-workspace__panel assignment-floorplan-overview"
      aria-labelledby="assignment-floorplan-overview-title"
      data-assignment-floorplan-overview="active-floorplan"
      data-assignment-set-id={assignmentSet?.assignmentSetId ?? ""}
      data-floorplan-version-id={activeFloorplanVersionId ?? ""}
    >
      <div className="manual-assignment-workspace__panel-header">
        <div>
          <p className="eyebrow">Floorplan overview</p>
          <h3 id="assignment-floorplan-overview-title">Active floorplan</h3>
        </div>
        {clearAssignmentsControl}
      </div>
      <dl className="assignment-floorplan-overview__stats">
        <div>
          <dt>Assignment set</dt>
          <dd>{assignmentSet?.displayName ?? "Active assignment set"}</dd>
        </div>
        <div>
          <dt>Layout</dt>
          <dd>{activeLayoutId ?? "No active layout"}</dd>
        </div>
        <div>
          <dt>Rooms</dt>
          <dd>{roomCount}</dd>
        </div>
        <div>
          <dt>Assigned</dt>
          <dd>{assignedRoomCount}</dd>
        </div>
        <div>
          <dt>Unassigned occupied</dt>
          <dd>{unassignedOccupiedRoomCount}</dd>
        </div>
        <div>
          <dt>Split rooms</dt>
          <dd>{splitParentIds.length}</dd>
        </div>
      </dl>
      <AssignmentColorLegend items={colorLegend} />
      <div className="manual-nurse-selector" role="group" aria-label="Active nurse">
        {nurseOptions.map((nurse) => (
          <button
            className={nurse.selected ? "manual-nurse-selector__button manual-nurse-selector__button--selected" : "manual-nurse-selector__button"}
            disabled={!nurse.active}
            key={nurse.nurseId}
            type="button"
            data-manual-nurse-id={nurse.nurseId}
            onClick={() => onSelectNurse(nurse.nurseId)}
            style={{ borderColor: nurse.color }}
          >
            <span style={{ background: nurse.color }} />
            {nurse.displayLabel}
          </button>
        ))}
      </div>
    </section>
  );
}
