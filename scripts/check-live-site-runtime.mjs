const DEFAULT_URL = "https://hub.nerdeus.com";

const args = process.argv.slice(2);
const urlArgIndex = args.indexOf("--url");
const baseUrl = normalizeBaseUrl(
  urlArgIndex >= 0 && args[urlArgIndex + 1] ? args[urlArgIndex + 1] : process.env.LIVE_SITE_URL ?? DEFAULT_URL
);

const failures = [];
const devFragments = ["/@vite/client", "/@react-refresh", "/src/main.tsx", "/node_modules/.vite"];

const root = await fetchText(baseUrl);
const detectedDevFragments = devFragments.filter((fragment) => root.body.includes(fragment));
const productionAssetDetected = /\/assets\/index-[A-Za-z0-9_-]+\.js/.test(root.body);

if (root.status !== 200) {
  failures.push(`root returned HTTP ${root.status}`);
}
if (detectedDevFragments.length > 0) {
  failures.push("root must not serve Vite development runtime references");
}
if (!productionAssetDetected) {
  failures.push("root must reference built production web assets");
}

const health = await fetchJson(new URL("/health", baseUrl).toString());
if (health.status !== 200 || health.body?.status !== "ok" || health.body?.service !== "nerdeus-api") {
  failures.push("/health must proxy to API health JSON");
}

const plans = await fetchJson(new URL("/v1/plans", baseUrl).toString());
if (plans.status !== 200 || !Array.isArray(plans.body?.plans)) {
  failures.push("/v1/plans must proxy to API plans JSON");
}

const result = {
  status: failures.length === 0 ? "passed" : "failed",
  liveSiteUrl: baseUrl,
  root: {
    status: root.status,
    viteDevRuntimeDetected: detectedDevFragments.length > 0,
    detectedDevFragments,
    productionAssetDetected
  },
  health: {
    status: health.status,
    apiHealthOk: health.body?.status === "ok" && health.body?.service === "nerdeus-api"
  },
  plans: {
    status: plans.status,
    plansArrayReturned: Array.isArray(plans.body?.plans)
  },
  failures
};

console.log(JSON.stringify(result, null, 2));

if (failures.length > 0) {
  process.exit(1);
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "cache-control": "no-cache" } });
  return {
    status: response.status,
    body: await response.text()
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "cache-control": "no-cache" } });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = { parseError: true, textPrefix: text.slice(0, 120) };
  }

  return {
    status: response.status,
    body
  };
}
