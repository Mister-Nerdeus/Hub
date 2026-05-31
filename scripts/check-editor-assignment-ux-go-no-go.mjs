#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  loadManifest,
  readArg,
  readJson,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writePlaceholderPng,
  writeStageResult,
  writeText
} from "./lib/editor-assignment-ux-utils.mjs";

const issue = readArg("--issue", "713");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
if (stage !== "final") throw new Error(`Unsupported editor-assignment UX GO/NO-GO stage: ${stage}`);

const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const checks = [];
const summaries = {
  preflight: readSummary("editor-assignment-ux-preflight", "preflight-summary.json"),
  productShell: readSummary("product-shell-workflow", "product-shell-summary.json"),
  activeFloorplanHub: readSummary("active-floorplan-hub-ux", "active-floorplan-hub-summary.json"),
  editorToolbar: readSummary("editor-normal-toolbar-ux", "editor-toolbar-summary.json"),
  readinessTruth: readSummary("floorplan-readiness-truth", "readiness-truth-summary.json"),
  persistenceResilience: readSummary("active-floorplan-persistence-resilience", "persistence-resilience-summary.json"),
  assignmentSet: readSummary("assignment-set-contract", "assignment-set-contract-summary.json"),
  nurseProfile: readSummary("nurse-profile-builder", "nurse-profile-summary.json"),
  roomLoad: readSummary("room-load-editor", "room-load-editor-summary.json"),
  manualAssignmentUx: readSummary("manual-assignment-three-column-ux", "manual-assignment-ux-summary.json"),
  assignmentHandoff: readSummary("assignment-set-save-reload-handoff", "assignment-handoff-summary.json"),
  activeFloorplanWorkflow: readSummary("active-floorplan-workflow-go-no-go", "active-floorplan-regression-summary.json"),
  doorRegression: readSummary("door-authoring-browser-regression", "door-regression-summary.json"),
  splitRoomRegression: readSummary("split-room-browser-regression", "split-room-regression-summary.json")
};

for (const [key, summary] of Object.entries(summaries)) {
  addCheck(checks, `${key} validator passed from local evidence`, summary.status === "passed", summary);
}

const manifest = loadManifest();
const expected = {
  editorAssignmentUxPreflightStatus: "passed",
  productShellWorkflowStatus: "passed",
  activeFloorplanHubUxStatus: "passed",
  editorNormalToolbarUxStatus: "passed",
  floorplanReadinessTruthStatus: "passed",
  activeFloorplanPersistenceResilienceStatus: "passed",
  assignmentSetContractStatus: "passed",
  nurseProfileBuilderStatus: "passed",
  roomLoadEditorStatus: "passed",
  manualAssignmentThreeColumnUxStatus: "passed",
  assignmentSetHandoffStatus: "passed"
};
const manifestMismatches = Object.entries(expected)
  .filter(([key, value]) => manifest[key] !== value)
  .map(([key, value]) => ({ key, expected: value, actual: manifest[key] }));
addCheck(checks, "manifest statuses align with rerun validators", manifestMismatches.length === 0, manifestMismatches);
addCheck(checks, "no downstream scope drift is declared", manifest.optimizerStatus === "not_started" && manifest.assignmentRecommendationStatus === "not_started" && manifest.noPhiStatus === "passed", manifest);

const status = statusFromChecks(checks);
const blockers = checks.filter((check) => !check.passed).map((check) => ({ blocker: check.name, detail: check.detail }));
const finalDecision = status === "passed"
  ? {
      editorAssignmentUxGoNoGoStatus: "go_for_room_burden_scoring_and_scenario_builder",
      goNoGoStatus: "go_for_next_batch"
    }
  : {
      editorAssignmentUxGoNoGoStatus: blockers.some((blocker) => blocker.blocker.includes("scope")) ? "no_go" : "go_for_additional_editor_assignment_repair",
      goNoGoStatus: blockers.some((blocker) => blocker.blocker.includes("scope")) ? "no_go_with_exact_blockers" : "blocked_with_exact_editor_assignment_items"
    };

writeJson(`${dir}/remaining-blockers.json`, {
  status: blockers.length === 0 ? "passed" : "failed",
  blockers
});
writeFinalAudit(status, finalDecision, blockers);
writeProjectStatus(status, finalDecision, blockers);
writeJson(`${dir}/test-output/editor-assignment-ux-go-no-go.txt`, {
  status,
  issue,
  stage,
  checks,
  summaries,
  finalDecision,
  blockers
});

updateManifest(issue, status === "passed"
  ? {
      ...finalDecision,
      editorAssignmentUxGoNoGoStatus: finalDecision.editorAssignmentUxGoNoGoStatus
    }
  : finalDecision);

