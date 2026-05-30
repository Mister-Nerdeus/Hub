#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  requiredIssueCommands,
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

const issue = readArg("--issue", "691");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const sourceIssue = "688";
const sourceDir = `docs/verification/issues/issue-${sourceIssue}`;
const doorProofPath = `${sourceDir}/door-browser-regression-proof.json`;
const splitRoomProofPath = `${sourceDir}/split-room-browser-regression-proof.json`;
const proofIndexPath = `${sourceDir}/browser-regression-proof-index.json`;
const genericProofPath = `${sourceDir}/browser-regression-proof.json`;
const supportedStages = [
  "artifact-inventory",
  "door-proof-renamed",
  "split-room-proof-renamed",
  "generic-proof-negative",
  "go-no-go-reference",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split/door artifact naming stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: generic browser proof artifacts must not contain door or split-room typed proof payloads.\n"
);

const migration = ensureTypedArtifacts();
const stages = stage === "final"
  ? [
      "artifact-inventory",
      "door-proof-renamed",
      "split-room-proof-renamed",
      "generic-proof-negative",
      "go-no-go-reference"
    ]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (allArtifactNamingProofsPassed()) {
  updateSplitRoomCloseoutHardeningManifest(issue, {
    splitDoorEvidenceNamingStatus: "passed",
    doorProofArtifactTyped: true,
    splitRoomProofArtifactTyped: true,
    genericBrowserProofCollisionRemoved: true,
    finalAuditReferencesTypedArtifacts: true
  });
}

