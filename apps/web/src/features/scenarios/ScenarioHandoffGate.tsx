import {
  buildManualAssignmentWarnings,
  type ActiveFloorplanContract,
  type AssignmentSetContract,
  type ManualAssignmentNurse,
  type ManualAssignmentRoomLoad,
  type ManualRoomAssignment,
  type NurseProfileContract,
  type RoomLoadContract
} from "@nerdeus/shared";

type ScenarioHandoffGateProps = {
  activeFloorplan: ActiveFloorplanContract | null;
  selectedAssignmentSet: AssignmentSetContract | null;
};

export function ScenarioHandoffGate({
  activeFloorplan,
  selectedAssignmentSet
}: ScenarioHandoffGateProps) {
  const assignmentReview = selectedAssignmentSet == null
    ? null
    : createSelectedAssignmentSetReview(selectedAssignmentSet);

  return (
    <section
      className="scenario-ratio-comparison__handoff"
      aria-labelledby="scenario-assignment-handoff-title"
      data-scenario-handoff-gate="foundation-only"
      data-selected-floorplan-version-id={activeFloorplan?.activeFloorplanVersionId ?? ""}
      data-selected-assignment-set-id={selectedAssignmentSet?.assignmentSetId ?? ""}
      data-missing-assignment-block={selectedAssignmentSet == null ? "true" : "false"}
      data-no-simulation-charts="true"
      data-no-optimizer-language="true"
    >
      <h4 id="scenario-assignment-handoff-title">Scenario handoff gate</h4>
      <dl>
        <div>
          <dt>Selected floorplan</dt>
          <dd>{activeFloorplan?.displayName ?? "No active floorplan selected"}</dd>
        </div>
        <div>
          <dt>Selected assignment set</dt>
          <dd>{selectedAssignmentSet?.displayName ?? "Required before scenario setup"}</dd>
        </div>
        <div>
          <dt>Warnings</dt>
          <dd>{assignmentReview?.warningCount ?? 0}</dd>
        </div>
      </dl>
      {selectedAssignmentSet == null || assignmentReview == null ? (
        <p role="status">Scenario setup is blocked until a durable assignment set is selected.</p>
      ) : (
        <>
          <dl>
            <div>
              <dt>Floorplan version</dt>
              <dd>{selectedAssignmentSet.floorplanVersionId}</dd>
            </div>
            <div>
              <dt>Assignments</dt>
              <dd>{assignmentReview.assignedRoomCount}</dd>
            </div>
            <div>
              <dt>Structured room loads</dt>
              <dd>{assignmentReview.roomLoadCount}</dd>
            </div>
            <div>
              <dt>Review status</dt>
              <dd>{assignmentReview.reviewStatus === "review_required" ? "Warnings need review before scenario setup" : "Ready for scenario setup review"}</dd>
            </div>
          </dl>
          <p>Scenario setup remains foundation-only until scoring assumptions are ready.</p>
        </>
      )}
    </section>
  );
}

function createSelectedAssignmentSetReview(assignmentSet: AssignmentSetContract) {
  const warnings = buildManualAssignmentWarnings({
    nurses: assignmentSet.nurseProfiles.map(nurseProfileToManualAssignmentNurse),
    roomLoads: Object.values(assignmentSet.roomLoadsByRoomId).map(roomLoadToManualAssignmentRoomLoad),
    assignments: Object.entries(assignmentSet.assignmentsByRoomId).map(([roomId, nurseId]) =>
      assignmentToManualRoomAssignment(roomId, nurseId)
    )
  });
  return {
    assignedRoomCount: Object.keys(assignmentSet.assignmentsByRoomId).length,
    roomLoadCount: Object.keys(assignmentSet.roomLoadsByRoomId).length,
    warningCount: warnings.length,
    reviewStatus: warnings.length > 0 ? "review_required" : "ready_for_scenario_review"
  };
}

function nurseProfileToManualAssignmentNurse(profile: NurseProfileContract): ManualAssignmentNurse {
  return {
    nurseId: profile.nurseProfileId,
    displayLabel: profile.displayLabel,
    color: profile.color,
    role: profile.role,
    targetPatientCount: profile.targetPatientCount,
    maxPatientCount: profile.maxPatientCount,
    traumaQualified: profile.traumaQualified,
    psychQualified: profile.psychQualified,
    chargeQualified: profile.chargeQualified,
    active: profile.active,
    syntheticDataOnly: true
  };
}

function roomLoadToManualAssignmentRoomLoad(roomLoad: RoomLoadContract): ManualAssignmentRoomLoad {
  return {
    roomId: roomLoad.roomId,
    occupied: roomLoad.occupied,
    acuity: roomLoad.acuity,
    traumaActive: roomLoad.traumaActive,
    isolationActive: roomLoad.isolationActive,
    behavioralRisk: roomLoad.behavioralRisk,
    fallRisk: roomLoad.fallRisk,
    sitterRequired: roomLoad.sitterRequired,
    medicationFrequency: roomLoad.medicationFrequency === "continuous" ? "high" : roomLoad.medicationFrequency,
    monitoringFrequency: roomLoad.monitoringFrequency === "continuous" ? "high" : roomLoad.monitoringFrequency,
    procedureBurden: roomLoad.procedureBurden === "very_high" ? "high" : roomLoad.procedureBurden,
    expectedTurnover: roomLoad.expectedTurnover === "normal"
      ? "medium"
      : roomLoad.expectedTurnover === "surge"
        ? "high"
        : roomLoad.expectedTurnover,
    syntheticDataOnly: true
  };
}

function assignmentToManualRoomAssignment(roomId: string, nurseId: string): ManualRoomAssignment {
  return {
    assignmentId: `assignment-${roomId}-${nurseId}`,
    roomId,
    nurseId,
    primary: true,
    syntheticDataOnly: true
  };
}
