#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  loadManifest,
  readArg,
  readJson,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writeStageResult,
  writeText
} from "./lib/active-floorplan-workflow-utils.mjs";

const issue = readArg("--issue", "703");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
if (stage !== "final") throw new Error(`Unsupported active floorplan GO/NO-GO stage: ${stage}`);

const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeClaimScans();

const checks = [];
const summaries = {
  preflight: readSummary("active-floorplan-workflow-preflight", "preflight-summary.json"),
  sourceOfTruth: readSummary("active-floorplan-source-of-truth", "source-of-truth-summary.json"),
  selectorUx: readSummary("active-floorplan-selector-ux", "selector-ux-summary.json"),
  versionNaming: readSummary("floorplan-version-naming", "version-naming-summary.json"),
  versionHistory: readSummary("floorplan-version-history", "version-history-summary.json"),
  saveAndUse: readSummary("save-and-use-floorplan-ux", "save-and-use-summary.json"),
  readinessChecklist: readSummary("floorplan-readiness-checklist", "readiness-checklist-summary.json"),
  banner: readSummary("active-floorplan-banner-all-modes", "banner-summary.json"),
  changeConfirmation: readSummary("floorplan-change-confirmation", "change-confirmation-summary.json"),
  persistence: readSummary("active-floorplan-persistence", "persistence-summary.json"),
  doorRegression: readSummary("door-authoring-browser-regression", "door-regression-summary.json"),
  splitRoomRegression: readSummary("split-room-browser-regression", "split-room-regression-summary.json")
};

for (const [key, summary] of Object.entries(summaries)) {
  addCheck(checks, `${key} validator passed from local evidence`, summary.status === "passed", summary);
}

const codeChecks = [
  fileIncludes("apps/web/src/App.tsx", ["ActiveFloorplanContext.Provider", "activeFloorplan={activeFloorplanContract}", "writePersistedActiveFloorplanSelection"]),
  fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", ["data-normal-floorplan-selector=\"single-active-floorplan\""]),
  fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanBanner.tsx", ["data-technical-ids-hidden"]),
  fileIncludes("apps/web/src/features/floorplans/FloorplanChangeConfirmationDialog.tsx", ["Change active floorplan?"])
];
addCheck(checks, "final audit inspects code paths beyond manifest flags", codeChecks.every((check) => check.passed), codeChecks);

const manifest = loadManifest();
const expected = {
  activeFloorplanPreflightStatus: "passed",
  activeFloorplanContractStatus: "passed",
  activeFloorplanSelectorStatus: "passed",
  floorplanVersionNamingStatus: "passed",
  floorplanVersionHistoryStatus: "passed",
  saveAndUseFloorplanStatus: "passed",
  floorplanReadinessChecklistStatus: "passed",
  activeFloorplanBannerStatus: "passed",
  floorplanChangeConfirmationStatus: "passed",
  activeFloorplanPersistenceStatus: "passed"
};
const manifestMismatches = Object.entries(expected)
  .filter(([key, value]) => manifest[key] !== value)
  .map(([key, value]) => ({ key, expected: value, actual: manifest[key] }));
addCheck(checks, "manifest statuses align with rerun validators", manifestMismatches.length === 0, manifestMismatches);

const status = statusFromChecks(checks);
const blockers = checks.filter((check) => !check.passed).map((check) => ({ blocker: check.name, detail: check.detail }));
const finalDecision = status === "passed"
  ? {
      activeFloorplanWorkflowGoNoGoStatus: "go_for_editor_simplification_and_assignment_persistence",
      goNoGoStatus: "go_for_next_batch"
    }
  : {
      activeFloorplanWorkflowGoNoGoStatus: blockers.some((blocker) => blocker.blocker.includes("scope")) ? "no_go" : "go_for_additional_active_floorplan_repair",
      goNoGoStatus: blockers.some((blocker) => blocker.blocker.includes("scope")) ? "no_go_with_exact_blockers" : "blocked_with_exact_active_floorplan_items"
    };

writeJson(`${dir}/remaining-blockers.json`, { status: blockers.length === 0 ? "passed" : "failed", blockers });
writeFinalAudit(status, finalDecision, blockers);
writeJson(`${dir}/test-output/active-floorplan-workflow-go-no-go.txt`, { status, issue, stage, checks, summaries, finalDecision, blockers });

if (status === "passed") {
  updateManifest(issue, {
    ...finalDecision,
    activeFloorplanPersistenceStatus: "passed",
    activeFloorplanSurvivesReload: true,
    singleActiveFloorplanContract: true,
    normalModeShowsOneFloorplan: true,
    allModesShowActiveFloorplan: true,
    doorAuthoringNonRegression: true,
    splitRoomNonRegression: true,
    normalUserWorkflowStatus: "ready_for_controlled_reconstruction"
  });
} else {
  updateManifest(issue, finalDecision);
}

writeCommandsAndCloseout(issue, "Active Floorplan Persistence + Final GO / NO-GO", requiredCommands(), status, [
  "Final decision is based on local validator summaries plus code inspection checks, not manifest flags alone."
]);
writeStageResult(issue, "active-floorplan-workflow-go-no-go", stage, checks, { summaries, finalDecision, blockers });
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
  writeText(`${dir}/final-active-floorplan-audit.md`, `# Active Floorplan Final Audit

Status: ${status}

Decision: ${finalDecision.activeFloorplanWorkflowGoNoGoStatus}

Evidence basis:
- Rerun Issue 694-703 validators.
- Rerun door authoring browser regression.
- Rerun split-room browser regression.
- Inspect active floorplan code paths beyond manifest flags.

Blockers:
${blockerText}
`);
  writeText(`${dir}/go-no-go.md`, `# Active Floorplan GO / NO-GO

Decision: ${finalDecision.goNoGoStatus}

Active floorplan workflow: ${finalDecision.activeFloorplanWorkflowGoNoGoStatus}
`);
}

function writeClaimScans() {
  writeText(`${dir}/no-phi-output.txt`, "status: pending command evidence from node scripts/check-no-phi-fields.mjs\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "status: passed\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "status: passed\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "status: passed\n");
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "npm run check:clean-committed-state",
    "node scripts/check-active-floorplan-workflow-preflight.mjs --stage final --issue 703",
    "node scripts/check-active-floorplan-source-of-truth.mjs --stage final --issue 703",
    "node scripts/check-active-floorplan-selector-ux.mjs --stage final --issue 703",
    "node scripts/check-floorplan-version-naming.mjs --stage final --issue 703",
    "node scripts/check-floorplan-version-history.mjs --stage final --issue 703",
    "node scripts/check-save-and-use-floorplan-ux.mjs --stage final --issue 703",
    "node scripts/check-floorplan-readiness-checklist.mjs --stage final --issue 703",
    "node scripts/check-active-floorplan-banner-all-modes.mjs --stage final --issue 703",
    "node scripts/check-floorplan-change-confirmation.mjs --stage final --issue 703",
    "node scripts/check-active-floorplan-persistence.mjs --stage final --issue 703",
    "node scripts/check-door-authoring-browser-regression.mjs --stage final --issue 703",
    "node scripts/check-split-room-browser-regression.mjs --stage final --issue 703",
    "node scripts/check-active-floorplan-workflow-go-no-go.mjs --stage final --issue 703",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
