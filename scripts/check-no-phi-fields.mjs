import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();

const ignoredDirectories = new Set([
  ".git",
  ".pytest_cache",
  ".venv",
  "dist",
  "node_modules",
  "__pycache__"
]);

const ignoredPrefixes = [
  "docs/codex/",
  "docs/compliance/",
  "docs/verification/",
  "scripts/check-no-phi-fields.mjs"
];

const scannedExtensions = new Set([
  ".json",
  ".md",
  ".mjs",
  ".py",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml"
]);

const forbiddenPatterns = [
  /\bpatient(?:Name|Id|Identifier|Record|Dob|DOB)\b/i,
  /\bpatient_(?:name|id|identifier|record|dob)\b/i,
  /\bmrn\b/i,
  /\bmedicalRecordNumber\b/i,
  /\bdateOfBirth\b/i,
  /\bdob\b/i,
  /\bssn\b/i,
  /\bfirstName\b/i,
  /\blastName\b/i,
  /\bchiefComplaint\b/i,
  /\bclinicalNote\b/i,
  /\bdiagnosisCode\b/i,
  /\behr(?:Id|Record|Import|Export)\b/i,
  /\behr_(?:id|record|import|export)\b/i
];

const findings = [];

function extensionOf(path) {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index);
}

function shouldIgnore(path) {
  const normalized = relative(root, path).replaceAll("\\", "/");
  return ignoredPrefixes.some((prefix) => normalized.startsWith(prefix));
}

function scanFile(path) {
  if (shouldIgnore(path) || !scannedExtensions.has(extensionOf(path))) {
    return;
  }

  const content = readFileSync(path, "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(line)) {
        findings.push(`${relative(root, path)}:${index + 1}: ${line.trim()}`);
      }
    }
  });
}

function walk(path) {
  if (!existsSync(path) || shouldIgnore(path)) {
    return;
  }
  const stats = statSync(path);
  if (stats.isDirectory()) {
    if (ignoredDirectories.has(path.split(/[\\/]/).at(-1))) {
      return;
    }
    for (const entry of readdirSync(path)) {
      walk(join(path, entry));
    }
    return;
  }
  scanFile(path);
}

walk(root);

if (findings.length > 0) {
  console.error("Potential PHI-like fields found:");
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log("No PHI-like fields found.");
