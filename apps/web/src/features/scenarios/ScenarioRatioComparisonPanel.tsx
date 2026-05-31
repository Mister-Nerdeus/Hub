import {
  createDefaultScenarioComparisonInput,
  createScenarioComparisonViewModel,
  type ScenarioComparisonViewModel
} from "./scenarioComparisonViewModel";
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
import { SCENARIO_RATIO_COMPARISON_COPY } from "./scenarioRatioComparisonCopy";

export function ScenarioRatioComparisonPanel({
  activeFloorplan = null,
  selectedAssignmentSet = null,
  viewModel = createScenarioComparisonViewModel({
    ...createDefaultScenarioComparisonInput(),
    activeFloorplanContext: activeFloorplan
  })
}: {
  activeFloorplan?: ActiveFloorplanContract | null;
  selectedAssignmentSet?: AssignmentSetContract | null;
  viewModel?: ScenarioComparisonViewModel;
}) {
  const assignmentReview = selectedAssignmentSet == null
    ? null
    : createSelectedAssignmentSetReview(selectedAssignmentSet);
  return (
    <section
      className="scenario-ratio-comparison"
      aria-labelledby="scenario-ratio-comparison-title"
      data-scenario-ratio-stage="comparison-ui-shell"
    >
      <header className="scenario-ratio-comparison__header">
        <div>
          <p className="eyebrow">{SCENARIO_RATIO_COMPARISON_COPY.floorplanLabel}</p>
          <h3 id="scenario-ratio-comparison-title">{SCENARIO_RATIO_COMPARISON_COPY.title}</h3>
          <p>{viewModel.floorplanLabel}: {viewModel.activeFloorplanDisplayName}</p>
          <p>Version: {viewModel.activeFloorplanVersionId ?? "Version 1"}</p>
          <p>{viewModel.foundationStatus}</p>
        </div>
        <div className="scenario-ratio-comparison__notices" aria-label="Scenario comparison boundaries">
          {viewModel.nonClaimCopy.map((copy) => (
            <span key={copy}>{copy}</span>
          ))}
        </div>
      </header>

      {selectedAssignmentSet == null || assignmentReview == null ? null : (
        <section
          className="scenario-ratio-comparison__handoff"
          aria-labelledby="scenario-assignment-handoff-title"
          data-scenario-assignment-handoff="selected-assignment-set"
          data-selected-assignment-set-id={selectedAssignmentSet.assignmentSetId}
          data-assignment-warning-review={assignmentReview.reviewStatus}
          data-assignment-warning-count={assignmentReview.warningCount}
        >
          <h4 id="scenario-assignment-handoff-title">Selected assignment set</h4>
          <p>{selectedAssignmentSet.displayName}</p>
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
              <dt>Assignment warnings</dt>
              <dd>{assignmentReview.warningCount}</dd>
            </div>
            <div>
              <dt>Review status</dt>
              <dd>{assignmentReview.reviewStatus === "review_required" ? "Warnings need review before scenario setup" : "Ready for scenario setup review"}</dd>
            </div>
          </dl>
          <p>Scenario setup remains foundation-only until scoring assumptions are ready.</p>
        </section>
      )}

      <div className="scenario-ratio-comparison__foundation" data-scenario-foundation-shell="ready">
        <section>
          <h4>Canonical seed</h4>
          <dl>
            <div>
              <dt>Floorplan ID</dt>
              <dd>{viewModel.canonicalFloorplanId}</dd>
            </div>
            <div>
              <dt>Reference proof</dt>
              <dd>{viewModel.referenceImageStatus}</dd>
            </div>
          </dl>
        </section>
        <section>
          <h4>Capacity counts</h4>
          <dl>
            <div>
              <dt>Physical rooms</dt>
              <dd>{viewModel.capacitySummary.physicalRoomCount}</dd>
            </div>
            <div>
              <dt>Bed positions</dt>
              <dd>{viewModel.capacitySummary.bedPositionCount}</dd>
            </div>
            <div>
              <dt>Split bays</dt>
              <dd>{viewModel.capacitySummary.splitBayCount}</dd>
            </div>
            <div>
              <dt>Assignment eligible</dt>
              <dd>{viewModel.capacitySummary.assignmentEligibleCount}</dd>
            </div>
            <div>
              <dt>Ratio eligible</dt>
              <dd>{viewModel.capacitySummary.ratioEligibleCount}</dd>
            </div>
            <div>
              <dt>Excluded</dt>
              <dd>{viewModel.capacitySummary.excludedCount}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="scenario-ratio-comparison__summary-grid">
        <section>
          <h4>Ratio presets</h4>
          <ul>
            {viewModel.ratioPresetRows.map((preset) => (
              <li key={preset.presetId}>{preset.label}: {preset.patientsPerNurse} synthetic occupied bed positions per nurse group, {preset.sourceNote}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>Activity profiles</h4>
          <ul>
            {viewModel.activityProfileRows.map((profile) => (
              <li key={profile.profileId}>{profile.label}: {profile.occupancyPercent}% occupancy placeholder, {profile.taskIntensityPlaceholder} task-intensity placeholder</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>Readiness contracts</h4>
          <p>{viewModel.roomLoadContractStatus}</p>
          <p>{viewModel.manualAssignmentBridgeStatus}</p>
        </section>
      </div>

      <div className="scenario-ratio-comparison__cards">
        {viewModel.cards.map((card) => (
          <article
            className="scenario-ratio-comparison__card"
            key={card.ratioId}
            data-ratio-card={card.ratioId}
          >
            <h4>{card.label} scenario</h4>
            <p>{card.sourceNote}</p>
            <dl>
              <div>
                <dt>Patients per nurse group</dt>
                <dd>{card.patientsPerNurse}</dd>
              </div>
              <div>
                <dt>Ratio eligible</dt>
                <dd>{card.ratioEligibleCount}</dd>
              </div>
              <div>
                <dt>Planning groups</dt>
                <dd>{card.planningGroupCountPlaceholder}</dd>
              </div>
            </dl>
            <strong>{card.readinessSummary}</strong>
          </article>
        ))}
      </div>

      <div className="scenario-ratio-comparison__summary-grid">
        <section>
          <h4>Ratio comparison readiness</h4>
          <p>3:1 uses {viewModel.planningGroupDifferencePlaceholder} additional planning groups for the same selector-eligible bed-position count.</p>
        </section>
      </div>

      <section className="scenario-ratio-comparison__limitations" aria-label="Known limitations">
        <h4>Known limitations</h4>
        <ul>
          {viewModel.knownLimitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>
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
