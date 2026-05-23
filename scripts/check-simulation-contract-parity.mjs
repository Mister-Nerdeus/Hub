import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const fixturesDir = join(root, "packages", "shared", "fixtures", "simulation-contract-parity");
const manifestPath = join(fixturesDir, "manifest.json");
const outputPath = join(
  root,
  "docs",
  "verification",
  "issues",
  "issue-110",
  "parity-manifest-output.json"
);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fixtureNames() {
  return readdirSync(fixturesDir)
    .filter((name) => name.endsWith(".json") && name !== "manifest.json")
    .sort();
}

function loadManifest() {
  if (!existsSync(manifestPath)) {
    throw new Error(`missing simulation contract parity manifest: ${manifestPath}`);
  }
  const manifest = readJson(manifestPath);
  if (!Array.isArray(manifest.fixtures)) {
    throw new Error("simulation contract parity manifest must contain fixtures array");
  }
  return [...manifest.fixtures].sort((left, right) =>
    left.fixture < right.fixture ? -1 : left.fixture > right.fixture ? 1 : 0
  );
}

function validateManifest(entries, names) {
  const manifestNames = entries.map((entry) => entry.fixture);
  if (new Set(manifestNames).size !== manifestNames.length) {
    throw new Error("simulation contract parity manifest has duplicate fixtures");
  }
  for (const entry of entries) {
    if (entry.expected !== "accept" && entry.expected !== "reject") {
      throw new Error(`invalid expected result for ${entry.fixture}`);
    }
  }
  if (JSON.stringify(manifestNames) !== JSON.stringify(names)) {
    throw new Error("simulation contract parity manifest must list every fixture and no unlisted fixture");
  }
}

async function typescriptResults(entries) {
  const build = spawnSync("npm --workspace packages/shared run build", {
    cwd: root,
    encoding: "utf8",
    shell: true
  });
  if (build.status !== 0) {
    throw new Error(build.stderr || build.stdout || "shared build failed");
  }
  const { validateSimulationRunContract } = await import(
    `file:///${join(root, "packages", "shared", "dist", "index.js").replaceAll("\\", "/")}`
  );
  return entries.map((entry) => {
    try {
      validateSimulationRunContract(readJson(join(fixturesDir, entry.fixture)));
      return { fixture: entry.fixture, result: "accept" };
    } catch {
      return { fixture: entry.fixture, result: "reject" };
    }
  });
}

function pythonResults(entries) {
  const python = spawnSync(
    "python",
    [
      "-c",
      [
        "import json, sys",
        "from pathlib import Path",
        "from pydantic import ValidationError",
        "from app.schemas.simulation import SimulationRunContract",
        "root = Path(sys.argv[1])",
        "entries = json.loads(sys.argv[2])",
        "fixtures_dir = root / 'packages' / 'shared' / 'fixtures' / 'simulation-contract-parity'",
        "results = []",
        "for entry in entries:",
        "    try:",
        "        SimulationRunContract.model_validate(json.loads((fixtures_dir / entry['fixture']).read_text(encoding='utf-8')))",
        "        result = 'accept'",
        "    except ValidationError:",
        "        result = 'reject'",
        "    results.append({'fixture': entry['fixture'], 'result': result})",
        "print(json.dumps(results))"
      ].join("\n"),
      root,
      JSON.stringify(entries)
    ],
    {
      cwd: join(root, "apps", "api"),
      encoding: "utf8"
    }
  );
  if (python.status !== 0) {
    throw new Error(python.stderr || python.stdout || "python parity validation failed");
  }
  return JSON.parse(python.stdout);
}

function byFixture(results) {
  return new Map(results.map((result) => [result.fixture, result.result]));
}

function assertResults(entries, tsResults, pyResults) {
  const tsByFixture = byFixture(tsResults);
  const pyByFixture = byFixture(pyResults);
  for (const entry of entries) {
    const typescript = tsByFixture.get(entry.fixture);
    const python = pyByFixture.get(entry.fixture);
    if (typescript !== entry.expected) {
      throw new Error(`${entry.fixture} TypeScript result ${typescript} did not match ${entry.expected}`);
    }
    if (python !== entry.expected) {
      throw new Error(`${entry.fixture} Python result ${python} did not match ${entry.expected}`);
    }
    if (typescript !== python) {
      throw new Error(`${entry.fixture} TypeScript/Python parity mismatch`);
    }
  }
}

const entries = loadManifest();
const names = fixtureNames();
validateManifest(entries, names);
const tsResults = await typescriptResults(entries);
const pyResults = pythonResults(entries);
assertResults(entries, tsResults, pyResults);

const tsByFixture = byFixture(tsResults);
const pyByFixture = byFixture(pyResults);
const output = {
  issue: "110",
  manifestFixtureCount: entries.length,
  typescriptPassed: true,
  pythonPassed: true,
  parityPassed: true,
  fixtures: entries.map((entry) => ({
    fixture: entry.fixture,
    expected: entry.expected,
    typescript: tsByFixture.get(entry.fixture),
    python: pyByFixture.get(entry.fixture)
  }))
};

mkdirSync(join(root, "docs", "verification", "issues", "issue-110"), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
