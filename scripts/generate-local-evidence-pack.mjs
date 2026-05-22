import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { relative, resolve } from "node:path";

const root = process.cwd();
const outputRoot = resolve(root, "docs/verification/local-runs");
const latestDir = resolve(outputRoot, "latest");
const issue028ManifestPath = resolve(
  root,
  "docs/verification/issues/issue-028/local-evidence-manifest.json"
);

const envFile = loadLocalEnv();
const apiHostPort = valueFor(envFile, "API_HOST_PORT", "8010");
const webHostPort = valueFor(envFile, "WEB_HOST_PORT", "5180");

if (existsSync(latestDir)) {
  rmSync(latestDir, { recursive: true, force: true });
}
mkdirSync(latestDir, { recursive: true });

const manifest = {
  createdAt: new Date().toISOString(),
  apiHostPort,
  webHostPort,
  status: "running",
  artifacts: []
};

writeJson("manifest.json", manifest);
writeJson("ports.json", {
  apiHostPort,
  webHostPort,
  apiUrl: `http://localhost:${apiHostPort}`,
  webUrl: `http://localhost:${webHostPort}`
});

const commands = [
  {
    label: "Docker Compose config",
    command: "docker compose config",
    artifact: "docker-compose-config.txt"
  },
  {
    label: "Docker stack startup",
    command: "docker compose up --build -d",
    artifact: "docker-compose-up.txt"
  },
  {
    label: "Docker service status",
    command: "docker compose ps",
    artifact: "docker-compose-ps.txt"
  },
  {
    label: "Docker migration",
    command: "docker compose --profile tools run --rm migrate",
    artifact: "migration-output.txt"
  },
  {
    label: "Docker plan API smoke proof",
    command: "node scripts/verify-docker-plan-api.mjs",
    artifact: "docker-plan-api-output.txt",
    env: { EVIDENCE_DIR: latestDir }
  },
  {
    label: "no-PHI scan",
    command: "node scripts/check-no-phi-fields.mjs",
    artifact: "no-phi-output.txt"
  },
  {
    label: "docs contract check",
    command: "node scripts/check-docs-contracts.mjs",
    artifact: "docs-contract-output.txt"
  },
  {
    label: "shared package tests",
    command: "npm --workspace packages/shared test",
    artifact: "shared-test-output.txt"
  },
  {
    label: "web tests",
    command: "npm --workspace apps/web test",
    artifact: "web-test-output.txt"
  },
  {
    label: "API tests",
    command: "python -m pytest",
    cwd: "apps/api",
    displayCommand: "cd apps/api && python -m pytest",
    artifact: "api-test-output.txt"
  },
  {
    label: "web build",
    command: "npm --workspace apps/web run build",
    artifact: "web-build-output.txt"
  },
  {
    label: "plan validation",
    command: "npm run validate:plan -- packages/shared/fixtures/plan-er-pod-phase2.json",
    artifact: "plan-validation-output.txt"
  }
];

try {
  for (const step of commands) {
    runStep(step);
  }
  manifest.status = "passed";
} catch (error) {
  manifest.status = "failed";
  manifest.error = error instanceof Error ? error.message : String(error);
  finalizeManifest();
  console.error(manifest.error);
  process.exit(1);
}

finalizeManifest();
console.log(`Local evidence pack generated at ${relative(root, latestDir)}`);

function runStep(step) {
  const displayCommand = step.displayCommand ?? step.command;
  console.log(`\n> ${displayCommand}`);
  const result = spawnSync(step.command, {
    cwd: step.cwd ? resolve(root, step.cwd) : root,
    env: { ...process.env, ...(step.env ?? {}) },
    shell: true,
    encoding: "utf8"
  });
  const output = [
    `# ${step.label}`,
    `Command: ${displayCommand}`,
    "",
    "## stdout",
    result.stdout ?? "",
    "## stderr",
    result.stderr ?? "",
    `Exit code: ${result.status ?? 1}`,
    ""
  ].join("\n");
  writeText(step.artifact, output);
  if (result.status !== 0) {
    throw new Error(`${displayCommand} failed with exit code ${result.status ?? 1}`);
  }
}

function finalizeManifest() {
  manifest.artifacts = collectFiles(latestDir)
    .filter((path) => path !== "manifest.json")
    .sort();
  writeJson("manifest.json", manifest);
  mkdirSync(resolve(root, "docs/verification/issues/issue-028"), { recursive: true });
  writeFileSync(issue028ManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function collectFiles(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const path = resolve(dir, name);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      entries.push(...collectFiles(path));
    } else {
      entries.push(relative(latestDir, path).replaceAll("\\", "/"));
    }
  }
  return entries;
}

function writeText(name, content) {
  writeFileSync(resolve(latestDir, name), content);
}

function writeJson(name, value) {
  writeText(name, `${JSON.stringify(value, null, 2)}\n`);
}

function loadLocalEnv() {
  const values = {};
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) {
    return values;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [key, ...rest] = trimmed.split("=");
    values[key] = rest.join("=").replace(/^["']|["']$/g, "");
  }
  return values;
}

function valueFor(values, key, fallback) {
  return process.env[key] ?? values[key] ?? fallback;
}
