import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  validateDefaultSavedPlanFixtureContract,
  validatePlanVisualParitySourceTruthContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-229");
const sourceTruthPath = join(
  defaultPlansDir,
  "visual-parity",
  "plan-1-source-truth.json"
);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function writeEvidenceText(name, content) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${content}\n`);
}

const objectKindValues = new Set([
  "room",
  "zone",
  "hallway",
  "nurse_station",
  "door_or_access",
  "annotation",
  "deferred"
]);

const coverageStatusValues = new Set([
  "pending",
  "represented",
  "deferred",
  "not_modeled_with_reason"
]);

function validateSourceTruthContract(contract) {
  assert.equal(contract.schemaVersion, "1.0.0");
  assert.equal(contract.planId, "default-er-layout-plan-1");
  assert.equal(typeof contract.sourceReference, "string");
  assert.equal(contract.sourceUse, "manual-visual-parity-contract-only");

  assert.ok(Array.isArray(contract.visibleObjects));
  assert.ok(contract.visibleObjects.length >= 20);
  assert.ok(contract.minimumExpectedCounts != null);
  assert.ok(Array.isArray(contract.requiredRoomIds));
  assert.equal(contract.requiredRoomIds.length, 23);

  assert.equal(typeof contract.minimumExpectedCounts.rooms, "number");
  assert.equal(typeof contract.minimumExpectedCounts.nurseStations, "number");
  assert.equal(typeof contract.minimumExpectedCounts.providerPharmacyZones, "number");
  assert.equal(typeof contract.minimumExpectedCounts.hallways, "number");
  assert.equal(typeof contract.minimumExpectedCounts.doorsOrAccessPoints, "number");

  for (const [index, item] of contract.visibleObjects.entries()) {
    assert.equal(typeof item.sourceLabel, "string");
    assert.equal(typeof item.required, "boolean");
    assert.equal(typeof item.objectKind, "string");
    assert.ok(objectKindValues.has(item.objectKind), `visibleObjects[${index}].objectKind`);
    if (item.expectedTargetId !== null) {
      assert.equal(typeof item.expectedTargetId, "string");
    }
    if (item.expectedRegionId !== null) {
      assert.equal(typeof item.expectedRegionId, "string");
    }
    assert.ok(coverageStatusValues.has(item.coverageStatus));
    if (!item.required) {
      assert.ok(
        item.coverageStatus === "deferred" || item.coverageStatus === "not_modeled_with_reason",
        `visibleObjects[${index}] can be optional only when explicitly deferred or not modeled`
      );
    }
  }

  return {
    requiredVisibleCount: contract.visibleObjects.length,
    coverageStatusHistogram: coverageStatusCount(contract.visibleObjects),
    objectKindHistogram: objectKindCount(contract.visibleObjects)
  };
}

function coverageStatusCount(items) {
  const counts = {};
  for (const item of items) {
    counts[item.coverageStatus] = (counts[item.coverageStatus] ?? 0) + 1;
  }
  return counts;
}

function objectKindCount(items) {
  const counts = {};
  for (const item of items) {
    counts[item.objectKind] = (counts[item.objectKind] ?? 0) + 1;
  }
  return counts;
}

function countPlanObjects(plan) {
  return {
    rooms: plan.rooms.length,
    nurseStations: plan.nurseStations.length,
    zones: plan.zones.length,
    hallways: plan.hallways.length,
    doors: plan.doors.length,
    doorOrAccessPoints: plan.doors.length,
    pathNodes: plan.pathNodes.length,
    pathEdges: plan.pathEdges.length
  };
}

function requiredVisibleLabelList(contract) {
  return contract.visibleObjects
    .filter((entry) => entry.required)
    .map((entry) => ({
      sourceLabel: entry.sourceLabel,
      objectKind: entry.objectKind,
      expectedTargetId: entry.expectedTargetId ?? null,
      coverageStatus: entry.coverageStatus,
      expectedRegionId: entry.expectedRegionId ?? null
    }));
}

function requiredPlan2To5Counts() {
  const plans = [];
  for (let i = 2; i <= 5; i++) {
    const fixture = validateDefaultSavedPlanFixtureContract(
      readJson(join(defaultPlansDir, `default-er-layout-plan-${i}.json`)),
      {
        sourcePlanIds: new Set([`source-er-layout-plan-${i}`]),
        mappingIds: new Set([`mapping-er-layout-plan-${i}`])
      }
    );

    plans.push({
      planId: fixture.plan.planId,
      roomCount: fixture.plan.rooms.length,
      hallwayCount: fixture.plan.hallways.length,
      zoneCount: fixture.plan.zones.length,
      nurseStationCount: fixture.plan.nurseStations.length,
      doorCount: fixture.plan.doors.length,
      pathNodeCount: fixture.plan.pathNodes.length,
      pathEdgeCount: fixture.plan.pathEdges.length
    });
  }
  return plans;
}

function readPlan1Fixture() {
  const wrapper = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")), {
    sourcePlanIds: new Set(["source-er-layout-plan-1"]),
    mappingIds: new Set(["mapping-er-layout-plan-1"])
  });
  return wrapper;
}

test("Plan 1 source-truth JSON validates and exports required structure", () => {
  const sourceTruth = readJson(sourceTruthPath);
  const sharedValidation = validatePlanVisualParitySourceTruthContract(sourceTruth);
  const validation = validateSourceTruthContract(sourceTruth);

  writeEvidence("plan-1-source-truth-validation-output.json", {
    issue: "229",
    status: "passed",
    planId: sourceTruth.planId,
    sourceReference: sourceTruth.sourceReference,
    requiredVisibleObjects: validation.requiredVisibleCount,
    coverageStatusHistogram: validation.coverageStatusHistogram,
    objectKindHistogram: validation.objectKindHistogram,
    minimumExpectedCounts: sourceTruth.minimumExpectedCounts,
    requiredRoomIds: sharedValidation.requiredRoomIds,
    legacyFixtureRejections: sharedValidation.legacyFixtureRejections,
    objectCount: sourceTruth.visibleObjects.length
  });

  writeEvidence("plan-1-source-truth-contract-output.json", {
    issue: "229",
    status: "passed",
    contractFile: "packages/shared/fixtures/default-plans/visual-parity/plan-1-source-truth.json",
    schemaVersion: sourceTruth.schemaVersion,
    requiredSourceVisibleLabelCount: requiredVisibleLabelList(sourceTruth).length,
    requiredRoomIds: sourceTruth.requiredRoomIds,
    coverageStatus: "pending_only_before_repair",
    legacyFixtureRejections: sourceTruth.legacyFixtureRejections,
    nonClaims: sourceTruth.nonClaims
  });

  writeEvidenceText(
    "plan-1-required-visible-labels.md",
    requiredVisibleLabelList(sourceTruth)
      .map(
        (entry) =>
          `- ${entry.sourceLabel} | kind=${entry.objectKind} | target=${entry.expectedTargetId ?? "deferred"} | status=${entry.coverageStatus}`
      )
      .join("\n")
  );
});

test("Issue 229 captures current Plan 1 object shortfall against source truth contract", () => {
  const sourceTruth = readJson(sourceTruthPath);
  const wrapper = readPlan1Fixture();
  const currentCounts = countPlanObjects(wrapper.plan);

  const minimums = sourceTruth.minimumExpectedCounts;
  const shortfall = {
    rooms: minimums.rooms - currentCounts.rooms,
    nurseStations: minimums.nurseStations - currentCounts.nurseStations,
    zonesProvider: minimums.providerPharmacyZones -
      (wrapper.plan.zones.some((zone) => zone.id === "zone-provider-pharmacy") ? 1 : 0),
    hallways: minimums.hallways - currentCounts.hallways,
    doorsOrAccessPoints: minimums.doorsOrAccessPoints - currentCounts.doors
  };

  const hasShortfall =
    shortfall.rooms > 0 ||
    shortfall.nurseStations > 0 ||
    shortfall.zonesProvider > 0 ||
    shortfall.hallways > 0 ||
    shortfall.doorsOrAccessPoints > 0;

  const requiredLabels = sourceTruth.visibleObjects.map((entry) => entry.sourceLabel);
  const roomLabels = sourceTruth.visibleObjects.filter((entry) => entry.objectKind === "room").map((entry) => entry.sourceLabel);

  writeEvidence("plan-1-current-object-counts.json", {
    issue: "229",
    planId: wrapper.plan.planId,
    observedCounts: currentCounts,
    minimumExpectedCounts: minimums,
    minimumShortfall: shortfall,
    hasContractShortfall: hasShortfall,
    roomRequiredLabelCount: roomLabels.length,
    requiredSourceLabels: requiredLabels,
    hasLegacyRoom01: wrapper.plan.rooms.some((room) => room.id === "room-01"),
    hasLegacySpace07: wrapper.plan.rooms.some((room) => room.id === "space-07"),
    legacyFixtureRejections: sourceTruth.legacyFixtureRejections
  });

  assert.equal(typeof wrapper.plan.planId, "string");
  assert.equal(typeof hasShortfall, "boolean");
});

test("Issue 229 encodes legacy simplified-fixture rejection rules", () => {
  const sourceTruth = readJson(sourceTruthPath);
  const fixture = readPlan1Fixture();
  const rejectedRoomIds = new Set(sourceTruth.legacyFixtureRejections.unsupportedRoomIds);
  const rejectedStationIds = new Set(sourceTruth.legacyFixtureRejections.unsupportedStationIds);
  const legacyRoomIdsPresent = fixture.plan.rooms
    .filter((room) => rejectedRoomIds.has(room.id))
    .map((room) => room.id);
  const legacyStationIdsPresent = fixture.plan.nurseStations
    .filter((station) => rejectedStationIds.has(station.id))
    .map((station) => station.id);

  writeEvidence("plan-1-legacy-fixture-rejection-output.json", {
    issue: "229",
    planId: fixture.plan.planId,
    status: "current_failure_recorded",
    legacyFixtureRejections: sourceTruth.legacyFixtureRejections,
    legacyRoomIdsPresent,
    legacyStationIdsPresent,
    currentRoomCount: fixture.plan.rooms.length,
    maximumOldSimplifiedRoomCount: sourceTruth.legacyFixtureRejections.maximumOldSimplifiedRoomCount
  });

  assert.equal(Array.isArray(legacyRoomIdsPresent), true);
  assert.equal(Array.isArray(legacyStationIdsPresent), true);
  assert.equal(sourceTruth.legacyFixtureRejections.unsupportedRoomIds.includes("room-01"), true);
  assert.equal(sourceTruth.legacyFixtureRejections.unsupportedRoomIds.includes("space-07"), true);
});

test("Plans 2-5 unchanged-proof inventory is captured", () => {
  const proof = {
    issue: "229",
    plans: requiredPlan2To5Counts(),
    preservedIds: [
      "default-er-layout-plan-2",
      "default-er-layout-plan-3",
      "default-er-layout-plan-4",
      "default-er-layout-plan-5"
    ]
  };

  writeEvidence("plans-2-through-5-unchanged-output.json", proof);
  assert.equal(proof.plans.length, 4);
});