writeStageSummary(issue, "split-door-artifact-naming", status, stage, checks, stageResults);
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  if (selectedStage === "artifact-inventory") {
    const output = artifactInventory();
    writeJson(`${dir}/artifact-inventory-output.json`, output);
    addCheck(
      checks,
      "artifact inventory contains typed door and split-room proof files plus an index",
      output.status === "passed",
      output
    );
    return output;
  }

  if (selectedStage === "door-proof-renamed") {
    const proof = readJson(doorProofPath);
    const output = {
      status: isDoorProof(proof) ? "passed" : "failed",
      proofPath: doorProofPath,
      statusField: proof.status ?? null,
      doorKeysPresent: {
        validPatientDoor: proof.validPatientDoor != null,
        doorMove: proof.doorMove != null,
        saveReloadExport: proof.saveReloadExport != null
      }
    };
    writeJson(`${dir}/door-proof-renamed-output.json`, output);
    addCheck(checks, "door browser proof is typed with a door artifact name", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "split-room-proof-renamed") {
    const proof = readJson(splitRoomProofPath);
    const output = {
      status: isSplitRoomProof(proof) ? "passed" : "failed",
      proofPath: splitRoomProofPath,
      statusField: proof.status ?? null,
      hasRoom5Stage: proof.stageResults?.["room5-user-flow"]?.status === "passed" || proof.room5ActionVisible === true,
      hasCanonicalStage: proof.stageResults?.["all-canonical-pairs"]?.status === "passed" || Array.isArray(proof.splitBayIds)
    };
    writeJson(`${dir}/split-room-proof-renamed-output.json`, output);
    addCheck(checks, "split-room browser proof is typed with a split-room artifact name", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "generic-proof-negative") {
    const output = genericProofNegative();
    writeJson(`${dir}/generic-proof-negative-output.json`, output);
    addCheck(checks, "generic browser proof file is absent or index-only", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "go-no-go-reference") {
    const output = goNoGoReferenceProof();
    writeJson(`${dir}/go-no-go-reference-output.json`, output);
    addCheck(checks, "GO/NO-GO audit references typed browser artifacts", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage: ${selectedStage}`);
}

function ensureTypedArtifacts() {
  mkdirSync(abs(sourceDir), { recursive: true });
  const beforeGeneric = readJsonIfExists(genericProofPath);
  const actions = [];

  if (!fileExists(doorProofPath)) {
    if (beforeGeneric != null && isDoorProof(beforeGeneric)) {
      writeJsonFile(doorProofPath, beforeGeneric);
      actions.push("copied legacy generic door proof into typed door artifact");
    } else {
      throw new Error(`missing typed door proof and no legacy door proof available at ${genericProofPath}`);
    }
  }

  if (!fileExists(splitRoomProofPath)) {
    const splitSummary = readJsonIfExists(`${sourceDir}/test-output/split-room-browser-regression.txt`) ??
      readJsonIfExists(`${sourceDir}/browser-regression-summary.json`);
    if (splitSummary == null) {
      throw new Error("missing split-room browser regression summary for typed split-room proof");
    }
    writeJsonFile(splitRoomProofPath, {
      proofType: "split-room-browser-regression",
      status: splitSummary.status,
      issue: sourceIssue,
      stage: splitSummary.stage,
      checks: splitSummary.checks ?? [],
      stageResults: splitSummary.stageResults ?? {},
      sourceSummary: `${sourceDir}/test-output/split-room-browser-regression.txt`
    });
    actions.push("created typed split-room proof from existing split-room browser summary");
  }

  const index = {
    doorProof: doorProofPath,
    splitRoomProof: splitRoomProofPath
  };
  writeJsonFile(proofIndexPath, index);
  writeJsonFile(genericProofPath, index);
  actions.push("wrote typed proof index and replaced generic proof payload with index");

  const noEvidenceLoss = {
    status: fileExists(doorProofPath) && fileExists(splitRoomProofPath) && fileExists(proofIndexPath) ? "passed" : "failed",
    sourceIssue,
    actions,
    legacyGenericHadDoorProof: beforeGeneric == null ? false : isDoorProof(beforeGeneric),
    artifacts: artifactStats([doorProofPath, splitRoomProofPath, proofIndexPath, genericProofPath])
  };
  writeJson(`${dir}/no-evidence-loss-output.json`, noEvidenceLoss);
  return noEvidenceLoss;
}

function artifactInventory() {
  const artifacts = artifactStats([doorProofPath, splitRoomProofPath, proofIndexPath, genericProofPath]);
  const output = {
    status: artifacts.every((artifact) => artifact.exists && artifact.bytes > 0) ? "passed" : "failed",
    sourceIssue,
    artifacts,
    migration
  };
  return output;
}

function genericProofNegative() {
  if (!fileExists(genericProofPath)) {
    return { status: "passed", genericProofPath, genericProofExists: false };
  }
  const value = readJson(genericProofPath);
  const keys = Object.keys(value).sort();
  const indexOnly = keys.join(",") === "doorProof,splitRoomProof";
  const typedEvidenceKeys = [
    "validPatientDoor",
    "doorMove",
    "split45Visible",
    "room5ActionVisible",
    "stageResults",
    "checks"
  ].filter((key) => Object.prototype.hasOwnProperty.call(value, key));
  return {
    status: indexOnly && typedEvidenceKeys.length === 0 ? "passed" : "failed",
    genericProofPath,
    genericProofExists: true,
    keys,
    typedEvidenceKeys
  };
}

function goNoGoReferenceProof() {
  const scriptSource = readTextFile("scripts/check-split-room-authoring-go-no-go.mjs");
  const finalAudit = readTextIfExists(`${sourceDir}/final-split-room-audit.md`) ?? "";
  const goNoGo = readTextIfExists(`${sourceDir}/go-no-go.md`) ?? "";
  const haystack = `${scriptSource}\n${finalAudit}\n${goNoGo}`;
  return {
    status:
      haystack.includes("door-browser-regression-proof.json") &&
      haystack.includes("split-room-browser-regression-proof.json") &&
      haystack.includes("browser-regression-proof-index.json")
        ? "passed"
        : "failed",
    scriptReferencesDoorProof: scriptSource.includes("door-browser-regression-proof.json"),
    scriptReferencesSplitRoomProof:
      scriptSource.includes("split-room-browser-regression-proof.json") ||
      scriptSource.includes("splitRoomBrowserRegressionProofFileName"),
    scriptReferencesIndex:
      scriptSource.includes("browser-regression-proof-index.json") ||
      scriptSource.includes("browserRegressionProofIndexFileName"),
    finalAuditReferencesDoorProof: finalAudit.includes("door-browser-regression-proof.json"),
    finalAuditReferencesSplitRoomProof: finalAudit.includes("split-room-browser-regression-proof.json"),
    goNoGoReferencesIndex: goNoGo.includes("browser-regression-proof-index.json")
  };
}

function allArtifactNamingProofsPassed() {
  return artifactInventory().status === "passed" &&
    isDoorProof(readJson(doorProofPath)) &&
    isSplitRoomProof(readJson(splitRoomProofPath)) &&
    genericProofNegative().status === "passed" &&
    goNoGoReferenceProof().status === "passed";
}

function isDoorProof(value) {
  return value != null &&
    typeof value === "object" &&
    value.status === "passed" &&
    (value.validPatientDoor != null || value.doorMove != null || value.saveReloadExport != null);
}

function isSplitRoomProof(value) {
  return value != null &&
    typeof value === "object" &&
    value.status === "passed" &&
    (
      value.proofType === "split-room-browser-regression" ||
      value.room5ActionVisible === true ||
      value.stageResults?.["room5-user-flow"]?.status === "passed"
    );
}

function artifactStats(paths) {
  return paths.map((path) => ({
    path,
    exists: fileExists(path),
    bytes: fileExists(path) ? statSync(abs(path)).size : 0
  }));
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-door-artifact-naming", [
    "artifact-inventory",
    "door-proof-renamed",
    "split-room-proof-renamed",
    "generic-proof-negative",
    "go-no-go-reference"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-door-artifact-naming.mjs --stage artifact-inventory --allow-partial --issue ${issue}`]: `${dir}/artifact-inventory-output.json`,
    [`node scripts/check-split-door-artifact-naming.mjs --stage door-proof-renamed --allow-partial --issue ${issue}`]: `${dir}/door-proof-renamed-output.json`,
    [`node scripts/check-split-door-artifact-naming.mjs --stage split-room-proof-renamed --allow-partial --issue ${issue}`]: `${dir}/split-room-proof-renamed-output.json`,
    [`node scripts/check-split-door-artifact-naming.mjs --stage generic-proof-negative --allow-partial --issue ${issue}`]: `${dir}/generic-proof-negative-output.json`,
    [`node scripts/check-split-door-artifact-naming.mjs --stage go-no-go-reference --allow-partial --issue ${issue}`]: `${dir}/go-no-go-reference-output.json`
  });
  writeCloseout(
    issue,
    "Split/door browser evidence artifact naming cleanup.",
    status,
    commands,
    [
      "This issue changes local evidence naming and validators only; product behavior is unchanged.",
      "The generic browser proof artifact is index-only so door and split-room proof payloads cannot collide."
    ],
    ["docs/verification/split-room-closeout-hardening-manifest.json"]
  );
}

function readJson(path) {
  return JSON.parse(readTextFile(path));
}

function readJsonIfExists(path) {
  return fileExists(path) ? readJson(path) : null;
}

function readTextIfExists(path) {
  return fileExists(path) ? readTextFile(path) : null;
}

function readTextFile(path) {
  return readFileSync(abs(path), "utf8");
}

function writeJsonFile(path, value) {
  writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeTextFile(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function fileExists(path) {
  return existsSync(abs(path));
}

function abs(path) {
  return join(process.cwd(), path);
}
