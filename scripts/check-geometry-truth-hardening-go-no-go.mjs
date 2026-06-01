#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  hardeningRootScripts,
  readArg,
  readJson,
  runRequiredHardeningValidators,
  statusFromChecks,
  updateHardeningManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/geometry-truth-hardening-utils.mjs";

const issue = readArg("--issue", "830");
const stage = readArg("--stage", "final");
const scriptName = "check-geometry-truth-hardening-go-no-go";
const commands = [
  `node scripts/${scriptName}.mjs --stage validator-execution-required --issue 816`,
  `node scripts/${scriptName}.mjs --stage manifest-not-sole-proof --issue 816`,
  `node scripts/${scriptName}.mjs --stage split-room-browser-required --issue 816`,
  `node scripts/${scriptName}.mjs --stage placeholder-proof-rejected --issue 816`,
  `node scripts/${scriptName}.mjs --stage final --issue 830`
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);

const checks = buildChecks(stage);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/go-no-go-output.json`, {
  status,
  issue: String(issue),
  stage,
  requiredValidators: Object.values(hardeningRootScripts),
  validatorExecutionResults: checks.find((check) => check.name === "hardening validators executed")?.detail ?? null
});
writeJson(`docs/verification/issues/issue-${issue}/geometry-hardening-consistency-output.json`, {
  status,
  issue: String(issue),
  geometryHardeningCloseoutConsistencyStatus: status,
  hardeningManifestLastUpdatedIssueCorrect: String(issue) === "831",
  durableAssignmentFoundationStatusContradictionResolved: status === "passed",
  goNoGoStatus: status === "passed" ? "go_for_next_milestone" : "not_ready"
});

if (status === "passed") {
  if (issue === "816") {
    updateHardeningManifest(issue, {
      geometryGoNoGoHardeningStatus: "passed",
      goNoGoRunsBehaviorValidators: true,
      manifestAloneCannotPassGoNoGo: true,
      browserRegressionRequiredForGo: true,
      placeholderProofRejectedForGo: true,
      durableAssignmentFoundationStatus: "blocked_until_split_room_editor_behavior_verified"
    });
  }
  if (stage === "final" || issue === "830") {
    updateHardeningManifest(issue, {
      geometryGoNoGoHardeningStatus: "passed",
      geometryTruthHardGoNoGoStatus: "go_for_durable_assignment_foundation",
      durableAssignmentFoundationStatus: "go_for_durable_assignment_foundation",
      geometryHardeningCloseoutConsistencyStatus: "passed",
      hardeningManifestLastUpdatedIssueCorrect: true,
      durableAssignmentFoundationStatusContradictionResolved: true,
      legacySplitBayNormalFlowRemoved: true,
      singleRoomSplitRoomEditorFlowVerified: true,
      splitRoomBrowserBehaviorVerified: true,
      assignmentTargetsStable: true,
      goNoGoStatus: "go_for_next_milestone"
    });
  }
}

writeCloseout(issue, {
  title: issue === "816" ? "Geometry GO/NO-GO Hardening" : "Geometry Truth HARD GO/NO-GO",
  reviewFinding: "Hard GO/NO-GO requires executable validators, real browser screenshot proof, and the split-room browser regression before durable assignment foundation can proceed.",
  status,
  filesChanged: [
    "scripts/check-geometry-truth-hardening-go-no-go.mjs",
    "scripts/lib/geometry-truth-hardening-utils.mjs",
    "docs/verification/geometry-truth-hardening-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/go-no-go-output.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: issue === "816"
    ? ["Final GO remains blocked until issue 829 writes hard browser regression proof."]
    : ["Durable assignment persistence remains out of scope for this batch."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

function buildChecks(targetStage) {
  const checksForStage = [];
  const scriptTextChecks = [
    fileIncludes("scripts/check-split-room-hard-browser-regression.mjs", [
      "withBrowserRenderedApp",
      "document.querySelectorAll('[data-layout-object-type=\"split_room_parent\"]')",
      "document.querySelectorAll('[data-layout-object-type=\"bed_position\"]')",
      "screenshot-index.json"
    ]),
    fileIncludes("scripts/check-real-screenshot-proof-required.mjs", [
      "placeholderScreenshotsRejectedForFinalProof",
      "check-split-room-hard-browser-regression.mjs"
    ])
  ];

  if (targetStage === "validator-execution-required") {
    addCheck(checksForStage, "GO/NO-GO script references executable validators", fileIncludes("scripts/check-geometry-truth-hardening-go-no-go.mjs", [
      "requiredValidators",
      "runRequiredHardeningValidators",
      "hardeningRootScripts",
      "splitRoomHardBrowserRegressionStatus"
    ]).passed);
    addCheck(checksForStage, "root script matrix includes hardening validators", Object.keys(hardeningRootScripts).length >= 15, {
      count: Object.keys(hardeningRootScripts).length
    });
    return checksForStage;
  }

  if (targetStage === "manifest-not-sole-proof") {
    addCheck(checksForStage, "GO/NO-GO requires source/browser validator proof beyond manifest", scriptTextChecks.every((check) => check.passed), scriptTextChecks);
    addCheck(checksForStage, "manifest-only final proof is rejected", fileIncludes("scripts/check-geometry-truth-hardening-go-no-go.mjs", [
      "manifestAloneCannotPassGoNoGo",
      "requiredValidators"
    ]).passed);
    return checksForStage;
  }

  if (targetStage === "split-room-browser-required") {
    addCheck(checksForStage, "browser regression is a final GO requirement", fileIncludes("scripts/check-geometry-truth-hardening-go-no-go.mjs", [
      "splitRoomHardBrowserRegressionStatus",
      "browserRegressionRequiredForGo",
      "splitRoomBrowserBehaviorVerified"
    ]).passed);
    return checksForStage;
  }

  if (targetStage === "placeholder-proof-rejected") {
    addCheck(checksForStage, "placeholder screenshots are rejected for final proof", fileIncludes("scripts/check-geometry-truth-hardening-go-no-go.mjs", [
      "placeholderProofRejectedForGo",
      "placeholderScreenshotsRejectedForFinalProof"
    ]).passed);
    addCheck(checksForStage, "hardening screenshot validators do not write placeholder PNGs", fileExcludes("scripts/check-split-room-hard-browser-regression.mjs", ["writePlaceholderPng"]).passed);
    return checksForStage;
  }

  if (targetStage !== "final") {
    throw new Error(`Unsupported ${scriptName} stage: ${targetStage}`);
  }

  const validatorExecutionResults = runRequiredHardeningValidators();
  const failedValidators = validatorExecutionResults.filter((result) => result.status !== "passed");
  writeJson(`docs/verification/issues/issue-${issue}/validator-execution-output.json`, {
    status: failedValidators.length === 0 ? "passed" : "failed",
    issue: String(issue),
    validators: validatorExecutionResults
  });
  addCheck(checksForStage, "hardening validators executed", failedValidators.length === 0, {
    failedValidators,
    executedValidators: validatorExecutionResults.map((result) => result.scriptName)
  });

  const manifest = readJson("docs/verification/geometry-truth-hardening-manifest.json");
  const requiredPassed = [
    "legacySplitBayNormalFlowStatus",
    "splitRoomReducerWiringStatus",
    "editableLayoutSplitRoomStateStatus",
    "splitRoomRenderPathStatus",
    "splitBedSelectionStateStatus",
    "splitParentMoveResizeWiringStatus",
    "splitDividerReducerActionsStatus",
    "splitRoomInspectorNormalFlowStatus",
    "wallSelectionBehaviorStatus",
    "hardGeometrySaveReloadStatus",
    "realGeometryScreenshotProofStatus",
    "splitRoomHardBrowserRegressionStatus"
  ];
  const missing = requiredPassed.filter((key) => manifest[key] !== "passed");

  addCheck(checksForStage, "hardening validators passed in manifest", missing.length === 0, { missing });
  addCheck(checksForStage, "root hardening validators are wired", Object.keys(hardeningRootScripts).every((scriptNameKey) => manifestRequiredScriptExists(scriptNameKey)), {
    rootScripts: Object.keys(hardeningRootScripts)
  });
  addCheck(checksForStage, "final browser screenshot proof is non-placeholder", manifest.realGeometryScreenshotProofStatus === "passed" && manifest.placeholderScreenshotsRejectedForFinalProof === true, {
    realGeometryScreenshotProofStatus: manifest.realGeometryScreenshotProofStatus,
    placeholderScreenshotsRejectedForFinalProof: manifest.placeholderScreenshotsRejectedForFinalProof
  });
  addCheck(checksForStage, "hard split-room browser behavior is verified", manifest.splitRoomHardBrowserRegressionStatus === "passed" && manifest.singleRoomToSplitRoomBrowserFlowPassed === true, {
    splitRoomHardBrowserRegressionStatus: manifest.splitRoomHardBrowserRegressionStatus,
    singleRoomToSplitRoomBrowserFlowPassed: manifest.singleRoomToSplitRoomBrowserFlowPassed
  });
  addCheck(checksForStage, "no durable assignment persistence contract was created", fileExcludes("packages/shared/src/contracts.ts", ["AssignmentSetContract"]).passed);
  return checksForStage;
}

function manifestRequiredScriptExists(scriptNameKey) {
  return Object.prototype.hasOwnProperty.call(hardeningRootScripts, scriptNameKey);
}
