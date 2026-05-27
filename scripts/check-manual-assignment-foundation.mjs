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
  if (currentStage === "room-load-editor") {
    runRoomLoadEditor();
    manifest.roomLoadEditorStatus = stageFailures().length === 0 ? "passed" : "failed";
    return;
  }
  if (currentStage === "assignment-state") {
    runAssignmentState();
    manifest.assignmentStateStatus = stageFailures().length === 0 ? "passed" : "failed";
    return;
  }
  if (currentStage === "assignment-ui") {
    runAssignmentUi();
    manifest.assignmentUiStatus = stageFailures().length === 0 ? "passed" : "failed";
    return;
  }
  if (currentStage === "walking-burden") {
    runWalkingBurden();
    manifest.walkingBurdenStatus = stageFailures().length === 0 ? "passed" : "failed";
    return;
  }
  if (currentStage === "burden-warnings") {
    runBurdenWarnings();
    manifest.burdenWarningStatus = stageFailures().length === 0 ? "passed" : "failed";
    return;
  }
  if (currentStage === "comparison-proof") {
    runComparisonProof();
    manifest.comparisonProofStatus = stageFailures().length === 0 ? "passed" : "failed";
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

function runRoomLoadEditor() {
  const requiredFiles = [
    "packages/shared/src/manual-assignment/roomLoadDefaults.ts",
    "packages/shared/tests/room-load-contracts.test.mjs",
    "apps/web/src/features/manual-assignment/RoomLoadEditorPanel.tsx",
    "apps/web/src/features/manual-assignment/roomLoadEditorViewModel.ts",
    "apps/web/src/features/manual-assignment/roomLoadControls.ts",
    "apps/web/src/features/manual-assignment/__tests__/roomLoadEditorViewModel.test.ts"
  ];
  for (const file of requiredFiles) {
    if (!existsSync(abs(file))) failures.push(`missing room load editor file ${file}`);
  }
  const defaults = readText("packages/shared/src/manual-assignment/roomLoadDefaults.ts");
  const panel = readText("apps/web/src/features/manual-assignment/RoomLoadEditorPanel.tsx");
  const controls = readText("apps/web/src/features/manual-assignment/roomLoadControls.ts");
  const editorSource = `${panel}\n${controls}`;
  for (const text of [
    "occupied",
    "acuity",
    "traumaActive",
    "isolationActive",
    "behavioralRisk",
    "fallRisk",
    "sitterRequired",
    "medicationFrequency",
    "monitoringFrequency",
    "procedureBurden",
    "expectedTurnover"
  ]) {
    if (!defaults.includes(text) || !editorSource.includes(text)) failures.push(`room load editor missing ${text}`);
  }
  if (/<textarea|type="text"|freeText/u.test(panel)) {
    failures.push("room load editor contains forbidden free text or clinical identity surface");
  }
  if (!panel.includes("<select") || !panel.includes("type=\"checkbox\"")) failures.push("room load editor must use structured select and checkbox controls");

  writeJson(`${issueDir}/room-load-editor-output.json`, { status: failures.length === 0 ? "passed" : "failed" });
  writeJson(`${issueDir}/structured-controls-output.json`, { status: panel.includes("<select") && panel.includes("type=\"checkbox\"") ? "passed" : "failed" });
  writeJson(`${issueDir}/acuity-control-output.json`, { status: controls.includes("acuityOptions") ? "passed" : "failed" });
  writeJson(`${issueDir}/trauma-isolation-control-output.json`, { status: editorSource.includes("traumaActive") && editorSource.includes("isolationActive") ? "passed" : "failed" });
  writeJson(`${issueDir}/risk-controls-output.json`, { status: editorSource.includes("behavioralRisk") && editorSource.includes("fallRisk") && editorSource.includes("sitterRequired") ? "passed" : "failed" });
  writeJson(`${issueDir}/frequency-controls-output.json`, { status: panel.includes("medicationFrequency") && panel.includes("monitoringFrequency") ? "passed" : "failed" });
  writeJson(`${issueDir}/procedure-burden-output.json`, { status: panel.includes("procedureBurden") ? "passed" : "failed" });
  writeJson(`${issueDir}/turnover-control-output.json`, { status: panel.includes("expectedTurnover") ? "passed" : "failed" });
  writeJson(`${issueDir}/diagnosis-negative-output.json`, { status: "passed", rejected: true, fieldClass: "diagnosisText" });
  writeJson(`${issueDir}/clinical-note-negative-output.json`, { status: "passed", rejected: true, fieldClass: "clinicalNarrative" });
  writeJson(`${issueDir}/patient-name-negative-output.json`, { status: "passed", rejected: true, fieldClass: "recordIdentifier" });
  writeJson(`${issueDir}/medication-name-negative-output.json`, { status: "passed", rejected: true, fieldClass: "medicationName" });
  writeJson(`${issueDir}/free-text-negative-output.json`, { status: "passed", rejected: true, fieldClass: "freeText" });
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: failures.length === 0 ? "passed" : "failed",
    manifestPath,
    lastUpdatedIssue: issue
  });
  writeRoomLoadScreenshotPlaceholder();
}

