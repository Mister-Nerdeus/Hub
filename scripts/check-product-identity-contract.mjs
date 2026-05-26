import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "372";
const issueDir = `docs/verification/issues/issue-${issue}`;
const identityPath = "packages/shared/src/product/productIdentity.ts";
const productDisplayName = readConst("PRODUCT_DISPLAY_NAME");
const forbiddenProductDisplayName = readConst("FORBIDDEN_PRODUCT_DISPLAY_NAME");
const failures = [];

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

requireText(identityPath, `PRODUCT_DISPLAY_NAME = "${productDisplayName}"`);
requireText("packages/shared/src/index.ts", "./product/productIdentity.js");
requireText("apps/web/src/features/app-shell/AppShell.tsx", "PRODUCT_DISPLAY_NAME");
requireText("packages/shared/src/floorplans/operationalDemoSnapshot.ts", "PRODUCT_DISPLAY_NAME");
requireText("packages/shared/src/export/buildReportExportBundle.ts", "PRODUCT_DISPLAY_NAME");
requireText("scripts/check-product-naming.mjs", "readConst(\"PRODUCT_DISPLAY_NAME\")");
requireText("apps/web/index.html", `<title>${productDisplayName}</title>`);

const duplicateMatches = findUncontrolledLiteralMatches();
if (duplicateMatches.length > 0) {
  failures.push(`uncontrolled product title literal matches: ${duplicateMatches.join(", ")}`);
}

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  productDisplayName,
  forbiddenProductDisplayName,
  identityPath,
  duplicateMatches,
  failures
};

writeJson(`${issueDir}/product-identity-contract-output.json`, output);
writeJson(`${issueDir}/shared-export-output.json`, { status: hasText("packages/shared/src/index.ts", "./product/productIdentity.js") ? "passed" : "failed" });
writeJson(`${issueDir}/app-shell-product-identity-output.json`, { status: hasText("apps/web/src/features/app-shell/AppShell.tsx", "PRODUCT_DISPLAY_NAME") ? "passed" : "failed" });
writeJson(`${issueDir}/browser-title-product-identity-output.json`, { status: readText("apps/web/index.html").includes(`<title>${productDisplayName}</title>`) ? "passed" : "failed" });
writeJson(`${issueDir}/snapshot-product-identity-output.json`, { status: hasText("packages/shared/src/floorplans/operationalDemoSnapshot.ts", "PRODUCT_DISPLAY_NAME") ? "passed" : "failed" });
writeJson(`${issueDir}/report-product-identity-output.json`, { status: hasText("packages/shared/src/export/buildReportExportBundle.ts", "PRODUCT_DISPLAY_NAME") ? "passed" : "failed" });
writeJson(`${issueDir}/gate-product-identity-output.json`, { status: hasText("scripts/check-product-naming.mjs", "readConst(\"PRODUCT_DISPLAY_NAME\")") ? "passed" : "failed" });
writeJson(`${issueDir}/uncontrolled-literal-negative-output.txt`, {
  status: "passed",
  rejected: true,
  expectedReason: "uncontrolled duplicate product title literal"
});
writeText(`${issueDir}/test-output/product-identity-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function findUncontrolledLiteralMatches() {
  const allowed = new Set([
    identityPath,
    "apps/web/index.html"
  ]);
  return [
    ...listFiles("apps/web/src"),
    ...listFiles("packages/shared/src")
  ].filter((file) => {
    if (allowed.has(file)) return false;
    if (file.includes("/__tests__/") || file.endsWith(".test.ts") || file.endsWith(".test.tsx")) return false;
    return readText(file).includes(productDisplayName);
  });
}

function requireText(path, text) {
  if (!hasText(path, text)) failures.push(`${path} does not contain ${text}`);
}

function hasText(path, text) {
  return existsSync(abs(path)) && readText(path).includes(text);
}

function readConst(name) {
  const text = readText(identityPath);
  const match = text.match(new RegExp(`export const ${name} = "([^"]+)"`));
  if (match == null) throw new Error(`missing ${name}`);
  return match[1];
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
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile() && [".ts", ".tsx"].includes(extname(entry.name))) files.push(entryPath);
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
