#!/usr/bin/env node
import {
  createRepairContext,
  finalizeRepairGate,
  fileExists,
  readJson,
  readText,
  runSelectedRepairStages,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = ["readiness-contract", "final"];

const context = createRepairContext({
  scriptName: "simulation v0 user-facing readiness",
  stages,
  statusKeyByStage: {
    "readiness-contract": "nextBatchReadinessContractStatus"
  },
  outputName: "simulation-v0-user-facing-readiness-output.json",
  defaultIssue: "600"
});

await runSelectedRepairStages(context, runStage);

finalizeRepairGate(context, {
  testOutputName: "simulation-v0-user-facing-readiness.txt",
  manifestUpdates: {
    nextBatchReadinessContractStatus: context.checks.every((check) => check.passed) ? "passed" : "failed"
  },
  closeoutStatus: context.checks.every((check) => check.passed)
    ? "GO for next batch."
    : "NO-GO with exact blockers in readiness output."
});

async function runStage(stage) {
  if (stage !== "readiness-contract") return;
  const readiness = readJson("docs/verification/simulation-v0-user-facing-refinement-readiness.json");
  const manifest = context.manifest;
  const requiredAllowed = [
    "activity_profile_selector",
    "ratio_comparison_controls_4_to_1_vs_3_to_1",
    "dry_run_timeline_table",
    "queue_delay_unassigned_summary_cards",
    "selected_occupied_bed_proof_panel",
    "artifact_hash_proof",
    "dry_run_artifact_export_download"
  ];
  const requiredForbidden = [
    "optimizer",
    "assignment_recommendations",
    "full_shift_clinical_simulation",
    "patient_outcomes",
    "staffing_compliance_certification",
    "phi_ehr_integration"
  ];
  const missingAllowed = requiredAllowed.filter((scope) => !readiness.allowedScope?.includes(scope));
  const missingForbidden = requiredForbidden.filter((scope) => !readiness.forbiddenScope?.includes(scope));
  const boundaryFailures = Object.entries(readiness.boundaries ?? {})
    .filter(([key, value]) => manifest[key] !== value)
    .map(([key, value]) => ({ key, expected: value, actual: manifest[key] }));
  const docsExist = fileExists("docs/project/simulation-v0-user-facing-refinement-readiness.md");
  const docText = docsExist ? readText("docs/project/simulation-v0-user-facing-refinement-readiness.md") : "";
  const docHasRequiredSections = [
    "Allowed 601-610 Scope",
    "Forbidden 601-610 Scope",
    "Continuing Boundaries"
  ].every((fragment) => docText.includes(fragment));
  const issue599Go = manifest.cleanGoNoGoReissueStatus === readiness.requiresIssue599Decision;
  const statusesSafe = readiness.simulationV0Status === "internal_dry_run_only" &&
    readiness.fullFutureSimulationEventModelStatus === "dormant" &&
    readiness.manualApprovalStatus === "missing" &&
    readiness.promotionStatus === "blocked";
  const passed = missingAllowed.length === 0 &&
    missingForbidden.length === 0 &&
    boundaryFailures.length === 0 &&
    docsExist &&
    docHasRequiredSections &&
    issue599Go &&
    statusesSafe;

  const output = {
    status: passed ? "passed" : "failed",
    issue599Go,
    missingAllowed,
    missingForbidden,
    boundaryFailures,
    docsExist,
    docHasRequiredSections,
    statusesSafe
  };
  context.add("next-batch readiness contract is bounded and issue-599 gated", passed, output);
  writeJson(`${context.dir}/simulation-v0-user-facing-readiness-output.json`, output);
  writeJson(`${context.dir}/readiness-contract-output.json`, output);
}
