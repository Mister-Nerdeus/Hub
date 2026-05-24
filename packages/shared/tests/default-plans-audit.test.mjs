import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";
import test from "node:test";

import {
  validateDefaultSavedPlanFixtureContract,
  validateSourceToPlanMappingContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const mappingDir = join(defaultPlansDir, "source-mappings");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-216");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function objectIds(plan) {
  return new Set([
    ...plan.rooms,
    ...plan.hallways,
    ...plan.doors,
    ...plan.nurseStations,
    ...plan.zones,
    ...plan.pathNodes,
    ...plan.pathEdges
  ].map((object) => object.id));
}

test("all default plan fixtures validate and link to manifest and mappings", () => {
  const manifest = readJson(join(defaultPlansDir, "source-layout-manifest.json"));
  const sourcePlanIds = new Set(manifest.sources.map((source) => source.sourcePlanId));
  const defaultPlanIds = new Set(manifest.sources.map((source) => source.defaultPlanId));
  const sourceById = new Map(manifest.sources.map((source) => [source.sourcePlanId, source]));
  const mappingFiles = readdirSync(mappingDir).filter((name) => /^mapping-er-layout-plan-\d+\.json$/.test(name)).sort();
  const mappings = mappingFiles.map((name) => validateSourceToPlanMappingContract(readJson(join(mappingDir, name))));
  const mappingIds = new Set(mappings.map((mapping) => mapping.mappingId));
  const wrappers = [1, 2, 3, 4, 5].map((index) =>
    validateDefaultSavedPlanFixtureContract(
      readJson(join(defaultPlansDir, `default-er-layout-plan-${index}.json`)),
      { sourcePlanIds, mappingIds }
    )
  );

  assert.equal(manifest.sources.length, 5);
  assert.equal(mappings.length, 5);
  assert.equal(wrappers.length, 5);

  for (const wrapper of wrappers) {
    const manifestSource = sourceById.get(wrapper.sourcePlanId);
    assert.ok(manifestSource);
    assert.equal(manifestSource.conversionStatus, wrapper.importStatus);
    assert.equal(defaultPlanIds.has(wrapper.plan.planId), true);
    assert.equal(wrapper.limitations.length > 0, true);
    const mapping = mappings.find((candidate) => candidate.mappingId === wrapper.mappingId);
    assert.ok(mapping);
    assert.equal(mapping.sourcePlanId, wrapper.sourcePlanId);
    assert.equal(mapping.targetPlanId, wrapper.plan.planId);
    const ids = objectIds(wrapper.plan);
    assert.equal(mapping.objects.every((object) => ids.has(object.targetObjectId)), true);
  }

  writeEvidence("default-plan-validation-output.json", {
    issue: "216",
    status: "passed",
    sourceCount: manifest.sources.length,
    defaultPlanCount: wrappers.length,
    defaultPlanIds: wrappers.map((wrapper) => wrapper.plan.planId),
    nestedPlanContractsValidated: true,
    wrapperContractsValidated: true,
    manifestConversionStatusesAligned: true,
    approximationNotesPresent: true
  });
  writeEvidence("source-mapping-validation-output.json", {
    issue: "216",
    status: "passed",
    mappingCount: mappings.length,
    mappingFiles: mappingFiles.map((name) => basename(name)),
    allMappingTargetsResolved: true,
    manifestLinksValidated: true
  });
});
