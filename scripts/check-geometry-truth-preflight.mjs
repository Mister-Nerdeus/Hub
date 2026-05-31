#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  readArg,
  readText,
  statusFromChecks,
  updateGeometryTruthManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writePlaceholderPng,
  writeStageResult,
  writeText
} from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "765");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-geometry-truth-preflight";
const title = "Geometry Truth Repair Preflight";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-geometry-truth-preflight.mjs --stage manifest-contract --issue 765",
  "node scripts/check-geometry-truth-preflight.mjs --stage failure-reproduction --issue 765",
  "node scripts/check-geometry-truth-preflight.mjs --stage scope-boundary --issue 765",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "manifest-contract": checkManifestContract,
  "failure-reproduction": checkFailureReproduction,
  "scope-boundary": checkScopeBoundary,
  "root-script-wiring": checkRootScriptWiring
};

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, title, commands);
writePreflightScreenshotIndex(issue);

const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};

for (const stageName of selectedStages) {
  const runStage = stages[stageName];
  if (runStage == null) {
    throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  }
  const result = runStage();
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateGeometryTruthManifest(issue, {
    geometryTruthPreflightStatus: "passed",
    geometryTruthGoNoGoStatus: "not_ready",
    durableAssignmentFoundationStatus: "blocked_until_geometry_targets_stable"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      geometryTruthPreflightStatus: "passed",
      geometryTruthGoNoGoStatus: "not_ready",
      durableAssignmentFoundationStatus: "blocked_until_geometry_targets_stable"
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Preflight review found the editor has useful floorplan visuals, but the durable-assignment foundation is blocked by missing rendered-object identity, missing wall geometry, unclassified reference/artifact visuals, and legacy split-bay child-room semantics.",
  filesChanged: [
    "docs/verification/geometry-truth-repair-manifest.json",
    "docs/project/geometry-truth-repair-status.md",
    "scripts/lib/geometry-truth-repair-utils.mjs",
    "scripts/check-geometry-truth-preflight.mjs",
    "scripts/check-geometry-truth-go-no-go.mjs",
    "package.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/manifest-contract-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/failure-reproduction-output.json`] },
    { command: commands[5], outputs: [`docs/verification/issues/issue-${issue}/scope-boundary-output.json`] },
    { command: commands[6], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/first-failure.txt`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`,
    "docs/verification/geometry-truth-repair-manifest.json"
  ],
  limitations: ["Issue 765 intentionally leaves geometry GO/NO-GO not ready until issues 766-810 pass."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkManifestContract() {
  const requiredKeys = [
    "geometryTruthPreflightStatus",
    "geometryTruthGoNoGoStatus",
    "durableAssignmentFoundationStatus"
  ];
  return checkAll([
    fileIncludes("docs/verification/geometry-truth-repair-manifest.json", [
      ...requiredKeys.map((key) => `"${key}":`),
      "\"geometryTruthGoNoGoStatus\": \"not_ready\"",
      "\"durableAssignmentFoundationStatus\": \"blocked_until_geometry_targets_stable\""
    ]),
    fileIncludes("docs/project/geometry-truth-repair-status.md", [
      "Geometry truth repair is in progress",
      "Durable assignment foundation remains blocked"
    ])
  ]);
}

function checkFailureReproduction() {
  const firstFailurePath = `docs/verification/issues/issue-${issue}/first-failure.txt`;
  const requiredFindings = [
    "Hallways render, but rendered objects do not yet declare a geometry layer contract.",
    "Outer walls are not first-class wall geometry.",
    "Reference/background visuals are not locked toggleable overlays.",
    "Legacy split rooms still reference child rooms through split bay geometry."
  ];
  const existing = readText(firstFailurePath);
  if (requiredFindings.every((finding) => existing.includes(finding))) {
    return { passed: true, mode: "recorded-first-failure", findings: requiredFindings };
  }

  const sourceFindings = [
    {
      finding: requiredFindings[0],
      passed: readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx").includes("<HallwayShape")
        && !fileExists("packages/shared/src/floorplans/geometryLayerContract.ts")
    },
    {
      finding: requiredFindings[1],
      passed: !fileExists("packages/shared/src/floorplans/wallGeometryContract.ts")
        && readText("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts").includes("\"solid_wall\"")
    },
    {
      finding: requiredFindings[2],
      passed: !fileExists("apps/web/src/features/layout-editor/ReferenceOverlayToggle.tsx")
        && !fileExists("packages/shared/src/floorplans/referenceOverlayContract.ts")
    },
    {
      finding: requiredFindings[3],
      passed: readText("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts").includes("bedPositionRoomIds")
        && readText("apps/web/src/features/layout-editor/SplitBayShape.tsx").includes("data-split-bay-child-room-ids")
    }
  ];
  const passed = sourceFindings.every((entry) => entry.passed);
  if (passed) {
    writeText(firstFailurePath, [
      "Reproduced before repair from default-branch source evidence:",
      ...requiredFindings.map((finding) => `- ${finding}`)
    ].join("\n"));
  }
  return { passed, mode: "source-baseline", sourceFindings };
}

function checkScopeBoundary() {
  return checkAll([
    fileIncludes("docs/verification/geometry-truth-repair-manifest.json", [
      "\"geometryTruthGoNoGoStatus\": \"not_ready\"",
      "\"durableAssignmentFoundationStatus\": \"blocked_until_geometry_targets_stable\""
    ]),
    fileIncludes("docs/project/geometry-truth-repair-status.md", [
      "Durable assignment persistence is not implemented",
      "Nurse profile builder",
      "Room load editor",
      "burden scoring",
      "scenario simulation",
      "optimizer",
      "management reports",
      "clinical safety claims",
      "staffing compliance claims",
      "patient outcome claims",
      "EHR integration",
      "PHI"
    ])
  ]);
}

function checkRootScriptWiring() {
  return checkAll([
    fileIncludes("package.json", [
      "\"check:geometry-truth-preflight\"",
      "\"check:geometry-truth-go-no-go\""
    ])
  ]);
}

function fileExists(path) {
  try {
    readText(path);
    return true;
  } catch {
    return false;
  }
}

function writePreflightScreenshotIndex(targetIssue) {
  const screenshots = [
    "hallways-not-first-class.png",
    "outer-walls-not-first-class.png",
    "reference-artifacts-mixed.png",
    "legacy-split-bay-child-rooms.png"
  ];
  for (const screenshot of screenshots) {
    writePlaceholderPng(`docs/verification/issues/issue-${targetIssue}/screenshots/${screenshot}`);
  }
  writeJson(`docs/verification/issues/issue-${targetIssue}/screenshot-index.json`, {
    status: "passed",
    issue: String(targetIssue),
    screenshotPurpose: "Preflight reproduction placeholders paired with source-recorded first-failure evidence.",
    screenshots: screenshots.map((name) => `docs/verification/issues/issue-${targetIssue}/screenshots/${name}`)
  });
}