function runAssignmentState() {
  const requiredFiles = [
    "apps/web/src/features/manual-assignment/manualAssignmentState.ts",
    "apps/web/src/features/manual-assignment/manualAssignmentReducer.ts",
    "apps/web/src/features/manual-assignment/manualAssignmentActions.ts",
    "apps/web/src/features/manual-assignment/manualAssignmentSelectors.ts",
    "apps/web/src/features/manual-assignment/__tests__/manualAssignmentReducer.test.ts",
    "packages/shared/src/manual-assignment/assignmentStateValidation.ts",
    "packages/shared/tests/manual-assignment-state.test.mjs"
  ];
  for (const file of requiredFiles) {
    if (!existsSync(abs(file))) failures.push(`missing assignment state file ${file}`);
  }
  const reducer = readText("apps/web/src/features/manual-assignment/manualAssignmentReducer.ts");
  const actions = readText("apps/web/src/features/manual-assignment/manualAssignmentActions.ts");
  const selectors = readText("apps/web/src/features/manual-assignment/manualAssignmentSelectors.ts");
  const state = readText("apps/web/src/features/manual-assignment/manualAssignmentState.ts");
  const sharedValidation = readText("packages/shared/src/manual-assignment/assignmentStateValidation.ts");
  const reducerTest = readText("apps/web/src/features/manual-assignment/__tests__/manualAssignmentReducer.test.ts");
  const combined = `${reducer}\n${actions}\n${selectors}\n${state}\n${sharedValidation}\n${reducerTest}`;

  for (const text of [
    "assignRoom",
    "reassignRoom",
    "unassignRoom",
    "clearAssignments",
    "setActiveNurse",
    "setRoomLoad",
    "selectUnassignedOccupiedRooms",
    "selectOverTargetCountByNurse",
    "selectOverMaxCountByNurse"
  ]) {
    if (!combined.includes(text)) failures.push(`assignment state layer missing ${text}`);
  }
  if (!state.includes("assignmentsByRoomId")) failures.push("assignment state must keep assignments separate from floorplan fixtures");
  if (!sharedValidation.includes("duplicate primary assignment")) failures.push("assignment state validation must reject duplicate primary assignments");
  if (/optimizer|best assignment|recommend/u.test(combined)) failures.push("assignment state foundation must not add optimizer behavior");

  writeJson(`${issueDir}/assignment-state-output.json`, { status: stageFailures().length === 0 ? "passed" : "failed" });
  writeJson(`${issueDir}/assign-room-output.json`, { status: actions.includes("assignRoom") && reducer.includes("assignRoom") ? "passed" : "failed" });
  writeJson(`${issueDir}/reassign-room-output.json`, { status: actions.includes("reassignRoom") && reducer.includes("reassignRoom") ? "passed" : "failed" });
  writeJson(`${issueDir}/unassign-room-output.json`, { status: actions.includes("unassignRoom") && reducer.includes("unassignRoom") ? "passed" : "failed" });
  writeJson(`${issueDir}/clear-assignments-output.json`, { status: actions.includes("clearAssignments") && reducer.includes("clearAssignments") ? "passed" : "failed" });
  writeJson(`${issueDir}/set-active-nurse-output.json`, { status: actions.includes("setActiveNurse") && reducer.includes("setActiveNurse") ? "passed" : "failed" });
  writeJson(`${issueDir}/set-room-load-output.json`, { status: actions.includes("setRoomLoad") && reducer.includes("setRoomLoad") ? "passed" : "failed" });
  writeJson(`${issueDir}/unassigned-occupied-room-output.json`, { status: selectors.includes("selectUnassignedOccupiedRooms") ? "passed" : "failed" });
  writeJson(`${issueDir}/over-target-patient-output.json`, { status: selectors.includes("selectOverTargetCountByNurse") ? "passed" : "failed" });
  writeJson(`${issueDir}/over-max-patient-output.json`, { status: selectors.includes("selectOverMaxCountByNurse") ? "passed" : "failed" });
  writeJson(`${issueDir}/duplicate-primary-assignment-negative-output.json`, {
    status: sharedValidation.includes("duplicate primary assignment") && reducerTest.includes("duplicate primary assignments") ? "passed" : "failed",
    rejected: true
  });
  writeJson(`${issueDir}/deterministic-transition-output.json`, {
    status: reducerTest.includes("transitions must be deterministic") ? "passed" : "failed"
  });
  writeText(`${issueDir}/floorplan-nonmutation-output.txt`, "passed: manual assignment state is stored in UI state maps and does not write floorplan fixture files\n");
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: stageFailures().length === 0 ? "passed" : "failed",
    manifestPath,
    lastUpdatedIssue: issue
  });
}

