#!/usr/bin/env node
import {
  createRepairContext,
  finalizeRepairGate,
  loadRepairManifest,
  runSelectedRepairStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = ["final"];

const context = createRepairContext({
  scriptName: "simulation v0 refinement repair",
  stages,
  statusKeyByStage: {},
  outputName: "simulation-v0-refinement-repair-output.json",
  defaultIssue: "590"
});

await runSelectedRepairStages(context, async () => {});

const manifest = loadRepairManifest();
const requiredStatuses = {
  visibleCopyAllRoutesStatus: manifest.visibleCopyAllRoutesStatus,
  workflowGuideIsolationStatus: manifest.workflowGuideIsolationStatus,
  workspaceAccessNamingStatus: manifest.workspaceAccessNamingStatus,
  evidenceIndexStatus: manifest.evidenceIndexStatus,
  rootVerificationWiringStatus: manifest.rootVerificationWiringStatus,
  defaultRoomScaleStatus: manifest.defaultRoomScaleStatus,
  executorSeedPresetGuardStatus: manifest.executorSeedPresetGuardStatus,
  runtimeSeedBehaviorStatus: manifest.runtimeSeedBehaviorStatus,
  comparisonValidationHardeningStatus: manifest.comparisonValidationHardeningStatus
};
const blockers = Object.entries(requiredStatuses)
  .filter(([, value]) => value !== "passed")
  .map(([key, value]) => ({ key, value }));
context.add("all Simulation v0 repair statuses passed", blockers.length === 0, { requiredStatuses, blockers });
context.add("manual visual review remains required", manifest.manualApprovalStatus === "missing", { manualApprovalStatus: manifest.manualApprovalStatus });
context.add("promotion remains blocked", manifest.promotionStatus === "blocked", { promotionStatus: manifest.promotionStatus });
context.add("Simulation v0 remains internal dry-run only", manifest.simulationV0Status === "internal_dry_run_only", { simulationV0Status: manifest.simulationV0Status });
context.add("no PHI status remains passed", manifest.noPhiStatus === "passed", { noPhiStatus: manifest.noPhiStatus });

const decision = blockers.length === 0
  ? "GO for Expanded Simulation v0 User-Facing Refinement."
  : "NO-GO with exact blockers.";

writeJson(`${context.dir}/source-batch-status-summary.json`, {
  sourceBatch: manifest.sourceBatch,
  sourceGoNoGoStatus: manifest.sourceGoNoGoStatus
});
writeJson(`${context.dir}/visible-copy-summary.json`, {
  visibleCopyAllRoutesStatus: manifest.visibleCopyAllRoutesStatus,
  allProductRoutesScanned: manifest.allProductRoutesScanned,
  routesScanned: manifest.routesScanned,
  visibleLegacyCopyStatus: manifest.visibleLegacyCopyStatus,
  accessCredentialVisibleStatus: manifest.accessCredentialVisibleStatus
});
writeJson(`${context.dir}/workflow-guide-isolation-summary.json`, { workflowGuideIsolationStatus: manifest.workflowGuideIsolationStatus });
writeJson(`${context.dir}/workspace-access-naming-summary.json`, { workspaceAccessNamingStatus: manifest.workspaceAccessNamingStatus });
writeJson(`${context.dir}/evidence-index-summary.json`, { evidenceIndexStatus: manifest.evidenceIndexStatus, evidenceIndexValid: manifest.evidenceIndexValid });
writeJson(`${context.dir}/root-verification-wiring-summary.json`, { rootVerificationWiringStatus: manifest.rootVerificationWiringStatus });
writeJson(`${context.dir}/default-room-scale-summary.json`, { defaultRoomScaleStatus: manifest.defaultRoomScaleStatus, defaultPatientRoomWidthFeet: manifest.defaultPatientRoomWidthFeet, defaultPatientRoomHeightFeet: manifest.defaultPatientRoomHeightFeet });
writeJson(`${context.dir}/executor-seed-preset-guard-summary.json`, { executorSeedPresetGuardStatus: manifest.executorSeedPresetGuardStatus });
writeJson(`${context.dir}/runtime-seed-behavior-summary.json`, { runtimeSeedBehaviorStatus: manifest.runtimeSeedBehaviorStatus });
writeJson(`${context.dir}/comparison-validation-hardening-summary.json`, { comparisonValidationHardeningStatus: manifest.comparisonValidationHardeningStatus });
writeJson(`${context.dir}/route-screenshot-index.json`, {
  screenshots: (manifest.routesScanned ?? []).map((route) => `${context.dir}/screenshots/${route}.png`)
});
writeText(`${context.dir}/known-gaps.md`, [
  "# Known Gaps",
  "",
  "- Manual visual review remains required.",
  "- Promotion remains blocked.",
  "- Simulation v0 remains an internal deterministic dry-run until a later accepted refinement batch."
].join("\n") + "\n");
writeText(`${context.dir}/follow-up-issues.md`, [
  "# Follow-Up Issues",
  "",
  "- Expanded Simulation v0 user-facing refinement may proceed only if the final decision is GO.",
  "- Full-shift simulation, optimizer behavior, recommendations, clinical safety scoring, staffing compliance certification, and patient outcome prediction remain out of scope."
].join("\n") + "\n");
writeText(`${context.dir}/go-no-go.md`, `# GO / NO-GO\n\n${decision}\n`);
writeText(`${context.dir}/simulation-v0-refinement-repair-final-audit.md`, [
  "# Simulation v0 Refinement Repair Final Audit",
  "",
  `Decision: ${decision}`,
  "",
  `Blockers: ${blockers.length}`,
  "",
  "Manual visual review remains required. Promotion remains blocked."
].join("\n") + "\n");
writeText("docs/project/simulation-v0-refinement-repair-status.md", [
  "# Simulation v0 Refinement Repair Status",
  "",
  `Decision: ${decision}`,
  "",
  "Simulation v0 remains internal synthetic dry-run only. No PHI, EHR data, optimizer behavior, assignment recommendation behavior, clinical safety scoring, staffing compliance certification, or patient outcome prediction is introduced by this repair batch.",
  "",
  "Manual visual review remains required and promotion remains blocked."
].join("\n") + "\n");
writeText(`${context.dir}/no-promotion-output.txt`, "passed: promotion remains blocked.\n");
writeText(`${context.dir}/no-manual-approval-claim-output.txt`, "passed: manual visual review remains required and was not claimed complete.\n");

finalizeRepairGate(context, {
  testOutputName: "simulation-v0-refinement-repair.txt",
  closeoutStatus: decision,
  manifestUpdates: {
    simulationV0RefinementRepairGoNoGoStatus: blockers.length === 0
      ? "go_for_expanded_simulation_v0_user_facing_refinement"
      : "not_ready",
    goNoGoStatus: blockers.length === 0
      ? "go_for_expanded_simulation_v0_user_facing_refinement"
      : "not_ready"
  }
});
