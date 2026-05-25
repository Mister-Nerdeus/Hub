import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export function normalizeIssue(issue) {
  if (issue == null || String(issue).trim().length === 0) {
    return null;
  }
  const normalized = String(issue).padStart(3, "0");
  if (!/^\d{3}$/.test(normalized)) {
    throw new Error(`Invalid issue number: ${issue}`);
  }
  return normalized;
}

export function issueEvidenceDir(root, issue) {
  const normalized = normalizeIssue(issue);
  if (normalized == null) {
    return null;
  }
  return join(root, "docs", "verification", "issues", `issue-${normalized}`);
}

export function buildIssueScopeSummary(root, issue) {
  const normalized = normalizeIssue(issue);
  const issueDir = issueEvidenceDir(root, normalized);
  return {
    issue: normalized ?? "unscoped",
    issueTraceabilityScoped: normalized != null,
    issueEvidenceDirectory: issueDir == null ? null : relative(root, issueDir).replaceAll("\\", "/"),
    evidenceDirectoryMatchesIssue: issueDir == null ? false : /issue-\d{3}$/.test(issueDir)
  };
}

export function validateIssueTraceability(root, options) {
  const issue = normalizeIssue(options.issue);
  const failures = [];
  if (issue == null) {
    failures.push("TRACEABILITY_ISSUE_REQUIRED");
    return result(issue, failures);
  }

  const issueDir = issueEvidenceDir(root, issue);
  if (issueDir == null || !existsSync(issueDir) || !statSync(issueDir).isDirectory()) {
    failures.push(`ISSUE_DIRECTORY_MISSING: docs/verification/issues/issue-${issue}`);
    return result(issue, failures);
  }

  for (const gatePath of options.gateOutputPaths ?? []) {
    validateGateOutput(root, issue, gatePath, failures);
  }
  validateCommandOutputMap(root, issue, failures);
  validateRequiredTestOutputs(root, issue, options.requiredTestOutputs ?? [], failures);
  validateEvidenceIndex(root, issue, failures);
  validateDemoReadinessManifest(root, issue, options.manifestPath, failures);

  return result(issue, failures);
}

function validateGateOutput(root, issue, gatePath, failures) {
  const absolutePath = join(root, gatePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    failures.push(`GATE_OUTPUT_MISSING: ${gatePath}`);
    return;
  }
  const content = readFileSync(absolutePath, "utf8");
  if (/"issue"\s*:\s*"unscoped"/.test(content)) {
    failures.push(`GATE_OUTPUT_UNSCOPED: ${gatePath}`);
  }
  if (!content.includes(`"issue": "${issue}"`)) {
    failures.push(`GATE_OUTPUT_ISSUE_MISMATCH: ${gatePath}`);
  }
}

function validateCommandOutputMap(root, issue, failures) {
  const mapPath = join(root, "docs", "verification", "issues", `issue-${issue}`, "command-output-map.json");
  if (!existsSync(mapPath) || !statSync(mapPath).isFile()) {
    failures.push(`COMMAND_OUTPUT_MAP_MISSING: docs/verification/issues/issue-${issue}/command-output-map.json`);
    return;
  }
  let map;
  try {
    map = JSON.parse(readFileSync(mapPath, "utf8"));
  } catch (error) {
    failures.push(`COMMAND_OUTPUT_MAP_INVALID_JSON: ${error.message}`);
    return;
  }
  if (map.issue !== issue) {
    failures.push(`COMMAND_OUTPUT_MAP_ISSUE_MISMATCH: expected ${issue}`);
  }
  const entries = Array.isArray(map.commands) ? map.commands : [];
  if (entries.length === 0) {
    failures.push("COMMAND_OUTPUT_MAP_COMMANDS_MISSING");
  }
  for (const entry of entries) {
    for (const outputPath of Array.isArray(entry?.outputs) ? entry.outputs : []) {
      const absoluteOutputPath = join(root, outputPath);
      if (!existsSync(absoluteOutputPath) || !statSync(absoluteOutputPath).isFile()) {
        failures.push(`COMMAND_OUTPUT_MAP_OUTPUT_MISSING: ${outputPath}`);
        continue;
      }
      const issueDir = join(root, "docs", "verification", "issues", `issue-${issue}`);
      if (relative(issueDir, absoluteOutputPath).startsWith("..")) {
        failures.push(`COMMAND_OUTPUT_MAP_OUTPUT_UNSCOPED: ${outputPath}`);
      }
    }
  }
}

function validateRequiredTestOutputs(root, issue, requiredTestOutputs, failures) {
  for (const fileName of requiredTestOutputs) {
    const path = join(root, "docs", "verification", "issues", `issue-${issue}`, "test-output", fileName);
    if (!existsSync(path) || !statSync(path).isFile()) {
      failures.push(`REQUIRED_TEST_OUTPUT_MISSING: test-output/${fileName}`);
      continue;
    }
    if (statSync(path).size === 0) {
      failures.push(`REQUIRED_TEST_OUTPUT_EMPTY: test-output/${fileName}`);
    }
  }
}

function validateEvidenceIndex(root, issue, failures) {
  const indexPath = join(root, "docs", "verification", "ISSUE_EVIDENCE_INDEX.json");
  if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
    failures.push("EVIDENCE_INDEX_MISSING");
    return;
  }
  let index;
  try {
    index = JSON.parse(readFileSync(indexPath, "utf8"));
  } catch (error) {
    failures.push(`EVIDENCE_INDEX_INVALID_JSON: ${error.message}`);
    return;
  }
  const entry = Array.isArray(index.issues) ? index.issues.find((candidate) => candidate.issue === issue) : null;
  if (entry == null) {
    failures.push(`EVIDENCE_INDEX_ISSUE_MISSING: ${issue}`);
  }
}

function validateDemoReadinessManifest(root, issue, manifestPath, failures) {
  const relativeManifestPath = manifestPath ?? "docs/verification/plan-1-demo-readiness-manifest.json";
  const absoluteManifestPath = join(root, relativeManifestPath);
  if (!existsSync(absoluteManifestPath) || !statSync(absoluteManifestPath).isFile()) {
    failures.push(`DEMO_READINESS_MANIFEST_MISSING: ${relativeManifestPath}`);
    return;
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(absoluteManifestPath, "utf8"));
  } catch (error) {
    failures.push(`DEMO_READINESS_MANIFEST_INVALID_JSON: ${error.message}`);
    return;
  }
  const requiredFields = [
    "manifestVersion",
    "planId",
    "demoScope",
    "requiredScreens",
    "requiredEvidenceArtifacts",
    "requiredGates",
    "requiredNonClaims",
    "routeMatrixPath",
    "proofBundlePath",
    "lastIssueUpdated",
    "goNoGoStatus"
  ];
  for (const field of requiredFields) {
    if (manifest[field] == null) {
      failures.push(`DEMO_READINESS_MANIFEST_FIELD_MISSING: ${field}`);
    }
  }
  if (manifest.planId !== "default-er-layout-plan-1") {
    failures.push(`DEMO_READINESS_MANIFEST_PLAN_MISMATCH: ${manifest.planId}`);
  }
  const serialized = JSON.stringify(manifest);
  if (!serialized.includes(`issue-${issue}`) && !serialized.includes(`"lastIssueUpdated":"${issue}"`)) {
    failures.push(`DEMO_READINESS_MANIFEST_ISSUE_REFERENCE_MISSING: ${issue}`);
  }
}

function result(issue, failures) {
  return {
    issue: issue ?? "unscoped",
    status: failures.length === 0 ? "passed" : "failed",
    failureCount: failures.length,
    failures
  };
}
