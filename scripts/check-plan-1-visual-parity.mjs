import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const sharedDistIndex = join(repoRoot, "packages", "shared", "dist", "index.js");
if (!existsSync(sharedDistIndex)) {
  throw new Error("Missing packages/shared/dist/index.js; run npm --workspace packages/shared run build first.");
}

const {
  auditPlan1VisualParityGaps,
  validateDefaultSavedPlanFixtureContract,
  validatePlanVisualParitySourceTruthContract
} = await import("../packages/shared/dist/index.js");

const args = new Set(process.argv.slice(2));
const issueArgIndex = process.argv.indexOf("--issue");
const issue = issueArgIndex >= 0 ? process.argv[issueArgIndex + 1] : null;
const issueNumber = issue == null ? null : Number.parseInt(issue, 10);
const allowCurrentFailure = args.has("--allow-current-failure");
const allowPartial = args.has("--allow-partial");

const sourceTruthRelativePath =
  "packages/shared/fixtures/default-plans/visual-parity/plan-1-source-truth.json";
const planRelativePath = "packages/shared/fixtures/default-plans/default-er-layout-plan-1.json";
const sourceTruth = readJson(sourceTruthRelativePath);
const planFixture = validateDefaultSavedPlanFixtureContract(readJson(planRelativePath), {
  sourcePlanIds: new Set(["source-er-layout-plan-1"]),
  mappingIds: new Set(["mapping-er-layout-plan-1"])
});
const sourceTruthValidation = validatePlanVisualParitySourceTruthContract(sourceTruth);
const audit = auditPlan1VisualParityGaps(sourceTruth, planFixture.plan, sourceTruthRelativePath);

const legacyRoomIdsPresent = planFixture.plan.rooms
  .filter((room) => sourceTruth.legacyFixtureRejections.unsupportedRoomIds.includes(room.id))
  .map((room) => room.id);
const legacyStationIdsPresent = planFixture.plan.nurseStations
  .filter((station) => sourceTruth.legacyFixtureRejections.unsupportedStationIds.includes(station.id))
  .map((station) => station.id);
const oldSimplifiedRoomCountFailure =
  planFixture.plan.rooms.length <= sourceTruth.legacyFixtureRejections.maximumOldSimplifiedRoomCount;

const failures = [
  ...audit.minimumCountFailures.map(
    (failure) =>
      `MINIMUM_COUNT_${failure.category}: observed ${failure.observed}, required ${failure.minimum}`
  ),
  ...audit.missingRequiredObjects.map(
    (failure) => `MISSING_${failure.objectKind}: ${failure.sourceLabel} -> ${failure.expectedTargetId}`
  ),
  ...audit.providerPharmacyModelingFailures.map((failure) => `PROVIDER_PHARMACY: ${failure}`),
  ...audit.nurseStationCountFailures.map((failure) => `NURSE_STATION: ${failure}`),
  ...legacyRoomIdsPresent.map((id) => `LEGACY_ROOM_PRESENT: ${id}`),
  ...legacyStationIdsPresent.map((id) => `LEGACY_STATION_PRESENT: ${id}`)
];

if (oldSimplifiedRoomCountFailure) {
  failures.push(
    `OLD_SIMPLIFIED_ROOM_COUNT: observed ${planFixture.plan.rooms.length}, threshold ${sourceTruth.legacyFixtureRejections.maximumOldSimplifiedRoomCount}`
  );
}

