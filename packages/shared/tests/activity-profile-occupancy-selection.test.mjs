import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRoomLoadStarterContractFromOccupancySelection,
  buildScenarioCapacityIntegration,
  busyActivityProfile,
  neutralWorkloadSeedContract,
  selectOccupiedBedPositionsForActivityProfile,
  slammedActivityProfile,
  typicalActivityProfile,
  validateActivityProfileOccupancySelection
} from "../dist/index.js";

function selectionFor(activityProfile) {
  const capacity = buildScenarioCapacityIntegration();
  return {
    capacity,
    selection: selectOccupiedBedPositionsForActivityProfile({
      capacity,
      activityProfile,
      neutralWorkloadSeed: neutralWorkloadSeedContract
    })
  };
}

test("typical activity profile drives deterministic occupied bed selection", () => {
  const { capacity, selection } = selectionFor(typicalActivityProfile);
  const validated = validateActivityProfileOccupancySelection(selection, {
    capacity,
    activityProfile: typicalActivityProfile
  });

  assert.equal(validated.activityProfileId, "typical");
  assert.equal(validated.occupancyTargetCount, Math.ceil(capacity.assignmentEligibleCount * 0.65));
  assert.equal(validated.selectedOccupiedBedPositionIds.length, validated.occupancyTargetCount);
});

test("busy activity profile uses busy occupancy percentage", () => {
  const { capacity, selection } = selectionFor(busyActivityProfile);

  assert.equal(selection.activityProfileId, "busy");
  assert.equal(selection.occupancyTargetCount, Math.ceil(capacity.assignmentEligibleCount * 0.85));
});

test("slammed activity profile caps selection at eligible count", () => {
  const { capacity, selection } = selectionFor(slammedActivityProfile);

  assert.equal(selection.activityProfileId, "slammed");
  assert.equal(selection.occupancyTargetCount, capacity.assignmentEligibleCount);
  assert.equal(selection.unoccupiedEligibleBedPositionIds.length, 0);
});

test("occupancy selection is repeatable for the same seed and profile", () => {
  const first = selectionFor(busyActivityProfile).selection;
  const second = selectionFor(busyActivityProfile).selection;

  assert.deepEqual(first.selectedOccupiedBedPositionIds, second.selectedOccupiedBedPositionIds);
  assert.equal(first.deterministicSelectionProof, second.deterministicSelectionProof);
});

test("excluded storage/support spaces are never selected", () => {
  const { capacity, selection } = selectionFor(slammedActivityProfile);
  const selected = new Set(selection.selectedOccupiedBedPositionIds);

  for (const excludedId of capacity.excludedObjectIds) {
    assert.equal(selected.has(excludedId), false);
  }
  assert.throws(
    () =>
      validateActivityProfileOccupancySelection(
        {
          ...selection,
          selectedOccupiedBedPositionIds: [
            ...selection.selectedOccupiedBedPositionIds,
            capacity.excludedObjectIds[0]
          ]
        },
        { capacity, activityProfile: slammedActivityProfile }
      ),
    /selector-eligible/
  );
});

test("room-load starter consumes selected occupied beds", () => {
  const { capacity, selection } = selectionFor(typicalActivityProfile);
  const roomLoad = buildRoomLoadStarterContractFromOccupancySelection(capacity, selection);
  const occupied = roomLoad.entries.filter((entry) => entry.occupancyState === "occupied");

  assert.equal(occupied.length, selection.occupancyTargetCount);
  assert.deepEqual(
    new Set(occupied.map((entry) => entry.loadableBedPositionId)),
    new Set(selection.selectedOccupiedBedPositionIds)
  );
});
