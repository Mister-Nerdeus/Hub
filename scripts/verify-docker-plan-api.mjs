import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const envFile = loadLocalEnv();
const apiHostPort = valueFor(envFile, "API_HOST_PORT", "8010");
const apiUrl = `http://localhost:${apiHostPort}`;
const evidenceDir = process.env.EVIDENCE_DIR ?? "docs/verification/issues/issue-025D";
const planId = process.env.DOCKER_PLAN_SMOKE_ID ?? "plan-docker-smoke";

const fixture = JSON.parse(readFileSync("packages/shared/fixtures/plan-er-pod-phase2.json", "utf8"));
const smokePlan = {
  ...fixture,
  planId,
  name: "Docker Smoke Plan",
  description: "Synthetic Docker smoke layout",
  createdAt: fixture.createdAt ?? "2026-05-22T00:00:00Z",
  updatedAt: fixture.updatedAt ?? "2026-05-22T00:00:00Z"
};

mkdirSync(join(evidenceDir, "api-responses"), { recursive: true });

console.log(`> GET ${apiUrl}/health`);
const health = await requestJson(`${apiUrl}/health`);
writeJson(join(evidenceDir, "api-health.json"), health);

console.log(`> DELETE ${apiUrl}/v1/plans/${planId}`);
await fetch(`${apiUrl}/v1/plans/${encodeURIComponent(planId)}`, { method: "DELETE" });

console.log(`> POST ${apiUrl}/v1/plans`);
const created = await requestJson(`${apiUrl}/v1/plans`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    description: smokePlan.description,
    layout: smokePlan
  })
});
writeJson(join(evidenceDir, "api-responses", "create-plan.json"), created);

console.log(`> GET ${apiUrl}/v1/plans`);
const list = await requestJson(`${apiUrl}/v1/plans`);
writeJson(join(evidenceDir, "api-responses", "list-plans.json"), list);

console.log(`> GET ${apiUrl}/v1/plans/${planId}`);
const retrieved = await requestJson(`${apiUrl}/v1/plans/${encodeURIComponent(planId)}`);
writeJson(join(evidenceDir, "api-responses", "get-plan.json"), retrieved);

if (created.id !== planId || retrieved.id !== planId) {
  throw new Error("Docker plan API smoke test returned the wrong plan ID");
}
if (!list.plans?.some((plan) => plan.id === planId)) {
  throw new Error("Docker plan API smoke test did not find the created plan in list response");
}

console.log("Docker plan API smoke test passed.");

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

function valueFor(values, key, fallback) {
  return process.env[key] ?? values[key] ?? fallback;
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
