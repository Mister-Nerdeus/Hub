#!/usr/bin/env node
import {
  addCheck,
  assertFile,
  ensureIssueDirs,
  hasFlag,
  loadSplitRoomManifest,
  readArg,
  readJson,
  readText,
  requiredIssueCommands,
  splitRoomManifestPath,
  splitRoomRootScriptMap,
  statusFromChecks,
  updateSplitRoomManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidenceSlots,
  writeJson,
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";

const issue = readArg("--issue", "679");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "manifest-contract",
  "root-script-wiring",
  "split-room-status",
  "door-hardening-still-wired",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room preflight stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: split-room authoring preflight must prove manifest, root wiring, status, door non-regression, and no scope drift.\n"
);

const stages = stage === "final"
  ? ["manifest-contract", "root-script-wiring", "split-room-status", "door-hardening-still-wired"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomManifest(issue, {
    splitRoomPreflightStatus: "passed",
    splitRoomGoNoGoStatus: issue === "679" ? "not_ready" : loadSplitRoomManifest(issue).splitRoomGoNoGoStatus,
    doorAuthoringStatus: "passed",
    doorHardeningNonRegression: true
  });
}

writeEvidenceSlots(issue, "split-room-authoring-preflight", status, stage, checks);
writeJson(`${dir}/test-output/split-room-authoring-preflight.txt`, {
  status,
  issue,
  stage,
  checks,
  stageResults
});
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  if (selectedStage === "manifest-contract") {
    const manifest = loadSplitRoomManifest(issue);
    const requiredKeys = Object.keys(loadSplitRoomManifest(issue));
    const existing = readJson(splitRoomManifestPath);
    const missingKeys = requiredKeys.filter((key) => !Object.hasOwn(existing, key));
    const output = {
      status: missingKeys.length === 0 ? "passed" : "failed",
      manifestPath: splitRoomManifestPath,
      missingKeys,
      batch: existing.batch,
      productDisplayName: existing.productDisplayName,
      splitRoomGoNoGoStatus: existing.splitRoomGoNoGoStatus
    };
    writeJson(`${dir}/manifest-contract-output.json`, output);
    addCheck(checks, "split-room manifest exists with required contract fields", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "root-script-wiring") {
    const packageJson = readJson("package.json");
    const missingScripts = [];
    const driftedScripts = [];
    for (const [script, command] of Object.entries(splitRoomRootScriptMap)) {
      if (!Object.hasOwn(packageJson.scripts, script)) {
        missingScripts.push(script);
      } else if (packageJson.scripts[script] !== command) {
        driftedScripts.push({ script, expected: command, actual: packageJson.scripts[script] });
      }
    }
    const verifyLocal = readText("scripts/verify-local.mjs");
    const missingVerifyLocal = Object.keys(splitRoomRootScriptMap).filter(
      (script) => !verifyLocal.includes(`npm run ${script}`)
    );
    const output = {
      status: missingScripts.length === 0 && driftedScripts.length === 0 && missingVerifyLocal.length === 0 ? "passed" : "failed",
      missingScripts,
      driftedScripts,
      missingVerifyLocal
    };
    writeJson(`${dir}/root-script-wiring-output.json`, output);
    addCheck(checks, "root split-room scripts are wired in package.json and verify-local", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "split-room-status") {
    const statusDocExists = assertFile("docs/project/split-room-authoring-status.md", 100);
    const text = statusDocExists ? readText("docs/project/split-room-authoring-status.md") : "";
    const output = {
      status: statusDocExists && text.includes("not yet user-ready") && text.includes("Create Split Room 4/5") ? "passed" : "failed",
      statusDocExists,
      notYetUserReadyPhrase: text.includes("not yet user-ready"),
      workflowPhrase: text.includes("Create Split Room 4/5")
    };
    writeJson(`${dir}/split-room-status-output.json`, output);
    addCheck(checks, "status doc states split-room authoring is not yet user-ready at preflight", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "door-hardening-still-wired") {
    const packageJson = readJson("package.json");
    const doorScripts = [
      "check:door-authoring-crash-preflight",
      "check:door-authoring-crash-reproduction",
      "check:safe-door-authoring-wrapper",
      "check:door-candidate-eligibility",
      "check:add-door-preflight",
      "check:door-owner-model-hardening",
      "check:door-action-recovery-snapshots",
      "check:door-recovery-diagnostics",
      "check:door-authoring-browser-regression",
      "check:door-authoring-go-no-go"
    ];
    const missingDoorScripts = doorScripts.filter((script) => !Object.hasOwn(packageJson.scripts, script));
    const output = {
      status: missingDoorScripts.length === 0 ? "passed" : "failed",
      missingDoorScripts,
      doorAuthoringStatus: loadSplitRoomManifest(issue).doorAuthoringStatus
    };
    writeJson(`${dir}/door-hardening-still-wired-output.json`, output);
    addCheck(checks, "door-hardening scripts remain wired", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage ${selectedStage}`);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-authoring-preflight", [
    "manifest-contract",
    "root-script-wiring",
    "split-room-status",
    "door-hardening-still-wired"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-authoring-preflight.mjs --stage manifest-contract --allow-partial --issue ${issue}`]: `${dir}/manifest-contract-output.json`,
    [`node scripts/check-split-room-authoring-preflight.mjs --stage root-script-wiring --allow-partial --issue ${issue}`]: `${dir}/root-script-wiring-output.json`,
    [`node scripts/check-split-room-authoring-preflight.mjs --stage split-room-status --allow-partial --issue ${issue}`]: `${dir}/split-room-status-output.json`,
    [`node scripts/check-split-room-authoring-preflight.mjs --stage door-hardening-still-wired --allow-partial --issue ${issue}`]: `${dir}/door-hardening-still-wired-output.json`
  });
  writeCloseout(
    issue,
    "Split-room authoring preflight and manifest.",
    status,
    commands,
    ["Issue 679 marks split-room authoring as not ready until UX, persistence, and browser regression gates pass."]
  );
}
