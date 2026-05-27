import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function loadLocalEnv() {
  const values = {};
  if (!existsSync(".env")) {
    return values;
  }

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);
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

function valueFor(envFile, key, fallback) {
  return process.env[key] ?? envFile[key] ?? fallback;
}

function manifestIssue(path, fallback) {
  if (existsSync(path)) {
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    return manifest.lastUpdatedIssue ?? fallback;
  }
  return fallback;
}

function currentManualAssignmentIssue() {
  const stableManualAssignmentIssue = "390";
  if (existsSync("docs/verification/manual-assignment-foundation-manifest.json")) {
    const issue = manifestIssue("docs/verification/manual-assignment-foundation-manifest.json", stableManualAssignmentIssue);
    return Number(issue) < Number(stableManualAssignmentIssue) ? stableManualAssignmentIssue : issue;
  }
  if (existsSync("docs/verification/operational-demo-repair-manifest.json")) {
    return manifestIssue("docs/verification/operational-demo-repair-manifest.json", "380");
  }
  if (existsSync("docs/verification/operational-demo-ux-manifest.json")) {
    return manifestIssue("docs/verification/operational-demo-ux-manifest.json", "370");
  }
  return manifestIssue("docs/verification/human-review-governance-hardening-manifest.json", "360");
}

function currentOperationalDemoRepairIssue() {
  return manifestIssue("docs/verification/operational-demo-repair-manifest.json", "380");
}

function currentOperationalDemoUxIssue() {
  return manifestIssue("docs/verification/operational-demo-ux-manifest.json", "370");
}

function currentHumanReviewGovernanceIssue() {
  return manifestIssue("docs/verification/human-review-governance-hardening-manifest.json", "360");
}

function currentFloorplanEditorUxIssue() {
  return manifestIssue("docs/verification/floorplan-editor-ux-manifest.json", "400");
}

function currentEditorUsabilityRepairIssue() {
  return manifestIssue("docs/verification/editor-usability-repair-manifest.json", "401");
}

function loadCanonicalGateRegistry() {
  const registryPath = "docs/verification/canonical-gate-registry.json";
  if (!existsSync(registryPath)) {
    throw new Error(`Missing canonical gate registry: ${registryPath}`);
  }
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  if (!Array.isArray(registry.gates)) {
    throw new Error("Canonical gate registry must contain a gates array");
  }
  return registry;
}

function interpolateCommand(command, values) {
  return command.replace(/\$\{([A-Za-z0-9_]+)\}/g, (_, key) => {
    if (!Object.hasOwn(values, key)) {
      throw new Error(`Unknown canonical gate command placeholder: ${key}`);
    }
    return values[key];
  });
}

const canonicalGateDiscoveryStrings = [
  "node scripts/check-plan-builder-ux-review-flow.mjs --stage final",
  "node scripts/check-human-review-intake.mjs --stage final",
  "check-source-plan-correction.mjs --stage final",
  "check-corrected-plan-review.mjs --stage final",
  "check-corrected-plan-route-repair.mjs --stage final"
];

function assertComposePortsAreEnvDriven() {
  const compose = readFileSync("docker-compose.yml", "utf8");
  const hardCodedApiPort = /^\s*-\s*["']?\d+:8000["']?\s*$/m.test(compose);
  const hardCodedWebPort = /^\s*-\s*["']?\d+:5173["']?\s*$/m.test(compose);

  if (hardCodedApiPort || hardCodedWebPort) {
    throw new Error("docker-compose.yml must use API_HOST_PORT and WEB_HOST_PORT for host ports");
  }
}

async function assertReachable(url, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }
  return response;
}

const envFile = loadLocalEnv();
const apiHostPort = valueFor(envFile, "API_HOST_PORT", "8010");
const webHostPort = valueFor(envFile, "WEB_HOST_PORT", "5180");
const apiUrl = `http://localhost:${apiHostPort}`;
const webUrl = `http://localhost:${webHostPort}`;
const viteApiBaseUrl = valueFor(envFile, "VITE_API_BASE_URL", apiUrl);
const corsOrigins = valueFor(
  envFile,
  "CORS_ORIGINS",
  `${webUrl},http://localhost:5173,http://localhost:5174`
);
const manualAssignmentIssue = currentManualAssignmentIssue();
const operationalDemoRepairIssue = currentOperationalDemoRepairIssue();
const operationalDemoUxIssue = currentOperationalDemoUxIssue();
const humanReviewGovernanceIssue = currentHumanReviewGovernanceIssue();
const floorplanEditorUxIssue = currentFloorplanEditorUxIssue();
const editorUsabilityRepairIssue = currentEditorUsabilityRepairIssue();

if (viteApiBaseUrl !== apiUrl) {
  throw new Error(`VITE_API_BASE_URL must be ${apiUrl}, got ${viteApiBaseUrl}`);
}

if (!corsOrigins.split(",").map((origin) => origin.trim()).includes(webUrl)) {
  throw new Error(`CORS_ORIGINS must include ${webUrl}`);
}

assertComposePortsAreEnvDriven();

const canonicalCommands = loadCanonicalGateRegistry().gates.map((gate) =>
  interpolateCommand(gate.command, {
    manualAssignmentIssue,
    operationalDemoRepairIssue,
    operationalDemoUxIssue,
    humanReviewGovernanceIssue,
    floorplanEditorUxIssue,
    editorUsabilityRepairIssue
  })
);

const commands = [
  "docker compose config",
  "docker compose up --build -d",
  "docker compose ps",
  "docker compose --profile tools run --rm migrate",
  ...canonicalCommands,
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "cd apps/api && python -m pytest",
  "npm --workspace apps/web run build",
  "node scripts/check-private-source-artifacts.mjs",
  "node scripts/verify-docker-plan-api.mjs"
];

for (const command of commands) {
  console.log(`\n> ${command}`);
  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`\n> GET ${apiUrl}/health`);
const healthResponse = await assertReachable(`${apiUrl}/health`, "API health");
console.log(await healthResponse.text());

console.log(`\n> GET ${webUrl}`);
await assertReachable(webUrl, "Web runtime");
console.log(`Web runtime reachable at ${webUrl}`);