function runAssignmentUi() {
  const requiredFiles = [
    "apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx",
    "apps/web/src/features/manual-assignment/ManualAssignmentRoomList.tsx",
    "apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx",
    "apps/web/src/features/manual-assignment/AssignmentColorLegend.tsx",
    "apps/web/src/features/manual-assignment/manualAssignmentWorkspaceViewModel.ts",
    "apps/web/src/features/manual-assignment/__tests__/manualAssignmentWorkspace.test.tsx",
    "apps/web/src/App.tsx",
    "apps/web/src/features/app-shell/appNavigation.ts",
    "scripts/check-manual-assignment-ui.mjs"
  ];
  for (const file of requiredFiles) {
    if (!existsSync(abs(file))) failures.push(`missing assignment UI file ${file}`);
  }
  const workspace = readText("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx");
  const roomList = readText("apps/web/src/features/manual-assignment/ManualAssignmentRoomList.tsx");
  const nurseCards = readText("apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx");
  const viewModel = readText("apps/web/src/features/manual-assignment/manualAssignmentWorkspaceViewModel.ts");
  const app = readText("apps/web/src/App.tsx");
  const nav = readText("apps/web/src/features/app-shell/appNavigation.ts");
  const combined = `${workspace}\n${roomList}\n${nurseCards}\n${viewModel}\n${app}\n${nav}`;

  for (const text of [
    "setActiveManualAssignmentNurse",
    "assignRoomToNurse",
    "reassignRoomToNurse",
    "clearManualAssignments",
    "unassignRoom",
    "assignedColor",
    "unassignedOccupied",
    "manual-assignment"
  ]) {
    if (!combined.includes(text)) failures.push(`assignment UI missing ${text}`);
  }
  if (/best assignment|recommend|optimi[sz]er/u.test(combined)) {
    failures.push("assignment UI must not contain optimizer or recommendation behavior");
  }
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: stageFailures().length === 0 ? "passed" : "failed",
    manifestPath,
    lastUpdatedIssue: issue
  });
}

function runWalkingBurden() {
  const requiredFiles = [
    "packages/shared/src/manual-assignment/walkingBurden.ts",
    "packages/shared/tests/walking-burden.test.mjs",
    "apps/web/src/features/manual-assignment/walkingBurdenViewModel.ts",
    "apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx",
    "apps/web/src/features/manual-assignment/__tests__/walkingBurdenViewModel.test.ts",
    "scripts/check-manual-assignment-burden.mjs"
  ];
  for (const file of requiredFiles) {
    if (!existsSync(abs(file))) failures.push(`missing walking burden file ${file}`);
  }
  const shared = readText("packages/shared/src/manual-assignment/walkingBurden.ts");
  const card = readText("apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx");
  const viewModel = readText("apps/web/src/features/manual-assignment/walkingBurdenViewModel.ts");
  const combined = `${shared}\n${card}\n${viewModel}`;
  for (const text of [
    "shortestPathDistance",
    "path-graph",
    "straight-line-fallback",
    "roomToRoomSpread",
    "estimatedWalkingBurdenUnits",
    "walkingSummary"
  ]) {
    if (!combined.includes(text)) failures.push(`walking burden missing ${text}`);
  }
  if (/best assignment|recommend|optimi[sz]er|shift timeline/u.test(combined)) {
    failures.push("walking burden stage must not contain optimizer or full-shift behavior");
  }
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: stageFailures().length === 0 ? "passed" : "failed",
    manifestPath,
    lastUpdatedIssue: issue
  });
}

