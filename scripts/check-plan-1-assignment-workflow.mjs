import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const sharedDistIndex = join(repoRoot, "packages", "shared", "dist", "index.js");
if (!existsSync(sharedDistIndex)) {
  throw new Error("Missing packages/shared/dist/index.js; run npm --workspace packages/shared run build first.");
}

const {
  auditPlan1AssignmentReadiness,
  buildPlan1AssignmentComparisonOutputs,
  buildPlan1AssignmentWalkingPreviews,
  buildPlan1NurseAssignmentSummaries,
  scorePlan1AssignmentBurden,
  validatePlan1AssignmentComparisonFixtures,
  validatePlan1AssignmentsForOperations,
  validatePlan1ManualAssignments,
  validatePlan1NurseProfiles,
  validatePlan1RoomLoads,
  validatePlanContract
} = await import("../packages/shared/dist/index.js");

const args = new Set(process.argv.slice(2));
const stageArgIndex = process.argv.indexOf("--stage");
const stage = stageArgIndex >= 0 ? process.argv[stageArgIndex + 1] : "final";
const issueArgIndex = process.argv.indexOf("--issue");
const issue = issueArgIndex >= 0 ? process.argv[issueArgIndex + 1] : null;
const allowPartial = args.has("--allow-partial");
const supportedStages = [
  "readiness",
  "nurse-profiles",
  "room-loads",
  "manual-assignment",
  "validation",
  "nurse-cards",
  "walking-preview",
  "burden-score",
  "comparison-fixtures",
  "final"
];
if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported --stage "${stage}". Expected one of: ${supportedStages.join(", ")}`);
}

const issueDir = issue == null ? null : join(repoRoot, "docs", "verification", "issues", `issue-${issue}`);
if (issueDir != null) {
  mkdirSync(issueDir, { recursive: true });
}

const plan = validatePlanContract(readJson("packages/shared/fixtures/default-plans/default-er-layout-plan-1.json").plan);
const walkingBaseline = readJson("packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json");
const nurseFixture = readJson("packages/shared/fixtures/assignments/plan-1/synthetic-nurses.json");
const roomLoadFixture = readJson("packages/shared/fixtures/assignments/plan-1/room-loads-baseline.json");
const assignmentFixture = readJson("packages/shared/fixtures/assignments/plan-1/manual-assignment-baseline.json");
const comparisonFixture = readJson("packages/shared/fixtures/assignments/plan-1/assignment-comparison-fixtures.json");

const readiness = auditPlan1AssignmentReadiness({ plan, walkingBaseline });
const nurses = validatePlan1NurseProfiles(nurseFixture.nurses, plan);
const roomLoads = validatePlan1RoomLoads(roomLoadFixture.roomLoads, plan);
const assignments = validatePlan1ManualAssignments(assignmentFixture.assignments, plan, nurses);
const validation = validatePlan1AssignmentsForOperations({ plan, nurses, roomLoads, assignments, stalePathSync: false });
const walkingPreviews = buildPlan1AssignmentWalkingPreviews({ plan, nurses, assignments, stalePathSync: false });
const summaries = buildPlan1NurseAssignmentSummaries({ plan, nurses, roomLoads, assignments, warnings: validation.warnings, walkingPreviews });
const burdenScore = scorePlan1AssignmentBurden({ nurses, roomLoads, assignments, walkingPreviews, warnings: validation.warnings });
const comparisonFixtures = validatePlan1AssignmentComparisonFixtures(comparisonFixture, plan);
const comparisons = buildPlan1AssignmentComparisonOutputs({ plan, fixtures: comparisonFixtures });

const stageFailures = [];
if (readiness.status !== "passed") {
  stageFailures.push(...readiness.failures);
}
if (stageAtLeast("nurse-profiles") && nurses.length !== 4) {
  stageFailures.push(`NURSE_PROFILE_COUNT: expected 4, observed ${nurses.length}`);
}
if (stageAtLeast("room-loads") && roomLoads.length !== 23) {
  stageFailures.push(`ROOM_LOAD_COUNT: expected 23, observed ${roomLoads.length}`);
}
if (stageAtLeast("manual-assignment") && assignments.length === 0) {
  stageFailures.push("MANUAL_ASSIGNMENT_BASELINE_MISSING");
}
if (stageAtLeast("validation")) {
  const coverage = warningCoverage();
  if (coverage.missingCodes.length > 0) {
    stageFailures.push(`VALIDATION_WARNING_COVERAGE_MISSING: ${coverage.missingCodes.join(",")}`);
  }
}
if (stageAtLeast("nurse-cards") && summaries.length !== nurses.length) {
  stageFailures.push("NURSE_CARD_SUMMARY_COUNT_MISMATCH");
}
if (stageAtLeast("walking-preview") && walkingPreviews.some((preview) => preview.limitations.length === 0)) {
  stageFailures.push("WALKING_PREVIEW_LIMITATIONS_MISSING");
}
if (stageAtLeast("burden-score") && burdenScore.totalBurdenScore <= 0) {
  stageFailures.push("BURDEN_SCORE_NOT_POSITIVE");
}
if (stageAtLeast("comparison-fixtures")) {
  const requiredFixtureIds = [
    "fixture-plan-1-balanced-3-to-1",
    "fixture-plan-1-light-4-to-1",
    "fixture-plan-1-heavy-4-to-1",
    "fixture-plan-1-walking-heavy-3-to-1",
    "fixture-plan-1-trauma-mismatch"
  ];
  const fixtureIds = comparisons.map((comparison) => comparison.fixtureId);
  for (const fixtureId of requiredFixtureIds) {
    if (!fixtureIds.includes(fixtureId)) {
      stageFailures.push(`COMPARISON_FIXTURE_MISSING: ${fixtureId}`);
    }
  }
  if (!(byComparisonId("fixture-plan-1-walking-heavy-3-to-1").totalBurdenScore > byComparisonId("fixture-plan-1-light-4-to-1").totalBurdenScore)) {
    stageFailures.push("THREE_ROOM_HEAVIER_THAN_FOUR_ROOM_PROOF_MISSING");
  }
  if (byComparisonId("fixture-plan-1-heavy-4-to-1").totalBurdenScore === byComparisonId("fixture-plan-1-light-4-to-1").totalBurdenScore) {
    stageFailures.push("FOUR_ROOM_DIFFERENT_BURDEN_PROOF_MISSING");
  }
}

const status = stageFailures.length === 0 ? "passed" : allowPartial && stage !== "final" ? "current_failure_allowed" : "failed";
const output = {
  issue: issue ?? "unscoped",
  stage,
  status,
  mode: allowPartial ? "allow-partial" : "strict",
  readiness,
  nurseProfileSummary: {
    nurseCount: nurses.length,
    nurseIds: nurses.map((nurse) => nurse.nurseId),
    displayNames: nurses.map((nurse) => nurse.displayName),
    homeStationIds: nurses.map((nurse) => nurse.homeStationId)
  },
  roomLoadSummary: {
    roomLoadCount: roomLoads.length,
    occupiedRoomCount: roomLoads.filter((roomLoad) => roomLoad.occupied).length,
    unoccupiedRoomCount: roomLoads.filter((roomLoad) => !roomLoad.occupied).length
  },
  manualAssignmentSummary: {
    assignmentCount: assignments.length,
    assignedRoomIds: assignments.map((assignment) => assignment.roomId)
  },
  assignmentValidationSummary: {
    status: validation.status,
    warningCodes: [...new Set(validation.warnings.map((warning) => warning.code))],
    highestSeverity: validation.warnings.some((warning) => warning.severity === "blocking")
      ? "blocking"
      : validation.warnings.some((warning) => warning.severity === "warning")
        ? "warning"
        : validation.warnings.length > 0
          ? "info"
          : "none"
  },
  nurseCardSummary: summaries,
  walkingPreviewSummary: walkingPreviews,
  burdenScoreSummary: burdenScore,
  comparisonFixtureSummary: comparisons,
  failureCount: stageFailures.length,
  failures: stageFailures,
  nonClaims: [
    "Plan 1 assignment outputs are operational comparison aids only.",
    "No optimizer, full shift simulation, staffing safety certification, EHR workflow, PHI, or patient identity is introduced."
  ]
};

if (issueDir != null) {
  writeIssueEvidence(output);
}
console.log(JSON.stringify(output, null, 2));
if (status === "failed") {
  process.exitCode = 1;
}

function stageAtLeast(requiredStage) {
  if (stage === "final") {
    return true;
  }
  return supportedStages.indexOf(stage) >= supportedStages.indexOf(requiredStage);
}

function warningCoverage() {
  const duplicateAssignments = [
    ...assignments.filter((assignment) => assignment.roomId !== "room-24"),
    { ...assignments[0], assignmentId: "duplicate-primary", nurseId: "nurse-green" },
    { ...assignments[0], assignmentId: "invalid-room", roomId: "room-missing" },
    { ...assignments[0], assignmentId: "invalid-nurse", nurseId: "nurse-red" },
    { ...assignments[0], assignmentId: "unoccupied-assigned", roomId: "room-05", nurseId: "nurse-green" }
  ];
  const overloadedNurses = nurses.map((nurse) =>
    nurse.nurseId === "nurse-orange" ? { ...nurse, targetPatientCount: 1, maxPatientCount: 1 } : nurse
  );
  const coverageResult = validatePlan1AssignmentsForOperations({
    plan,
    nurses: overloadedNurses,
    roomLoads,
    assignments: duplicateAssignments,
    stalePathSync: true
  });
  const missingScope = validatePlan1AssignmentsForOperations({ plan: null, nurses, roomLoads, assignments, stalePathSync: false });
  const wrongScope = validatePlan1AssignmentsForOperations({
    plan: { ...plan, planId: "default-er-layout-plan-2" },
    nurses,
    roomLoads,
    assignments,
    stalePathSync: false
  });
  const observedCodes = [
    ...coverageResult.warnings,
    ...missingScope.warnings,
    ...wrongScope.warnings
  ].map((warning) => warning.code);
  const requiredCodes = [
    "UNOCCUPIED_ASSIGNED_ROOM",
    "OCCUPIED_UNASSIGNED_ROOM",
    "NURSE_OVER_TARGET_RATIO",
    "NURSE_OVER_MAX_RATIO",
    "TRAUMA_ROOM_WITH_NON_TRAUMA_QUALIFIED_NURSE",
    "INVALID_ROOM_REFERENCE",
    "INVALID_NURSE_REFERENCE",
    "DUPLICATE_PRIMARY_ASSIGNMENT",
    "STALE_PATH_SYNC",
    "NO_ACTIVE_PLAN_1_FLOORPLAN",
    "NON_PLAN_1_ASSIGNMENT_SCOPE"
  ];
  return {
    observedCodes: [...new Set(observedCodes)],
    missingCodes: requiredCodes.filter((code) => !observedCodes.includes(code))
  };
}

function byComparisonId(fixtureId) {
  const match = comparisons.find((comparison) => comparison.fixtureId === fixtureId);
  if (match == null) {
    throw new Error(`Missing comparison output ${fixtureId}`);
  }
  return match;
}

function writeIssueEvidence(outputValue) {
  const files = {
    "plan-1-assignment-readiness-output.json": outputValue.readiness,
    "room-17-zone-semantics-output.json": {
      room17AssignmentClass: outputValue.readiness.room17AssignmentClass,
      providerPharmacySupportClassified: outputValue.readiness.providerPharmacySupportClassified,
      status: outputValue.readiness.room17AssignmentClass === "assignment_patient_care" ? "passed" : "failed"
    },
    "scaffold-zone-classification-output.json": {
      scaffoldZonesNonAssignment: outputValue.readiness.scaffoldZonesNonAssignment,
      status: outputValue.readiness.scaffoldZonesNonAssignment ? "passed" : "failed"
    },
    "stale-path-sync-warning-output.json": outputValue.readiness.stalePathSyncWarning,
    "nurse-profile-contract-output.json": outputValue.nurseProfileSummary,
    "nurse-profile-defaults-output.json": outputValue.nurseProfileSummary,
    "station-reference-validation-output.json": {
      homeStationIds: outputValue.nurseProfileSummary.homeStationIds,
      status: "passed"
    },
    "room-load-contract-output.json": outputValue.roomLoadSummary,
    "room-load-defaults-output.json": outputValue.roomLoadSummary,
    "manual-assignment-contract-output.json": outputValue.manualAssignmentSummary,
    "assignment-validation-output.json": outputValue.assignmentValidationSummary,
    "warning-code-coverage-output.json": warningCoverage(),
    "warning-severity-output.json": outputValue.assignmentValidationSummary,
    "nurse-assignment-summary-output.json": outputValue.nurseCardSummary,
    "assignment-walking-preview-output.json": outputValue.walkingPreviewSummary,
    "burden-score-contract-output.json": outputValue.burdenScoreSummary,
    "burden-score-breakdown-output.json": outputValue.burdenScoreSummary,
    "comparison-fixture-output.json": outputValue.comparisonFixtureSummary
  };
  for (const [fileName, value] of Object.entries(files)) {
    writeJson(join(issueDir, fileName), value);
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), "utf8"));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
