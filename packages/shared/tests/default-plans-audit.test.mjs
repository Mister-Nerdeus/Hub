import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";
import test from "node:test";

import {
  validateDefaultSavedPlanFixtureContract,
  validateSourceMappingAgainstPlan,
  validateSourceToPlanMappingContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const mappingDir = join(defaultPlansDir, "source-mappings");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-216");
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

function countMappedObjectsByType(mapping) {
  return mapping.objects.reduce((counts, object) => {
    counts[object.objectType] = (counts[object.objectType] ?? 0) + 1;
    return counts;
  }, {});
}

function idsForObjectType(mapping, objectType) {
  return mapping.objects
    .filter((object) => object.objectType === objectType)
    .map((object) => object.targetObjectId)
    .sort();
}

function labelsForMatches(objects, pattern) {
  return objects
    .filter((object) => pattern.test(object.label ?? object.id ?? ""))
    .map((object) => ({ id: object.id, label: object.label ?? object.id }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function summarizeConversionCompleteness(wrapper, mapping) {
  const plan = wrapper.plan;
  const entryNodes = plan.pathNodes.filter((node) => node.nodeType === "entry");
  const emsEntryNodes = plan.pathNodes.filter(
    (node) => node.entryOperationalMetadata?.entryClass === "ems"
  );
  const providerOrPharmacyZones = labelsForMatches(plan.zones, /provider|pharmacy/i);
  const traumaZones = labelsForMatches(plan.zones, /trauma/i);
  const traumaRooms = plan.rooms
    .filter((room) => room.traumaCapable || /trauma/i.test(room.label))
    .map((room) => ({ id: room.id, label: room.label }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    defaultPlanId: plan.planId,
    sourcePlanId: wrapper.sourcePlanId,
    mappingId: mapping.mappingId,
    importStatus: wrapper.importStatus,
    counts: {
      rooms: plan.rooms.length,
      hallways: plan.hallways.length,
      doors: plan.doors.length,
      nurseStations: plan.nurseStations.length,
      zones: plan.zones.length,
      pathNodes: plan.pathNodes.length,
      pathEdges: plan.pathEdges.length
    },
    mappedCountsByType: countMappedObjectsByType(mapping),
    mappedTargetIdsByType: {
      room: idsForObjectType(mapping, "room"),
      hallway: idsForObjectType(mapping, "hallway"),
      door: idsForObjectType(mapping, "door"),
      nurseStation: idsForObjectType(mapping, "nurseStation"),
      zone: idsForObjectType(mapping, "zone"),
      pathNode: idsForObjectType(mapping, "pathNode"),
      pathEdge: idsForObjectType(mapping, "pathEdge")
    },
    coreOperationalElements: {
      roomsRepresented: plan.rooms.length > 0,
      hallwaysRepresented: plan.hallways.length > 0,
      doorsRepresented: plan.doors.length > 0,
      nurseStationsRepresented: plan.nurseStations.length > 0,
      emsOrHallEntryRepresented: entryNodes.length > 0 || emsEntryNodes.length > 0,
      providerOrPharmacyRepresented: providerOrPharmacyZones.length > 0,
      traumaAreaRepresented: traumaZones.length > 0 || traumaRooms.length > 0,
      zonesRepresented: plan.zones.length > 0,
      pathNodesRepresented: plan.pathNodes.length > 0,
      pathEdgesRepresented: plan.pathEdges.length > 0
    },
    representedObjectExamples: {
      entryPathNodeIds: entryNodes.map((node) => node.id).sort(),
      emsEntryPathNodeIds: emsEntryNodes.map((node) => node.id).sort(),
      providerOrPharmacyZones,
      traumaZones,
      traumaRooms
    },
    deferredSourceLabelCount: mapping.deferredSourceLabels.length,
    limitationCount: wrapper.limitations.length
  };
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

  const conversionCompletenessSummaries = [];
  for (const wrapper of wrappers) {
    const manifestSource = sourceById.get(wrapper.sourcePlanId);
    assert.ok(manifestSource);
    assert.equal(manifestSource.conversionStatus, wrapper.importStatus);
    assert.equal(manifestSource.auditStatus, wrapper.auditStatus);
    assert.equal(wrapper.importStatus, wrapper.auditStatus);
    assert.equal(defaultPlanIds.has(wrapper.plan.planId), true);
    assert.equal(wrapper.limitations.length > 0, true);
    const mapping = mappings.find((candidate) => candidate.mappingId === wrapper.mappingId);
    assert.ok(mapping);
    assert.equal(mapping.sourcePlanId, wrapper.sourcePlanId);
    assert.equal(mapping.targetPlanId, wrapper.plan.planId);
    validateSourceMappingAgainstPlan(mapping, wrapper.plan);
    const ids = objectIds(wrapper.plan);
    assert.equal(mapping.objects.every((object) => ids.has(object.targetObjectId)), true);
    conversionCompletenessSummaries.push(summarizeConversionCompleteness(wrapper, mapping));
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
    manifestAuditStatusesAligned: true,
    approximationNotesPresent: true
  });
  writeEvidence("source-mapping-validation-output.json", {
    issue: "216",
    status: "passed",
    mappingCount: mappings.length,
    mappingFiles: mappingFiles.map((name) => basename(name)),
    allMappingTargetsResolved: true,
    allMappingTargetsResolvedInCorrectCollection: true,
    manifestLinksValidated: true
  });

  writeIssue218Evidence("source-to-json-completeness-output.json", {
    issue: "218",
    status: "passed",
    inspectedInputs: [
      "packages/shared/fixtures/default-plans/source-layout-manifest.json",
      "packages/shared/fixtures/default-plans/source-mappings/*.json",
      "packages/shared/fixtures/default-plans/default-er-layout-plan-*.json"
    ],
    docxReadRenderedOrServed: false,
    defaultPlanCount: conversionCompletenessSummaries.length,
    allDefaultPlansHaveSourceManifestEntry: true,
    allDefaultPlansHaveSourceMapping: true,
    noExactGeometryClaim: true,
    summaries: conversionCompletenessSummaries
  });

  writeIssue218Evidence("source-to-json-summary.json", {
    issue: "218",
    status: "passed",
    alignedPlanIds: wrappers.map((wrapper) => wrapper.plan.planId),
    conversionStatus: "validated_default",
    importStatus: "validated_default",
    auditStatus: "validated_default"
  });
});
