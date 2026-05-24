import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validatePlanContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-198");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function withMetadataPlaceholders() {
  const plan = readFixture("plan-er-pod-phase2.json");
  return plan;
}

test("ER layout metadata architecture accepts optional nested metadata placeholders", () => {
  const plan = validatePlanContract(withMetadataPlaceholders());

  assert.equal(plan.rooms[0].roomOperationalMetadata.roomClass, "standard");
  assert.equal(
    plan.rooms.find((room) => room.id === "room-06").overflowOperationalMetadata.overflowClass,
    "surge_space"
  );
  assert.equal(
    plan.rooms.find((room) => room.id === "room-02").adjacencyOperationalMetadata.traumaAdjacencyLevel,
    "direct"
  );
  assert.equal(plan.hallways[0].hallwayOperationalMetadata.hallwayClass, "main");
  assert.equal(plan.doors[0].doorOperationalMetadata.doorClass, "standard");
  assert.equal(plan.nurseStations[0].stationOperationalMetadata.stationClass, "primary");
  assert.equal(plan.zones[0].zoneOperationalMetadata.zoneClass, "patient_care");
  assert.deepEqual(
    plan.pathNodes.find((node) => node.nodeType === "entry").entryOperationalMetadata,
    {
      entryClass: "ems",
      preferredFlowDirection: "inbound",
      preferredTraumaZoneId: "zone-trauma",
      linkedPathNodeId: "node-hall-west"
    }
  );

  writeEvidence("er-layout-metadata-architecture-output.json", {
    issue: "198",
    status: "passed",
    metadataObjects: [
      "roomOperationalMetadata",
      "zoneOperationalMetadata",
      "hallwayOperationalMetadata",
      "doorOperationalMetadata",
      "stationOperationalMetadata",
      "entryOperationalMetadata",
      "overflowOperationalMetadata",
      "adjacencyOperationalMetadata"
    ],
    nestedMetadataOnly: true,
    existingFixturesRemainOptional: true
  });
});

test("ER layout metadata architecture rejects top-level sprawl and narrative metadata fields", () => {
  const topLevelSprawl = readFixture("plan-er-pod-phase2.json");
  topLevelSprawl.rooms[0].roomClass = "trauma";
  assert.throws(
    () => validatePlanContract(topLevelSprawl),
    /rooms\[0\]\.roomClass is not allowed/
  );

  const rejectedValue = "Narrative metadata text";
  const narrativeMetadata = withMetadataPlaceholders();
  narrativeMetadata.rooms[0].roomOperationalMetadata = {
    ...narrativeMetadata.rooms[0].roomOperationalMetadata,
    noteText: rejectedValue
  };
  assert.throws(
    () => validatePlanContract(narrativeMetadata),
    (error) => {
      assert.match(error.message, /roomOperationalMetadata\.noteText is not allowed/);
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );

  writeEvidence("no-phi-metadata-boundary-output.json", {
    issue: "198",
    status: "passed",
    topLevelSprawlRejected: true,
    narrativeMetadataRejected: true,
    rejectedValuesEchoed: false
  });
});

test("existing ER layout fixtures continue to validate without metadata", () => {
  assert.equal(validatePlanContract(readFixture("plan-basic.json")).planId, "plan-basic");
  assert.equal(
    validatePlanContract(readFixture("plan-er-pod-phase2.json")).planId,
    "plan-er-pod-phase2"
  );
});
