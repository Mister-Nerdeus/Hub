import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateIssueTraceability } from "./evidence/issueTraceabilityContract.mjs";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const args = new Set(process.argv.slice(2));
const stageArgIndex = process.argv.indexOf("--stage");
const stage = stageArgIndex >= 0 ? process.argv[stageArgIndex + 1] : "final";
const issueArgIndex = process.argv.indexOf("--issue");
const issue = issueArgIndex >= 0 ? String(process.argv[issueArgIndex + 1]).padStart(3, "0") : null;
const allowPartial = args.has("--allow-partial");

const supportedStages = [
  "traceability",
  "guided-workflow",
  "narratives",
  "assumptions-presentation",
  "timeline-warning-ux",
  "demo-seed-pack",
  "proof-bundle",
  "no-claims-audit",
  "screenshots-route-matrix",
  "final"
];
if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported --stage "${stage}". Expected one of: ${supportedStages.join(", ")}`);
}

const issueDir = issue == null ? null : join(repoRoot, "docs", "verification", "issues", `issue-${issue}`);
if (issueDir != null) {
  mkdirSync(issueDir, { recursive: true });
}

const manifestPath = "docs/verification/plan-1-demo-readiness-manifest.json";
const manifest = readOptionalJson(manifestPath);
const checks = [];

checks.push(validateManifest(manifest));

if (stage === "traceability" || stage === "final") {
  checks.push(validateTraceability(issue));
}
if (stage === "guided-workflow" || stage === "final") {
  checks.push(validateIssueEvidence("272", [
    "demo-workflow-view-model-output.json",
    "demo-guide-ui-output.json",
    "demo-step-coverage-output.json",
    "demo-non-claims-banner-output.json",
    "developer-evidence-separation-output.json"
  ], "guidedWorkflow"));
}
if (stage === "narratives" || stage === "final") {
  checks.push(validateIssueEvidence("273", [
    "scenario-narratives-output.json",
    "typical-vs-slammed-narrative-output.json",
    "typical-vs-walking-heavy-narrative-output.json",
    "typical-vs-trauma-heavy-narrative-output.json",
    "prohibited-claim-negative-output.json",
    "comparison-panel-narrative-output.json"
  ], "scenarioNarratives"));
  checks.push(validateNarrativeContent());
}
if (stage === "assumptions-presentation" || stage === "final") {
  checks.push(validateIssueEvidence("274", [
    "assumptions-display-groups-output.json",
    "assumptions-polished-panel-output.json",
    "assumptions-non-claims-callout-output.json",
    "assumptions-reader-summary-output.md"
  ], "assumptionsPresentation"));
}
if (stage === "timeline-warning-ux" || stage === "final") {
  checks.push(validateIssueEvidence("275", [
    "timeline-narratives-output.json",
    "highest-queue-callout-output.json",
    "deferred-task-callout-output.json",
    "walking-load-callout-output.json",
    "warning-card-output.json",
    "prohibited-claim-negative-output.json"
  ], "timelineWarningUx"));
}
if (stage === "demo-seed-pack" || stage === "final") {
  checks.push(validateIssueEvidence("276", [
    "demo-seed-pack-output.json",
    "demo-seed-validation-output.json",
    "demo-seed-reproducibility-output.json",
    "expected-signals-output.json",
    "demo-seed-panel-output.json"
  ], "demoSeedPack"));
}
if (stage === "proof-bundle" || stage === "final") {
  checks.push(validateIssueEvidence("277", [
    "demo-proof-bundle-output.json",
    "demo-proof-bundle-determinism-output.json",
    "demo-proof-bundle-evidence-reference-output.json",
    "demo-proof-bundle-non-claims-output.json",
    "demo-proof-bundle-ui-output.json"
  ], "proofBundle"));
}
if (stage === "no-claims-audit" || stage === "final") {
  checks.push(validateIssueEvidence("278", [
    "no-claims-audit-output.json",
    "no-phi-demo-audit-output.json",
    "prohibited-claim-negative-output.json",
    "prohibited-data-field-negative-output.json",
    "required-non-claims-present-output.json"
  ], "noClaimsAudit"));
}
if (stage === "screenshots-route-matrix" || stage === "final") {
  checks.push(validateIssueEvidence("279", [
    "demo-route-matrix-output.json",
    "demo-screen-coverage-output.json",
    "demo-non-claims-screen-output.json",
    "screenshot-reference-output.json"
  ], "screenshotsRouteMatrix"));
  checks.push(validateRouteMatrix());
}

const failures = checks.flatMap((check) => check.failures.map((failure) => `${check.check}: ${failure}`));
const status = failures.length === 0 ? "passed" : allowPartial && stage !== "final" ? "current_failure_allowed" : "failed";
const output = {
  issue: issue ?? "unscoped",
  stage,
  status,
  mode: allowPartial ? "allow-partial" : "strict",
  manifestSummary: summarizeManifest(manifest),
  checks,
  failureCount: failures.length,
  failures,
  nonClaims: manifest?.requiredNonClaims ?? []
};

if (issueDir != null) {
  writeJson(join(issueDir, "plan-1-demo-readiness-output.json"), output);
  writeJson(join(issueDir, "demo-readiness-manifest-output.json"), {
    issue,
    status: checks.find((check) => check.check === "manifest")?.status ?? "failed",
    manifestSummary: output.manifestSummary
  });
  if (stage === "traceability" || stage === "final") {
    writeJson(join(issueDir, "issue-scope-validation-output.json"), checks.find((check) => check.check === "traceability"));
    writeJson(
      join(issueDir, "command-output-map-validation-output.json"),
      checks.find((check) => check.check === "traceability") ?? { status: "failed" }
    );
  }
}

console.log(JSON.stringify(output, null, 2));
if (status === "failed") {
  process.exitCode = 1;
}

function validateManifest(value) {
  const failures = [];
  if (value == null) {
    failures.push(`${manifestPath} is missing`);
  } else {
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
      if (value[field] == null) {
        failures.push(`missing field ${field}`);
      }
    }
    if (value.planId !== "default-er-layout-plan-1") {
      failures.push(`unexpected planId ${value.planId}`);
    }
    for (const nonClaim of [
      "Synthetic operational modeling only.",
      "Not a clinical safety score.",
      "Not a staffing compliance recommendation.",
      "Not a legal compliance assessment.",
      "Not a patient outcome prediction.",
      "Not based on real patient, staff, EHR, or hospital data."
    ]) {
      if (!Array.isArray(value.requiredNonClaims) || !value.requiredNonClaims.includes(nonClaim)) {
        failures.push(`missing required non-claim: ${nonClaim}`);
      }
    }
  }
  return check("manifest", failures);
}

function validateTraceability(issueId) {
  const requiredGateOutputs = [
    "plan-1-visual-parity-gate.txt",
    "plan-1-assignment-workflow-gate.txt",
    "plan-1-scenario-simulation-gate.txt",
    "plan-1-simulation-refinement-gate.txt"
  ];
  const result = validateIssueTraceability(repoRoot, {
    issue: issueId,
    manifestPath,
    gateOutputPaths: issueId == null
      ? []
      : requiredGateOutputs.map((fileName) => `docs/verification/issues/issue-${issueId}/test-output/${fileName}`),
    requiredTestOutputs: requiredGateOutputs
  });
  return check("traceability", result.failures);
}

function validateIssueEvidence(issueId, requiredFiles, checkName) {
  const failures = [];
  for (const fileName of requiredFiles) {
    const relativePath = `docs/verification/issues/issue-${issueId}/${fileName}`;
    const absolutePath = join(repoRoot, relativePath);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      failures.push(`missing ${relativePath}`);
    } else if (statSync(absolutePath).size === 0) {
      failures.push(`empty ${relativePath}`);
    }
  }
  if (manifest != null && !JSON.stringify(manifest).includes(`issue-${issueId}`)) {
    failures.push(`manifest does not reference issue-${issueId}`);
  }
  return check(checkName, failures);
}

function validateRouteMatrix() {
  const failures = [];
  const routeMatrixPath = manifest?.routeMatrixPath;
  if (typeof routeMatrixPath !== "string" || routeMatrixPath.length === 0) {
    return check("routeMatrix", ["manifest routeMatrixPath missing"]);
  }
  const matrix = readOptionalJson(routeMatrixPath);
  if (matrix == null) {
    return check("routeMatrix", [`missing ${routeMatrixPath}`]);
  }
  const screens = Array.isArray(matrix.screens) ? matrix.screens : Array.isArray(matrix) ? matrix : [];
  const requiredScreens = Array.isArray(manifest?.requiredScreens) ? manifest.requiredScreens : [];
  const screenIds = new Set(screens.map((screen) => screen.screenId));
  for (const screenId of requiredScreens) {
    if (!screenIds.has(screenId)) {
      failures.push(`missing required screen ${screenId}`);
    }
  }
  for (const screen of screens) {
    if (screen.screenshotRequired === true) {
      if (typeof screen.screenshotPath !== "string" || screen.screenshotPath.length === 0) {
        failures.push(`missing screenshotPath for ${screen.screenId}`);
        continue;
      }
      const screenshotPath = join(repoRoot, screen.screenshotPath);
      if (!existsSync(screenshotPath) || !statSync(screenshotPath).isFile()) {
        failures.push(`missing screenshot file for ${screen.screenId}: ${screen.screenshotPath}`);
      }
    }
  }
  return check("routeMatrix", failures);
}

function validateNarrativeContent() {
  const relativePath = "docs/verification/issues/issue-273/scenario-narratives-output.json";
  const output = readOptionalJson(relativePath);
  if (output == null) {
    return check("scenarioNarrativeContent", [`missing ${relativePath}`]);
  }
  const text = JSON.stringify(output);
  const failures = [];
  for (const phrase of [
    "higher synthetic task pressure",
    "more deferred synthetic work",
    "higher approximate walking load",
    "larger queue-depth signal",
    "operational comparison only"
  ]) {
    if (!text.includes(phrase)) {
      failures.push(`missing narrative phrase: ${phrase}`);
    }
  }
  for (const prohibited of [
    /\bunsafe\b/iu,
    /\bsafe\b/iu,
    /staffing compliant/iu,
    /clinically unacceptable/iu,
    /patient harm/iu,
    /predicts outcomes/iu,
    /required staffing level/iu
  ]) {
    if (prohibited.test(text)) {
      failures.push(`prohibited narrative claim language present: ${prohibited}`);
    }
  }
  return check("scenarioNarrativeContent", failures);
}

function summarizeManifest(value) {
  if (value == null) {
    return null;
  }
  return {
    manifestVersion: value.manifestVersion,
    planId: value.planId,
    demoScope: value.demoScope,
    requiredScreenCount: Array.isArray(value.requiredScreens) ? value.requiredScreens.length : 0,
    requiredEvidenceArtifactCount: Array.isArray(value.requiredEvidenceArtifacts) ? value.requiredEvidenceArtifacts.length : 0,
    requiredGateCount: Array.isArray(value.requiredGates) ? value.requiredGates.length : 0,
    lastIssueUpdated: value.lastIssueUpdated,
    goNoGoStatus: value.goNoGoStatus
  };
}

function check(name, failures) {
  return {
    check: name,
    status: failures.length === 0 ? "passed" : "failed",
    failureCount: failures.length,
    failures
  };
}

function readOptionalJson(relativePath) {
  const absolutePath = join(repoRoot, relativePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    return null;
  }
  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
