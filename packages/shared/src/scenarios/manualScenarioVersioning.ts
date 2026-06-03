import {
  manualScenarioSnapshotIdFor,
  validateManualScenarioSnapshotContract,
  type ManualScenarioSnapshotContract
} from "./manualScenarioSnapshotContract.js";

export function createManualScenarioSnapshot(input: Omit<ManualScenarioSnapshotContract, "scenarioSnapshotId" | "mode">): ManualScenarioSnapshotContract {
  return validateManualScenarioSnapshotContract({
    ...input,
    scenarioSnapshotId: manualScenarioSnapshotIdFor(input),
    mode: "manual_snapshot"
  });
}

export function orderManualScenarioSnapshots(
  snapshots: readonly ManualScenarioSnapshotContract[]
): ManualScenarioSnapshotContract[] {
  return snapshots
    .map(validateManualScenarioSnapshotContract)
    .sort((left, right) => left.createdAtIso.localeCompare(right.createdAtIso) ||
      left.scenarioSnapshotId.localeCompare(right.scenarioSnapshotId));
}
