#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  runSelectedStages,
  writeJson
} from "./lib/simulation-v0-internal-dry-run-utils.mjs";

const stages = [
  "typical",
  "busy",
  "slammed",
  "deterministic-selection",
  "excluded-space-negative",
  "final"
];

const context = createCheckContext({
  scriptName: "activity profile occupancy selection",
  stages,
  statusKeyByStage: {
    typical: "activityProfileOccupancySelectionStatus",
    busy: "activityProfileOccupancySelectionStatus",
    slammed: "activityProfileOccupancySelectionStatus",
    "deterministic-selection": "activityProfileOccupancySelectionStatus",
    "excluded-space-negative": "activityProfileOccupancySelectionStatus"
  },
  outputName: "activity-profile-occupancy-selection-output.json",
  defaultIssue: "572"
});

await runSelectedStages(context, runStage);
finalizeGate(context, {
  testOutputName: "activity-profile-occupancy-selection.txt",
  manifestUpdates: {
    usesSelectorDrivenCapacity: true,
    usesActivityProfileForOccupancy: true,
    usesNeutralWorkloadSeed: true
  }
});

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const capacity = shared.buildScenarioCapacityIntegration();
  const profiles = {
    typical: shared.typicalActivityProfile,
    busy: shared.busyActivityProfile,
    slammed: shared.slammedActivityProfile
  };
  if (stage === "typical" || stage === "busy" || stage === "slammed") {
    const profile = profiles[stage];
    const selection = shared.selectOccupiedBedPositionsForActivityProfile({
      capacity,
      activityProfile: profile,
      neutralWorkloadSeed: shared.neutralWorkloadSeedContract
    });
    const expected = Math.min(
      capacity.assignmentEligibleCount,
      Math.ceil((capacity.assignmentEligibleCount * profile.occupancyPercent) / 100)
    );
    context.add(`${stage} selection uses profile occupancy`, selection.occupancyTargetCount === expected, { expected, selection });
    context.add(`${stage} selection validates`, shared.validateActivityProfileOccupancySelection(selection, { capacity, activityProfile: profile }) === selection);
    writeJson(`${context.dir}/${stage}-occupancy-selection-output.json`, { status: "passed", selection });
  }
  if (stage === "deterministic-selection") {
    const first = shared.selectOccupiedBedPositionsForActivityProfile({
      capacity,
      activityProfile: shared.busyActivityProfile,
      neutralWorkloadSeed: shared.neutralWorkloadSeedContract
    });
    const second = shared.selectOccupiedBedPositionsForActivityProfile({
      capacity,
      activityProfile: shared.busyActivityProfile,
      neutralWorkloadSeed: shared.neutralWorkloadSeedContract
    });
    context.add("same seed and profile repeat selection", JSON.stringify(first) === JSON.stringify(second));
    writeJson(`${context.dir}/deterministic-selection-output.json`, { status: "passed", first, second });
  }
  if (stage === "excluded-space-negative") {
    const selection = shared.selectOccupiedBedPositionsForActivityProfile({
      capacity,
      activityProfile: shared.slammedActivityProfile,
      neutralWorkloadSeed: shared.neutralWorkloadSeedContract
    });
    const selected = new Set(selection.selectedOccupiedBedPositionIds);
    const excludedSelected = capacity.excludedObjectIds.filter((id) => selected.has(id));
    let rejected = false;
    try {
      shared.validateActivityProfileOccupancySelection(
        {
          ...selection,
          selectedOccupiedBedPositionIds: [
            ...selection.selectedOccupiedBedPositionIds,
            capacity.excludedObjectIds[0]
          ]
        },
        { capacity, activityProfile: shared.slammedActivityProfile }
      );
    } catch {
      rejected = true;
    }
    context.add("excluded spaces are not selected", excludedSelected.length === 0, excludedSelected);
    context.add("excluded space negative fixture is rejected", rejected);
    writeJson(`${context.dir}/excluded-space-negative-output.json`, { status: "passed", excludedSelected, rejected });
  }
}
