import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";
import test from "node:test";

import {
  validateSourceMappingAgainstPlan,
  validateSourceToPlanMappingContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const mappingDir = join(defaultPlansDir, "source-mappings");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-209");
const issue218EvidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-218");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function writeIssue218Evidence(name, payload) {
  mkdirSync(issue218EvidenceDir, { recursive: true });
  writeFileSync(join(issue218EvidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function readMappingFiles() {
  return readdirSync(mappingDir)
    .filter((name) => /^mapping-er-layout-plan-\d+\.json$/.test(name))
    .sort()
    .map((name) => join(mappingDir, name));
}

function manifestSourceIds() {
  const manifest = readJson(join(defaultPlansDir, "source-layout-manifest.json"));
  return {
    sourcePlanIds: new Set(manifest.sources.map((source) => source.sourcePlanId)),
    defaultPlanIds: new Set(manifest.sources.map((source) => source.defaultPlanId))
  };
}

test("source-to-plan mapping skeletons validate and link to the manifest", () => {
  const mappingFiles = readMappingFiles();
  const manifestIds = manifestSourceIds();
  const mappings = mappingFiles.map((path) => validateSourceToPlanMappingContract(readJson(path)));

  assert.equal(mappings.length, 5);
  for (const [index, mapping] of mappings.entries()) {
    assert.equal(mapping.mappingId, `mapping-er-layout-plan-${index + 1}`);
    assert.equal(mapping.sourcePlanId, `source-er-layout-plan-${index + 1}`);
    assert.equal(mapping.targetPlanId, `default-er-layout-plan-${index + 1}`);
    assert.equal(manifestIds.sourcePlanIds.has(mapping.sourcePlanId), true);
    assert.equal(manifestIds.defaultPlanIds.has(mapping.targetPlanId), true);
    assert.ok(mapping.objects.length > 0);
    assert.ok(mapping.deferredSourceLabels.length > 0);
  }

  writeEvidence("source-to-plan-mapping-contract-output.json", {
    issue: "209",
    status: "passed",
    mappingCount: mappings.length,
    mappingIds: mappings.map((mapping) => mapping.mappingId),
    manifestLinksValidated: true
  });
  writeEvidence("mapping-skeletons-output.json", {
    issue: "209",
    status: "passed",
    mappingFiles: mappingFiles.map((path) => basename(path)),
    objectCounts: mappings.map((mapping) => ({
      mappingId: mapping.mappingId,
      objectCount: mapping.objects.length,
      deferredSourceLabelCount: mapping.deferredSourceLabels.length
    }))
  });
  writeIssue218Evidence("deferred-source-labels-output.json", {
    issue: "218",
    status: "passed",
    mappingCount: mappings.length,
    deferredSourceLabels: mappings.map((mapping) => ({
      mappingId: mapping.mappingId,
      deferredSourceLabelCount: mapping.deferredSourceLabels.length,
      reasonCodes: [...new Set(mapping.deferredSourceLabels.map((label) => label.reasonCode))].sort()
    })),
    codedReasonsOnly: true
  });
});

test("source-to-plan mappings validate against the correct target plan collections", () => {
  const mappingFiles = readMappingFiles();
  const results = [];
  const objectTypeCounts = {};
  for (const path of mappingFiles) {
    const mapping = validateSourceToPlanMappingContract(readJson(path));
    const wrapper = readJson(join(defaultPlansDir, `${mapping.targetPlanId}.json`));
    validateSourceMappingAgainstPlan(mapping, wrapper.plan);
    for (const object of mapping.objects) {
      objectTypeCounts[object.objectType] = (objectTypeCounts[object.objectType] ?? 0) + 1;
    }
    results.push({
      mappingId: mapping.mappingId,
      targetPlanId: wrapper.plan.planId,
      mappedObjectCount: mapping.objects.length
    });
  }

  writeIssue218Evidence("mapping-object-type-target-validation-output.json", {
    issue: "218",
    status: "passed",
    mappingCount: results.length,
    objectTypeCounts,
    allMappingTargetsResolvedInCorrectCollection: true,
    annotationMappingsRejectedUntilPlanAnnotationsExist: true,
    results
  });
});

test("source-to-plan mapping rejects wrong target collections for every supported object type", () => {
  const plan = readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")).plan;
  const collections = {
    room: plan.rooms[0].id,
    hallway: plan.hallways[0].id,
    door: plan.doors[0].id,
    nurseStation: plan.nurseStations[0].id,
    zone: plan.zones[0].id,
    pathNode: plan.pathNodes[0].id,
    pathEdge: plan.pathEdges[0].id
  };
  const rejectedPairs = [];

  for (const [objectType] of Object.entries(collections)) {
    for (const [wrongCollection, targetObjectId] of Object.entries(collections)) {
      if (objectType === wrongCollection) {
        continue;
      }
      const mapping = singleObjectMapping(objectType, targetObjectId);
      assert.throws(
        () => validateSourceMappingAgainstPlan(mapping, plan),
        /targetObjectId must reference plan\./
      );
      rejectedPairs.push({ objectType, wrongCollection });
    }
  }

  assert.throws(
    () => validateSourceMappingAgainstPlan(singleObjectMapping("annotation", plan.rooms[0].id), plan),
    /annotation is deferred/
  );
  rejectedPairs.push({ objectType: "annotation", wrongCollection: "rooms" });

  writeIssue218Evidence("wrong-collection-negative-output.json", {
    issue: "218",
    status: "passed",
    rejectedPairCount: rejectedPairs.length,
    rejectedPairs
  });
});

function singleObjectMapping(objectType, targetObjectId) {
  return {
    schemaVersion: "1.0.0",
    mappingId: `mapping-test-${objectType}`,
    sourcePlanId: "source-er-layout-plan-1",
    targetPlanId: "default-er-layout-plan-1",
    objects: [
      {
        sourceObjectId: `source-test-${objectType}`,
        sourceLabel: `Operational ${objectType}`,
        objectType,
        targetObjectId,
        confidence: "medium",
        geometryApproximation: "manual",
        approximateCoordinates: {
          x: 1,
          y: 1,
          widthFeet: null,
          lengthFeet: null
        },
        conversionProvenance: "manual_approximation",
        notesCode: "source-visible-operational-object"
      }
    ],
    deferredSourceLabels: []
  };
}

test("source-to-plan mapping rejects duplicate source and target object IDs", () => {
  const mapping = readJson(join(mappingDir, "mapping-er-layout-plan-1.json"));
  mapping.objects[1].sourceObjectId = mapping.objects[0].sourceObjectId;
  assert.throws(
    () => validateSourceToPlanMappingContract(mapping),
    /duplicate sourceObjectId values are not allowed/
  );

  const duplicateTarget = readJson(join(mappingDir, "mapping-er-layout-plan-1.json"));
  duplicateTarget.objects[1].targetObjectId = duplicateTarget.objects[0].targetObjectId;
  assert.throws(
    () => validateSourceToPlanMappingContract(duplicateTarget),
    /duplicate targetObjectId values are not allowed/
  );
});

test("source-to-plan mapping rejects unknown enums", () => {
  const unknownObjectType = readJson(join(mappingDir, "mapping-er-layout-plan-1.json"));
  unknownObjectType.objects[0].objectType = "bed";
  assert.throws(
    () => validateSourceToPlanMappingContract(unknownObjectType),
    /objects\[0\]\.objectType must be one of/
  );

  const unknownConfidence = readJson(join(mappingDir, "mapping-er-layout-plan-1.json"));
  unknownConfidence.objects[0].confidence = "certain";
  assert.throws(
    () => validateSourceToPlanMappingContract(unknownConfidence),
    /objects\[0\]\.confidence must be one of/
  );

  const unknownNotesCode = readJson(join(mappingDir, "mapping-er-layout-plan-1.json"));
  unknownNotesCode.objects[0].notesCode = "free-text-note";
  assert.throws(
    () => validateSourceToPlanMappingContract(unknownNotesCode),
    /objects\[0\]\.notesCode must be one of/
  );

  const unknownProvenance = readJson(join(mappingDir, "mapping-er-layout-plan-1.json"));
  unknownProvenance.objects[0].conversionProvenance = "unknown";
  assert.throws(
    () => validateSourceToPlanMappingContract(unknownProvenance),
    /objects\[0\]\.conversionProvenance must be one of/
  );
});

test("source-to-plan mapping rejects PHI-like or clinical source labels", () => {
  const badSourceLabel = readJson(join(mappingDir, "mapping-er-layout-plan-1.json"));
  badSourceLabel.objects[0].sourceLabel = "Jane Doe";
  assert.throws(() => validateSourceToPlanMappingContract(badSourceLabel), /NO_PHI_RUNTIME_REJECTION/);

  const badDeferredLabel = readJson(join(mappingDir, "mapping-er-layout-plan-1.json"));
  badDeferredLabel.deferredSourceLabels[0].sourceLabel = "clinical note";
  assert.throws(
    () => validateSourceToPlanMappingContract(badDeferredLabel),
    /NO_PHI_RUNTIME_REJECTION/
  );

  writeEvidence("no-phi-mapping-output.json", {
    issue: "209",
    status: "passed",
    rejectedSourceLabel: true,
    rejectedDeferredSourceLabel: true,
    codedNotesOnly: true
  });
});
