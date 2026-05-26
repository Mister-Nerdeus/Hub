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

if (viteApiBaseUrl !== apiUrl) {
  throw new Error(`VITE_API_BASE_URL must be ${apiUrl}, got ${viteApiBaseUrl}`);
}

if (!corsOrigins.split(",").map((origin) => origin.trim()).includes(webUrl)) {
  throw new Error(`CORS_ORIGINS must include ${webUrl}`);
}

assertComposePortsAreEnvDriven();

const commands = [
  "docker compose config",
  "docker compose up --build -d",
  "docker compose ps",
  "docker compose --profile tools run --rm migrate",
  "node scripts/check-no-phi-fields.mjs",
  "node scripts/check-dependency-specs.mjs",
  "node scripts/check-docs-contracts.mjs",
  "node scripts/check-simulation-contract-parity.mjs",
  "node scripts/check-source-plan-correction.mjs --stage final",
  "node scripts/check-corrected-plan-review.mjs --stage final",
  "node scripts/check-corrected-plan-route-repair.mjs --stage final",
  "node scripts/check-manual-visual-review.mjs --stage final",
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
