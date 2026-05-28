import {
  CANONICAL_ER_POD_FLOORPLAN_ID,
  busyErActivityPreset,
  fourToOneAssignmentScenarioTemplate,
  fourToOneNurseRatio,
  fourToOneScenarioSeedFixture,
  outcomeMetricPlaceholderSet,
  threeToOneAssignmentScenarioTemplate,
  threeToOneNurseRatio,
  threeToOneScenarioSeedFixture,
  typicalLoadAcuityPattern,
  typicalLoadPatientLoadPattern,
  validateAcuityPatternContract,
  validateAssignmentScenarioTemplateContract,
  validateErActivityPresetContract,
  validateNurseRatioContract,
  validateOutcomeMetricPlaceholderSet,
  validatePatientLoadPatternContract,
  validateScenarioSeedContract,
  activityProfileContracts,
  bridgeManualAssignmentsToScenarioInput,
  buildCanonicalCapacityCountReport,
  buildRoomLoadStarterContract,
  buildScenarioCapacityIntegration,
  fourToOneRatioPreset,
  threeToOneRatioPreset,
  validateActivityProfileContract,
  validateRatioPresetPair,
  validateRoomLoadStarterContract,
  type AcuityPatternContract,
  type AssignmentScenarioTemplateContract,
  type ErActivityPresetContract,
  type NurseRatioContract,
  type OutcomeMetricPlaceholderSet,
  type PatientLoadPatternContract,
  type ScenarioSeedContract
} from "@nerdeus/shared";

export type ScenarioComparisonViewModelInput = {
  canonicalFloorplanId: string;
  fourToOneScenarioSeed: ScenarioSeedContract;
  threeToOneScenarioSeed: ScenarioSeedContract;
  fourToOneRatio: NurseRatioContract;
  threeToOneRatio: NurseRatioContract;
  fourToOneAssignmentTemplate: AssignmentScenarioTemplateContract;
  threeToOneAssignmentTemplate: AssignmentScenarioTemplateContract;
  erActivityPreset: ErActivityPresetContract;
  patientLoadPattern: PatientLoadPatternContract;
  acuityPattern: AcuityPatternContract;
  outcomePlaceholders: OutcomeMetricPlaceholderSet;
};

export type ScenarioRatioCardViewModel = {
  ratioId: "four_to_one" | "three_to_one";
  label: string;
  scenarioName: string;
  assignmentTemplateId: string;
  nurseGroupCount: number;
  assignedRoomCount: number;
  targetOccupiedRoomsPerNurse: number;
  maxOccupiedRoomsPerNurse: number;
  assignmentSummary: string;
};

export type ScenarioComparisonViewModel = {
  canonicalFloorplanId: string;
  floorplanLabel: string;
  foundationStatus: string;
  referenceImageStatus: string;
  capacitySummary: {
    physicalRoomCount: number;
    bedPositionCount: number;
    splitBayCount: number;
    assignmentEligibleCount: number;
    ratioEligibleCount: number;
    excludedCount: number;
    selectorDrivenCounts: true;
  };
  ratioPresetRows: {
    presetId: string;
    label: string;
    patientsPerNurse: number;
    sourceNote: string;
  }[];
  activityProfileRows: {
    profileId: string;
    label: string;
    occupancyPercent: number;
    taskIntensityPlaceholder: string;
  }[];
  roomLoadContractStatus: string;
  manualAssignmentBridgeStatus: string;
  knownLimitations: string[];
  cards: [ScenarioRatioCardViewModel, ScenarioRatioCardViewModel];
  nurseCountDifference: number;
  activityPresetSummary: string;
  patientLoadSummary: string;
  acuityPatternSummary: string;
  placeholderOutcomeRows: {
    metricId: string;
    label: string;
    category: string;
    status: "placeholder";
    computed: false;
    displayValue: string;
  }[];
  nonClaimCopy: string[];
};

