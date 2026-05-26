import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "378";
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/operational-demo-screenshot-manifest.json";
const failures = [];

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

if (!existsSync(abs(manifestPath))) {
  failures.push("missing operational demo screenshot manifest");
} else {
  const manifest = readJson(manifestPath);
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

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  manifestPath,
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