const mode = allowCurrentFailure ? "allow-current-failure" : allowPartial ? "allow-partial" : "strict";
const requiredStageFailures = [];
if (issueNumber != null && issueNumber >= 232) {
  const roomCountFailure = audit.minimumCountFailures.find((failure) => failure.category === "rooms");
  if (roomCountFailure != null) {
    requiredStageFailures.push(
      `ROOM_COUNT_STAGE_FAILURE: observed ${roomCountFailure.observed}, required ${roomCountFailure.minimum}`
    );
  }
  for (const failure of audit.missingRequiredObjects.filter((entry) => entry.objectKind === "room")) {
    requiredStageFailures.push(`ROOM_COVERAGE_STAGE_FAILURE: ${failure.sourceLabel}`);
  }
  for (const legacyRoomId of legacyRoomIdsPresent) {
    requiredStageFailures.push(`LEGACY_ROOM_STAGE_FAILURE: ${legacyRoomId}`);
  }
}
if (issueNumber != null && issueNumber >= 233) {
  const hallwayCountFailure = audit.minimumCountFailures.find((failure) => failure.category === "hallways");
  if (hallwayCountFailure != null) {
    requiredStageFailures.push(
      `HALLWAY_COUNT_STAGE_FAILURE: observed ${hallwayCountFailure.observed}, required ${hallwayCountFailure.minimum}`
    );
  }
  const nurseStationCountFailure = audit.minimumCountFailures.find((failure) => failure.category === "nurseStations");
  if (nurseStationCountFailure != null) {
    requiredStageFailures.push(
      `NURSE_STATION_COUNT_STAGE_FAILURE: observed ${nurseStationCountFailure.observed}, required ${nurseStationCountFailure.minimum}`
    );
  }
  const providerZoneCountFailure = audit.minimumCountFailures.find(
    (failure) => failure.category === "providerPharmacyZones"
  );
  if (providerZoneCountFailure != null) {
    requiredStageFailures.push(
      `PROVIDER_PHARMACY_ZONE_STAGE_FAILURE: observed ${providerZoneCountFailure.observed}, required ${providerZoneCountFailure.minimum}`
    );
  }
  for (const failure of audit.missingRequiredObjects.filter((entry) =>
    ["zone", "hallway", "nurse_station"].includes(entry.objectKind)
  )) {
    requiredStageFailures.push(`OPERATIONAL_AREA_STAGE_FAILURE: ${failure.objectKind} ${failure.sourceLabel}`);
  }
  for (const failure of audit.providerPharmacyModelingFailures) {
    requiredStageFailures.push(`PROVIDER_PHARMACY_STAGE_FAILURE: ${failure}`);
  }
  for (const failure of audit.nurseStationCountFailures) {
    requiredStageFailures.push(`NURSE_STATION_STAGE_FAILURE: ${failure}`);
  }
  for (const legacyStationId of legacyStationIdsPresent) {
    requiredStageFailures.push(`LEGACY_STATION_STAGE_FAILURE: ${legacyStationId}`);
  }
}
if (issueNumber != null && issueNumber >= 234) {
  const doorCountFailure = audit.minimumCountFailures.find((failure) => failure.category === "doorsOrAccessPoints");
  if (doorCountFailure != null) {
    requiredStageFailures.push(
      `DOOR_ACCESS_COUNT_STAGE_FAILURE: observed ${doorCountFailure.observed}, required ${doorCountFailure.minimum}`
    );
  }
  for (const failure of audit.missingRequiredObjects.filter((entry) => entry.objectKind === "door_or_access")) {
    requiredStageFailures.push(`DOOR_ACCESS_STAGE_FAILURE: ${failure.sourceLabel}`);
  }
}

const status = failures.length === 0
  ? "passed"
  : mode === "strict" || requiredStageFailures.length > 0
    ? "failed"
    : "current_failure_allowed";
const output = {
  issue: issue ?? "unscoped",
  status,
  mode,
  planId: planFixture.plan.planId,
  sourceTruthValidation,
  currentCounts: audit.currentCounts,
  minimumCountFailures: audit.minimumCountFailures,
  missingRequiredObjectCount: audit.missingRequiredObjects.length,
  unsupportedLegacyLabels: audit.unsupportedLegacyLabels,
  legacyFixtureRejectionSummary: {
    legacyRoomIdsPresent,
    legacyStationIdsPresent,
    oldSimplifiedRoomCountFailure
  },
  failureCount: failures.length,
  failures,
  requiredStageFailures,
  nonClaims: sourceTruth.nonClaims
};

if (issue != null) {
  const issueDir = join(repoRoot, "docs", "verification", "issues", `issue-${issue}`);
  mkdirSync(issueDir, { recursive: true });
  writeJson(join(issueDir, "plan-1-legacy-fixture-rejection-output.json"), {
    issue,
    planId: planFixture.plan.planId,
    legacyFixtureRejections: sourceTruth.legacyFixtureRejections,
    legacyRoomIdsPresent,
    legacyStationIdsPresent,
    oldSimplifiedRoomCountFailure,
    status: legacyRoomIdsPresent.length > 0 || legacyStationIdsPresent.length > 0
      ? "current_failure_recorded"
      : "passed"
  });
  if (issue === "231") {
    writeJson(join(issueDir, "plan-1-partial-parity-gate-output.json"), output);
  }
}

console.log(JSON.stringify(output, null, 2));

if (status === "failed") {
  process.exitCode = 1;
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), "utf8"));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
