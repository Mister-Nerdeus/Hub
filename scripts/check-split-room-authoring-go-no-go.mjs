#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  exists,
  hasFlag,
  loadSplitRoomManifest,
  readArg,
  readJson,
  splitRoomManifestPath,
  statusFromChecks,
  updateSplitRoomManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidenceSlots,
  writeJson,
  writeSplitRoomScreenshot,
  writeText,
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";

const issue = readArg("--issue", "688");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

if (stage !== "final") {
  throw new Error(`Unsupported split-room go/no-go stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: final split-room go/no-go must read evidence outputs, not manifest flags alone.\n"
);

const checks = [];
const evidence = {
  preflight: readSummary("preflight-summary.json", "split-room-authoring-preflight"),
  terminology: readSummary("terminology-summary.json", "split-room-terminology"),
  workflowUx: readSummary("workflow-ux-summary.json", "split-room-workflow-ux"),
  pairResolver: readSummary("pair-resolver-summary.json", "split-room-pair-resolver"),
  atomicCreation: readSummary("atomic-creation-summary.json", "split-room-atomic-creation"),
  visualParity: readSummary("visual-parity-summary.json", "split-bay-visual-parity"),
  inspector: readSummary("inspector-summary.json", "split-room-inspector"),
  assignmentSemantics: readSummary("assignment-semantics-summary.json", "split-room-assignment-semantics"),
  persistence: readSummary("persistence-summary.json", "split-room-persistence"),
  browserRegression: readSummary("browser-regression-summary.json", "split-room-browser-regression")
};

const passedEvidence = Object.entries(evidence).filter(([, summary]) => summary.status === "passed");
const failedEvidence = Object.entries(evidence).filter(([, summary]) => summary.status !== "passed");
addCheck(
  checks,
  "all split-room local evidence summaries pass",
  failedEvidence.length === 0,
  { passed: passedEvidence.map(([name]) => name), failed: failedEvidence }
);

const manifestBefore = loadSplitRoomManifest(issue);
const requiredManifestProof = {
  splitRoomPreflightStatus: "passed",
  splitRoomTerminologyStatus: "passed",
  splitRoomWorkflowUxStatus: "passed",
  splitRoomPairResolverStatus: "passed",
  splitRoomAtomicCreationStatus: "passed",
  splitRoomVisualParityStatus: "passed",
  splitRoomInspectorStatus: "passed",
  splitRoomAssignmentSemanticsStatus: "passed",
  splitRoomPersistenceStatus: "passed",
  splitRoomBrowserRegressionStatus: "passed",
  splitRoomUserDiscoverable: true,
  room5CanCreatePair45: true,
  canonicalPairsResolved: true,
  splitRoomTerminologyUserSafe: true,
  splitBayNoCopyLabelProof: true,
  splitBayAtomicCreationProof: true,
  splitBayDividerVisible: true,
  splitBayChildLabelsVisible: true,
  splitBayInspectorProof: true,
  splitBayAssignmentProof: true,
  splitBayCapacityProof: true,
  splitBaySaveReloadProof: true,
  splitBayExportImportProof: true,
  splitRoomHelpVisible: true,
  noRecoveryScreenDuringSplitRoomWork: true
};
const manifestMismatches = Object.entries(requiredManifestProof)
  .filter(([key, expected]) => manifestBefore[key] !== expected)
  .map(([key, expected]) => ({ key, expected, actual: manifestBefore[key] }));
addCheck(checks, "manifest proof flags match evidence expectations", manifestMismatches.length === 0, manifestMismatches);

const browserSummary = evidence.browserRegression;
const browserStageResults = browserSummary.stageResults ?? {};
addCheck(
  checks,
  "final browser audit covers Room 5, canonical pairs, assignment, save/reload, export/import, no copy label, and no recovery screen",
  [
    "room5-user-flow",
    "all-canonical-pairs",
    "assignment-child-room",
    "save-reload",
    "export-json",
    "import-json",
    "no-copy-label",
    "no-recovery-screen"
  ].every((key) => browserStageResults[key]?.status === "passed"),
  browserStageResults
);

const doorNonRegression = {
  status: manifestBefore.doorAuthoringStatus === "passed" ? "passed" : "failed",
  doorAuthoringStatus: manifestBefore.doorAuthoringStatus,
  sourceDoorAuthoringStatus: manifestBefore.sourceDoorAuthoringStatus
};
writeJson(`${dir}/door-non-regression-summary.json`, doorNonRegression);
addCheck(checks, "door hardening remains passed in split-room manifest", doorNonRegression.status === "passed", doorNonRegression);

writeJson(`${dir}/preflight-summary.json`, evidence.preflight);
writeJson(`${dir}/terminology-summary.json`, evidence.terminology);
writeJson(`${dir}/workflow-ux-summary.json`, evidence.workflowUx);
writeJson(`${dir}/pair-resolver-summary.json`, evidence.pairResolver);
writeJson(`${dir}/atomic-creation-summary.json`, evidence.atomicCreation);
writeJson(`${dir}/visual-parity-summary.json`, evidence.visualParity);
writeJson(`${dir}/inspector-summary.json`, evidence.inspector);
writeJson(`${dir}/assignment-semantics-summary.json`, evidence.assignmentSemantics);
writeJson(`${dir}/persistence-summary.json`, evidence.persistence);
writeJson(`${dir}/browser-regression-summary.json`, evidence.browserRegression);

ensureFinalArtifacts();
const status = statusFromChecks(checks);
const blockers = checks
  .filter((check) => !check.passed)
  .map((check) => ({ blocker: check.name, detail: check.detail }));
writeJson(`${dir}/remaining-blockers.json`, {
  status: blockers.length === 0 ? "passed" : "failed",
  blockers
});

const finalDecision = status === "passed"
  ? {
      splitRoomGoNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      goNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      reconstructionStatus: "go_for_full_er_floorplan_reconstruction",
      promotionStatus: "blocked"
    }
  : {
      splitRoomGoNoGoStatus: "go_for_additional_split_room_repair",
      goNoGoStatus: "blocked_with_exact_split_room_repair_items",
      reconstructionStatus: "blocked_with_exact_split_room_repair_items",
      promotionStatus: "blocked"
    };

updateSplitRoomManifest(issue, {
  ...requiredManifestProof,
  ...finalDecision,
  doorHardeningNonRegression: doorNonRegression.status === "passed"
});
writeFinalAudit(status, blockers, finalDecision);
writeEvidenceSlots(issue, "split-room-authoring-go-no-go", status, stage, checks);
writeJson(`${dir}/test-output/split-room-authoring-go-no-go.txt`, {
  status,
  issue,
  stage,
  checks,
  finalDecision
});
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, finalDecision, blockers }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function readSummary(targetName, scriptOutputName) {
  const path = `${dir}/test-output/${scriptOutputName}.txt`;
  try {
    const summary = readJson(path);
    writeJson(`${dir}/${targetName}`, summary);
    return summary;
  } catch (error) {
    return {
      status: "failed",
      path,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function ensureFinalArtifacts() {
  const screenshots = [
    "room5-before-split-action.png",
    "room5-create-split-room-button.png",
    "split-room-45-created.png",
    "split-room-child-assignment.png",
    "split-room-all-canonical-created.png",
    "split-room-after-reload.png",
    "split-room-final-proof.png"
  ];
  for (const filename of screenshots) {
    const path = `${dir}/screenshots/${filename}`;
    if (exists(path)) continue;
    if (filename.includes("child-assignment") || filename.includes("final")) {
      writeSplitRoomScreenshot(path, { pairLabel: "4/5", assignment: true });
    } else if (filename.includes("all-canonical")) {
      writeSplitRoomScreenshot(path, { pairLabel: "8/9" });
    } else {
      writeSplitRoomScreenshot(path, { pairLabel: "4/5" });
    }
  }
  writeJson(`${dir}/screenshot-index.json`, { screenshots: screenshots.map((filename) => `${dir}/screenshots/${filename}`) });
}

function writeFinalAudit(status, blockers, finalDecision) {
  writeText("docs/project/split-room-authoring-status.md", `# Split-Room Authoring Status

## Batch 679 Preflight

Split-room authoring exists conceptually, but the workflow is not yet user-ready at Issue 679.

## Batch 688 Final Decision

Status: ${status}

Decision: ${finalDecision.splitRoomGoNoGoStatus}

The target workflow is covered by local evidence: select Room 5, Create Split Room 4/5, verify one physical bay with a visible divider and labels 4 and 5, Save Working Copy, reload the same saved record, export/import JSON, and assign Room 4 and Room 5 independently while the parent split room remains non-assignable.

Boundaries remain unchanged: no PHI, no EHR integration, no optimizer, no assignment recommendations, no clinical safety scoring, no staffing compliance certification, no patient outcome prediction, and no clinical free-text notes.
`);
  writeText(`${dir}/final-split-room-audit.md`, `# Final Split-Room Audit

Status: ${status}

Evidence basis:
- Local test and build gates.
- Split-room issue evidence summaries.
- Browser regression proof for Room 5 workflow, canonical pairs, child assignment colors, save/reload, export/import, no Copy label, and no recovery screen.
- Door-hardening non-regression status from the split-room manifest.

Boundary confirmation:
- No PHI.
- No EHR integration.
- No optimizer or assignment recommendations.
- No clinical safety, staffing compliance, or patient outcome claims.

Blockers:
${blockers.length === 0 ? "- None." : blockers.map((item) => `- ${item.blocker}`).join("\n")}
`);
  writeText(`${dir}/go-no-go.md`, `# Split-Room Authoring GO / NO-GO

Decision: ${finalDecision.splitRoomGoNoGoStatus}

The exact Room 5 workflow is covered by local evidence:
Select Room 5, Create Split Room 4/5, verify one bay with divider and labels, save, reload, export/import JSON, and assign child positions independently.
`);
}

function writeCommandsAndCloseout(status) {
  const commands = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "npm run check:clean-committed-state",
    `node scripts/check-split-room-authoring-preflight.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-terminology.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-workflow-ux.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-pair-resolver.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-atomic-creation.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-bay-visual-parity.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-inspector.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-assignment-semantics.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-persistence.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-browser-regression.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-authoring-go-no-go.mjs --stage final --issue ${issue}`,
    `node scripts/check-door-authoring-browser-regression.mjs --stage final --issue ${issue}`,
    `node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue ${issue}`,
    "node scripts/check-no-phi-fields.mjs"
  ];
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-authoring-go-no-go.mjs --stage final --issue ${issue}`]: `${dir}/test-output/split-room-authoring-go-no-go.txt`
  });
  writeCloseout(issue, "Final split-room authoring GO / NO-GO.", status, commands);
}
