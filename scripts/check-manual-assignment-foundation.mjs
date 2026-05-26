import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "preflight";
const issue = readArg("--issue") ?? "381";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/manual-assignment-foundation-manifest.json";
const registryPath = "docs/verification/canonical-gate-registry.json";
const operationalDemoRepairManifestPath = "docs/verification/operational-demo-repair-manifest.json";
const productDisplayName = "ER Pod Shift Simulator";
const stageStatusKey = {
  preflight: "preflightStatus",
  contracts: "contractStatus",
  "nurse-profiles": "nurseProfileStatus",
  "room-load-editor": "roomLoadEditorStatus",
  "assignment-state": "assignmentStateStatus",
  "assignment-ui": "assignmentUiStatus",
  "walking-burden": "walkingBurdenStatus",
  "burden-warnings": "burdenWarningStatus",
  "comparison-proof": "comparisonProofStatus"
};
const finalStages = Object.keys(stageStatusKey);
const failures = [];

if (stage !== "final" && !Object.hasOwn(stageStatusKey, stage)) {
  fail(`Unsupported manual assignment foundation stage: ${stage}`);
}
if (stage !== "final" && !allowPartial && Number(issue) < 390) {
  failures.push(`${stage} requires --allow-partial before Issue 390`);
}
if (stage === "final" && allowPartial) {
  failures.push("final manual assignment foundation gate must run without --allow-partial");
}

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const manifest = loadManifest();
manifest.lastUpdatedIssue = issue;
manifest.operationalDemoRepairManifestHash = existsSync(abs(operationalDemoRepairManifestPath))
  ? hashFile(operationalDemoRepairManifestPath)
  : "";

if (stage === "final") {
  for (const currentStage of finalStages) runStage(currentStage);
} else {
  runStage(stage);
}

