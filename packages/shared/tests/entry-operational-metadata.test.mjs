import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validatePlanContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-204");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function entryNode(plan) {
  return plan.pathNodes.find((node) => node.nodeType === "entry");
}

test("EMS entry metadata validates and links to trauma zone and path node", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const entry = entryNode(plan);
  const traumaZone = plan.zones.find(
    (zone) => zone.id === entry.entryOperationalMetadata.preferredTraumaZoneId
  );

  assert.equal(entry.entryOperationalMetadata.entryClass, "ems");
  assert.equal(entry.entryOperationalMetadata.preferredFlowDirection, "inbound");
  assert.equal(entry.entryOperationalMetadata.preferredTraumaZoneId, "zone-trauma");
  assert.equal(entry.entryOperationalMetadata.linkedPathNodeId, "node-ems-entry");
  assert.equal(traumaZone.zoneType, "trauma_zone");

  writeEvidence("ems-entry-contract-output.json", {
    issue: "204",
    status: "passed",
    entryNodeId: entry.id,
    entryClass: entry.entryOperationalMetadata.entryClass,
    preferredFlowDirection: entry.entryOperationalMetadata.preferredFlowDirection,
    preferredTraumaZoneId: entry.entryOperationalMetadata.preferredTraumaZoneId,
    linkedPathNodeId: entry.entryOperationalMetadata.linkedPathNodeId,
    noArrivalSimulationAdded: true
  });
});

test("entry metadata rejects invalid enum, narrative fields, and non-entry placement", () => {
  const invalidClass = readFixture("plan-er-pod-phase2.json");
  entryNode(invalidClass).entryOperationalMetadata.entryClass = "patient_arrival";
  assert.throws(
    () => validatePlanContract(invalidClass),
    /entryOperationalMetadata\.entryClass must be one of/
  );

  const rejectedValue = "Narrative entry metadata";
  const freeText = readFixture("plan-er-pod-phase2.json");
  entryNode(freeText).entryOperationalMetadata.freeText = rejectedValue;
  assert.throws(
    () => validatePlanContract(freeText),
    (error) => {
      assert.match(error.message, /entryOperationalMetadata\.freeText is not allowed/);
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );

  const nonEntry = readFixture("plan-er-pod-phase2.json");
  nonEntry.pathNodes[0].entryOperationalMetadata = {
    entryClass: "ems",
    preferredFlowDirection: "inbound",
    preferredTraumaZoneId: "zone-trauma",
    linkedPathNodeId: "node-ems-entry"
  };
  assert.throws(
    () => validatePlanContract(nonEntry),
    /pathNodes\[0\]\.entryOperationalMetadata is only allowed on entry nodes/
  );
});

test("entry metadata rejects unknown zone and path-node references", () => {
  const unknownZone = readFixture("plan-er-pod-phase2.json");
  entryNode(unknownZone).entryOperationalMetadata.preferredTraumaZoneId = "zone-missing";
  assert.throws(
    () => validatePlanContract(unknownZone),
    /entryOperationalMetadata\.preferredTraumaZoneId references an unknown zone/
  );

  const unknownPathNode = readFixture("plan-er-pod-phase2.json");
  entryNode(unknownPathNode).entryOperationalMetadata.linkedPathNodeId = "node-missing";
  assert.throws(
    () => validatePlanContract(unknownPathNode),
    /entryOperationalMetadata\.linkedPathNodeId references an unknown path node/
  );

  writeEvidence("entry-reference-validation-output.json", {
    issue: "204",
    status: "passed",
    unknownPreferredTraumaZoneRejected: true,
    unknownLinkedPathNodeRejected: true,
    referencesChecked: ["preferredTraumaZoneId", "linkedPathNodeId"]
  });
});
