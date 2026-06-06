#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  issuePath,
  readArg,
  readText,
  runNoPhi,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/manual-scenario-foundation-utils.mjs";
import {
  DEFAULT_CO_ASSIGNMENT_POLICY,
  assignmentTargetIdFor,
  coAssignmentPolicyAllowsMultipleStaff,
  createManualAssignmentSetEntry,
  manualStaffFixture,
  validateAssignmentFoundationTargetContract,
  validateCoAssignmentPolicyContract,
  validateManualAssignmentSetContract,
  validateManualAssignmentSetReferences
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "893");
const stage = readArg("--stage", "final");
const scriptName = "check-co-assignment-policy-semantics";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-co-assignment-policy-contract.mjs --stage final --issue 893",
  "node scripts/check-manual-assignment-validation.mjs --stage final --issue 893",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const floorplanId = "co-assignment-policy-semantics-proof";
const targets = {
  room: target(floorplanId, "room", "room-14", "Room 14"),
  bedPosition: target(floorplanId, "bed_position", "room-02:bed-a", "Room 2A"),
  hallBed: target(floorplanId, "hall_bed", "hall-01", "Hall Bed 1"),
  supportArea: target(floorplanId, "support_area", "support-team-room", "Support Team Room"),
  zone: target(floorplanId, "zone", "zone-fast-track", "Zone Fast Track")
};
const allTargets = Object.values(targets);
const defaultPolicy = validateCoAssignmentPolicyContract(DEFAULT_CO_ASSIGNMENT_POLICY);
const allowMultiplePolicy = validateCoAssignmentPolicyContract({
  policyId: "manual-allow-multiple-policy",
  mode: "allow_multiple_manual_staff",
  allowMultipleForTargetKinds: [],
  warningOnly: true
});

const beforeModeProof = {
  status: "passed",
  oldAllowListOnlyInterpretation: {
    mode: allowMultiplePolicy.mode,
    allowMultipleForTargetKinds: allowMultiplePolicy.allowMultipleForTargetKinds,
    roomAllowsMultipleStaff: allowMultiplePolicy.allowMultipleForTargetKinds.includes("room")
  },
  ambiguity: "mode was not part of the helper decision"
};
const singlePrimaryResults = Object.fromEntries(
  [
    ["room", "room"],
    ["bed_position", "bedPosition"],
    ["hall_bed", "hallBed"],
    ["support_area", "supportArea"],
    ["zone", "zone"]
  ].map(([targetKind]) => [targetKind, coAssignmentPolicyAllowsMultipleStaff(defaultPolicy, targetKind)])
);
const allowMultipleResults = Object.fromEntries(
  ["room", "bed_position", "hall_bed", "support_area", "zone"].map((targetKind) => [
    targetKind,
    coAssignmentPolicyAllowsMultipleStaff(allowMultiplePolicy, targetKind)
  ])
);
const afterModeProof = {
  status: singlePrimaryResults.room === false &&
    singlePrimaryResults.bed_position === false &&
    singlePrimaryResults.hall_bed === false &&
    singlePrimaryResults.support_area === true &&
    singlePrimaryResults.zone === true &&
    Object.values(allowMultipleResults).every(Boolean)
    ? "passed"
    : "failed",
  singlePrimaryPerPatientTarget: singlePrimaryResults,
  allowMultipleManualStaff: allowMultipleResults
};

const roomValidation = validationFor(targets.room, defaultPolicy);
const bedValidation = validationFor(targets.bedPosition, defaultPolicy);
const supportValidation = validationFor(targets.supportArea, defaultPolicy);
const zoneValidation = validationFor(targets.zone, defaultPolicy);
const allowMultipleRoomValidation = validationFor(targets.room, allowMultiplePolicy);
const policyValidationProof = {
  status: hasPolicyIssue(roomValidation) &&
    hasPolicyIssue(bedValidation) &&
    !hasPolicyIssue(supportValidation) &&
    !hasPolicyIssue(zoneValidation) &&
    !hasPolicyIssue(allowMultipleRoomValidation)
    ? "passed"
    : "failed",
  roomValidation,
  bedValidation,
  supportValidation,
  zoneValidation,
  allowMultipleRoomValidation
};

