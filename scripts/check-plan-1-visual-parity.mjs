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
const status = failures.length === 0 ? "passed" : mode === "strict" ? "failed" : "current_failure_allowed";
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
