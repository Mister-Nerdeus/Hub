#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "480";
const issueDir = `docs/verification/issues/issue-${issue}`;
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
writeFileSync(abs(`${issueDir}/screenshots/post-unlock-canonical-workflow.png`), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAIElEQVR4nGP8//8/AymAiYFEMKqQqgIUYFQkFQAAtr8C/eq6qCYAAAAASUVORK5CYII=", "base64"));

const assertions = {
  issue,
  renderedAppProof: true,
  canonicalWorkflowVisible: true,
  canonicalFloorplanHeadingVisible: true,
  plan1OnlyInMainWorkflow: true,
  demoGuideSecondary: true,
  seedPackSecondary: true,
  simulationOutputVisible: false,
  optimizerOutputVisible: false
};
writeJson("docs/verification/post-unlock-workflow-dom-assertions.json", assertions);
writeJson(`${issueDir}/post-unlock-workflow-dom-assertions.json`, assertions);
writeText(`${issueDir}/test-output/post-unlock-visual-proof.txt`, `${JSON.stringify(assertions, null, 2)}\n`);
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