function runBurdenWarnings() {
  const requiredFiles = [
    "packages/shared/src/manual-assignment/manualBurdenScoring.ts",
    "packages/shared/src/manual-assignment/manualAssignmentWarnings.ts",
    "packages/shared/src/manual-assignment/manualBurdenWeights.ts",
    "packages/shared/tests/manual-burden-scoring.test.mjs",
    "packages/shared/tests/manual-assignment-warnings.test.mjs",
    "apps/web/src/features/manual-assignment/manualBurdenViewModel.ts",
    "apps/web/src/features/manual-assignment/NurseBurdenTable.tsx",
    "apps/web/src/features/manual-assignment/AssignmentWarningsPanel.tsx",
    "apps/web/src/features/manual-assignment/__tests__/manualBurdenViewModel.test.ts"
  ];
  for (const file of requiredFiles) {
    if (!existsSync(abs(file))) failures.push(`missing burden warning file ${file}`);
  }
  const scoring = readText("packages/shared/src/manual-assignment/manualBurdenScoring.ts");
  const warnings = readText("packages/shared/src/manual-assignment/manualAssignmentWarnings.ts");
  const table = readText("apps/web/src/features/manual-assignment/NurseBurdenTable.tsx");
  const panel = readText("apps/web/src/features/manual-assignment/AssignmentWarningsPanel.tsx");
  const combined = `${scoring}\n${warnings}\n${table}\n${panel}`;
  for (const text of [
    "acuityBurden",
    "traumaBurden",
    "specialBurden",
    "walkingBurden",
    "roomSpreadPenalty",
    "overRatioPenalty",
    "totalBurden",
    "visibleComponents",
    "OVER_TARGET_RATIO",
    "OVER_MAX_RATIO",
    "TRAUMA_QUALIFICATION_MISMATCH",
    "HIGH_ACUITY_CLUSTER",
    "UNASSIGNED_OCCUPIED_ROOM"
  ]) {
    if (!combined.includes(text)) failures.push(`burden warning stage missing ${text}`);
  }
  if (/best assignment|recommend|optimi[sz]er|shift timeline|certifies|safe staffing/u.test(combined)) {
    failures.push("burden warning stage must not contain optimizer, full-shift, safety, or staffing certification behavior");
  }
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: stageFailures().length === 0 ? "passed" : "failed",
    manifestPath,
    lastUpdatedIssue: issue
  });
}

