import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRoomLoadStarterContract,
  buildScenarioCapacityIntegration,
  validateRoomLoadStarterContract
} from "../dist/index.js";

test("room-load starter contract uses only eligible bed positions", () => {
  const capacity = buildScenarioCapacityIntegration();
  const contract = validateRoomLoadStarterContract(buildRoomLoadStarterContract(capacity, 2), capacity);
  assert.equal(contract.source, "synthetic planning input");
  assert.equal(contract.fullShiftSimulationStatus, "not_started");
  assert.equal(contract.patientOutcomeStatus, "not_started");
  assert.equal(contract.entries.length, capacity.assignmentEligibleCount);
});

test("room-load starter rejects excluded spaces", () => {
  const capacity = buildScenarioCapacityIntegration();
  const contract = buildRoomLoadStarterContract(capacity);
  assert.throws(
    () => validateRoomLoadStarterContract({
      ...contract,
      entries: [
        ...contract.entries,
        {
          ...contract.entries[0],
          loadableBedPositionId: "room-14"
        }
      ]
    }, capacity),
    /eligible bed positions/
  );
});

