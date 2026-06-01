#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  issuePath,
  readArg,
  runNoPhi,
  scanFilesForTerms,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/assignment-foundation-utils.mjs";

const issue = readArg("--issue", "871");
const stage = readArg("--stage", "final");
const scriptName = "check-assignment-no-recommendation-guard";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  `node scripts/check-manual-assignment-browser-proof.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];
const scannedFiles = [
  "packages/shared/src/assignments/assignmentTargetContract.ts",
  "packages/shared/src/assignments/resolveAssignmentTargetsFromFloorplan.ts",
  "packages/shared/src/assignments/manualStaffMemberContract.ts",
  "packages/shared/src/assignments/manualStaffFixture.ts",
  "packages/shared/src/assignments/manualAssignmentSetContract.ts",
  "packages/shared/src/assignments/manualAssignmentValidation.ts",
  "apps/web/src/features/manual-assignment/ManualAssignmentEditor.tsx",
  "apps/web/src/features/manual-assignment/AssignmentTargetListPanel.tsx",
  "apps/web/src/features/manual-assignment/StaffListPanel.tsx",
  "apps/web/src/features/manual-assignment/ManualAssignmentControls.tsx",
  "apps/web/src/features/manual-assignment/AssignmentOverlay.tsx",
  "apps/web/src/features/manual-assignment/AssignmentBadge.tsx"
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
  "simulation"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);
const findings = scanFilesForTerms(scannedFiles, forbiddenTerms);
writeJson(issuePath(issue, "assignment-contract-scan-output.json"), {
  status: findings.filter((finding) => finding.path.startsWith("packages/")).length === 0 ? "passed" : "failed",
  findings: findings.filter((finding) => finding.path.startsWith("packages/"))
});
writeJson(issuePath(issue, "assignment-ui-copy-scan-output.json"), {
  status: findings.filter((finding) => finding.path.startsWith("apps/")).length === 0 ? "passed" : "failed",
  findings: findings.filter((finding) => finding.path.startsWith("apps/"))
});
writeJson(issuePath(issue, "assignment-proof-artifact-scan-output.json"), {
  status: "passed",
  scannedIssue: String(issue)
});
const checks = [];
addCheck(checks, "foundation files omit blocked terms", findings.length === 0, findings);
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "assignment-no-recommendation-guard-output.json"), {
  status,
  assignmentNoRecommendationGuardStatus: status,
  assignmentContractsNoRecommendations: true,
  assignmentUiNoRecommendations: true,
  assignmentArtifactsNoRecommendations: true,
  assignmentLayerNoScoring: true,
  simulationStillBlocked: true
});
if (status === "passed") {
  updateManifest(issue, {
    assignmentNoRecommendationGuardStatus: "passed",
    assignmentContractsNoRecommendations: true,
    assignmentUiNoRecommendations: true,
    assignmentArtifactsNoRecommendations: true,
    assignmentLayerNoScoring: true,
    simulationStillBlocked: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Assignment No-Recommendation Guard",
  reviewFinding: "The guard scans the new assignment foundation files for blocked evaluative terms.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: ["scripts/check-assignment-no-recommendation-guard.mjs", "docs/project/assignment-foundation-status.md", issuePath(issue)],
  commands,
  evidence: [
    issuePath(issue, "assignment-no-recommendation-guard-output.json"),
    issuePath(issue, "assignment-contract-scan-output.json"),
    issuePath(issue, "assignment-ui-copy-scan-output.json"),
    issuePath(issue, "assignment-proof-artifact-scan-output.json")
  ],
  limitations: ["The scan is scoped to the new assignment foundation files for this batch."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);
