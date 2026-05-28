import {
  CANONICAL_SCENARIO_FLOORPLAN_ID,
  activityProfileContracts,
  bridgeManualAssignmentsToScenarioInput,
  buildCanonicalCapacityCountReport,
  buildRoomLoadStarterContract,
  buildScenarioCapacityIntegration,
  canonicalScenarioSeedContract,
  fourToOneRatioPreset,
  threeToOneRatioPreset,
  validateActivityProfileContract,
  validateCanonicalScenarioSeedContract,
  validateRatioPresetPair,
  validateRoomLoadStarterContract,
  type CanonicalScenarioSeedContract
} from "@nerdeus/shared";

export type ScenarioComparisonViewModelInput = {
  canonicalFloorplanId: string;
  scenarioSeed: CanonicalScenarioSeedContract;
  splitBayBridgeReady: boolean;
  imageBackedReferenceProofReady: boolean;
};

export type ScenarioRatioCardViewModel = {
  ratioId: "four_to_one" | "three_to_one";
  label: string;
  patientsPerNurse: number;
  sourceNote: string;
  ratioEligibleCount: number;
  planningGroupCountPlaceholder: number;
  readinessSummary: string;
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
  planningGroupDifferencePlaceholder: number;
  nonClaimCopy: string[];
};

export function createDefaultScenarioComparisonInput(): ScenarioComparisonViewModelInput {
  return {
    canonicalFloorplanId: CANONICAL_SCENARIO_FLOORPLAN_ID,
    scenarioSeed: canonicalScenarioSeedContract,
    splitBayBridgeReady: true,
    imageBackedReferenceProofReady: true
  };
}

export function createScenarioComparisonViewModel(
  input: ScenarioComparisonViewModelInput = createDefaultScenarioComparisonInput()
): ScenarioComparisonViewModel {
  const capacityReport = buildCanonicalCapacityCountReport();
  const scenarioSeed = validateCanonicalScenarioSeedContract(input.scenarioSeed, {
    capacityReport,
    splitBayBridgeReady: input.splitBayBridgeReady,
    imageBackedReferenceProofReady: input.imageBackedReferenceProofReady
  });
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

  if (input.canonicalFloorplanId !== CANONICAL_SCENARIO_FLOORPLAN_ID) {
    throw new Error("Scenario comparison requires the canonical Plan 1 floorplan");
  }

  const fourToOneCard = buildRatioCard(fourToOnePreset, capacity.ratioEligibleCount);
  const threeToOneCard = buildRatioCard(threeToOnePreset, capacity.ratioEligibleCount);

  return {
    canonicalFloorplanId: CANONICAL_SCENARIO_FLOORPLAN_ID,
    floorplanLabel: "Canonical ER pod floorplan",
    foundationStatus: "Scenario foundation only",
    referenceImageStatus: `${humanizeReferenceStatus(scenarioSeed.referenceImageStatus)} proof ready`,
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
    planningGroupDifferencePlaceholder:
      threeToOneCard.planningGroupCountPlaceholder - fourToOneCard.planningGroupCountPlaceholder,
    nonClaimCopy: [
      "Scenario foundation only",
      "No full-shift simulation output",
      "No optimizer recommendation",
      "No staffing compliance certification"
    ]
  };
}

function humanizeReferenceStatus(status: CanonicalScenarioSeedContract["referenceImageStatus"]): string {
  if (status === "image_backed_reference_ready") return "Image-backed reference";
  return status;
}

function buildRatioCard(
  preset: typeof fourToOneRatioPreset | typeof threeToOneRatioPreset,
  ratioEligibleCount: number
): ScenarioRatioCardViewModel {
  const planningGroupCountPlaceholder = Math.ceil(ratioEligibleCount / preset.patientsPerNurse);
  return {
    ratioId: preset.presetId,
    label: preset.label,
    patientsPerNurse: preset.patientsPerNurse,
    sourceNote: preset.sourceNote,
    ratioEligibleCount,
    planningGroupCountPlaceholder,
    readinessSummary: `${planningGroupCountPlaceholder} planning groups for ${ratioEligibleCount} selector-eligible bed positions.`
  };
}