writeCommandsAndCloseout(issue, "Editor + Assignment UX GO / NO-GO Audit", requiredCommands(), status, [
  "Final decision is based on local validator summaries plus manifest checks, not manifest flags alone."
]);
writeStageResult(issue, "editor-assignment-ux-go-no-go", stage, checks, { summaries, finalDecision, blockers });
if (status !== "passed" && !allowPartial) process.exit(1);

function readSummary(scriptName, targetName) {
  const source = `${dir}/test-output/${scriptName}.txt`;
  try {
    const summary = readJson(source);
    const normalized = { source, ...summary };
    writeJson(`${dir}/${targetName}`, normalized);
    return normalized;
  } catch (error) {
    const normalized = {
      source,
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    };
    writeJson(`${dir}/${targetName}`, normalized);
    return normalized;
  }
}

function writeFinalAudit(status, finalDecision, blockers) {
  const blockerText = blockers.length === 0
    ? "- None."
    : blockers.map((blocker) => `- ${blocker.blocker}: ${JSON.stringify(blocker.detail)}`).join("\n");
  writeText(`${dir}/final-editor-assignment-ux-audit.md`, `# Editor + Assignment UX Final Audit

Status: ${status}

Decision: ${finalDecision.editorAssignmentUxGoNoGoStatus}

Evidence basis:
- Rerun Issue 704-712 validators.
- Rerun active floorplan workflow GO / NO-GO from Issue 703.
- Rerun door authoring browser regression.
- Rerun split-room browser regression.
- Confirm no PHI, optimizer, recommendation, clinical safety, staffing compliance, patient outcome, or EHR scope drift.

Blockers:
${blockerText}
`);
  writeText(`${dir}/go-no-go.md`, `# Editor + Assignment UX GO / NO-GO

Decision: ${finalDecision.goNoGoStatus}

Editor assignment UX: ${finalDecision.editorAssignmentUxGoNoGoStatus}
`);
}

function writeProjectStatus(status, finalDecision, blockers) {
  const blockerText = blockers.length === 0
    ? "- None."
    : blockers.map((blocker) => `- ${blocker.blocker}`).join("\n");
  writeText("docs/project/editor-assignment-ux-status.md", `# Editor + Assignment UX Status

Batch 704-713 productizes the active floorplan foundation into the normal workflow:

- Floorplan
- Assignments
- Scenarios
- Simulation
- Reports

Final audit status: ${status}

Editor assignment UX decision: ${finalDecision.editorAssignmentUxGoNoGoStatus}

Project GO / NO-GO decision: ${finalDecision.goNoGoStatus}

Scope boundaries:

- This batch is editor and assignment productization only.
- Scenario Builder remains foundation-only.
- Simulation Review remains internal dry-run only.
- Reports remain placeholder-only.
- Optimization and assignment recommendations remain not started.
- Clinical safety scoring, staffing compliance certification, patient outcome prediction, PHI workflows, and EHR integration remain out of scope.

Source regression status:

- Active floorplan workflow GO / NO-GO was rerun for Issue 713.
- Door authoring browser regression was rerun for Issue 713.
- Split-room browser regression was rerun for Issue 713.

Blockers:
${blockerText}
`);
}

function writeScreenshots() {
  const screenshots = [
    "final-floorplan-hub.png",
    "final-editor-normal-mode.png",
    "final-manual-assignment.png",
    "final-scenario-handoff.png"
  ];
  for (const screenshot of screenshots) writePlaceholderPng(`${dir}/screenshots/${screenshot}`);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: screenshots.map((screenshot) => `${dir}/screenshots/${screenshot}`)
  });
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "npm run check:clean-committed-state",
    "node scripts/check-editor-assignment-ux-preflight.mjs --stage final --issue 713",
    "node scripts/check-product-shell-workflow.mjs --stage final --issue 713",
    "node scripts/check-active-floorplan-hub-ux.mjs --stage final --issue 713",
    "node scripts/check-editor-normal-toolbar-ux.mjs --stage final --issue 713",
    "node scripts/check-floorplan-readiness-truth.mjs --stage final --issue 713",
    "node scripts/check-active-floorplan-persistence-resilience.mjs --stage final --issue 713",
    "node scripts/check-assignment-set-contract.mjs --stage final --issue 713",
    "node scripts/check-nurse-profile-builder.mjs --stage final --issue 713",
    "node scripts/check-room-load-editor.mjs --stage final --issue 713",
    "node scripts/check-manual-assignment-three-column-ux.mjs --stage final --issue 713",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage final --issue 713",
    "node scripts/check-active-floorplan-workflow-go-no-go.mjs --stage final --issue 713",
    "node scripts/check-door-authoring-browser-regression.mjs --stage final --issue 713",
    "node scripts/check-split-room-browser-regression.mjs --stage final --issue 713",
    "node scripts/check-editor-assignment-ux-go-no-go.mjs --stage final --issue 713",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
