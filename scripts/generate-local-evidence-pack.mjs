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
import { tmpdir } from "node:os";
import { isAbsolute, relative, resolve } from "node:path";

const root = process.cwd();
const trackedLatestDir = resolve(root, "docs/verification/local-runs/latest");
const { latestDir, outputMode } = parseOutputTarget(process.argv.slice(2));

const envFile = loadLocalEnv();
const apiHostPort = valueFor(envFile, "API_HOST_PORT", "8010");
const webHostPort = valueFor(envFile, "WEB_HOST_PORT", "5180");

assertSafeOutputDir(latestDir);
if (existsSync(latestDir)) {
  rmSync(latestDir, { recursive: true, force: true });
}
mkdirSync(latestDir, { recursive: true });

const manifest = {
  createdAt: new Date().toISOString(),
  apiHostPort,
  webHostPort,
  outputMode,
  outputDir: latestDir,
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
console.log(`Local evidence pack generated at ${displayPath(latestDir)}`);

function runStep(step) {
  const displayCommand = step.displayCommand ?? step.command;
  console.log(`\n> ${displayCommand}`);
  const result = spawnSync(step.command, {
    cwd: step.cwd ? resolve(root, step.cwd) : root,
    env: { ...process.env, ...(step.env ?? {}) },
    maxBuffer: 50 * 1024 * 1024,
    shell: true,
    encoding: "utf8"
  });
  const output = [
    `# ${step.label}`,
    `Command: ${displayCommand}`,
    "",
    "## stdout",
    normalizeCommandOutput(result.stdout ?? ""),
    "## stderr",
    normalizeCommandOutput(result.stderr ?? ""),
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

function parseOutputTarget(args) {
  let explicitOut = process.env.LOCAL_EVIDENCE_DIR;
  let tracked = false;

  if (isTruthyNpmConfig(process.env.npm_config_tracked)) {
    tracked = true;
  }
  if (process.env.npm_config_out != null && !isTruthyNpmConfig(process.env.npm_config_out)) {
    explicitOut = process.env.npm_config_out;
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--tracked") {
      tracked = true;
      continue;
    }
    if (arg === "--out") {
      const value = args[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error("--out requires a path");
      }
      explicitOut = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--out=")) {
      explicitOut = arg.slice("--out=".length);
      continue;
    }
    if (
      !arg.startsWith("--") &&
      (explicitOut == null || isTruthyNpmConfig(explicitOut)) &&
      !tracked
    ) {
      explicitOut = arg;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (tracked && explicitOut != null) {
    throw new Error("Use either --tracked or --out, not both");
  }

  if (tracked) {
    return { latestDir: trackedLatestDir, outputMode: "tracked" };
  }

  if (explicitOut != null) {
    if (isTruthyNpmConfig(explicitOut)) {
      throw new Error("--out requires a path");
    }
    const resolvedOut = isAbsolute(explicitOut) ? explicitOut : resolve(root, explicitOut);
    return {
      latestDir: resolvedOut,
      outputMode: isSamePath(resolvedOut, trackedLatestDir) ? "tracked" : "custom"
    };
  }

  return {
    latestDir: resolve(tmpdir(), "nerdeus-er-pod-shift-simulator", "local-evidence", "latest"),
    outputMode: "transient"
  };
}

function displayPath(path) {
  const relativePath = relative(root, path);
  if (!relativePath.startsWith("..") && !isAbsolute(relativePath)) {
    return relativePath;
  }
  return path;
}

function isTruthyNpmConfig(value) {
  return value === "true" || value === "1" || value === "";
}

function assertSafeOutputDir(outputDir) {
  const repoLocalRunsDir = resolve(root, "docs/verification/local-runs");
  const transientRoot = resolve(tmpdir(), "nerdeus-er-pod-shift-simulator", "local-evidence");
  const disallowedDirs = [
    root,
    resolve(root, "docs"),
    resolve(root, "docs/verification"),
    repoLocalRunsDir,
    tmpdir(),
    resolve(tmpdir(), "nerdeus-er-pod-shift-simulator"),
    transientRoot
  ];

  if (disallowedDirs.some((dir) => isSamePath(outputDir, dir))) {
    throw new Error(`Refusing to use broad evidence output directory: ${outputDir}`);
  }

  if (isInsidePath(root, outputDir) && !isInsidePath(repoLocalRunsDir, outputDir)) {
    throw new Error(
      `Repository-local evidence output must be under ${displayPath(repoLocalRunsDir)}`
    );
  }
}

function isSamePath(left, right) {
  return normalizeForCompare(resolve(left)) === normalizeForCompare(resolve(right));
}

function isInsidePath(parent, child) {
  const relativePath = relative(resolve(parent), resolve(child));
  return relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath);
}

function normalizeForCompare(path) {
  return process.platform === "win32" ? path.toLowerCase() : path;
}

function normalizeCommandOutput(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("\n");
}