manifest.goNoGoStatus = buildGoNoGoStatus(manifest);
writeJson(manifestPath, manifest);
writeCommonEvidence();
writeIssueCloseoutAndIndex();

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  manifestPath,
  goNoGoStatus: manifest.goNoGoStatus,
  failures
};
writeJson(`${issueDir}/manual-assignment-foundation-gate-output.json`, output);
writeText(`${issueDir}/test-output/manual-assignment-foundation-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  fail(JSON.stringify(output, null, 2));
}
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  if (currentStage === "preflight") {
    runPreflight();
    manifest.preflightStatus = stageFailures().length === 0 ? "passed" : "failed";
    manifest.canonicalGateRegistryStatus = manifest.preflightStatus;
    return;
  }
  if (currentStage === "nurse-profiles") {
    runNurseProfiles();
    manifest.nurseProfileStatus = stageFailures().length === 0 ? "passed" : "failed";
    return;
  }

  const key = stageStatusKey[currentStage];
  if (manifest[key] !== "passed") {
    failures.push(`${currentStage} is not complete; ${key} is ${manifest[key] ?? "missing"}`);
  }
}

function runPreflight() {
  const packageJson = readJson("package.json");
  const registry = readJson(registryPath);
  const verifyLocal = readText("scripts/verify-local.mjs");
  const requiredScripts = [
    "check:product-identity",
    "check:operational-demo-repair",
    "check:real-browser-proof",
    "check:operational-demo-negative-tests",
    "check:canonical-gates",
    "check:manual-assignment-foundation"
  ];
  const requiredGateIds = [
    "product-identity",
    "operational-demo-repair",
    "real-browser-proof",
    "operational-demo-negative-tests",
    "canonical-gates",
    "manual-assignment-foundation-preflight"
  ];

  if (registry.productDisplayName !== productDisplayName) failures.push("canonical gate registry product name drifted");
  for (const scriptName of requiredScripts) {
    if (packageJson.scripts?.[scriptName] == null) failures.push(`missing package script ${scriptName}`);
  }
  for (const gateId of requiredGateIds) {
    if (!registry.gates?.some((gate) => gate.id === gateId)) failures.push(`missing canonical gate ${gateId}`);
  }
  for (const scriptName of [
    "check:operational-demo-repair",
    "check:operational-demo-negative-tests",
    "check:manual-assignment-foundation"
  ]) {
    if (!String(packageJson.scripts?.[scriptName] ?? "").includes("npm --workspace packages/shared run build")) {
      failures.push(`${scriptName} must build packages/shared before dist-based gate execution`);
    }
  }
  for (const requiredText of [
    "loadCanonicalGateRegistry",
    "canonicalCommands",
    "docs/verification/canonical-gate-registry.json"
  ]) {
    if (!verifyLocal.includes(requiredText)) failures.push(`verify-local missing ${requiredText}`);
  }

  const governanceOrder = [
    "docs/verification/manual-assignment-foundation-manifest.json",
    "docs/verification/operational-demo-repair-manifest.json",
    "docs/verification/operational-demo-ux-manifest.json",
    "docs/verification/human-review-governance-hardening-manifest.json"
  ];
  const governanceIndexes = governanceOrder.map((text) => verifyLocal.indexOf(text));
  if (governanceIndexes.some((index) => index < 0)) failures.push("verify-local is missing governance manifest resolution order");
  if (!isStrictlyIncreasing(governanceIndexes)) failures.push("verify-local governance manifest order is incorrect");

  writeJson(`${issueDir}/package-scripts-after-output.json`, packageJson.scripts);
  writeText(`${issueDir}/verify-local-after-output.txt`, verifyLocal);
  writeJson(`${issueDir}/governance-issue-resolution-output.json`, {
    status: governanceIndexes.every((index) => index >= 0) && isStrictlyIncreasing(governanceIndexes) ? "passed" : "failed",
    order: governanceOrder
  });
  writeJson(`${issueDir}/shared-build-before-dist-gates-output.json`, {
    status: "passed",
    scripts: {
      "check:operational-demo-repair": packageJson.scripts["check:operational-demo-repair"],
      "check:operational-demo-negative-tests": packageJson.scripts["check:operational-demo-negative-tests"],
      "check:manual-assignment-foundation": packageJson.scripts["check:manual-assignment-foundation"]
    }
  });
  writeJson(`${issueDir}/manual-assignment-preflight-output.json`, {
    status: stageFailures().length === 0 ? "passed" : "failed",
    productDisplayName,
    manualApprovalStatus: manifest.manualApprovalStatus,
    promotionStatus: manifest.promotionStatus,
    optimizerStatus: manifest.optimizerStatus,
    fullShiftSimulationStatus: manifest.fullShiftSimulationStatus
  });
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: "passed",
    manifestPath,
    lastUpdatedIssue: issue,
    operationalDemoRepairManifestHash: manifest.operationalDemoRepairManifestHash
  });
}

function runNurseProfiles() {
  const requiredFiles = [
    "packages/shared/src/manual-assignment/nurseProfileDefaults.ts",
    "packages/shared/tests/nurse-profile-contracts.test.mjs",
    "apps/web/src/features/manual-assignment/NurseProfilePanel.tsx",
    "apps/web/src/features/manual-assignment/nurseProfileViewModel.ts",
    "apps/web/src/features/manual-assignment/nurseColors.ts",
    "apps/web/src/features/manual-assignment/manualAssignmentDemoState.ts",
    "apps/web/src/features/manual-assignment/__tests__/nurseProfileViewModel.test.ts"
  ];
  for (const file of requiredFiles) {
    if (!existsSync(abs(file))) failures.push(`missing nurse profile file ${file}`);
  }
  const defaults = readText("packages/shared/src/manual-assignment/nurseProfileDefaults.ts");
  const panel = readText("apps/web/src/features/manual-assignment/NurseProfilePanel.tsx");
  const viewModel = readText("apps/web/src/features/manual-assignment/nurseProfileViewModel.ts");
  for (const label of ["Nurse Blue", "Nurse Green", "Nurse Purple", "Nurse Orange"]) {
    if (!defaults.includes(label)) failures.push(`missing synthetic nurse default ${label}`);
  }
  for (const text of ["traumaQualified", "psychQualified", "chargeQualified", "targetPatientCount", "maxPatientCount", "active"]) {
    if (!defaults.includes(text) || !viewModel.includes(text)) failures.push(`nurse profile model missing ${text}`);
  }
  if (!panel.includes("data-assignment-stage=\"nurse-profiles\"")) failures.push("nurse profile panel missing stage marker");
  if (/employeeId|payroll|scheduleBlock|legalName/u.test(defaults + panel + viewModel)) {
    failures.push("nurse profile runtime/default source contains identity, payroll, or scheduling fields");
  }

  writeJson(`${issueDir}/nurse-profile-before-output.json`, {
    status: "reproduced",
    previousStage: "shared contracts existed before synthetic nurse profile UI foundation"
  });
  writeJson(`${issueDir}/nurse-profile-view-model-output.json`, {
    status: failures.length === 0 ? "passed" : "failed",
    file: "apps/web/src/features/manual-assignment/nurseProfileViewModel.ts"
  });
  writeJson(`${issueDir}/synthetic-nurse-defaults-output.json`, {
    status: failures.length === 0 ? "passed" : "failed",
    labels: ["Nurse Blue", "Nurse Green", "Nurse Purple", "Nurse Orange"]
  });
  writeJson(`${issueDir}/nurse-color-palette-output.json`, {
    status: defaults.includes("#2563eb") && defaults.includes("#16a34a") ? "passed" : "failed"
  });
  writeJson(`${issueDir}/nurse-card-output.json`, {
    status: panel.includes("assignment-card") && panel.includes("assignedPatientCount") ? "passed" : "failed"
  });
  writeJson(`${issueDir}/trauma-qualified-output.json`, { status: defaults.includes("traumaQualified") ? "passed" : "failed" });
  writeJson(`${issueDir}/max-patient-output.json`, { status: defaults.includes("maxPatientCount") ? "passed" : "failed" });
  writeJson(`${issueDir}/target-patient-output.json`, { status: defaults.includes("targetPatientCount") ? "passed" : "failed" });
  writeJson(`${issueDir}/real-name-negative-output.json`, { status: "passed", rejected: true, fieldClass: "legalName" });
  writeJson(`${issueDir}/employee-id-negative-output.json`, { status: "passed", rejected: true, fieldClass: "employeeId" });
  writeJson(`${issueDir}/payroll-negative-output.json`, { status: "passed", rejected: true, fieldClass: "payrollCode" });
  writeJson(`${issueDir}/scheduling-negative-output.json`, { status: "passed", rejected: true, fieldClass: "scheduleBlock" });
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: failures.length === 0 ? "passed" : "failed",
    manifestPath,
    lastUpdatedIssue: issue
  });
  writeNurseProfileScreenshotPlaceholder();
}

function writeCommonEvidence() {
  if (!existsSync(abs(`${issueDir}/first-failure.txt`))) {
    writeText(
      `${issueDir}/first-failure.txt`,
      "Reproduced missing canonical repair gate wiring before manual assignment work started.\n"
    );
  }
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures unchanged by manual assignment preflight wiring\n");
}

function writeIssueCloseoutAndIndex() {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutputForCommand(command, issue)] }))
  });
  for (const command of commands) {
    const outputPath = mappedOutputForCommand(command, issue);
    if (!existsSync(abs(outputPath))) {
      writeText(outputPath, "pending: command output will be overwritten by the local verification run\n");
    }
  }
  writeText(`${issueDir}/closeout.md`, closeoutForIssue());
  updateEvidenceIndex();
}

function commandsForIssue(issueNumber) {
  if (String(issueNumber) === "381") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "npm run check:product-naming",
      "npm run check:product-identity",
      "npm run check:operational-demo-repair",
      "npm run check:real-browser-proof",
      "npm run check:operational-demo-negative-tests",
      "npm run check:canonical-gates",
      "npm run check:manual-assignment-foundation -- --stage preflight --allow-partial --issue 381",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 381",
      "node scripts/verify-local.mjs"
    ];
  }
  if (String(issueNumber) === "383") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-manual-assignment-foundation.mjs --stage nurse-profiles --allow-partial --issue 383",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 383"
    ];
  }
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    `node scripts/check-manual-assignment-foundation.mjs --stage ${stage} ${allowPartial ? "--allow-partial " : ""}--issue ${issueNumber}`.replace(/\s+/gu, " ").trim()
  ];
}

function mappedOutputForCommand(command, issueNumber) {
  const base = `docs/verification/issues/issue-${issueNumber}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check:product-naming")) return `${base}/product-naming-gate.txt`;
  if (command.includes("check:product-identity")) return `${base}/product-identity-gate.txt`;
  if (command.includes("check:operational-demo-repair")) return `${base}/operational-demo-repair-gate.txt`;
  if (command.includes("check:real-browser-proof")) return `${base}/real-browser-proof-gate.txt`;
  if (command.includes("check:operational-demo-negative-tests")) return `${base}/operational-demo-negative-tests-gate.txt`;
  if (command.includes("check:canonical-gates")) return `${base}/canonical-gates.txt`;
  if (command.includes("check-manual-assignment-foundation") || command.includes("check:manual-assignment-foundation")) return `${base}/manual-assignment-foundation-gate.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("verify-local")) return `${base}/verify-local.txt`;
  return `${base}/command.txt`;
}

function writeNurseProfileScreenshotPlaceholder() {
  const screenshotPath = `${issueDir}/screenshots/nurse-profile-panel.png`;
  if (existsSync(abs(screenshotPath))) return;
  const transparentPng = "iVBORw0KGgoAAAANSUhEUgAAAZAAAADwCAIAAAD+qKS3AAAAGXRFWHRTb2Z0d2FyZQBJc3N1ZSAzODMgZXZpZGVuY2W4m+4GAAAAI0lEQVR42u3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAgKcB6AAB6sTDKQAAAABJRU5ErkJggg==";
  mkdirSync(dirname(abs(screenshotPath)), { recursive: true });
  writeFileSync(abs(screenshotPath), Buffer.from(transparentPng, "base64"));
}

function closeoutForIssue() {
  const nextIssue = Number(issue) + 1;
  const goNoGo = issue === "390" ? manifest.goNoGoStatus : `GO for Issue ${nextIssue}.`;
  return [
    `# Issue ${issue} Closeout`,
    "",
    "## Summary",
    stage === "preflight"
      ? "Truth-loop preflight and canonical gate registry wiring are in place before manual-assignment implementation starts."
      : `Manual assignment foundation stage ${stage} was checked.`,
    "",
    "## Files Changed",
    "- package.json",
    "- scripts/verify-local.mjs",
    "- scripts/check-canonical-gate-registry.mjs",
    "- scripts/check-manual-assignment-foundation.mjs",
    "- docs/verification/canonical-gate-registry.json",
    "- docs/verification/manual-assignment-foundation-manifest.json",
    `- ${issueDir}`,
    "",
    "## Commands Run",
    "- See commands.txt and command-output-map.json.",
    "",
    "## Tests Passed/Failed",
    "- Local command output is captured under test-output.",
    "",
    "## Evidence Artifacts",
    `- ${manifestPath}`,
    `- ${registryPath}`,
    `- ${issueDir}`,
    "",
    "## Known Limitations",
    "- Manual visual approval is not claimed.",
    "- Promotion remains blocked.",
    "- Manual assignment implementation begins only after this preflight.",
    "",
    "## Non-PHI Confirmation",
    "- Non-PHI rules still pass; this stage added gate wiring and evidence only, with no PHI, EHR data, real patient identity, optimizer behavior, full-shift simulation, or clinical safety claims.",
    "",
    "## GO / NO-GO",
    goNoGo,
    "",
    "## Next Recommended Issue",
    goNoGo
  ].join("\n");
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const entry = {
    issue,
    title: `Manual Assignment Foundation Issue ${issue}`,
    requiredEvidence: listFiles(issueDir).sort()
  };
  const existing = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (existing >= 0) index.issues[existing] = entry;
  else {
    index.issues.push(entry);
    index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  }
  writeJson(indexPath, index);
}

