import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  NO_PHI_RUNTIME_REJECTION_CODE,
  validateManualAssignment,
  validatePlanContract,
  validateRoomLoads
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-205");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

test("overflow and adjacency metadata validate in representative fixture rooms", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const hallBed = plan.rooms.find((room) => room.id === "hall-bed-01");
  const overflow = plan.rooms.find((room) => room.id === "room-06");
  const traumaAdjacent = plan.rooms.find((room) => room.id === "room-02");
  const behavioralAdjacent = plan.rooms.find((room) => room.id === "room-04");

  assert.equal(hallBed.overflowOperationalMetadata.overflowClass, "hall_bed");
  assert.equal(overflow.overflowOperationalMetadata.overflowClass, "surge_space");
  assert.equal(traumaAdjacent.adjacencyOperationalMetadata.traumaAdjacencyLevel, "direct");
  assert.equal(behavioralAdjacent.adjacencyOperationalMetadata.behavioralAdjacencyLevel, "direct");

  writeEvidence("overflow-adjacency-metadata-output.json", {
    issue: "205",
    status: "passed",
    overflowRoomIds: plan.rooms
      .filter((room) => room.overflowOperationalMetadata != null)
      .map((room) => room.id),
    adjacencyRoomIds: plan.rooms
      .filter((room) => room.adjacencyOperationalMetadata != null)
      .map((room) => room.id),
    hallBedRepresented: hallBed.roomType === "hall_bed",
    traumaAdjacentRepresented: true,
    behavioralAdjacentRepresented: true
  });
});

test("overflow and adjacency metadata reject unknown references and narrative fields", () => {
  const unknownHallway = readFixture("plan-er-pod-phase2.json");
  unknownHallway.rooms.find((room) => room.id === "room-06").overflowOperationalMetadata.nearbyHallwayId =
    "hallway-missing";
  assert.throws(
    () => validatePlanContract(unknownHallway),
    /overflowOperationalMetadata\.nearbyHallwayId references an unknown hallway/
  );

  const unknownStation = readFixture("plan-er-pod-phase2.json");
  unknownStation.rooms.find((room) => room.id === "room-06").overflowOperationalMetadata.nearbyStationId =
    "station-missing";
  assert.throws(
    () => validatePlanContract(unknownStation),
    /overflowOperationalMetadata\.nearbyStationId references an unknown nurse station/
  );

  const unknownZone = readFixture("plan-er-pod-phase2.json");
  unknownZone.rooms.find((room) => room.id === "room-02").adjacencyOperationalMetadata.nearbySupportZoneIds = [
    "zone-missing"
  ];
  assert.throws(
    () => validatePlanContract(unknownZone),
    /adjacencyOperationalMetadata\.nearbySupportZoneIds\[0\] references an unknown zone/
  );

  const rejectedValue = "Narrative adjacency metadata";
  const freeText = readFixture("plan-er-pod-phase2.json");
  freeText.rooms.find((room) => room.id === "room-02").adjacencyOperationalMetadata.freeText =
    rejectedValue;
  assert.throws(
    () => validatePlanContract(freeText),
    (error) => {
      assert.match(error.message, /adjacencyOperationalMetadata\.freeText is not allowed/);
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );

  writeEvidence("adjacency-reference-validation-output.json", {
    issue: "205",
    status: "passed",
    unknownHallwayRejected: true,
    unknownStationRejected: true,
    unknownZoneRejected: true,
    narrativeFieldRejected: true,
    rejectedValuesEchoed: false
  });
});

test("hall bed remains compatible with room load and manual assignment contracts", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const roomLoads = validateRoomLoads([
    {
      roomId: "hall-bed-01",
      occupied: true,
      acuity: 2,
      traumaActive: false,
      isolationActive: false,
      behavioralRisk: false,
      fallRisk: false,
      sitterRequired: true,
      medicationFrequency: "none",
      monitoringFrequency: "low",
      procedureBurden: "none",
      expectedTurnover: "normal"
    }
  ]);
  const assignment = {
    schemaVersion: "1.0.0",
    assignmentSetId: "assignment-hall-bed-compatibility",
    planId: plan.planId,
    name: "Hall Bed Compatibility",
    description: null,
    nurses: [
      {
        id: "nurse-1",
        name: "Nurse 1",
        color: "#2563eb",
        role: "primary",
        homeStationId: "station-primary",
        traumaQualified: false,
        chargeQualified: false,
        psychQualified: false,
        triageQualified: false,
        maxPatients: 4,
        targetPatients: 3,
        walkingSpeedFeetPerMinute: 250,
        shiftStartMinute: 0,
        shiftEndMinute: 720,
        breakWindows: []
      }
    ],
    assignments: [
      {
        id: "assignment-hall-bed-01",
        nurseId: "nurse-1",
        roomIds: ["hall-bed-01"],
        assignmentType: "manual",
        startMinute: 0,
        endMinute: null
      }
    ]
  };

  const result = validateManualAssignment(plan, roomLoads, assignment);
  assert.deepEqual(result.unassignedOccupiedRoomIds, []);

  writeEvidence("hall-bed-assignment-compatibility-output.json", {
    issue: "205",
    status: "passed",
    hallBedRoomType: plan.rooms.find((room) => room.id === "hall-bed-01").roomType,
    roomLoadValidated: true,
    manualAssignmentValidated: true,
    warningCount: result.warnings.length
  });
});

test("overflow and adjacency labels remain no-PHI guarded", () => {
  const rejectedLabel = ["John", "Smith"].join(" ");
  const badLabel = readFixture("plan-er-pod-phase2.json");
  badLabel.rooms.find((room) => room.id === "hall-bed-01").label = rejectedLabel;

  assert.throws(
    () => validatePlanContract(badLabel),
    (error) => {
      assert.match(error.message, new RegExp(NO_PHI_RUNTIME_REJECTION_CODE));
      assert.equal(error.message.includes(rejectedLabel), false);
      return true;
    }
  );
});
