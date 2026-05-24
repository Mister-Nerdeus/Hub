import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateDefaultSavedPlanFixtureContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sharedFixtureDir = join(repoRoot, "packages", "shared", "fixtures");
const defaultPlansDir = join(sharedFixtureDir, "default-plans");
const mappingDir = join(defaultPlansDir, "source-mappings");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-210");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function registeredReferences() {
  const manifest = readJson(join(defaultPlansDir, "source-layout-manifest.json"));
  return {
    sourcePlanIds: new Set(manifest.sources.map((source) => source.sourcePlanId)),
    mappingIds: new Set(
      readdirSync(mappingDir)
        .filter((name) => /^mapping-er-layout-plan-\d+\.json$/.test(name))
        .map((name) => readJson(join(mappingDir, name)).mappingId)
    )
  };
}

function validWrapper() {
  const plan = readJson(join(sharedFixtureDir, "plan-basic.json"));
  return {
    schemaVersion: "1.0.0",
    defaultPlanRecordId: "default-plan-er-layout-plan-1",
    sourcePlanId: "source-er-layout-plan-1",
    mappingId: "mapping-er-layout-plan-1",
    readOnly: true,
    importStatus: "draft_converted",
    plan: {
      ...plan,
      planId: "default-er-layout-plan-1",
      name: "ER Layout Plan 1"
    },
    limitations: [
      "Approximate manual conversion from source layout reference.",
      "Not exact CAD geometry.",
      "Operational fixture only."
    ]
  };
}

test("default saved plan fixture wrapper validates nested PlanContract and registered links", () => {
  const wrapper = validateDefaultSavedPlanFixtureContract(validWrapper(), registeredReferences());

  assert.equal(wrapper.schemaVersion, "1.0.0");
  assert.equal(wrapper.readOnly, true);
  assert.equal(wrapper.sourcePlanId, "source-er-layout-plan-1");
  assert.equal(wrapper.mappingId, "mapping-er-layout-plan-1");
  assert.equal(wrapper.plan.planId, "default-er-layout-plan-1");

  writeEvidence("default-plan-fixture-contract-output.json", {
    issue: "210",
    status: "passed",
    nestedPlanValidated: true,
    sourcePlanLinkValidated: true,
    mappingLinkValidated: true,
    readOnlyRequired: true,
    limitationCount: wrapper.limitations.length
  });
});

test("default saved plan fixture rejects user namespace and mutable records", () => {
  const wrongRecordNamespace = validWrapper();
  wrongRecordNamespace.defaultPlanRecordId = "saved-plan-er-layout-plan-1";
  assert.throws(
    () => validateDefaultSavedPlanFixtureContract(wrongRecordNamespace, registeredReferences()),
    /defaultPlanRecordId must use the default-plan- namespace/
  );

  const wrongPlanNamespace = validWrapper();
  wrongPlanNamespace.plan.planId = "saved-plan-er-layout-plan-1";
  assert.throws(
    () => validateDefaultSavedPlanFixtureContract(wrongPlanNamespace, registeredReferences()),
    /plan\.planId must use the default-er-layout-plan- namespace/
  );

  const mutable = validWrapper();
  mutable.readOnly = false;
  assert.throws(
    () => validateDefaultSavedPlanFixtureContract(mutable, registeredReferences()),
    /readOnly must be true/
  );

  writeEvidence("default-plan-id-namespace-output.json", {
    issue: "210",
    status: "passed",
    rejectedUserRecordNamespace: true,
    rejectedUserPlanNamespace: true,
    rejectedMutableRecord: true
  });
});

test("default saved plan fixture rejects missing links, limitations, and PHI-like wrapper text", () => {
  const missingSource = validWrapper();
  missingSource.sourcePlanId = "source-er-layout-plan-99";
  assert.throws(
    () => validateDefaultSavedPlanFixtureContract(missingSource, registeredReferences()),
    /sourcePlanId must reference a registered source plan/
  );

  const missingMapping = validWrapper();
  missingMapping.mappingId = "mapping-er-layout-plan-99";
  assert.throws(
    () => validateDefaultSavedPlanFixtureContract(missingMapping, registeredReferences()),
    /mappingId must reference a registered source mapping/
  );

  const missingLimitations = validWrapper();
  missingLimitations.limitations = [];
  assert.throws(
    () => validateDefaultSavedPlanFixtureContract(missingLimitations, registeredReferences()),
    /limitations requires at least one entry/
  );

  const badLimitation = validWrapper();
  badLimitation.limitations[0] = "Jane Doe layout note";
  assert.throws(
    () => validateDefaultSavedPlanFixtureContract(badLimitation, registeredReferences()),
    /NO_PHI_RUNTIME_REJECTION/
  );

  writeEvidence("no-phi-default-plan-wrapper-output.json", {
    issue: "210",
    status: "passed",
    rejectedPhiLikeLimitation: true,
    limitationsRequired: true,
    registeredSourceLinkRequired: true,
    registeredMappingLinkRequired: true
  });
});
