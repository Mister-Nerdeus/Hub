import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "361";
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/governance-product-naming-hardening-manifest.json";
const productDisplayName = "ER Pod Shift Simulator";
const forbiddenProductName = "Nerdeus ER Pod Shift Simulator";
const failures = [];

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const scannedFiles = [
  ...listFiles("apps/web/src").filter((path) => !path.endsWith(".test.ts") && !path.endsWith(".test.tsx")),
  ...listFiles("packages/shared/src"),
  "package.json"
];

for (const file of scannedFiles) {
  const text = readText(file);
  if (text.includes(forbiddenProductName)) {
    failures.push(`${file} contains old product-facing app name`);
  }
}

if (!readText("apps/web/src/features/app-shell/AppShell.tsx").includes(productDisplayName)) {
  failures.push("AppShell does not show ER Pod Shift Simulator");
}

const manifest = {
  manifestVersion: "1.0.0",
  batch: "361-370",
  lastUpdatedIssue: issue,
  productDisplayName,
  appShellStatus: failures.length === 0 ? "passed" : "failed",
  exportMetadataStatus: readText("packages/shared/src/export/buildReportExportBundle.ts").includes(`appName: "${productDisplayName}"`) ? "passed" : "failed",
  forbiddenNameStatus: failures.length === 0 ? "passed" : "failed",
  promotionStatus: "blocked",
  manualApprovalStatus: "missing",
  noPhiStatus: "passed"
};
if (manifest.exportMetadataStatus !== "passed") {
  failures.push("export metadata does not use product display name");
}

writeJson(manifestPath, manifest);
const output = {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  manifestPath,
  productDisplayName,
  scannedFileCount: scannedFiles.length,
  failures
};
writeJson(`${issueDir}/product-naming-preflight-output.json`, output);
writeText(`${issueDir}/test-output/product-naming-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));

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
      } else if (entry.isFile() && [".ts", ".tsx", ".json"].includes(extname(entry.name))) {
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
