import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "381";
const issueDir = `docs/verification/issues/issue-${issue}`;
const registryPath = "docs/verification/canonical-gate-registry.json";
const requiredGateIds = [
  "no-phi",
  "dependency-specs",
  "docs-contracts",
  "simulation-contract-parity",
  "product-naming",
  "product-identity",
  "source-plan-correction",
  "corrected-plan-review",
  "corrected-plan-route-repair",
  "manual-visual-review",
  "plan-builder-ux-review-flow",
  "human-review-intake",
  "human-review-governance-hardening",
  "operational-demo-ux",
  "operational-demo-repair",
  "real-browser-proof",
  "operational-demo-negative-tests",
  "private-source-artifacts",
  "default-plans-2-5-unchanged",
  "canonical-gates",
  "manual-assignment-foundation-preflight",
  "manual-assignment-contracts",
  "manual-assignment-ui",
  "manual-assignment-burden",
  "floorplan-editor-ux",
  "floorplan-operational-map-style",
  "floorplan-presentation-rendering",
  "door-authoring-tools",
  "layout-assignment-overlay"
];
const newIssue381Scripts = [
  "check:product-identity",
  "check:operational-demo-repair",
  "check:real-browser-proof",
  "check:operational-demo-negative-tests",
  "check:canonical-gates",
  "check:manual-assignment-foundation",
  "check:manual-assignment-contracts",
  "check:manual-assignment-ui",
  "check:manual-assignment-burden",
  "check:floorplan-editor-ux",
  "check:floorplan-operational-map-style",
  "check:floorplan-presentation-rendering",
  "check:door-authoring-tools",
  "check:layout-assignment-overlay"
];
const sharedBuildRequiredScripts = [
  "check:operational-demo-ux",
  "check:operational-demo-repair",
  "check:operational-demo-negative-tests",
  "check:source-plan-correction",
  "check:corrected-plan-review",
  "check:corrected-plan-route-repair",
  "check:manual-visual-review",
  "check:plan-builder-ux-review-flow",
  "check:human-review-intake",
  "check:human-review-governance-hardening",
  "check:manual-assignment-foundation",
  "check:manual-assignment-contracts",
  "check:manual-assignment-ui",
  "check:manual-assignment-burden",
  "check:floorplan-editor-ux",
  "check:floorplan-presentation-rendering",
  "check:door-authoring-tools",
  "check:layout-assignment-overlay"
];

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const registry = readJson(registryPath);
const packageJson = readJson("package.json");
const verifyLocalSource = readText("scripts/verify-local.mjs");
const failures = validateRegistry(registry, packageJson, verifyLocalSource);

const missingRepairNegative = captureValidationFailure(
  () => validateRegistry(
    { ...registry, gates: registry.gates.filter((gate) => gate.id !== "operational-demo-repair") },
    packageJson,
    verifyLocalSource
  ),
  /operational-demo-repair/u
);
const missingCanonicalGateNegative = captureValidationFailure(
  () => validateRegistry(
    { ...registry, gates: registry.gates.filter((gate) => gate.id !== "canonical-gates") },
    packageJson,
    verifyLocalSource
  ),
  /canonical-gates/u
);
const missingPackageScriptNegative = captureValidationFailure(
  () => validateRegistry(
    registry,
    {
      ...packageJson,
      scripts: Object.fromEntries(
        Object.entries(packageJson.scripts).filter(([name]) => name !== "check:operational-demo-repair")
      )
    },
    verifyLocalSource
  ),
  /check:operational-demo-repair/u
);
const missingFloorplanGateNegative = {
  status: "passed",
  checks: requiredGateIds
    .filter((id) => [
      "floorplan-editor-ux",
      "floorplan-operational-map-style",
      "floorplan-presentation-rendering",
      "door-authoring-tools",
      "layout-assignment-overlay"
    ].includes(id))
    .map((id) => captureValidationFailure(
      () => validateRegistry(
        { ...registry, gates: registry.gates.filter((gate) => gate.id !== id) },
        packageJson,
        verifyLocalSource
      ),
      new RegExp(id, "u")
    ))
};
if (missingFloorplanGateNegative.checks.some((check) => check.status !== "passed")) {
  missingFloorplanGateNegative.status = "failed";
  failures.push("missing floorplan gate negative test did not reject every removed gate");
}

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  registryPath,
  gateCount: Array.isArray(registry.gates) ? registry.gates.length : 0,
  requiredGateIds,
  missingRepairNegative,
  missingCanonicalGateNegative,
  missingPackageScriptNegative,
  missingFloorplanGateNegative,
  failures
};

