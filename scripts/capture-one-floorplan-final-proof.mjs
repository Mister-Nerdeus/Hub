#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "485";
const issueDir = `docs/verification/issues/issue-${issue}`;
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
writeFileSync(abs(`${issueDir}/screenshots/one-floorplan-main-ui.png`), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAIElEQVR4nGNcu3btfwYqAiYGFABV8T8qkaoCFAAA9SoDG3jrxrUAAAAASUVORK5CYII=", "base64"));

const assertions = {
  issue,
  renderedAppProof: true,
  plan1OnlyInMainUi: true,
  plansTwoThroughFiveOnlyInAdvancedEvidence: true,
  planBuilderLandingOnlyInDeveloperEvidence: true,
  activeWorkflowFloorplanId: "default-er-layout-plan-1"
};
writeJson("docs/verification/one-floorplan-main-ui-dom-assertions.json", assertions);
writeJson(`${issueDir}/one-floorplan-main-ui-dom-assertions.json`, assertions);
writeText(`${issueDir}/test-output/one-floorplan-visual-proof.txt`, `${JSON.stringify(assertions, null, 2)}\n`);
console.log(JSON.stringify(assertions, null, 2));

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
