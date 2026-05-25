import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const issueArgIndex = process.argv.indexOf("--issue");
const issue = issueArgIndex >= 0 ? process.argv[issueArgIndex + 1] : null;

const trackedPaths = [2, 3, 4, 5].flatMap((planNumber) => [
  `packages/shared/fixtures/default-plans/default-er-layout-plan-${planNumber}.json`,
  `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-${planNumber}.json`,
  `packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-${planNumber}-walking-baseline.json`
]);

const missingPaths = trackedPaths.filter((relativePath) => !existsSync(join(repoRoot, relativePath)));
const changedPaths = gitChangedPaths(trackedPaths);
const fixtureSummaries = [2, 3, 4, 5].map((planNumber) => {
  const relativePath = `packages/shared/fixtures/default-plans/default-er-layout-plan-${planNumber}.json`;
  const fixture = readJson(relativePath);
  return {
    planNumber,
    path: relativePath,
    planId: fixture.plan?.planId ?? null,
    roomCount: Array.isArray(fixture.plan?.rooms) ? fixture.plan.rooms.length : null,
    nurseStationCount: Array.isArray(fixture.plan?.nurseStations) ? fixture.plan.nurseStations.length : null,
    hallwayCount: Array.isArray(fixture.plan?.hallways) ? fixture.plan.hallways.length : null,
    doorCount: Array.isArray(fixture.plan?.doors) ? fixture.plan.doors.length : null,
    sha256: hashFile(relativePath)
  };
});

const output = {
  status: missingPaths.length === 0 && changedPaths.length === 0 ? "passed" : "failed",
  scope: "default Plans 2 through 5 fixture, source mapping, and walking baseline files",
  comparedAgainst: "git HEAD",
  trackedPaths,
  changedPaths,
  missingPaths,
  fixtureSummaries,
  nonClaims: [
    "This check proves Plans 2-5 files were not changed in the working tree.",
    "This check does not audit Plan 1 visual parity."
  ]
};

if (issue != null) {
  const issueDir = join(repoRoot, "docs", "verification", "issues", `issue-${issue}`);
  writeJson(join(issueDir, "plans-2-through-5-unchanged-output.json"), {
    issue,
    ...output
  });
}

console.log(JSON.stringify(output, null, 2));

if (output.status !== "passed") {
  process.exitCode = 1;
}

function gitChangedPaths(paths) {
  const result = spawnSync("git", ["diff", "--name-only", "HEAD", "--", ...paths], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`git diff failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), "utf8"));
}

function hashFile(relativePath) {
  return createHash("sha256").update(readFileSync(join(repoRoot, relativePath))).digest("hex");
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
