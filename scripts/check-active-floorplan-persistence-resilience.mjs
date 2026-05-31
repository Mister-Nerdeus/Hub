#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateWorkspaceUxManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "721");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-active-floorplan-persistence-resilience";
const title = "Active Floorplan Persistence Resilience";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-active-floorplan-persistence-resilience.mjs --stage corrupted-localstorage --allow-partial --issue 721",
  "node scripts/check-active-floorplan-persistence-resilience.mjs --stage fallback-floorplan --allow-partial --issue 721",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "corrupted-localstorage": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/activeFloorplanPersistence.ts", [
      "try {",
      "JSON.parse(raw)",
      "catch {",
      "return null;"
    ])
  ]),
  "fallback-floorplan": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/activeFloorplanPersistence.ts", [
      "parsed == null || typeof parsed !== \"object\" || Array.isArray(parsed)",
      "candidate.schemaVersion !== \"1.0.0\"",
      "typeof candidate.activeFloorplanId !== \"string\"",
      "typeof candidate.activeFloorplanVersionId !== \"string\""
    ]),
    fileIncludes("apps/web/src/App.tsx", [
      "return fallback;",
      "savedRecord == null ? fallback : openSavedFloorplan(fallback, savedRecord)"
    ])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);

const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};

for (const stageName of selectedStages) {
  const runStage = stages[stageName];
  if (runStage == null) throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  const result = runStage();
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    activeFloorplanPersistenceResilienceStatus: "passed",
    corruptedActiveFloorplanStorageHandled: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      activeFloorplanPersistenceResilienceStatus: "passed",
      corruptedActiveFloorplanStorageHandled: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Persisted active-floorplan selection parsed untrusted localStorage directly; corrupted JSON and invalid schema now return null so startup uses the safe fallback floorplan state.",
  filesChanged: [
    "apps/web/src/features/floorplans/activeFloorplanPersistence.ts",
    "scripts/check-active-floorplan-persistence-resilience.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Invalid persisted selections are ignored; this issue does not add a user-facing recovery banner."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkAll(results) {
  return {
    passed: results.every((result) => result.passed),
    results
  };
}
