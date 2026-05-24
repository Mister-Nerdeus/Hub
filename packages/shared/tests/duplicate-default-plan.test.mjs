import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  duplicateDefaultPlan,
  validatePlanContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-221");
const deterministicCreatedAt = "2026-05-24T10:00:00Z";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function defaultFixtures() {
  return [1, 2, 3, 4, 5].map((index) =>
    readJson(join(defaultPlansDir, `default-er-layout-plan-${index}.json`))
  );
}

function assertNoForbiddenPayload(value, label = "copy") {
  const forbidden = [
    "sourceDocumentPath",
    "docxBinary",
    "binaryData",
    "rawFileContent",
    "base64Content",
    "embeddedDocument",
    "sourceFilename"
  ];
  if (value == null || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbidden.includes(key), false, `${label}.${key} must not be present`);
    assertNoForbiddenPayload(child, `${label}.${key}`);
  }
}

test("duplicateDefaultPlan creates editable JSON floorplan copies for all defaults", () => {
  const results = [];
  for (const fixture of defaultFixtures()) {
    const copy = duplicateDefaultPlan(fixture, {
      planId: `editable-${fixture.plan.planId}`,
      name: `${fixture.plan.name} Copy`,
      createdAt: deterministicCreatedAt
    });

    validatePlanContract(copy.plan);
    assert.equal(copy.schemaVersion, "1.0.0");
    assert.equal(copy.readOnly, false);
    assert.equal(copy.parentDefaultPlanId, fixture.plan.planId);
    assert.equal(copy.createdAt, deterministicCreatedAt);
    assert.equal(copy.updatedAt, deterministicCreatedAt);
    assert.equal(copy.plan.planId, `editable-${fixture.plan.planId}`);
    assert.equal(copy.plan.name, `${fixture.plan.name} Copy`);
    assert.equal(copy.plan.rooms.length, fixture.plan.rooms.length);
    assert.equal(copy.plan.hallways.length, fixture.plan.hallways.length);
    assert.equal(copy.plan.doors.length, fixture.plan.doors.length);
    assert.equal(copy.plan.nurseStations.length, fixture.plan.nurseStations.length);
    assert.equal(copy.plan.zones.length, fixture.plan.zones.length);
    assert.equal(copy.plan.pathNodes.length, fixture.plan.pathNodes.length);
    assert.equal(copy.plan.pathEdges.length, fixture.plan.pathEdges.length);
    assert.deepEqual(copy.plan.rooms, fixture.plan.rooms);
    assert.deepEqual(copy.plan.hallways, fixture.plan.hallways);
    assert.deepEqual(copy.plan.doors, fixture.plan.doors);
    assert.deepEqual(copy.plan.nurseStations, fixture.plan.nurseStations);
    assert.deepEqual(copy.plan.zones, fixture.plan.zones);
    assert.deepEqual(copy.plan.pathNodes, fixture.plan.pathNodes);
    assert.deepEqual(copy.plan.pathEdges, fixture.plan.pathEdges);
    assertNoForbiddenPayload(copy);

    results.push({
      parentDefaultPlanId: copy.parentDefaultPlanId,
      editablePlanId: copy.plan.planId,
      readOnly: copy.readOnly,
      rooms: copy.plan.rooms.length,
      pathNodes: copy.plan.pathNodes.length,
      pathEdges: copy.plan.pathEdges.length
    });
  }

  writeEvidence("duplicate-default-plan-output.json", {
    issue: "221",
    status: "passed",
    duplicatedDefaultCount: results.length,
    results
  });
  writeEvidence("editable-copy-integrity-output.json", {
    issue: "221",
    status: "passed",
    copiedCollections: [
      "rooms",
      "hallways",
      "doors",
      "nurseStations",
      "zones",
      "pathNodes",
      "pathEdges"
    ],
    planContractValidated: true,
    operationalMetadataPreserved: true
  });
  writeEvidence("no-docx-payload-output.json", {
    issue: "221",
    status: "passed",
    forbiddenPayloadKeysRejected: [
      "sourceDocumentPath",
      "docxBinary",
      "binaryData",
      "rawFileContent",
      "base64Content",
      "embeddedDocument",
      "sourceFilename"
    ],
    copiedPlansContainDocxPayload: false
  });
});

test("duplicateDefaultPlan does not mutate default fixtures and rejects unsafe metadata", () => {
  const fixtures = defaultFixtures();
  const before = JSON.stringify(fixtures);
  const fixture = fixtures[0];

  assert.throws(
    () => duplicateDefaultPlan(fixture, { planId: fixture.plan.planId, name: `${fixture.plan.name} Copy` }),
    /new non-empty ID/
  );
  assert.throws(
    () => duplicateDefaultPlan(fixture, { planId: "editable-plan", name: fixture.plan.name }),
    /new non-empty name/
  );

  duplicateDefaultPlan(fixture, {
    planId: "editable-default-er-layout-plan-1",
    name: "Editable ER Layout Plan 1",
    createdAt: deterministicCreatedAt
  });

  const after = JSON.stringify(fixtures);
  assert.equal(after, before);

  writeEvidence("default-immutability-output.json", {
    issue: "221",
    status: "passed",
    defaultFixtureCount: fixtures.length,
    defaultsMutated: false,
    unsafeDuplicateMetadataRejected: true
  });
});