writeJson(`${issueDir}/canonical-gate-registry-output.json`, output);
writeJson(`${issueDir}/missing-repair-gates-negative-output.json`, missingRepairNegative);
writeJson(`${issueDir}/missing-canonical-gate-negative-output.json`, missingCanonicalGateNegative);
writeJson(`${issueDir}/missing-floorplan-gate-negative-output.json`, missingFloorplanGateNegative);
writeJson(`${issueDir}/canonical-gate-registry-update-output.json`, {
  status: output.status,
  registryPath,
  lastUpdatedIssue: registry.lastUpdatedIssue
});
writeText(`${issueDir}/test-output/canonical-gates.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function validateRegistry(candidateRegistry, candidatePackageJson, candidateVerifyLocalSource) {
  const errors = [];
  if (candidateRegistry.registryVersion !== "1.0.0") errors.push("registryVersion must be 1.0.0");
  if (candidateRegistry.productDisplayName !== "ER Pod Shift Simulator") {
    errors.push("productDisplayName must remain ER Pod Shift Simulator");
  }
  if (!Array.isArray(candidateRegistry.gates)) errors.push("registry gates must be an array");
  const gates = Array.isArray(candidateRegistry.gates) ? candidateRegistry.gates : [];
  const ids = new Set(gates.map((gate) => gate.id));
  for (const id of requiredGateIds) {
    if (!ids.has(id)) errors.push(`missing canonical gate: ${id}`);
  }

  for (const gate of gates) {
    if (typeof gate.id !== "string" || gate.id.length === 0) errors.push("gate id is required");
    if (typeof gate.command !== "string" || gate.command.length === 0) errors.push(`${gate.id} command is required`);
    if (typeof gate.packageScript !== "string" || gate.packageScript.length === 0) {
      errors.push(`${gate.id} packageScript is required`);
      continue;
    }
    if (candidatePackageJson.scripts?.[gate.packageScript] == null) {
      errors.push(`package.json missing script ${gate.packageScript} for ${gate.id}`);
    }
    if (!gate.command.includes(`npm run ${gate.packageScript}`)) {
      errors.push(`${gate.id} command must be discoverable through npm run ${gate.packageScript}`);
    }
  }

  for (const scriptName of newIssue381Scripts) {
    if (candidatePackageJson.scripts?.[scriptName] == null) {
      errors.push(`package.json missing Issue 381 script ${scriptName}`);
    }
  }

  for (const scriptName of sharedBuildRequiredScripts) {
    const command = candidatePackageJson.scripts?.[scriptName] ?? "";
    if (!command.includes("npm --workspace packages/shared run build")) {
      errors.push(`${scriptName} must build packages/shared before running its gate`);
    }
  }

  for (const requiredText of [
    "docs/verification/canonical-gate-registry.json",
    "loadCanonicalGateRegistry",
    "canonicalCommands",
    "docs/verification/manual-assignment-foundation-manifest.json",
    "docs/verification/operational-demo-repair-manifest.json",
    "docs/verification/operational-demo-ux-manifest.json",
    "docs/verification/human-review-governance-hardening-manifest.json",
    "docs/verification/floorplan-editor-ux-manifest.json",
    "floorplanEditorUxIssue",
    "docs/verification/editor-usability-repair-manifest.json",
    "editorUsabilityRepairIssue"
  ]) {
    if (!candidateVerifyLocalSource.includes(requiredText)) {
      errors.push(`verify-local missing registry/governance wiring: ${requiredText}`);
    }
  }
  return errors;
}

function captureValidationFailure(run, expectedPattern) {
  const errors = run();
  const matched = errors.find((error) => expectedPattern.test(error));
  return {
    status: matched == null ? "failed" : "passed",
    rejected: matched != null,
    expectedReason: String(expectedPattern),
    actualError: matched ?? errors.join("; ")
  };
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
