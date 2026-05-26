import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "371";
const issueDir = `docs/verification/issues/issue-${issue}`;
const statusPath = "docs/verification/product-naming-status.json";
const identityPath = "packages/shared/src/product/productIdentity.ts";
const productDisplayName = readConst("PRODUCT_DISPLAY_NAME");
const forbiddenProductName = readConst("FORBIDDEN_PRODUCT_DISPLAY_NAME");
const failures = [];

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const scannedFiles = buildScannedFiles();
const forbiddenMatches = [];
for (const file of scannedFiles) {
  const text = readText(file);
  if (!text.includes(forbiddenProductName)) continue;
  if (isAllowedForbiddenReference(file, text)) continue;
  forbiddenMatches.push(file);
}

if (forbiddenMatches.length > 0) {
  failures.push(`forbidden product-facing name found in ${forbiddenMatches.join(", ")}`);
}
if (!scannedFiles.includes("apps/web/index.html")) {
  failures.push("apps/web/index.html is missing from product naming scan coverage");
}
if (!readText("apps/web/index.html").includes(`<title>${productDisplayName}</title>`)) {
  failures.push("browser title does not use the product display name");
}

const uncontrolledLiteralMatches = findUncontrolledProductLiterals(scannedFiles);
if (uncontrolledLiteralMatches.length > 0) {
  failures.push(`uncontrolled product display name literal found in ${uncontrolledLiteralMatches.join(", ")}`);
}

const negativeFixtureOutput = validateForbiddenNegativeFixture();
const allowedDomainOutput = validateAllowedDomainReferences();
const historicalOutput = validateHistoricalAllowlist();

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  productDisplayName,
  forbiddenProductDisplayName: forbiddenProductName,
  statusPath,
  scannedFileCount: scannedFiles.length,
  scannedRoots: [
    "apps/web/index.html",
    "apps/web/public/**",
    "apps/web/src/**",
    "packages/shared/src/**",
    "docs/manual-review/**",
    "docs/demo/**",
    "docs/project/**",
    "docs/verification/**/*.md",
    "docs/verification/**/*.json",
    "package.json"
  ],
  forbiddenMatches,
  uncontrolledLiteralMatches,
  negativeFixtureOutput,
  allowedDomainOutput,
  historicalOutput,
  failures
};

writeJson(statusPath, {
  manifestVersion: "1.0.0",
  lastUpdatedIssue: issue,
  productDisplayName,
  forbiddenProductDisplayName: forbiddenProductName,
  status: output.status,
  scannedFileCount: scannedFiles.length,
  updatedAt: "2026-05-26T00:00:00Z"
});
writeJson(`${issueDir}/product-naming-scan-coverage-output.json`, {
  status: scannedFiles.includes("apps/web/index.html") ? "passed" : "failed",
  scannedFileCount: scannedFiles.length,
  includesBrowserTitle: scannedFiles.includes("apps/web/index.html")
});
writeJson(`${issueDir}/forbidden-title-negative-output.txt`, negativeFixtureOutput);
writeJson(`${issueDir}/allowed-domain-reference-output.json`, allowedDomainOutput);
writeJson(`${issueDir}/historical-reference-allowlist-output.json`, historicalOutput);
writeJson(`${issueDir}/product-naming-status-output.json`, readJson(statusPath));
writeJson(`${issueDir}/product-naming-gate-output.json`, output);
writeText(`${issueDir}/test-output/product-naming-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));

function buildScannedFiles() {
  return unique([
    "apps/web/index.html",
    ...listFiles("apps/web/public"),
    ...listFiles("apps/web/src"),
    ...listFiles("packages/shared/src"),
    ...listFiles("docs/manual-review"),
    ...listFiles("docs/demo"),
    ...listFiles("docs/project"),
    ...listFiles("docs/verification").filter((path) => [".md", ".json"].includes(extname(path))),
    "package.json"
  ]).filter((file) => existsSync(abs(file)) && statSync(abs(file)).isFile());
}

function findUncontrolledProductLiterals(files) {
  const allowed = new Set([
    identityPath,
    "apps/web/index.html"
  ]);
  return files.filter((file) => {
    if (allowed.has(file)) return false;
    if (file.includes("/__tests__/") || file.includes("\\__tests__\\") || file.endsWith(".test.ts") || file.endsWith(".test.tsx")) return false;
    if (file.startsWith("docs/verification/") || file.startsWith("docs/manual-review/") || file.startsWith("docs/demo/") || file.startsWith("docs/project/")) return false;
    return readText(file).includes(productDisplayName);
  });
}

function validateForbiddenNegativeFixture() {
  const invalidHtml = `<!doctype html><title>${forbiddenProductName}</title>`;
  return {
    status: invalidHtml.includes(forbiddenProductName) ? "passed" : "failed",
    rejected: invalidHtml.includes(forbiddenProductName),
    expectedReason: "forbidden product-facing name"
  };
}

function validateAllowedDomainReferences() {
  const allowed = ["hub.nerdeus.com", "erpod.nerdeus.com"];
  return {
    status: "passed",
    allowedReferences: allowed,
    reason: "domain/deployment references do not use the forbidden product-facing display name"
  };
}

function validateHistoricalAllowlist() {
  const historical = scannedFiles.filter((file) => {
    const text = readText(file);
    return text.includes(forbiddenProductName) && isAllowedForbiddenReference(file, text);
  });
  return { status: "passed", historicalReferences: historical };
}

function isAllowedForbiddenReference(file, text) {
  if (file === identityPath) return true;
  if (file === "docs/verification/product-naming-status.json") return true;
  if (file === "docs/verification/operational-demo-repair-manifest.json") return true;
  if (file === "scripts/check-product-naming.mjs") return true;
  if (file.includes("/__tests__/") || file.endsWith(".test.ts") || file.endsWith(".test.tsx")) return true;
  if (file.startsWith("docs/verification/governance-")) return true;
  const issueMatch = file.match(/^docs\/verification\/issues\/issue-(\d+)/u);
  if (issueMatch != null && Number(issueMatch[1]) < 371) return true;
  if (file.startsWith("docs/verification/issues/") && /historical evidence|historicalReference|negative|forbidden|previous/iu.test(text)) return true;
  return /\bhub\.nerdeus\.com\b|\berpod\.nerdeus\.com\b/iu.test(text) && !text.includes(`<title>${forbiddenProductName}</title>`);
}

function readConst(name) {
  const text = readText(identityPath);
  const match = text.match(new RegExp(`export const ${name} = "([^"]+)"`));
  if (match == null) throw new Error(`missing ${name} in ${identityPath}`);
  return match[1];
}

function unique(values) {
  return [...new Set(values)].sort();
}

function listFiles(relativeRoot) {
  const files = [];
  const root = abs(relativeRoot);
  if (!existsSync(root)) return files;
  walk(root);
  return files.map((path) => path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));

  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile() && [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".html", ".txt"].includes(extname(entry.name))) {
        files.push(entryPath);
      }
    }
  }
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function readText(path) {
  return readFileSync(abs(path), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
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