const docProof = {
  status: fileIncludes("docs/project/assignment-foundation-status.md", [
    "`mode` field is the policy preset",
    "`allowMultipleForTargetKinds` is the explicit override list",
    "`allow_multiple_manual_staff` preset allows multiple manual staff on every assignment target kind"
  ]).passed && fileIncludes("docs/project/manual-scenario-foundation-status.md", [
    "`mode` field is the preset",
    "`allowMultipleForTargetKinds` is the explicit override list"
  ]).passed ? "passed" : "failed",
  assignmentFoundationStatus: "docs/project/assignment-foundation-status.md",
  manualScenarioFoundationStatus: "docs/project/manual-scenario-foundation-status.md"
};

writeJson(issuePath(issue, "co-assignment-mode-before.json"), beforeModeProof);
writeJson(issuePath(issue, "co-assignment-mode-after.json"), afterModeProof);
writeJson(issuePath(issue, "co-assignment-policy-doc-proof.json"), docProof);

const contractText = readText("packages/shared/src/assignments/coAssignmentPolicyContract.ts");
const testText = readText("packages/shared/tests/co-assignment-policy-contract.test.mjs");
const scannedFiles = [
  "packages/shared/src/assignments/coAssignmentPolicyContract.ts",
  "packages/shared/src/assignments/manualAssignmentValidation.ts",
  "packages/shared/tests/co-assignment-policy-contract.test.mjs",
  "docs/project/assignment-foundation-status.md",
  "docs/project/manual-scenario-foundation-status.md"
];
const forbiddenCopy = [
  "overstaffed",
  "understaffed",
  "unsafe",
  "safer",
  "balanced workload",
  "better coverage",
  "recommended",
  "optimized",
  "Workload score",
  "Burden score",
  "Clinical safety",
  "Staffing compliance",
  "Patient outcome"
];

const checks = [];
addCheck(checks, "co-assignment mode semantics are explicit", contractText.includes("validPolicy.mode === \"allow_multiple_manual_staff\""));
addCheck(checks, "allow list semantics are documented", docProof.status === "passed", docProof);
addCheck(checks, "shared tests cover both policy modes", testText.includes("single primary mode uses allow list as explicit override list") &&
  testText.includes("allow multiple mode permits all target kinds regardless of allow list"));
addCheck(checks, "patient-care targets are single-primary by default", !singlePrimaryResults.room &&
  !singlePrimaryResults.bed_position &&
  !singlePrimaryResults.hall_bed, singlePrimaryResults);
addCheck(checks, "support and zone targets can allow multiple by policy", singlePrimaryResults.support_area &&
  singlePrimaryResults.zone, singlePrimaryResults);
addCheck(checks, "allow multiple preset allows all target kinds", Object.values(allowMultipleResults).every(Boolean), allowMultipleResults);
addCheck(checks, "manual validation follows final semantics", policyValidationProof.status === "passed", policyValidationProof);
addCheck(checks, "co-assignment semantics contain no forbidden copy", scannedFiles.every((file) =>
  fileExcludes(file, forbiddenCopy).passed
), forbiddenCopy);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "co-assignment-policy-semantics-output.json"), {
  status,
  coAssignmentPolicySemanticsStatus: status,
  coAssignmentModeSemanticsDocumented: status === "passed",
  coAssignmentAllowListSemanticsDocumented: status === "passed",
  patientCareTargetsSinglePrimaryByDefault: status === "passed",
  supportZoneTargetsCanAllowMultipleByPolicy: status === "passed",
  coAssignmentSemanticsContainNoRecommendations: status === "passed",
  coAssignmentSemanticsContainNoScoring: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    coAssignmentPolicySemanticsStatus: "passed",
    coAssignmentPolicySemanticsExplicit: true,
    coAssignmentModeSemanticsDocumented: true,
    coAssignmentAllowListSemanticsDocumented: true,
    patientCareTargetsSinglePrimaryByDefault: true,
    supportZoneTargetsCanAllowMultipleByPolicy: true,
    coAssignmentSemanticsContainNoRecommendations: true,
    coAssignmentSemanticsContainNoScoring: true
  });
}

