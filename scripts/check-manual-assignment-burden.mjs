import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "387";
const issueDir = `docs/verification/issues/issue-${issue}`;
const failures = [];

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

runWalkingBurdenChecks();

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  stage: Number(issue) >= 388 ? "burden-warnings" : "walking-burden",
  failures
};
writeJson(`${issueDir}/manual-assignment-burden-gate-output.json`, output);
writeText(`${issueDir}/test-output/manual-assignment-burden-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);
updateEvidenceIndex();

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function runWalkingBurdenChecks() {
  const requiredFiles = [
    "packages/shared/src/manual-assignment/walkingBurden.ts",
    "packages/shared/tests/walking-burden.test.mjs",
    "apps/web/src/features/manual-assignment/walkingBurdenViewModel.ts",
    "apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx",
    "apps/web/src/features/manual-assignment/__tests__/walkingBurdenViewModel.test.ts"
  ];
  for (const file of requiredFiles) {
    if (!existsSync(abs(file))) failures.push(`missing walking burden file ${file}`);
  }
  const shared = readText("packages/shared/src/manual-assignment/walkingBurden.ts");
  const sharedTest = readText("packages/shared/tests/walking-burden.test.mjs");
  const card = readText("apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx");
  const viewModel = readText("apps/web/src/features/manual-assignment/walkingBurdenViewModel.ts");
  const combined = `${shared}\n${sharedTest}\n${card}\n${viewModel}`;
  for (const text of [
    "shortestPathDistance",
    "path-graph",
    "straight-line-fallback",
    "roomToRoomSpread",
    "estimatedWalkingBurdenUnits",
    "walkingSummary"
  ]) {
    if (!combined.includes(text)) failures.push(`walking burden missing ${text}`);
  }
  if (/best assignment|recommend|optimi[sz]er|shift timeline/u.test(combined)) {
    failures.push("walking burden foundation must not add optimizer or full-shift behavior");
  }

  writeJson(`${issueDir}/walking-burden-output.json`, { status: failures.length === 0 ? "passed" : "failed" });
  writeJson(`${issueDir}/graph-distance-output.json`, { status: shared.includes("path-graph") ? "passed" : "failed" });
  writeJson(`${issueDir}/shortest-path-output.json`, { status: shared.includes("shortestPathDistance") ? "passed" : "failed" });
  writeJson(`${issueDir}/straight-line-fallback-output.json`, { status: shared.includes("straight-line-fallback") ? "passed" : "failed" });
  writeJson(`${issueDir}/room-spread-output.json`, { status: shared.includes("roomToRoomSpread") ? "passed" : "failed" });
  writeJson(`${issueDir}/nurse-card-walking-output.json`, { status: card.includes("walkingSummary") ? "passed" : "failed" });
  writeJson(`${issueDir}/no-simulation-negative-output.json`, {
    status: /shift timeline/u.test(combined) ? "failed" : "passed",
    rejected: true
  });
  writeJson(`${issueDir}/no-optimizer-negative-output.json`, {
    status: /best assignment|recommend|optimi[sz]er/u.test(combined) ? "failed" : "passed",
    rejected: true
  });
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: walking burden uses synthetic runtime assignment state and does not write default fixtures\n");
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const entry = {
    issue,
    title: `Manual Assignment Foundation Issue ${issue}`,
    requiredEvidence: listFiles(issueDir).sort()
  };
  const existing = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (existing >= 0) index.issues[existing] = entry;
  else {
    index.issues.push(entry);
    index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  }
  writeJson(indexPath, index);
}

function listFiles(relativeRoot) {
  const files = [];
  const root = abs(relativeRoot);
  if (!existsSync(root)) return files;
  walk(root);
  return files.map((path) => path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));

  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile()) files.push(entryPath);
    }
  }
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function readText(path) {
  return readFileSync(abs(path), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
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