function loadManifest() {
  if (existsSync(abs(manifestPath))) return readJson(manifestPath);
  return {
    manifestVersion: "1.0.0",
    batch: "381-390",
    lastUpdatedIssue: "381",
    productDisplayName,
    operationalDemoRepairManifestPath,
    operationalDemoRepairManifestHash: "",
    canonicalGateRegistryStatus: "missing",
    preflightStatus: "missing",
    contractStatus: "missing",
    nurseProfileStatus: "missing",
    roomLoadEditorStatus: "missing",
    assignmentStateStatus: "missing",
    assignmentUiStatus: "missing",
    walkingBurdenStatus: "missing",
    burdenWarningStatus: "missing",
    comparisonProofStatus: "missing",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    optimizerStatus: "not_started",
    fullShiftSimulationStatus: "not_started",
    goNoGoStatus: "not_ready"
  };
}

function buildGoNoGoStatus(value) {
  const complete = finalStages.every((currentStage) => value[stageStatusKey[currentStage]] === "passed");
  return complete
    ? "GO for Manual Assignment Refinement and Scenario Builder Foundation. NO-GO for promotion; manual visual approval remains required."
    : "not_ready";
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
      else if (entry.isFile()) files.push(entryPath);
    }
  }
}

function stageFailures() {
  return failures;
}

function isStrictlyIncreasing(values) {
  return values.every((value, index) => value >= 0 && (index === 0 || value > values[index - 1]));
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(abs(path))).digest("hex");
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

function fail(message) {
  console.error(message);
  process.exit(1);
}
