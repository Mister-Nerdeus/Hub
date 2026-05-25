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

const approvedHashes = {
  "packages/shared/fixtures/default-plans/default-er-layout-plan-2.json":
    "d1b6700a9ac0bb3e6c48ba84b9a7cd9169722c749183a5961d6a9cc15e33efc3",
  "packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-2.json":
    "67ab585292acd9ce0d1a207df958e80dfab206528c56946747f326fdc0f4ab83",
  "packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-2-walking-baseline.json":
    "1b38aabc98d54464ac56c47d9c3b02fb7a50ea16ed9cc38ea53949ee3e90b89b",
  "packages/shared/fixtures/default-plans/default-er-layout-plan-3.json":
    "827b0e440f47256bde17d8753e7e5c214cba16f1d3f0bd57d9115caf48f9d2b4",
  "packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-3.json":
    "17126880d9cfece0265d044519763b9537e339857ad642f51c6e2d180ef40c33",
  "packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-3-walking-baseline.json":
    "2af495924cac16e34d1cea46825a00eb126fa1cad3452f80495099442c85d900",
  "packages/shared/fixtures/default-plans/default-er-layout-plan-4.json":
    "5f22083f41f3b54987dffa02bd530d13af81d634b9e510d3a689d81cb81932b2",
  "packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-4.json":
    "07720bcb670ff27741a23e31f3c578fa06fb2ac28097cb3e74aaaad640817539",
  "packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-4-walking-baseline.json":
    "a02d4f095219df1e5fdfb225dfa78209804bb5ad997cdf0fbbe0efe7b6646e6f",
  "packages/shared/fixtures/default-plans/default-er-layout-plan-5.json":
    "dc12dfb2f821d0c70ff749898efa1937d2de4bad7df748cd99b3f2068cd3a67f",
  "packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-5.json":
    "3c131b8819d6ef280213d26c59edd94acdf08a92fc6fb6e2dcab9dce4a59c0a6",
  "packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-5-walking-baseline.json":
    "610117ac846fd53d696616f6178b8165a17466b10f80ac393d5ed583fbd51912"
};

const missingPaths = trackedPaths.filter((relativePath) => !existsSync(join(repoRoot, relativePath)));
const changedPaths = gitChangedPaths(trackedPaths);
const hashMismatches = trackedPaths
  .filter((relativePath) => !missingPaths.includes(relativePath))
  .map((relativePath) => ({
    path: relativePath,
    expectedSha256: approvedHashes[relativePath],
    actualSha256: hashFile(relativePath)
  }))
  .filter((entry) => entry.expectedSha256 !== entry.actualSha256);
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
  status: missingPaths.length === 0 && changedPaths.length === 0 && hashMismatches.length === 0 ? "passed" : "failed",
  scope: "default Plans 2 through 5 fixture, source mapping, and walking baseline files",
  comparedAgainst: "approved Plan 2-5 hashes plus git HEAD working-tree cleanliness",
  trackedPaths,
  changedPaths,
  hashMismatches,
  missingPaths,
  fixtureSummaries,
  nonClaims: [
    "This check proves Plans 2-5 protected files match the approved batch baseline hashes.",
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
