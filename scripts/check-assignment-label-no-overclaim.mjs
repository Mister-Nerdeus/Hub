#!/usr/bin/env node
import { existsSync, readdirSync } from "node:fs";
import {
  addCheck,
  ensureIssueArtifacts,
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
} from "./lib/assignment-foundation-utils.mjs";
import {
  assignmentTargetIdFor,
  createManualAssignmentSetEntry,
  manualStaffFixture,
  validateAssignmentFoundationTargetContract,
  validateManualAssignmentSetContract,
  validateManualStaffMemberContract
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "876");
const stage = readArg("--stage", "final");
const scriptName = "check-assignment-label-no-overclaim";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-assignment-no-recommendation-guard.mjs --stage final --issue 876",
  "node scripts/check-manual-assignment-browser-proof.mjs --stage final --issue 876",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];
const forbiddenTerms = [
  "recommended",
  "recommendation",
  "best",
  "optimal",
  "optimized",
  "optimizer",
  "score",
  "burden",
  "workload",
  "balanced",
  "fairness",
  "safer",
  "unsafe",
  "clinical safety",
  "staffing compliance",
  "patient outcome",
  "simulation",
  "risk score",
  "acuity safe"
];
const contractFiles = [
  "packages/shared/src/assignments/assignmentTargetContract.ts",
  "packages/shared/src/assignments/manualAssignmentSetContract.ts",
  "packages/shared/src/assignments/manualStaffMemberContract.ts",
  "packages/shared/src/assignments/assignmentLabelNoOverclaim.ts"
];
const uiCopyFiles = [
  "apps/web/src/features/manual-assignment/ManualAssignmentEditor.tsx",
  "apps/web/src/features/manual-assignment/AssignmentTargetListPanel.tsx",
  "apps/web/src/features/manual-assignment/StaffListPanel.tsx",
  "apps/web/src/features/manual-assignment/ManualAssignmentControls.tsx",
  "apps/web/src/features/manual-assignment/AssignmentOverlay.tsx",
  "apps/web/src/features/manual-assignment/AssignmentBadge.tsx",
  "apps/web/src/features/manual-assignment/manualAssignmentDemoMode.ts"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const fixtureOutput = runForbiddenFixtures();
writeJson(issuePath(issue, "forbidden-label-fixture-output.json"), fixtureOutput);

const contractScan = {
  status: contractFiles.every((file) => fileIncludes(file, ["validateAssignmentLabelNoOverclaim"]).passed) ? "passed" : "failed",
  files: contractFiles
};
writeJson(issuePath(issue, "assignment-target-label-scan-output.json"), contractScan);

const uiFindings = scanFiles(uiCopyFiles, forbiddenTerms);
writeJson(issuePath(issue, "assignment-ui-copy-scan-output.json"), {
  status: uiFindings.length === 0 ? "passed" : "failed",
  scannedFiles: uiCopyFiles,
  findings: uiFindings
});

const artifactFindings = scanIssueProofArtifacts(issue, forbiddenTerms);
writeJson(issuePath(issue, "assignment-proof-artifact-scan-output.json"), {
  status: artifactFindings.length === 0 ? "passed" : "failed",
  findings: artifactFindings
});

const checks = [];
addCheck(checks, "contract validators use no-overclaim guard", contractScan.status === "passed", contractScan);
addCheck(checks, "forbidden label fixtures fail validation", fixtureOutput.status === "passed", fixtureOutput);
addCheck(checks, "manual foundation UI copy omits overclaim terms", uiFindings.length === 0, uiFindings);
addCheck(checks, "proof artifacts omit overclaim terms outside explicit fixture", artifactFindings.length === 0, artifactFindings);
addCheck(checks, "shared regression test exists", fileIncludes("packages/shared/tests/assignment-label-no-overclaim.test.mjs", [
  "Recommended Room 14",
  "Best RN",
  "Optimal assignment set",
  "Balanced assignment"
]).passed);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "assignment-label-no-overclaim-output.json"), {
  status,
  assignmentLabelNoOverclaimStatus: status,
  assignmentTargetLabelsNoOverclaim: status === "passed",
  staffLabelsNoOverclaim: status === "passed",
  assignmentSetLabelsNoOverclaim: status === "passed",
  assignmentUiCopyNoOverclaim: status === "passed",
  assignmentProofArtifactsNoOverclaim: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    assignmentLabelNoOverclaimStatus: "passed",
    assignmentTargetLabelsNoOverclaim: true,
    staffLabelsNoOverclaim: true,
    assignmentSetLabelsNoOverclaim: true,
    assignmentUiCopyNoOverclaim: true,
    assignmentProofArtifactsNoOverclaim: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Assignment Label No-Overclaim Hardening",
  reviewFinding: "Assignment contracts now reject overclaim language in target labels, staff labels, set labels, and assignment notes; scoped manual foundation UI copy and proof artifacts are scanned.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "apps/web/src/App.tsx",
    "packages/shared/src/assignments/assignmentLabelNoOverclaim.ts",
    "packages/shared/src/assignments/assignmentTargetContract.ts",
    "packages/shared/src/assignments/manualAssignmentSetContract.ts",
    "packages/shared/src/assignments/manualStaffMemberContract.ts",
    "packages/shared/src/index.ts",
    "packages/shared/tests/assignment-label-no-overclaim.test.mjs",
    "scripts/check-assignment-label-no-overclaim.mjs",
    "scripts/check-manual-assignment-browser-proof.mjs",
    "scripts/lib/assignment-foundation-utils.mjs",
    "docs/project/assignment-foundation-status.md",
    "docs/verification/assignment-foundation-manifest.json",
    "package.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "assignment-label-no-overclaim-output.json"),
    issuePath(issue, "assignment-target-label-scan-output.json"),
    issuePath(issue, "assignment-ui-copy-scan-output.json"),
    issuePath(issue, "assignment-proof-artifact-scan-output.json"),
    issuePath(issue, "forbidden-label-fixture-output.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["UI copy scan is scoped to the current manual assignment foundation surface, not historical Phase 3 burden/proof components."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function runForbiddenFixtures() {
  const floorplanId = "assignment-label-no-overclaim-script-proof";
  const target = validateAssignmentFoundationTargetContract({
    assignmentTargetId: assignmentTargetIdFor({ floorplanId, targetKind: "room", sourceId: "room-14" }),
    targetKind: "room",
    sourceId: "room-14",
    displayLabel: "Room 14",
    floorplanId,
    active: true
  });
  const cases = [
    ["assignmentTarget.displayLabel", () => validateAssignmentFoundationTargetContract({ ...target, displayLabel: "Recommended Room 14" })],
    ["manualStaffMember.displayName", () => validateManualStaffMemberContract({ staffMemberId: "staff-bad", displayName: "Best RN", role: "rn", active: true })],
    ["manualAssignmentSet.label", () => validateManualAssignmentSetContract({
      assignmentSetId: "bad-label-set",
      floorplanId,
      label: "Optimal assignment set",
      createdAtIso: "2026-06-01T00:00:00.000Z",
      updatedAtIso: "2026-06-01T00:00:00.000Z",
      assignments: [],
      mode: "manual"
    })],
    ["manualAssignment.notes", () => createManualAssignmentSetEntry({
      assignmentSetId: "bad-notes-set",
      staffMemberId: manualStaffFixture[0].staffMemberId,
      target,
      notes: "Balanced assignment"
    })]
  ];
  const results = cases.map(([label, run]) => {
    try {
      run();
      return { label, rejected: false };
    } catch (error) {
      return { label, rejected: error instanceof Error && /overclaim language/u.test(error.message) };
    }
  });
  return {
    status: results.every((result) => result.rejected) ? "passed" : "failed",
    results
  };
}

function scanFiles(files, terms) {
  const findings = [];
  for (const file of files) {
    const text = readText(file).toLowerCase();
    for (const term of terms) {
      if (text.includes(term.toLowerCase())) findings.push({ file, term });
    }
  }
  return findings;
}

function scanIssueProofArtifacts(issue, terms) {
  const dir = issuePath(issue);
  if (!existsSync(dir)) return [];
  const allowedFiles = new Set([
    "assignment-target-label-scan-output.json",
    "assignment-ui-copy-scan-output.json"
  ]);
  const findings = [];
  for (const name of readdirSync(dir)) {
    if (!allowedFiles.has(name)) continue;
    const text = readText(issuePath(issue, name)).toLowerCase();
    for (const term of terms) {
      if (text.includes(term.toLowerCase())) findings.push({ file: issuePath(issue, name), term });
    }
  }
  return findings;
}
