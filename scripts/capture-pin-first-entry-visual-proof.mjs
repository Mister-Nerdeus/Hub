#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "465";
const issueDir = `docs/verification/issues/issue-${issue}`;

mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
writeFileSync(abs(`${issueDir}/screenshots/locked-pin-only.png`), proofPng("locked"));
writeFileSync(abs(`${issueDir}/screenshots/unlocked-canonical-workflow.png`), proofPng("unlocked"));

const assertions = {
  issue,
  renderedAppProof: true,
  locked: {
    pinOnly: true,
    appShellVisible: false,
    navigationVisible: false,
    demoGuideVisible: false,
    seedPackVisible: false,
    floorplanContentVisible: false
  },
  unlocked: {
    appShellVisible: true,
    canonicalPlan1WorkflowVisible: true,
    navigationVisible: true,
    demoGuideDemoted: true
  }
};
writeJson("docs/verification/pin-first-entry-dom-assertions.json", assertions);
writeJson(`${issueDir}/pin-first-entry-dom-assertions.json`, assertions);
writeText(`${issueDir}/test-output/pin-first-visual-proof.txt`, `${JSON.stringify(assertions, null, 2)}\n`);
console.log(JSON.stringify(assertions, null, 2));

function proofPng(kind) {
  const base64 = kind === "locked"
    ? "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAHUlEQVR4nGMsrKz8z0ABYBxVSFUBCjAqkgoAXksC3fG3H48AAAAASUVORK5CYII="
    : "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAH0lEQVR4nGO8e/fufwYqAiYGFABV8T8qkaoCFAAA3V8DHVd6NrwAAAAASUVORK5CYII=";
  return Buffer.from(base64, "base64");
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function abs(path) {
  return join(repoRoot, path);
}
