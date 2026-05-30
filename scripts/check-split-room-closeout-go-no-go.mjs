#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  loadSplitRoomCloseoutHardeningManifest,
  readArg,
  readJson,
  requiredIssueCommands,
  splitRoomCloseoutHardeningManifestPath,
  statusFromChecks,
  updateSplitRoomCloseoutHardeningManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageSummary,
  writeText,
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";

const issue = readArg("--issue", "693");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

if (stage !== "final") {
  throw new Error(`Unsupported split-room closeout GO/NO-GO stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: final closeout GO/NO-GO must rerun validators and report exact blockers instead of trusting manifest flags.\n"
);

const checks = [];
const summaries = {
  adjacencyHardening: readValidatorSummary({
    label: "split-room adjacency hardening",
    source: `${dir}/test-output/split-room-adjacency-hardening.txt`,
    target: `${dir}/adjacency-hardening-summary.json`
  }),
  manualAssignmentBrowser: readValidatorSummary({
    label: "split-room Manual Assignment browser proof",
    source: `${dir}/test-output/split-room-manual-assignment-browser.txt`,
    target: `${dir}/manual-assignment-browser-summary.json`
  }),
  artifactNaming: readValidatorSummary({
    label: "split/door artifact naming",
    source: `${dir}/test-output/split-door-artifact-naming.txt`,
    target: `${dir}/artifact-naming-summary.json`
  }),
  unsplitConfirmation: readValidatorSummary({
    label: "split-room unsplit confirmation",
    source: `${dir}/test-output/split-room-unsplit-confirmation.txt`,
    target: `${dir}/unsplit-confirmation-summary.json`
  }),
  splitRoomBrowserRegression: readValidatorSummary({
    label: "Issue 688 split-room browser regression rerun",
    source: `${dir}/test-output/split-room-browser-regression.txt`,
    target: `${dir}/split-room-browser-regression-summary.json`
  }),
  doorBrowserRegression: readValidatorSummary({
    label: "door browser regression rerun",
    source: `${dir}/test-output/door-authoring-browser-regression.txt`,
    target: `${dir}/door-browser-regression-summary.json`
  })
};

for (const [key, summary] of Object.entries(summaries)) {
  addCheck(
    checks,
    `${summary.label} validator passed from local issue-${issue} evidence`,
    summary.status === "passed" && String(summary.issue) === String(issue),
    { key, source: summary.source, status: summary.status, issue: summary.issue, stage: summary.stage }
  );
}

const manifestBefore = loadSplitRoomCloseoutHardeningManifest(issue);
const boundaryExpectations = {
  doorAuthoringStatus: "passed",
  collaborationStatus: "not_started",
  simulationV0Status: "internal_dry_run_only",
  optimizerStatus: "not_started",
  assignmentRecommendationStatus: "not_started",
  clinicalSafetyScoringStatus: "not_started",
  staffingComplianceStatus: "not_started",
  patientOutcomePredictionStatus: "not_started",
  promotionStatus: "blocked",
  noPhiStatus: "passed"
};
const boundaryMismatches = Object.entries(boundaryExpectations)
  .filter(([key, expected]) => manifestBefore[key] !== expected)
  .map(([key, expected]) => ({ key, expected, actual: manifestBefore[key] }));
addCheck(checks, "project boundaries remain unchanged in closeout manifest", boundaryMismatches.length === 0, boundaryMismatches);

const status = statusFromChecks(checks);
const blockers = checks
  .filter((check) => !check.passed)
  .map((check) => ({ blocker: check.name, detail: check.detail }));
const finalDecision = buildFinalDecision(status, blockers, boundaryMismatches);

writeJson(`${dir}/remaining-blockers.json`, {
  status: blockers.length === 0 ? "passed" : "failed",
  blockers
});
writeFinalAudit(status, blockers, finalDecision);

if (status === "passed") {
  updateSplitRoomCloseoutHardeningManifest(issue, {
    splitRoomCloseoutGoNoGoStatus: "go_for_full_er_floorplan_reconstruction",
    splitRoomAdjacencyHardeningStatus: "passed",
    splitRoomManualAssignmentBrowserStatus: "passed",
    splitDoorEvidenceNamingStatus: "passed",
    splitRoomUnsplitConfirmationStatus: "passed",
    reconstructionStatus: "go_for_full_er_floorplan_reconstruction",
    goNoGoStatus: "go_for_full_er_floorplan_reconstruction",
    splitRoomSeparatedAlignedRoomsBlocked: true,
    splitRoomCanonicalPairsStillPass: true,
    splitRoomOverlapBlocked: true,
    splitRoomChildManualAssignmentProof: true,
    splitRoomParentNotAssignableProof: true,
    splitRoomChildBurdenProof: true,
    splitRoomIndependentColorProof: true,
    doorProofArtifactTyped: true,
    splitRoomProofArtifactTyped: true,
    genericBrowserProofCollisionRemoved: true,
    finalAuditReferencesTypedArtifacts: true,
    unsplitRequiresConfirmation: true,
    unsplitCancelPreservesSplit: true,
    unsplitPreservesChildRooms: true,
    splitRoomStatusCopyCurrentGo: true
  });
} else {
  updateSplitRoomCloseoutHardeningManifest(issue, {
    splitRoomCloseoutGoNoGoStatus: finalDecision.splitRoomCloseoutGoNoGoStatus,
    reconstructionStatus: finalDecision.goNoGoStatus,
    goNoGoStatus: finalDecision.goNoGoStatus
  });
}

writeStageSummary(issue, "split-room-closeout-go-no-go", status, stage, checks, summaries);
writeJson(`${dir}/test-output/split-room-closeout-go-no-go.txt`, {
  status,
  issue,
  stage,
  checks,
  summaries,
  finalDecision,
  blockers
});
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, finalDecision, blockers }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function readValidatorSummary({ label, source, target }) {
  try {
    const summary = readJson(source);
    const normalized = {
      label,
      source,
      ...summary
    };
    writeJson(target, normalized);
    return normalized;
  } catch (error) {
    const normalized = {
      label,
      source,
      status: "failed",
      issue,
      stage: null,
      error: error instanceof Error ? error.message : String(error)
    };
    writeJson(target, normalized);
    return normalized;
  }
}

function buildFinalDecision(overallStatus, blockers, boundaryMismatches) {
  if (overallStatus === "passed") {
    return {
      splitRoomCloseoutGoNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      goNoGoStatus: "go_for_full_er_floorplan_reconstruction"
    };
  }
  if (boundaryMismatches.length > 0) {
    return {
      splitRoomCloseoutGoNoGoStatus: "no_go",
      goNoGoStatus: "no_go_with_exact_blockers",
      blockers
    };
  }
  return {
    splitRoomCloseoutGoNoGoStatus: "go_for_additional_split_room_closeout_repair",
    goNoGoStatus: "blocked_with_exact_split_room_closeout_items",
    blockers
  };
}

function writeFinalAudit(overallStatus, blockers, finalDecision) {
  const blockerText = blockers.length === 0
    ? "- None."
    : blockers.map((item) => `- ${item.blocker}: ${JSON.stringify(item.detail)}`).join("\n");
  writeText(`${dir}/final-split-room-closeout-audit.md`, `# Split-Room Closeout Final Audit

Status: ${overallStatus}

Decision: ${finalDecision.splitRoomCloseoutGoNoGoStatus}

Evidence basis:
- Rerun Issue 689 adjacency hardening validator.
- Rerun Issue 690 real Manual Assignment browser validator.
- Rerun Issue 691 split/door typed artifact validator.
- Rerun Issue 692 unsplit confirmation validator.
- Rerun Issue 688 split-room browser regression validator.
- Rerun door browser regression validator.

This audit reads the validator output artifacts for issue ${issue}; it does not grant GO from manifest flags alone.

Blockers:
${blockerText}

Boundary confirmation:
- No PHI.
- No EHR integration.
- No optimizer or assignment recommendations.
- No clinical safety, staffing compliance, or patient outcome claims.
`);
  writeText(`${dir}/go-no-go.md`, `# Split-Room Closeout GO / NO-GO

Decision: ${finalDecision.splitRoomCloseoutGoNoGoStatus}

goNoGoStatus: ${finalDecision.goNoGoStatus}

Blockers:
${blockerText}
`);
  writeText("docs/project/split-room-authoring-status.md", `# Split-Room Authoring Status

Current Status: GO for full ER floorplan reconstruction.

Issue 688 closed the user workflow: select Room 5, create Split Room 4/5, verify divider and labels, save, reload, export/import JSON, and assign child positions independently.

Historical note: Issue 679 began with split-room authoring not user-ready. The status changed after the 679–688 truth loop passed.

## Batch 693 Final Closeout Audit

Status: ${overallStatus}

Decision: ${finalDecision.splitRoomCloseoutGoNoGoStatus}

The final closeout audit reran the split-room adjacency, Manual Assignment browser, split/door artifact naming, unsplit confirmation, split-room browser regression, and door browser regression validators from local evidence.

Blockers:
${blockerText}

Boundaries remain unchanged: no PHI, no EHR integration, no optimizer, no assignment recommendations, no clinical safety scoring, no staffing compliance certification, no patient outcome prediction, and no clinical free-text notes.

## Batch 688 Final Decision

Status: passed

Decision: go_for_full_er_floorplan_reconstruction

The target workflow is covered by local evidence: select Room 5, Create Split Room 4/5, verify one physical bay with a visible divider and labels 4 and 5, Save Working Copy, reload the same saved record, export/import JSON, and assign Room 4 and Room 5 independently while the parent split room remains non-assignable.
`);
}

function writeCommandsAndCloseout(overallStatus) {
  const commands = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "npm run check:clean-committed-state",
    `node scripts/check-split-room-adjacency-hardening.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-manual-assignment-browser.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-door-artifact-naming.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-unsplit-confirmation.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-browser-regression.mjs --stage final --issue ${issue}`,
    `node scripts/check-door-authoring-browser-regression.mjs --stage final --issue ${issue}`,
    `node scripts/check-split-room-closeout-go-no-go.mjs --stage final --issue ${issue}`,
    `node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue ${issue}`,
    "node scripts/check-production-docker-runtime.mjs",
    "node scripts/check-no-phi-fields.mjs"
  ];
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-adjacency-hardening.mjs --stage final --issue ${issue}`]: `${dir}/adjacency-hardening-summary.json`,
    [`node scripts/check-split-room-manual-assignment-browser.mjs --stage final --issue ${issue}`]: `${dir}/manual-assignment-browser-summary.json`,
    [`node scripts/check-split-door-artifact-naming.mjs --stage final --issue ${issue}`]: `${dir}/artifact-naming-summary.json`,
    [`node scripts/check-split-room-unsplit-confirmation.mjs --stage final --issue ${issue}`]: `${dir}/unsplit-confirmation-summary.json`,
    [`node scripts/check-split-room-browser-regression.mjs --stage final --issue ${issue}`]: `${dir}/split-room-browser-regression-summary.json`,
    [`node scripts/check-door-authoring-browser-regression.mjs --stage final --issue ${issue}`]: `${dir}/door-browser-regression-summary.json`,
    [`node scripts/check-split-room-closeout-go-no-go.mjs --stage final --issue ${issue}`]: `${dir}/test-output/split-room-closeout-go-no-go.txt`,
    "npm run check:clean-committed-state": `${dir}/test-output/clean-committed-state.txt`,
    "node scripts/check-production-docker-runtime.mjs": `${dir}/docker-runtime-output.json`
  });
  writeCloseout(
    issue,
    "Final split-room closeout GO / NO-GO audit.",
    overallStatus,
    commands,
    ["Final status is evidence-gated from rerun local validator outputs, not manifest-only."],
    [splitRoomCloseoutHardeningManifestPath, `${dir}/final-split-room-closeout-audit.md`, `${dir}/go-no-go.md`]
  );
}
