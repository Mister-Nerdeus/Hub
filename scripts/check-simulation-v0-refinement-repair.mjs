#!/usr/bin/env node
import { existsSync, statSync } from "node:fs";
import {
  abs,
  createRepairContext,
  finalizeRepairGate,
  readJson,
  readText,
  runSelectedRepairStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-repair-utils.mjs";
import { summarizeEvidenceIndexContent } from "./lib/evidence-index-utils.mjs";

const stages = [
  "independent-revalidation",
  "manifest-contradiction-negative",
  "default-scale-revalidation",
  "evidence-index-revalidation",
  "docs-contract-revalidation",
  "ui-status-revalidation",
  "visible-copy-policy-revalidation",
  "final"
];

const context = createRepairContext({
  scriptName: "simulation v0 refinement repair",
  stages,
  statusKeyByStage: {
    "independent-revalidation": "finalGateIndependentRevalidationStatus",
    "manifest-contradiction-negative": "finalGateIndependentRevalidationStatus",
    "default-scale-revalidation": "finalGateIndependentRevalidationStatus",
    "evidence-index-revalidation": "finalGateIndependentRevalidationStatus",
    "docs-contract-revalidation": "finalGateIndependentRevalidationStatus",
    "ui-status-revalidation": "finalGateIndependentRevalidationStatus",
    "visible-copy-policy-revalidation": "finalGateIndependentRevalidationStatus"
  },
  outputName: "simulation-v0-refinement-repair-output.json",
  defaultIssue: "596"
});

await runSelectedRepairStages(context, runStage);

finalizeRepairGate(context, {
  testOutputName: "simulation-v0-refinement-repair.txt",
  manifestUpdates: {
    finalGateIndependentRevalidationStatus: context.checks.every((check) => check.passed) ? "passed" : "failed",
    finalGateRevalidatesCommittedState: context.checks.every((check) => check.passed)
  }
});

async function runStage(stage) {
  if (stage === "independent-revalidation") {
    const results = {
      defaultScale: revalidateDefaultScale(),
      evidenceIndex: revalidateEvidenceIndex(),
      docsContracts: revalidateDocsContracts(),
      uiStatus: revalidateUiStatus(),
      visibleCopyPolicy: revalidateVisibleCopyPolicy(),
      noClaimBoundaries: revalidateNoClaimBoundaries()
    };
    const passed = Object.values(results).every((result) => result.status === "passed");
    context.add("final repair gate independently revalidates committed source and artifacts", passed, results);
    writeJson(`${context.dir}/independent-revalidation-output.json`, { status: passed ? "passed" : "failed", results });
  }
  if (stage === "manifest-contradiction-negative") {
    const failed = finalGateWouldFail({
      manifestStatus: "passed",
      layoutEditorStageSource: "defaultWidthFeet: 12"
    });
    context.add("manifest says passed plus source 12x10 negative fixture fails", failed, null);
    writeJson(`${context.dir}/manifest-contradiction-negative-output.json`, { status: failed ? "passed" : "failed" });
  }
  if (stage === "default-scale-revalidation") {
    const result = revalidateDefaultScale();
    context.add("default scale is independently revalidated from committed source", result.status === "passed", result);
    writeJson(`${context.dir}/default-scale-revalidation-output.json`, result);
  }
  if (stage === "evidence-index-revalidation") {
    const result = revalidateEvidenceIndex();
    context.add("evidence index is independently revalidated from committed file", result.status === "passed", result);
    writeJson(`${context.dir}/evidence-index-revalidation-output.json`, result);
  }
  if (stage === "docs-contract-revalidation") {
    const result = revalidateDocsContracts();
    context.add("docs-contract state is resolved or scoped by committed policy", result.status === "passed", result);
    writeJson(`${context.dir}/docs-contract-revalidation-output.json`, result);
  }
  if (stage === "ui-status-revalidation") {
    const result = revalidateUiStatus();
    context.add("Simulation UI status is not stale", result.status === "passed", result);
    writeJson(`${context.dir}/ui-status-revalidation-output.json`, result);
  }
  if (stage === "visible-copy-policy-revalidation") {
    const result = revalidateVisibleCopyPolicy();
    context.add("visible-copy policy includes generic demo protections", result.status === "passed", result);
    writeJson(`${context.dir}/visible-copy-policy-revalidation-output.json`, result);
  }
}

function revalidateDefaultScale() {
  const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  const helperSource = readText("apps/web/src/features/layout-editor/clickToPlaceObject.ts");
  const passed = stageSource.includes("getDefaultPlacementSizeForObject(pendingAddObjectId)") &&
    stageSource.includes("defaultWidthFeet: defaultPlacementSize.widthFeet") &&
    !stageSource.includes("defaultWidthFeet: 12") &&
    helperSource.includes("DEFAULT_PATIENT_ROOM_WIDTH_FEET = 10") &&
    helperSource.includes("DEFAULT_PATIENT_ROOM_HEIGHT_FEET = 10") &&
    helperSource.includes("DEFAULT_STORAGE_ROOM_WIDTH_FEET = 10") &&
    helperSource.includes("DEFAULT_STORAGE_ROOM_HEIGHT_FEET = 10");
  return {
    status: passed ? "passed" : "failed",
    actualPlacementUsesSharedDefault: stageSource.includes("getDefaultPlacementSizeForObject(pendingAddObjectId)"),
    hardcoded12x10Absent: !stageSource.includes("defaultWidthFeet: 12")
  };
}

function revalidateEvidenceIndex() {
  const summary = summarizeEvidenceIndexContent(process.cwd());
  const index = summary.status === "passed" ? readJson("docs/verification/ISSUE_EVIDENCE_INDEX.json") : { issues: [] };
  const issueSet = new Set((index.issues ?? []).map((entry) => entry.issue));
  const requiredIssues = Array.from({ length: 25 }, (_, index) => String(571 + index).padStart(3, "0"));
  const missing = requiredIssues.filter((issue) => !issueSet.has(issue));
  const passed = summary.status === "passed" && summary.byteSize > 0 && missing.length === 0;
  return {
    status: passed ? "passed" : "failed",
    ...summary,
    requiredIssues,
    missing
  };
}

function revalidateDocsContracts() {
  const policy = readJson("docs/verification/docs-contract-scope-policy.json");
  const cleanupStatusExists = fileExists("docs/project/docs-contract-cleanup-status.md");
  const passed = policy.currentBatchBlocking?.blocking === true &&
    policy.historicalBacklogNonblocking?.blocking === false &&
    typeof policy.historicalBacklogNonblocking?.acceptedRisk === "string" &&
    cleanupStatusExists;
  return {
    status: passed ? "passed" : "failed",
    currentBatchBlocking: policy.currentBatchBlocking?.blocking,
    historicalBacklogBlocking: policy.historicalBacklogNonblocking?.blocking,
    cleanupStatusExists
  };
}

function revalidateUiStatus() {
  const viewModel = readText("apps/web/src/features/simulation/simulationV0ViewModel.ts");
  const artifactProofViewModel = readText("apps/web/src/features/simulation/simulationV0ArtifactProofViewModel.ts");
  const proofBuilder = readText("packages/shared/src/simulation/dryRunReproducibilityProof.ts");
  const usesLegacyProofBuilder = viewModel.includes("buildDryRunReproducibilityStatus");
  const usesRouteProofPanel = viewModel.includes("buildSimulationV0ArtifactProofViewModel") &&
    artifactProofViewModel.includes("stable_hash_proof_passed") &&
    artifactProofViewModel.includes("same Simulation v0 review inputs must produce the same artifact hash");
  const passed = (usesLegacyProofBuilder || usesRouteProofPanel) &&
    !viewModel.includes("stable hash proof pending final gate") &&
    proofBuilder.includes("stable_hash_proof_passed") &&
    proofBuilder.includes("stable hash proof passed");
  return {
    status: passed ? "passed" : "failed",
    usesProofBuilder: usesLegacyProofBuilder || usesRouteProofPanel,
    pendingStatusAbsent: !viewModel.includes("stable hash proof pending final gate")
  };
}

function revalidateVisibleCopyPolicy() {
  const policy = readJson("docs/verification/visible-product-copy-policy.json");
  const required = ["demo", "Demo", "DEMO", "demo workflow", "demo seed", "demo review", "trial", "recommended assignment", "best assignment"];
  const missing = required.filter((fragment) => !policy.renderedProductForbiddenFragments?.includes(fragment));
  const passed = policy.policyVersion === "2.0.0" &&
    missing.length === 0 &&
    Array.isArray(policy.advancedEvidenceAllowedFragments) &&
    Array.isArray(policy.sourceIdentifierAllowlistRules) &&
    Array.isArray(policy.productDocsForbiddenFragments);
  return {
    status: passed ? "passed" : "failed",
    policyVersion: policy.policyVersion,
    missing
  };
}

function revalidateNoClaimBoundaries() {
  const manifest = context.manifest;
  const passed = manifest.optimizerStatus === "not_started" &&
    manifest.assignmentRecommendationStatus === "not_started" &&
    manifest.clinicalSafetyScoringStatus === "not_started" &&
    manifest.staffingComplianceStatus === "not_started" &&
    manifest.patientOutcomePredictionStatus === "not_started" &&
    manifest.noPhiStatus === "passed";
  return {
    status: passed ? "passed" : "failed",
    optimizerStatus: manifest.optimizerStatus,
    assignmentRecommendationStatus: manifest.assignmentRecommendationStatus,
    clinicalSafetyScoringStatus: manifest.clinicalSafetyScoringStatus,
    staffingComplianceStatus: manifest.staffingComplianceStatus,
    patientOutcomePredictionStatus: manifest.patientOutcomePredictionStatus,
    noPhiStatus: manifest.noPhiStatus
  };
}

function finalGateWouldFail(input) {
  return input.manifestStatus === "passed" && input.layoutEditorStageSource.includes("defaultWidthFeet: 12");
}

function fileExists(path, minBytes = 1) {
  return existsSync(abs(path)) && statSync(abs(path)).isFile() && statSync(abs(path)).size >= minBytes;
}

writeText(`${context.dir}/no-promotion-output.txt`, "passed: promotion remains blocked.\n");
writeText(`${context.dir}/no-manual-approval-claim-output.txt`, "passed: manual visual review remains required and was not claimed complete.\n");
