import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies"
];
const ignoredDirectories = new Set([".git", "dist", "node_modules", "__pycache__", ".pytest_cache"]);
const findings = [];

for (const manifestPath of findPackageManifests(root)) {
  const relativePath = relative(root, manifestPath).replaceAll("\\", "/");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const section of dependencySections) {
    const dependencies = manifest[section];
    if (dependencies == null) {
      continue;
    }
    for (const [name, spec] of Object.entries(dependencies)) {
      if (isFloatingSpec(spec)) {
        findings.push(`${relativePath}:${section}.${name} uses floating spec "${spec}"`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Floating dependency specs found:");
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log("Dependency specs are pinned.");

function findPackageManifests(directory) {
  const manifests = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (!ignoredDirectories.has(entry)) {
        manifests.push(...findPackageManifests(fullPath));
      }
      continue;
    }
    if (entry === "package.json") {
      manifests.push(fullPath);
    }
  }
  return manifests;
}

function isFloatingSpec(spec) {
  if (typeof spec !== "string") {
    return true;
  }
  const trimmed = spec.trim();
  if (trimmed.length === 0 || trimmed === "latest" || trimmed === "*") {
    return true;
  }
  if (/^[~^]/.test(trimmed)) {
    return true;
  }
  if (/[xX*]/.test(trimmed)) {
    return true;
  }
  if (/[<>=]|\|\||\s-\s/.test(trimmed)) {
    return true;
  }
  return false;
}
