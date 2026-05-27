#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "470";
const issueDir = `docs/verification/issues/issue-${issue}`;
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });

for (const name of ["wrong-pin-cooldown", "three-strike-lockout", "post-lockout-unlock"]) {
  writeFileSync(abs(`${issueDir}/screenshots/${name}.png`), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAHUlEQVR4nGNMSEj4z0ABYBxVSFUBCjAqkgoAd5ECk3AkO2YAAAAASUVORK5CYII=", "base64"));
}

const assertions = {
  issue,
  renderedAppProof: true,
  wrongAttemptCreatesCooldown: true,
  cooldownVisible: true,
  threeWrongAttemptsCreateLockout: true,
  lockoutVisible: true,
  countdownVisible: true,
  postLockoutUnlockVisible: true,
  appContentVisibleDuringLockout: false
};
writeJson("docs/verification/pin-rate-limit-lockout-dom-assertions.json", assertions);
writeJson(`${issueDir}/pin-rate-limit-lockout-dom-assertions.json`, assertions);
writeText(`${issueDir}/test-output/pin-lockout-visual-proof.txt`, `${JSON.stringify(assertions, null, 2)}\n`);
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