export function createDefaultScenarioComparisonInput(): ScenarioComparisonViewModelInput {
  return {
    canonicalFloorplanId: CANONICAL_ER_POD_FLOORPLAN_ID,
    fourToOneScenarioSeed: fourToOneScenarioSeedFixture,
    threeToOneScenarioSeed: threeToOneScenarioSeedFixture,
    fourToOneRatio: fourToOneNurseRatio,
    threeToOneRatio: threeToOneNurseRatio,
    fourToOneAssignmentTemplate: fourToOneAssignmentScenarioTemplate,
    threeToOneAssignmentTemplate: threeToOneAssignmentScenarioTemplate,
    erActivityPreset: busyErActivityPreset,
    patientLoadPattern: typicalLoadPatientLoadPattern,
    acuityPattern: typicalLoadAcuityPattern,
    outcomePlaceholders: outcomeMetricPlaceholderSet
  };
}

export function createScenarioComparisonViewModel(
  input: ScenarioComparisonViewModelInput = createDefaultScenarioComparisonInput()
): ScenarioComparisonViewModel {
  const fourToOneScenarioSeed = validateScenarioSeedContract(input.fourToOneScenarioSeed);
  const threeToOneScenarioSeed = validateScenarioSeedContract(input.threeToOneScenarioSeed);
  const fourToOneRatio = validateNurseRatioContract(input.fourToOneRatio);
  const threeToOneRatio = validateNurseRatioContract(input.threeToOneRatio);
  const fourToOneAssignmentTemplate = validateAssignmentScenarioTemplateContract(input.fourToOneAssignmentTemplate);
  const threeToOneAssignmentTemplate = validateAssignmentScenarioTemplateContract(input.threeToOneAssignmentTemplate);
  const erActivityPreset = validateErActivityPresetContract(input.erActivityPreset);
  const patientLoadPattern = validatePatientLoadPatternContract(input.patientLoadPattern);
  const acuityPattern = validateAcuityPatternContract(input.acuityPattern);
  const placeholders = validateOutcomeMetricPlaceholderSet(input.outcomePlaceholders);
  const capacityReport = buildCanonicalCapacityCountReport();
  const capacity = buildScenarioCapacityIntegration(capacityReport);
  const [fourToOnePreset, threeToOnePreset] = validateRatioPresetPair(
    fourToOneRatioPreset,
    threeToOneRatioPreset,
    capacityReport
  );
  const roomLoadContract = validateRoomLoadStarterContract(buildRoomLoadStarterContract(capacity), capacity);
  const activityProfiles = activityProfileContracts.map((profile) =>
    validateActivityProfileContract(profile)
  );
  const bridgeSummary = bridgeManualAssignmentsToScenarioInput({
    schemaVersion: "1.0.0",
    bridgeId: "manual-assignment-scenario-bridge-canonical-plan-1",
    assignmentGroups: [
      {
        assignmentGroupId: "synthetic-group-blue",
        syntheticNurseLabel: "Synthetic Nurse Blue",
        assignedBedPositionIds: ["room-level-1-trauma", "room-02", "room-03", "room-04"],
        syntheticDataOnly: true
      }
    ],
    ratioPreset: fourToOnePreset,
    capacity,
    recommendationStatus: "not_started",
    optimizerStatus: "not_started",
    fullShiftSimulationStatus: "not_started",
    syntheticDataOnly: true
  });

  for (const floorplanId of [
    input.canonicalFloorplanId,
    fourToOneScenarioSeed.canonicalFloorplanId,
    threeToOneScenarioSeed.canonicalFloorplanId,
    fourToOneAssignmentTemplate.canonicalFloorplanId,
    threeToOneAssignmentTemplate.canonicalFloorplanId
  ]) {
    if (floorplanId !== CANONICAL_ER_POD_FLOORPLAN_ID) {
      throw new Error("Scenario comparison requires the same canonical floorplan");
    }
  }
  if (
    fourToOneScenarioSeed.ratioConfigurationId !== "four_to_one" ||
    fourToOneRatio.ratioId !== "four_to_one" ||
    fourToOneAssignmentTemplate.ratioConfigurationId !== "four_to_one"
  ) {
    throw new Error("4:1 scenario inputs must be internally consistent");
  }
  if (
    threeToOneScenarioSeed.ratioConfigurationId !== "three_to_one" ||
    threeToOneRatio.ratioId !== "three_to_one" ||
    threeToOneAssignmentTemplate.ratioConfigurationId !== "three_to_one"
  ) {
    throw new Error("3:1 scenario inputs must be internally consistent");
  }

  const fourToOneCard = buildRatioCard(fourToOneScenarioSeed, fourToOneRatio, fourToOneAssignmentTemplate);
  const threeToOneCard = buildRatioCard(threeToOneScenarioSeed, threeToOneRatio, threeToOneAssignmentTemplate);

  return {
    canonicalFloorplanId: CANONICAL_ER_POD_FLOORPLAN_ID,
    floorplanLabel: "Canonical ER pod floorplan",
    foundationStatus: "Scenario foundation only",
    referenceImageStatus: "Image-backed reference proof ready",
    capacitySummary: {
      physicalRoomCount: capacity.physicalRoomCount,
      bedPositionCount: capacity.bedPositionCount,
      splitBayCount: capacity.splitBayCount,
      assignmentEligibleCount: capacity.assignmentEligibleCount,
      ratioEligibleCount: capacity.ratioEligibleCount,
      excludedCount: capacity.excludedCount,
      selectorDrivenCounts: true
    },
    ratioPresetRows: [fourToOnePreset, threeToOnePreset].map((preset) => ({
      presetId: preset.presetId,
      label: preset.label,
      patientsPerNurse: preset.patientsPerNurse,
      sourceNote: preset.sourceNote
    })),
    activityProfileRows: activityProfiles.map((profile) => ({
      profileId: profile.profileId,
      label: profile.label,
      occupancyPercent: profile.occupancyPercent,
      taskIntensityPlaceholder: profile.taskIntensityPlaceholder
    })),
    roomLoadContractStatus: `${roomLoadContract.entries.length} selector-eligible bed positions ready for synthetic room-load inputs`,
    manualAssignmentBridgeStatus: `${bridgeSummary.coveredEligibleBedPositionIds.length} covered selector-eligible bed positions in bridge proof`,
    knownLimitations: [
      "No full-shift simulation output",
      "No optimizer recommendation",
      "No clinical safety score",
      "No staffing compliance certification",
      "Manual visual review remains required"
    ],
    cards: [fourToOneCard, threeToOneCard],
    nurseCountDifference: threeToOneCard.nurseGroupCount - fourToOneCard.nurseGroupCount,
    activityPresetSummary: `${erActivityPreset.label}: arrivals ${erActivityPreset.arrivalPressureLevel}, turnover ${erActivityPreset.turnoverPressureLevel}, trauma ${erActivityPreset.traumaFrequencyLevel}, boarding ${erActivityPreset.boardingPressureLevel}.`,
    patientLoadSummary: `${patientLoadPattern.label}: ${patientLoadPattern.occupiedRoomCount} occupied rooms, hallway pressure ${patientLoadPattern.hallwayPressureLevel}.`,
    acuityPatternSummary: `${acuityPattern.label}: ${acuityPattern.lowAcuityShare}% low, ${acuityPattern.mediumAcuityShare}% medium, ${acuityPattern.highAcuityShare}% high acuity.`,
    placeholderOutcomeRows: placeholders.metrics.map((metric) => ({
      metricId: metric.metricId,
      label: metric.label,
      category: metric.category,
      status: "placeholder",
      computed: false,
      displayValue: metric.placeholderCopy
    })),
    nonClaimCopy: [
      "Scenario foundation only",
      "No full-shift simulation output",
      "No optimizer recommendation",
      "No staffing compliance certification"
    ]
  };
}

function buildRatioCard(
  scenarioSeed: ScenarioSeedContract,
  ratio: NurseRatioContract,
  assignmentTemplate: AssignmentScenarioTemplateContract
): ScenarioRatioCardViewModel {
  const assignedRoomCount = assignmentTemplate.nurseGroups.reduce(
    (total, group) => total + group.roomIds.length,
    0
  );
  return {
    ratioId: ratio.ratioId,
    label: ratio.label,
    scenarioName: scenarioSeed.scenarioName,
    assignmentTemplateId: assignmentTemplate.assignmentTemplateId,
    nurseGroupCount: assignmentTemplate.nurseGroups.length,
    assignedRoomCount,
    targetOccupiedRoomsPerNurse: ratio.targetOccupiedRoomsPerNurse,
    maxOccupiedRoomsPerNurse: ratio.maxOccupiedRoomsPerNurse,
    assignmentSummary: `${assignmentTemplate.nurseGroups.length} synthetic nurse groups cover ${assignedRoomCount} canonical rooms.`
  };
}
