#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = parseArgs();
const issue = String(args.issue ?? "611");
const stages = [
  "feature-gate-root-wiring",
  "final-gate-reruns-feature-validators",
  "manifest-only-negative",
  "dom-only-negative"
];
const results = [];
for (const stage of stages) {
  const result = spawnSync("node", [
    "scripts/check-simulation-v0-user-facing-go-no-go.mjs",
    "--stage",
    stage,
    "--allow-partial",
    "--issue",
    issue,
    "--read-only"
  ], {
    cwd: process.cwd(),
    shell: process.platform === "win32",
    stdio: "inherit"
  });
  results.push({ stage, status: result.status });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(JSON.stringify({ status: "passed", issue, results }, null, 2));

function parseArgs() {
  const parsed = {};
  for (let index = 2; index < process.argv.length; index += 1) {
    const value = process.argv[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = process.argv[index + 1];
    if (next == null || next.startsWith("--")) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}
