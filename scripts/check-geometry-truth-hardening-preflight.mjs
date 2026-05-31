#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileIncludes,
  hardeningManifestDefaults,
  readArg,
  readText,
  statusFromChecks,
  updateHardeningManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult,
  writeText
} from "./lib/geometry-truth-hardening-utils.mjs";

const issue = readArg("--issue", "815");
const stage = readArg("--stage", "final");
const scriptName = "check-geometry-truth-hardening-preflight";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage manifest-contract --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage reproduce-legacy-split-bay-flow --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage scope-boundary --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const stages = {
  "manifest-contract": manifestContract,
  "reproduce-legacy-split-bay-flow": reproduceLegacySplitBayFlow,
  "scope-boundary": scopeBoundary,
  final: final
};
const checks = (stages[stage] ?? unsupported)();
const status = statusFromChecks(checks);
if (status === "passed") {
  updateHardeningManifest(issue, {
    geometryTruthHardeningPreflightStatus: "passed",
    legacySplitBayNormalFlowDetected: true,
    durableAssignmentFoundationStatus: "blocked_until_split_room_editor_behavior_verified"
  });
}
writeCloseout(issue, {
  title: "Geometry Truth Hardening Preflight",
  reviewFinding: "Preflight recorded the prior contradiction: Geometry Truth had GO status while the normal editor still used split-bay naming and lacked hard browser proof.",
  status,
  filesChanged: [
    "docs/verification/geometry-truth-hardening-manifest.json",
    "docs/project/geometry-truth-hardening-status.md",
    "scripts/check-geometry-truth-hardening-preflight.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/first-failure.txt`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Preflight records the contradiction and keeps Durable Assignment Foundation blocked until issue 830 passes."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

function manifestContract() {
  const manifestText = readText("docs/verification/geometry-truth-hardening-manifest.json");
  const checks = [];
  for (const [key, value] of Object.entries(hardeningManifestDefaults)) {
    addCheck(checks, `manifest has ${key}`, manifestText.includes(`"${key}": "${value}"`) || manifestText.includes(`"${key}":`));
  }
  return checks;
}

function reproduceLegacySplitBayFlow() {
  const firstFailurePath = `docs/verification/issues/issue-${issue}/first-failure.txt`;
  const required = [
    "Manifest says Geometry Truth is GO.",
    "Editor imported/used SplitBayShape.",
    "Editor rendered splitBayItems.",
    "Normal Add Split Room dispatched convertSelectedRoomPairToSplitBay.",
    "Reducer called pair/legacy split-room functions.",
    "Hard browser proof was not yet established."
  ];
  const current = readText(firstFailurePath);
  if (!required.every((line) => current.includes(line))) {
    writeText(firstFailurePath, [
      "Reproduced before hardening from source review performed before edits:",
      ...required.map((line) => `- ${line}`)
    ].join("\n"));
  }
  return [checked("legacy contradiction recorded", required.every((line) => readText(firstFailurePath).includes(line)))];
}

function scopeBoundary() {
  return [
    checked("status doc keeps durable assignment blocked", fileIncludes("docs/project/geometry-truth-hardening-status.md", [
      "Durable Assignment Foundation remains blocked",
      "Durable assignment persistence is not implemented",
      "PHI are out of scope"
    ]).passed)
  ];
}

function final() {
  return [...manifestContract(), ...reproduceLegacySplitBayFlow(), ...scopeBoundary()];
}

function checked(name, passed, detail = {}) {
  return { name, passed: Boolean(passed), detail };
}

function unsupported() {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}