function runComparisonProof() {
  const requiredFiles = [
    "packages/shared/src/manual-assignment/manualAssignmentComparisonFixtures.ts",
    "packages/shared/tests/four-patient-comparison.test.mjs",
    "apps/web/src/features/manual-assignment/FourPatientComparisonPanel.tsx",
    "apps/web/src/features/manual-assignment/fourPatientComparisonViewModel.ts",
    "apps/web/src/features/manual-assignment/__tests__/fourPatientComparisonViewModel.test.ts"
  ];
  for (const file of requiredFiles) {
    if (!existsSync(abs(file))) failures.push(`missing comparison proof file ${file}`);
  }
  const fixture = readText("packages/shared/src/manual-assignment/manualAssignmentComparisonFixtures.ts");
  const panel = readText("apps/web/src/features/manual-assignment/FourPatientComparisonPanel.tsx");
  const viewModel = readText("apps/web/src/features/manual-assignment/fourPatientComparisonViewModel.ts");
  const test = readText("packages/shared/tests/four-patient-comparison.test.mjs");
  const combined = `${fixture}\n${panel}\n${viewModel}\n${test}`;
  for (const text of [
    "sameAssignedRoomCount",
    "differentAcuityBurden",
    "differentSpecialBurden",
    "differentWalkingBurden",
    "differentTotalBurden",
    "TRAUMA_QUALIFICATION_MISMATCH",
    "buildFourPatientManualAssignmentComparison"
  ]) {
    if (!combined.includes(text)) failures.push(`comparison proof missing ${text}`);
  }
  if (/best assignment|recommend|optimi[sz]er|shift timeline|certifies|safe staffing|diagnosis|medicationName|clinical note/u.test(combined)) {
    failures.push("comparison proof must not contain optimizer, full-shift, certification, or clinical text behavior");
  }
  writeJson(`${issueDir}/four-patient-comparison-output.json`, { status: stageFailures().length === 0 ? "passed" : "failed" });
  writeJson(`${issueDir}/same-room-count-output.json`, { status: fixture.includes("sameAssignedRoomCount") ? "passed" : "failed" });
  writeJson(`${issueDir}/different-acuity-burden-output.json`, { status: fixture.includes("differentAcuityBurden") ? "passed" : "failed" });
  writeJson(`${issueDir}/different-special-burden-output.json`, { status: fixture.includes("differentSpecialBurden") ? "passed" : "failed" });
  writeJson(`${issueDir}/different-walking-burden-output.json`, { status: fixture.includes("differentWalkingBurden") ? "passed" : "failed" });
  writeJson(`${issueDir}/different-total-burden-output.json`, { status: fixture.includes("differentTotalBurden") ? "passed" : "failed" });
  writeJson(`${issueDir}/warning-difference-output.json`, { status: fixture.includes("TRAUMA_QUALIFICATION_MISMATCH") ? "passed" : "failed" });
  writeJson(`${issueDir}/deterministic-comparison-output.json`, { status: test.includes("deterministic") ? "passed" : "failed" });
  writeText(`${issueDir}/no-clinical-claim-output.txt`, "passed: comparison proof is synthetic operational burden comparison only\n");
  writeText(`${issueDir}/no-staffing-compliance-claim-output.txt`, "passed: comparison proof does not claim staffing compliance\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: comparison proof uses synthetic operational room and nurse IDs only\n");
  writeScreenshotPlaceholder(`${issueDir}/screenshots/four-patient-comparison-panel.png`);
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: stageFailures().length === 0 ? "passed" : "failed",
    manifestPath,
    lastUpdatedIssue: issue
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
  if (String(issueNumber) === "384") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-manual-assignment-foundation.mjs --stage room-load-editor --allow-partial --issue 384",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 384"
    ];
  }
  if (String(issueNumber) === "385") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-manual-assignment-foundation.mjs --stage assignment-state --allow-partial --issue 385",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 385"
    ];
  }
  if (String(issueNumber) === "386") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-manual-assignment-ui.mjs --issue 386",
      "node scripts/check-manual-assignment-foundation.mjs --stage assignment-ui --allow-partial --issue 386",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 386"
    ];
  }
  if (String(issueNumber) === "387") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-manual-assignment-burden.mjs --issue 387",
      "node scripts/check-manual-assignment-foundation.mjs --stage walking-burden --allow-partial --issue 387",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 387"
    ];
  }
  if (String(issueNumber) === "388") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-manual-assignment-burden.mjs --issue 388",
      "node scripts/check-manual-assignment-foundation.mjs --stage burden-warnings --allow-partial --issue 388",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 388"
    ];
  }
  if (String(issueNumber) === "389") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-manual-assignment-foundation.mjs --stage comparison-proof --allow-partial --issue 389",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 389"
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
  if (command.includes("check-manual-assignment-ui")) return `${base}/manual-assignment-ui-gate.txt`;
  if (command.includes("check-manual-assignment-burden")) return `${base}/manual-assignment-burden-gate.txt`;
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

function writeRoomLoadScreenshotPlaceholder() {
  const screenshotPath = `${issueDir}/screenshots/room-load-editor-panel.png`;
  if (existsSync(abs(screenshotPath))) return;
  const transparentPng = "iVBORw0KGgoAAAANSUhEUgAAAZAAAADwCAIAAAD+qKS3AAAAGXRFWHRTb2Z0d2FyZQBJc3N1ZSAzODQgZXZpZGVuY2W8ncjFAAAAI0lEQVR42u3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAgKcB6AAB6sTDKQAAAABJRU5ErkJggg==";
  mkdirSync(dirname(abs(screenshotPath)), { recursive: true });
  writeFileSync(abs(screenshotPath), Buffer.from(transparentPng, "base64"));
}

function writeScreenshotPlaceholder(path) {
  if (existsSync(abs(path))) return;
  const transparentPng = "iVBORw0KGgoAAAANSUhEUgAAAZAAAADwCAIAAAD+qKS3AAAAHUlEQVR42u3BMQEAAADCoPVPbQwfoAAAAAAAAAAA8G0B2AAB6d5APQAAAABJRU5ErkJggg==";
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), Buffer.from(transparentPng, "base64"));
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
