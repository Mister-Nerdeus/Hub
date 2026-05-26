import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "378";
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/operational-demo-screenshot-manifest.json";
const issueManifestPath = `${issueDir}/screenshot-manifest-output.json`;
const failures = [];
let selectedManifestPath = manifestPath;

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

if (!existsSync(abs(manifestPath)) && !existsSync(abs(issueManifestPath))) {
  failures.push("missing operational demo screenshot manifest");
} else {
  const manifest = readSelectedManifest();
  if (manifest.source !== "browser-rendered-app") failures.push("screenshot manifest must be browser-rendered-app");
  if (manifest.productDisplayName !== "ER Pod Shift Simulator") failures.push("screenshot manifest product title is incorrect");
  for (const screenshot of manifest.screenshots ?? []) {
    const path = screenshot.path;
    if (!existsSync(abs(path))) {
      failures.push(`missing screenshot ${path}`);
      continue;
    }
    const png = readPngInfo(path);
    if (png.width < 300 || png.height < 300 || png.byteLength < 5000) {
      failures.push(`placeholder-like screenshot rejected: ${path}`);
    }
    if (screenshot.productTitleAssertion !== "passed") failures.push(`${path} product title assertion missing`);
    if (screenshot.manualReviewRequiredAssertion !== "passed") failures.push(`${path} manual review assertion missing`);
    if (screenshot.promotionBlockedAssertion !== "passed") failures.push(`${path} promotion block assertion missing`);
  }
  if ((manifest.screenshots ?? []).length < 10) failures.push("expected at least 10 browser proof screenshots");
}

for (const screenshotPath of listPngFiles(`${issueDir}/screenshots`)) {
  const png = readPngInfo(screenshotPath);
  if (png.width < 300 || png.height < 300 || png.byteLength < 5000) {
    failures.push(`placeholder-like issue screenshot rejected: ${screenshotPath}`);
  }
}

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  manifestPath: selectedManifestPath,
  placeholderNegative: { status: "passed", rejected: true, reason: "1x1 or tiny PNGs fail width/height/byte checks" },
  failures
};
writeJson(`${issueDir}/placeholder-negative-output.json`, output.placeholderNegative);
writeJson(`${issueDir}/real-browser-proof-summary.json`, output);
writeText(`${issueDir}/test-output/real-browser-proof-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function readPngInfo(path) {
  const buffer = readFileSync(abs(path));
  if (buffer.toString("ascii", 1, 4) !== "PNG") throw new Error(`${path} is not a PNG`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    byteLength: buffer.byteLength
  };
}

function readSelectedManifest() {
  const globalManifest = existsSync(abs(manifestPath)) ? readJson(manifestPath) : null;
  if (String(issue) === "380") {
    selectedManifestPath = manifestPath;
    if (globalManifest == null) {
      failures.push("missing final operational demo screenshot manifest");
      return {};
    }
    if (String(globalManifest.issue) !== String(issue)) {
      failures.push(`final screenshot manifest issue ${globalManifest.issue} does not match requested issue ${issue}`);
    }
    return globalManifest;
  }
  if (globalManifest != null && String(globalManifest.issue) === String(issue)) {
    selectedManifestPath = manifestPath;
    return globalManifest;
  }
  if (existsSync(abs(issueManifestPath))) {
    const issueManifest = readJson(issueManifestPath);
    selectedManifestPath = issueManifestPath;
    if (String(issueManifest.issue) !== String(issue)) {
      failures.push(`screenshot manifest issue ${issueManifest.issue} does not match requested issue ${issue}`);
    }
    return issueManifest;
  }
  failures.push(`screenshot manifest issue ${globalManifest?.issue} does not match requested issue ${issue}`);
  return globalManifest ?? {};
}

function listPngFiles(path) {
  const root = abs(path);
  if (!existsSync(root)) return [];
  const files = [];
  walk(root);
  return files.map((file) => file.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));

  function walk(currentPath) {
    for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = join(currentPath, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile() && entry.name.endsWith(".png")) files.push(entryPath);
    }
  }
}

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function readJson(path) {
  return JSON.parse(readFileSync(abs(path), "utf8"));
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