const noPhiPassed = runNoPhi(issue);
const finalStatus = status === "passed" && noPhiPassed ? "passed" : "failed";
writeCloseout(issue, {
  title: "Co-Assignment Policy Semantics Clarification",
  reviewFinding: "Co-assignment semantics are now explicit: mode selects the preset, and the allow-list is the single-primary preset override list.",
  status: finalStatus,
  filesChanged: [
    "packages/shared/src/assignments/coAssignmentPolicyContract.ts",
    "packages/shared/tests/co-assignment-policy-contract.test.mjs",
    "docs/project/assignment-foundation-status.md",
    "docs/project/manual-scenario-foundation-status.md",
    `scripts/${scriptName}.mjs`,
    "package.json",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "co-assignment-policy-semantics-output.json"),
    issuePath(issue, "co-assignment-mode-before.json"),
    issuePath(issue, "co-assignment-mode-after.json"),
    issuePath(issue, "co-assignment-policy-doc-proof.json"),
    issuePath(issue, "test-output/shared.txt"),
    issuePath(issue, "test-output/web.txt"),
    issuePath(issue, "test-output/web-build.txt"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["The policy clarifies co-assignment validity only; it does not evaluate assignment quality."]
});
writeJson(issuePath(issue, "command-output-map.json"), {
  status: finalStatus,
  issue: String(issue),
  commands: [
    { command: "npm --workspace packages/shared test", outputs: [issuePath(issue, "test-output/shared.txt")] },
    { command: "npm --workspace apps/web test", outputs: [issuePath(issue, "test-output/web.txt")] },
    { command: "npm --workspace apps/web run build", outputs: [issuePath(issue, "test-output/web-build.txt")] },
    {
      command: `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
      outputs: [
        issuePath(issue, `test-output/${scriptName}.txt`),
        issuePath(issue, "co-assignment-policy-semantics-output.json")
      ]
    },
    {
      command: "node scripts/check-co-assignment-policy-contract.mjs --stage final --issue 893",
      outputs: [
        issuePath(issue, "test-output/check-co-assignment-policy-contract.txt"),
        issuePath(issue, "co-assignment-policy-contract-output.json")
      ]
    },
    {
      command: "node scripts/check-manual-assignment-validation.mjs --stage final --issue 893",
      outputs: [
        issuePath(issue, "test-output/check-manual-assignment-validation.txt"),
        issuePath(issue, "manual-assignment-validation-output.json")
      ]
    },
    { command: "node scripts/check-no-phi-fields.mjs", outputs: [issuePath(issue, "no-phi-output.txt")] },
    { command: "docker compose config", outputs: [issuePath(issue, "test-output/docker-compose-config.txt")] },
    {
      command: "docker compose -f docker-compose.production.yml config",
      outputs: [issuePath(issue, "test-output/docker-compose-production-config.txt")]
    },
    { command: "docker compose build web", outputs: [issuePath(issue, "test-output/docker-compose-build-web.txt")] },
    {
      command: "docker compose -f docker-compose.production.yml build web",
      outputs: [issuePath(issue, "test-output/docker-compose-production-build-web.txt")]
    }
  ]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function target(floorplanId, targetKind, sourceId, displayLabel) {
  return validateAssignmentFoundationTargetContract({
    assignmentTargetId: assignmentTargetIdFor({ floorplanId, targetKind, sourceId }),
    targetKind,
    sourceId,
    displayLabel,
    floorplanId,
    active: true
  });
}

function assignment(staffMemberId, assignmentTarget) {
  return createManualAssignmentSetEntry({
    assignmentSetId: "co-assignment-semantics-set",
    staffMemberId,
    target: assignmentTarget
  });
}

function assignmentSet(assignments) {
  return validateManualAssignmentSetContract({
    assignmentSetId: "co-assignment-semantics-set",
    floorplanId,
    label: "Manual co-assignment semantics proof",
    createdAtIso: "2026-06-01T00:00:00.000Z",
    updatedAtIso: "2026-06-01T00:00:00.000Z",
    assignments,
    mode: "manual"
  });
}

function validationFor(assignmentTarget, coAssignmentPolicy) {
  return validateManualAssignmentSetReferences({
    assignmentSet: assignmentSet([
      assignment("staff-rn-a", assignmentTarget),
      assignment("staff-rn-b", assignmentTarget)
    ]),
    staffMembers: manualStaffFixture,
    assignmentTargets: allTargets,
    coAssignmentPolicy
  });
}

function hasPolicyIssue(result) {
  return result.issues.some((issue) => issue.code === "multiple_staff_on_restricted_target");
}
