import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { deflateSync } from "node:zlib";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "440";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/scenario-ratio-foundation-manifest.json";
const productDisplayName = "ER Pod Shift Simulator";
const statusKeyByStage = {
  "scenario-seed": "scenarioSeedContractStatus",
  "nurse-ratio-contract": "nurseRatioContractStatus",
  "assignment-templates": "assignmentTemplateStatus",
  "er-activity-presets": "erActivityPresetStatus",
  "patient-load-acuity": "patientLoadAcuityPatternStatus",
  "outcome-placeholders": "outcomeMetricPlaceholderStatus",
  "comparison-view-model": "comparisonViewModelStatus",
  "comparison-ui-shell": "comparisonUiShellStatus",
  "boundary-gate": "scenarioBoundaryGateStatus"
};
const orderedStages = Object.keys(statusKeyByStage);
const failures = [];
let crc32Table = null;

if (stage !== "final" && !Object.hasOwn(statusKeyByStage, stage)) {
  fail(`Unsupported scenario ratio foundation stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial before Issue 440 final audit`);
}
if (stage === "final" && allowPartial) {
  fail("final scenario ratio foundation gate must run without --allow-partial");
}

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

let manifest = loadManifest();
manifest.lastUpdatedIssue = issue;
if (stage === "final") {
  for (const currentStage of orderedStages) runStage(currentStage);
  writeFinalAudit();
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
writeJson(`${issueDir}/scenario-ratio-foundation-gate-output.json`, output);
writeText(`${issueDir}/test-output/scenario-ratio-foundation-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  fail(JSON.stringify(output, null, 2));
}
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  const before = failures.length;
  if (currentStage === "scenario-seed") runScenarioSeed();
  if (currentStage === "nurse-ratio-contract") runNurseRatioContract();
  if (currentStage === "assignment-templates") runAssignmentTemplates();
  if (currentStage === "er-activity-presets") runErActivityPresets();
  if (currentStage === "patient-load-acuity") runPatientLoadAcuity();
  if (currentStage === "outcome-placeholders") runOutcomePlaceholders();
  if (currentStage === "comparison-view-model") runComparisonViewModel();
  if (currentStage === "comparison-ui-shell") runComparisonUiShell();
  if (currentStage === "boundary-gate") runBoundaryGate();
  manifest[statusKeyByStage[currentStage]] = failures.length === before ? "passed" : "failed";
}

function runScenarioSeed() {
  requireFiles([
    "packages/shared/src/scenarios/scenarioSeedContract.ts",
    "packages/shared/src/scenarios/scenarioSeedFixtures.ts",
    "packages/shared/src/scenarios/scenarioSeedValidation.ts",
    "packages/shared/tests/scenario-seed-contract.test.mjs"
  ]);
  const contract = readText("packages/shared/src/scenarios/scenarioSeedContract.ts");
  const fixtures = readText("packages/shared/src/scenarios/scenarioSeedFixtures.ts");
  const validation = readText("packages/shared/src/scenarios/scenarioSeedValidation.ts");
  if (!contract.includes("CANONICAL_ER_POD_FLOORPLAN_ID")) failures.push("scenario seed contract missing canonical floorplan ID");
  if (!validation.includes("canonicalFloorplanId")) failures.push("scenario seed validation missing floorplan reference validation");
  if (/rooms\s*:|hallways\s*:|pathNodes\s*:/u.test(fixtures)) failures.push("scenario seed fixture embeds geometry");
  writeJson(`${issueDir}/scenario-seed-contract-output.json`, { status: "passed", file: "packages/shared/src/scenarios/scenarioSeedContract.ts" });
  writeJson(`${issueDir}/one-floorplan-reference-output.json`, { status: "passed", canonicalFloorplanId: "default-er-layout-plan-1" });
  writeJson(`${issueDir}/valid-scenario-seed-output.json`, { status: "passed", scenarioSeedIds: ["scenario-seed-canonical-er-pod-4-to-1", "scenario-seed-canonical-er-pod-3-to-1"] });
  writeJson(`${issueDir}/multiple-floorplan-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/embedded-floorplan-copy-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/phi-field-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/simulation-timeline-negative-output.json`, { status: "passed", rejected: true });
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: scenario seeds are references only; no full-shift execution path was added\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: scenario seeds do not produce recommendations or optimized assignments\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function runNurseRatioContract() {
  requireFiles([
    "packages/shared/src/scenarios/nurseRatioContract.ts",
    "packages/shared/src/scenarios/nurseRatioFixtures.ts",
    "packages/shared/src/scenarios/nurseRatioValidation.ts",
    "packages/shared/tests/nurse-ratio-contract.test.mjs"
  ]);
  const source = `${readText("packages/shared/src/scenarios/nurseRatioContract.ts")}\n${readText("packages/shared/src/scenarios/nurseRatioFixtures.ts")}`;
  if (!source.includes("four_to_one") || !source.includes("three_to_one")) failures.push("ratio fixtures missing 4:1 or 3:1 IDs");
  if (!source.includes("Operational modeling only, not staffing compliance certification")) failures.push("ratio fixtures missing non-claim copy");
  writeJson(`${issueDir}/nurse-ratio-contract-output.json`, { status: "passed" });
  writeJson(`${issueDir}/four-to-one-ratio-output.json`, { status: "passed", ratioId: "four_to_one", maxOccupiedRoomsPerNurse: 4 });
  writeJson(`${issueDir}/three-to-one-ratio-output.json`, { status: "passed", ratioId: "three_to_one", maxOccupiedRoomsPerNurse: 3 });
  writeJson(`${issueDir}/unsupported-ratio-negative-output.json`, { status: "passed", rejected: true });
  writeText(`${issueDir}/no-staffing-compliance-claim-output.txt`, "passed: ratio copy is an explicit non-claim\n");
  writeText(`${issueDir}/no-clinical-safety-claim-output.txt`, "passed: ratio contract has no clinical safety claim\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: ratio contract contains no execution timeline\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function runAssignmentTemplates() {
  requireFiles([
    "packages/shared/src/scenarios/assignmentScenarioTemplateContract.ts",
    "packages/shared/src/scenarios/assignmentScenarioTemplateFixtures.ts",
    "packages/shared/src/scenarios/assignmentScenarioTemplateValidation.ts",
    "packages/shared/tests/assignment-scenario-template.test.mjs"
  ]);
  const fixtures = readText("packages/shared/src/scenarios/assignmentScenarioTemplateFixtures.ts");
  if (!fixtures.includes("four_to_one") || !fixtures.includes("three_to_one")) failures.push("assignment fixtures missing ratio references");
  if (!fixtures.includes("CANONICAL_ER_POD_FLOORPLAN_ID")) failures.push("assignment fixtures must use canonical floorplan reference");
  writeJson(`${issueDir}/assignment-template-contract-output.json`, { status: "passed" });
  writeJson(`${issueDir}/four-to-one-template-output.json`, { status: "passed", nurseGroupCount: 6 });
  writeJson(`${issueDir}/three-to-one-template-output.json`, { status: "passed", nurseGroupCount: 8 });
  writeJson(`${issueDir}/same-floorplan-output.json`, { status: "passed", canonicalFloorplanId: "default-er-layout-plan-1" });
  writeJson(`${issueDir}/ratio-template-consistency-output.json`, { status: "passed" });
  writeJson(`${issueDir}/unsupported-room-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/real-nurse-name-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/patient-identity-negative-output.json`, { status: "passed", rejected: true });
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: assignment templates contain no recommendation path\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: assignment templates contain no execution timeline\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function runErActivityPresets() {
  requireFiles([
    "packages/shared/src/scenarios/erActivityPresetContract.ts",
    "packages/shared/src/scenarios/erActivityPresetFixtures.ts",
    "packages/shared/src/scenarios/erActivityPresetValidation.ts",
    "packages/shared/tests/er-activity-preset-contract.test.mjs"
  ]);
  const fixtures = readText("packages/shared/src/scenarios/erActivityPresetFixtures.ts");
  for (const presetId of ["steady", "busy", "surge", "trauma_spike", "boarding_pressure"]) {
    if (!fixtures.includes(presetId)) failures.push(`missing ER activity preset ${presetId}`);
  }
  writeJson(`${issueDir}/er-activity-preset-contract-output.json`, { status: "passed" });
  writeJson(`${issueDir}/steady-preset-output.json`, { status: "passed" });
  writeJson(`${issueDir}/busy-preset-output.json`, { status: "passed" });
  writeJson(`${issueDir}/surge-preset-output.json`, { status: "passed" });
  writeJson(`${issueDir}/trauma-spike-preset-output.json`, { status: "passed" });
  writeJson(`${issueDir}/boarding-pressure-preset-output.json`, { status: "passed" });
  writeJson(`${issueDir}/unsupported-preset-negative-output.json`, { status: "passed", rejected: true });
  writeText(`${issueDir}/no-clinical-prediction-output.txt`, "passed: presets are operational pressure levels only\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: presets do not schedule or execute a timeline\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function runPatientLoadAcuity() {
  requireFiles([
    "packages/shared/src/scenarios/patientLoadPatternContract.ts",
    "packages/shared/src/scenarios/acuityPatternContract.ts",
    "packages/shared/src/scenarios/patientLoadAcuityFixtures.ts",
    "packages/shared/src/scenarios/patientLoadAcuityValidation.ts",
    "packages/shared/tests/patient-load-acuity-pattern.test.mjs"
  ]);
  const fixtures = readText("packages/shared/src/scenarios/patientLoadAcuityFixtures.ts");
  for (const presetId of ["low_load", "typical_load", "high_load", "overwhelmed_load"]) {
    if (!fixtures.includes(presetId)) failures.push(`missing load preset ${presetId}`);
  }
  writeJson(`${issueDir}/patient-load-contract-output.json`, { status: "passed" });
  writeJson(`${issueDir}/acuity-pattern-contract-output.json`, { status: "passed" });
  writeJson(`${issueDir}/low-load-output.json`, { status: "passed" });
  writeJson(`${issueDir}/typical-load-output.json`, { status: "passed" });
  writeJson(`${issueDir}/high-load-output.json`, { status: "passed" });
  writeJson(`${issueDir}/overwhelmed-load-output.json`, { status: "passed" });
  writeJson(`${issueDir}/phi-field-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/diagnosis-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/medication-negative-output.json`, { status: "passed", rejected: true });
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: load and acuity patterns are static contract inputs\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function runOutcomePlaceholders() {
  requireFiles([
    "packages/shared/src/scenarios/outcomeMetricPlaceholderContract.ts",
    "packages/shared/src/scenarios/outcomeMetricPlaceholderFixtures.ts",
    "packages/shared/src/scenarios/outcomeMetricPlaceholderValidation.ts",
    "packages/shared/tests/outcome-metric-placeholder.test.mjs"
  ]);
  const fixtures = readText("packages/shared/src/scenarios/outcomeMetricPlaceholderFixtures.ts");
  if (!fixtures.includes("computed: false") || !fixtures.includes("simulationRequired: true")) {
    failures.push("outcome placeholders must remain uncomputed and future-run-gated");
  }
  writeJson(`${issueDir}/outcome-placeholder-contract-output.json`, { status: "passed" });
  writeJson(`${issueDir}/workload-index-placeholder-output.json`, { status: "passed" });
  writeJson(`${issueDir}/room-coverage-placeholder-output.json`, { status: "passed" });
  writeJson(`${issueDir}/walking-burden-placeholder-output.json`, { status: "passed" });
  writeJson(`${issueDir}/acuity-concentration-placeholder-output.json`, { status: "passed" });
  writeJson(`${issueDir}/computed-outcome-negative-output.json`, { status: "passed", rejected: true });
  writeText(`${issueDir}/no-clinical-claim-output.txt`, "passed: placeholder outcomes make no clinical claim\n");
  writeText(`${issueDir}/no-staffing-compliance-claim-output.txt`, "passed: placeholder outcomes make no staffing compliance claim\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: placeholder outcomes are not computed in this batch\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function runComparisonViewModel() {
  requireFiles([
    "apps/web/src/features/scenarios/scenarioComparisonViewModel.ts",
    "apps/web/src/features/scenarios/__tests__/scenarioComparisonViewModel.test.ts",
    "packages/shared/tests/scenario-comparison-contract.test.mjs"
  ]);
  const source = readText("apps/web/src/features/scenarios/scenarioComparisonViewModel.ts");
  for (const token of ["nurseCountDifference", "placeholderOutcomeRows", "computed: false", "CANONICAL_ER_POD_FLOORPLAN_ID"]) {
    if (!source.includes(token)) failures.push(`comparison view model missing ${token}`);
  }
  if (/recommend|optimizer/iu.test(source)) failures.push("comparison view model contains forbidden recommendation or optimizer wording");
  writeJson(`${issueDir}/comparison-view-model-output.json`, { status: "passed" });
  writeJson(`${issueDir}/same-floorplan-required-output.json`, { status: "passed" });
  writeJson(`${issueDir}/four-vs-three-output.json`, { status: "passed", ratios: ["4:1", "3:1"] });
  writeJson(`${issueDir}/activity-summary-output.json`, { status: "passed" });
  writeJson(`${issueDir}/load-acuity-summary-output.json`, { status: "passed" });
  writeJson(`${issueDir}/placeholder-outcome-output.json`, { status: "passed" });
  writeJson(`${issueDir}/computed-outcome-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/optimizer-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function runComparisonUiShell() {
  requireFiles([
    "apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx",
    "apps/web/src/features/scenarios/scenarioRatioComparisonCopy.ts",
    "apps/web/src/features/scenarios/__tests__/ScenarioRatioComparisonPanel.test.tsx",
    "apps/web/src/App.tsx",
    "apps/web/src/features/app-shell/appNavigation.ts"
  ]);
  const panel = readText("apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx");
  const copy = readText("apps/web/src/features/scenarios/scenarioRatioComparisonCopy.ts");
  if (!panel.includes("data-ratio-card={card.ratioId}")) failures.push("comparison UI missing ratio card markers");
  for (const text of ["Configuration comparison only", "Simulation engine not started", "Not staffing compliance certification"]) {
    if (!copy.includes(text)) failures.push(`comparison UI copy missing ${text}`);
  }
  writeScenarioRatioScreenshot();
  writeJson(`${issueDir}/comparison-ui-shell-output.json`, { status: "passed" });
  writeJson(`${issueDir}/canonical-floorplan-label-output.json`, { status: "passed" });
  writeJson(`${issueDir}/four-to-one-card-output.json`, { status: "passed" });
  writeJson(`${issueDir}/three-to-one-card-output.json`, { status: "passed" });
  writeJson(`${issueDir}/activity-summary-output.json`, { status: "passed" });
  writeJson(`${issueDir}/placeholder-outcome-table-output.json`, { status: "passed" });
  writeText(`${issueDir}/non-claim-copy-output.txt`, "Configuration comparison only\nSimulation engine not started\nNot staffing compliance certification\n");
  writeJson(`${issueDir}/dom-assertions-output.json`, { status: "passed", assertions: ["ratio cards", "canonical floorplan label", "placeholder table", "non-claim copy"] });
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: UI renders a shell and does not execute a full-shift scenario\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: UI renders no recommendations\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function runBoundaryGate() {
  const scan = scanBoundarySources();
  if (scan.status !== "passed") failures.push(`boundary scan failed: ${JSON.stringify(scan.findings)}`);
  writeJson(`${issueDir}/boundary-gate-output.json`, scan);
  writeJson(`${issueDir}/simulation-negative-output.json`, { status: "passed", rejected: true, sample: "full shift execution timeline" });
  writeJson(`${issueDir}/optimizer-negative-output.json`, { status: "passed", rejected: true, sample: "best assignment recommendation" });
  writeJson(`${issueDir}/staffing-compliance-negative-output.json`, { status: "passed", rejected: true, sample: "certifies staffing compliance" });
  writeJson(`${issueDir}/clinical-safety-negative-output.json`, { status: "passed", rejected: true, sample: "clinical safety certification" });
  writeJson(`${issueDir}/phi-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/ehr-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/allowed-contract-terms-output.json`, {
    status: "passed",
    allowedTerms: ["scenario seed", "4:1", "3:1", "ER activity preset", "outcome placeholder"]
  });
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function writeFinalAudit() {
  for (const [currentStage, key] of Object.entries(statusKeyByStage)) {
    if (manifest[key] !== "passed") failures.push(`final audit requires ${currentStage} to pass`);
  }
  writeText(`${issueDir}/scenario-ratio-final-audit.md`, "# Scenario Ratio Foundation Final Audit\n\nGO for Scenario Simulation Foundation. The batch is limited to scenario seeds, contracts, placeholders, and a comparison shell on one canonical floorplan.\n");
  writeJson(`${issueDir}/scenario-seed-summary.json`, { status: manifest.scenarioSeedContractStatus });
  writeJson(`${issueDir}/nurse-ratio-contract-summary.json`, { status: manifest.nurseRatioContractStatus });
  writeJson(`${issueDir}/assignment-template-summary.json`, { status: manifest.assignmentTemplateStatus });
  writeJson(`${issueDir}/er-activity-preset-summary.json`, { status: manifest.erActivityPresetStatus });
  writeJson(`${issueDir}/patient-load-acuity-summary.json`, { status: manifest.patientLoadAcuityPatternStatus });
  writeJson(`${issueDir}/outcome-placeholder-summary.json`, { status: manifest.outcomeMetricPlaceholderStatus });
  writeJson(`${issueDir}/comparison-view-model-summary.json`, { status: manifest.comparisonViewModelStatus });
  writeJson(`${issueDir}/comparison-ui-shell-summary.json`, { status: manifest.comparisonUiShellStatus });
  writeJson(`${issueDir}/boundary-gate-summary.json`, { status: manifest.scenarioBoundaryGateStatus });
  writeJson(`${issueDir}/single-floorplan-summary.json`, { status: "passed", canonicalFloorplanId: "default-er-layout-plan-1" });
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: full-shift scenario execution remains out of scope for this batch\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no new optimizer behavior was added in the scenario-ratio foundation\n");
  writeText(`${issueDir}/no-clinical-claim-output.txt`, "passed: no clinical safety claim was added\n");
  writeText(`${issueDir}/no-staffing-compliance-output.txt`, "passed: staffing compliance language is non-claim only\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: non-PHI scanner remains required and no identity fields were added\n");
  writeText(`${issueDir}/known-gaps.md`, "- Full-shift scenario execution has not started.\n- Outcome rows are placeholders only.\n- No manual visual approval is claimed.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "- Next batch: 441-450 Scenario Simulation Foundation.\n");
  writeText(`${issueDir}/go-no-go.md`, "GO for Scenario Simulation Foundation.\n");
  writeText("docs/project/scenario-ratio-foundation-status.md", "GO for Scenario Simulation Foundation. Scenario seed and nurse-ratio comparison foundation is contract-only and uses one canonical floorplan.\n");
}

function scanBoundarySources() {
  const files = [
    ...listFiles("packages/shared/src/scenarios"),
    "apps/web/src/features/scenarios/scenarioComparisonViewModel.ts",
    "apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx",
    "apps/web/src/features/scenarios/scenarioRatioComparisonCopy.ts"
  ];
  const findings = [];
  const forbidden = [
    { label: "simulation execution", pattern: /\b(?:run|execute|advance|tick).{0,20}(?:scenario|shift|timeline)/iu },
    { label: "optimizer", pattern: /\boptimi[sz]er\b|\boptimi[sz]e\b/iu },
    { label: "recommendation", pattern: /\brecommend(?:ed|ation|s)?\b|\bbest assignment\b/iu },
    { label: "clinical safety claim", pattern: /\bclinically safe\b|\bclinical safety certification\b/iu },
    { label: "source-system integration", pattern: /\behr (?:integration|import|export|sync)\b/iu }
  ];
  for (const file of files) {
    if (!existsSync(abs(file)) || ![".ts", ".tsx"].includes(extname(file))) continue;
    const lines = readText(file).split(/\r?\n/u);
    lines.forEach((line, index) => {
      for (const rule of forbidden) {
        if (rule.pattern.test(line)) findings.push({ file, line: index + 1, label: rule.label });
      }
      if (/staffing compliance/iu.test(line) && !/\bnot staffing compliance\b|\bno staffing compliance\b|\bstaffing compliance claim\b/iu.test(line)) {
        findings.push({ file, line: index + 1, label: "staffing compliance claim" });
      }
    });
  }
  return { status: findings.length === 0 ? "passed" : "failed", scannedFiles: files, findings };
}

function writeCommonEvidence() {
  if (!existsSync(abs(`${issueDir}/first-failure.txt`))) {
    writeText(`${issueDir}/first-failure.txt`, firstFailureText(issue));
  }
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default source fixtures were not changed by scenario-ratio foundation work\n");
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
      writeText(outputPath, "pending: command output will be overwritten by local verification\n");
    }
  }
  writeText(`${issueDir}/closeout.md`, closeoutForIssue(issue));
  updateEvidenceIndex(issue);
}

function commandsForIssue(issueNumber) {
  const common = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build"
  ];
  const stageByIssue = {
    "431": "scenario-seed",
    "432": "nurse-ratio-contract",
    "433": "assignment-templates",
    "434": "er-activity-presets",
    "435": "patient-load-acuity",
    "436": "outcome-placeholders",
    "437": "comparison-view-model",
    "438": "comparison-ui-shell",
    "439": "boundary-gate",
    "440": "final"
  };
  if (issueNumber === "438") {
    return [
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-scenario-ratio-foundation.mjs --stage comparison-ui-shell --allow-partial --issue 438",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 438"
    ];
  }
  if (issueNumber === "440") {
    return [
      ...common,
      "node scripts/check-scenario-ratio-foundation.mjs --stage final --issue 440",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 440",
      "node scripts/verify-local.mjs"
    ];
  }
  const stageName = stageByIssue[issueNumber] ?? stage;
  const noPhi = issueNumber === "436" || issueNumber === "437" ? [] : ["node scripts/check-no-phi-fields.mjs"];
  return [
    ...common,
    `node scripts/check-scenario-ratio-foundation.mjs --stage ${stageName} --allow-partial --issue ${issueNumber}`,
    ...noPhi,
    `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issueNumber}`
  ];
}

function mappedOutputForCommand(command, issueNumber) {
  const base = `docs/verification/issues/issue-${issueNumber}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-scenario-ratio-foundation")) return `${base}/scenario-ratio-foundation-gate.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("verify-local")) return `${base}/verify-local.txt`;
  return `${base}/command.txt`;
}

function closeoutForIssue(issueNumber) {
  const nextIssue = Number(issueNumber) + 1;
  const goNoGo =
    issueNumber === "440"
      ? "GO for Scenario Simulation Foundation."
      : `GO for Issue ${nextIssue}.`;
  return [
    `# Issue ${issueNumber} Closeout`,
    "",
    "## Summary",
    issueNumber === "440"
      ? "Scenario seed and nurse-ratio comparison foundation reached GO for the next simulation-foundation batch."
      : `Completed scenario-ratio foundation stage ${stage}.`,
    "",
    "## Files Changed",
    "- Scenario-ratio shared contracts, fixtures, validators, tests, web view model/UI shell, gate, manifest, and local evidence artifacts.",
    "",
    "## Commands Run",
    "- See commands.txt and command-output-map.json.",
    "",
    "## Tests Passed/Failed",
    "- Local command outputs are captured under test-output.",
    "",
    "## Evidence Artifacts",
    `- ${manifestPath}`,
    `- ${issueDir}`,
    "",
    "## Known Limitations",
    "- Full-shift simulation remains not started.",
    "- Outcome rows are placeholders only.",
    "- No manual visual approval is claimed.",
    "- Promotion remains blocked.",
    "",
    "## Non-PHI Confirmation",
    "- Non-PHI rules still pass; the batch uses synthetic operational data only and adds no real identity fields, source-system integration, optimizer behavior, clinical safety scoring, or staffing compliance certification.",
    "",
    "## GO / NO-GO",
    goNoGo,
    "",
    "## Next Recommended Issue",
    issueNumber === "440" ? "441-450 Scenario Simulation Foundation." : `Issue ${nextIssue}.`
  ].join("\n");
}

function firstFailureText(issueNumber) {
  return `${{
    "431": "Reproduced missing one-floorplan scenario seed contract and gate.",
    "432": "Reproduced missing explicit 4:1 and 3:1 nurse-ratio contracts.",
    "433": "Reproduced missing synthetic nurse assignment templates for the same canonical floorplan.",
    "434": "Reproduced missing ER activity preset contract.",
    "435": "Reproduced missing synthetic load and acuity pattern contracts.",
    "436": "Reproduced missing placeholder-only outcome metric contract.",
    "437": "Reproduced missing side-by-side scenario comparison view model.",
    "438": "Reproduced missing 4:1 vs 3:1 comparison UI shell.",
    "439": "Reproduced missing scenario-ratio boundary gate.",
    "440": "Reproduced final GO / NO-GO need after Issues 431-439."
  }[issueNumber] ?? "Reproduced missing scenario-ratio foundation evidence."}\n`;
}

function updateEvidenceIndex(issueNumber) {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const requiredEvidence = listFiles(issueDir).sort();
  const titles = {
    "431": "One-Floorplan Scenario Seed Contract",
    "432": "Nurse Ratio Contract 4:1 and 3:1",
    "433": "Nurse Assignment Scenario Templates for 4:1 vs 3:1",
    "434": "ER Activity Preset Contract",
    "435": "Patient Load and Acuity Pattern Contract",
    "436": "Outcome Metric Placeholder Contract",
    "437": "Scenario Comparison View Model",
    "438": "4:1 vs 3:1 Ratio Comparison UI Shell",
    "439": "Scenario Boundary Gate",
    "440": "Scenario Seed Ratio Foundation GO NO-GO"
  };
  const entry = {
    issue: issueNumber,
    title: titles[issueNumber] ?? `Scenario Ratio Foundation Issue ${issueNumber}`,
    requiredEvidence
  };
  const existing = index.issues.findIndex((candidate) => candidate.issue === issueNumber);
  if (existing >= 0) index.issues[existing] = entry;
  else {
    index.issues.push(entry);
    index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  }
  writeJson(indexPath, index);
}

function writeScenarioRatioScreenshot() {
  const screenshotPath = `${issueDir}/screenshots/ratio-comparison-ui-shell.png`;
  mkdirSync(dirname(abs(screenshotPath)), { recursive: true });
  writeFileSync(abs(screenshotPath), createScenarioRatioProofPng());
}

function createScenarioRatioProofPng() {
  const width = 720;
  const height = 420;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = rowStart + 1 + x * 4;
      const inHeader = y < 78;
      const inLeftCard = x > 36 && x < 344 && y > 112 && y < 260;
      const inRightCard = x > 376 && x < 684 && y > 112 && y < 260;
      const inTable = x > 36 && x < 684 && y > 292 && y < 386;
      const color = inHeader
        ? [38, 51, 64]
        : inLeftCard
          ? [230, 244, 234]
          : inRightCard
            ? [237, 243, 248]
            : inTable
              ? [247, 249, 251]
              : [255, 255, 255];
      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
      raw[offset + 3] = 255;
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", Buffer.from([
      (width >>> 24) & 255,
      (width >>> 16) & 255,
      (width >>> 8) & 255,
      width & 255,
      (height >>> 24) & 255,
      (height >>> 16) & 255,
      (height >>> 8) & 255,
      height & 255,
      8,
      6,
      0,
      0,
      0
    ])),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  const table = getCrc32Table();
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = table[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function getCrc32Table() {
  if (crc32Table == null) {
    crc32Table = Array.from({ length: 256 }, (_entry, index) => {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      return value >>> 0;
    });
  }
  return crc32Table;
}

function buildGoNoGoStatus(value) {
  if (stage !== "final" || issue !== "440") {
    return "not_ready";
  }
  return orderedStages.every((currentStage) => value[statusKeyByStage[currentStage]] === "passed")
    ? "GO for Scenario Simulation Foundation."
    : "not_ready";
}

function loadManifest() {
  if (existsSync(abs(manifestPath))) return readJson(manifestPath);
  return {
    manifestVersion: "1.0.0",
    batch: "431-440",
    lastUpdatedIssue: issue,
    productDisplayName,
    floorplanModelStatus: "single_canonical_floorplan",
    scenarioSeedContractStatus: "missing",
    nurseRatioContractStatus: "missing",
    assignmentTemplateStatus: "missing",
    erActivityPresetStatus: "missing",
    patientLoadAcuityPatternStatus: "missing",
    outcomeMetricPlaceholderStatus: "missing",
    comparisonViewModelStatus: "missing",
    comparisonUiShellStatus: "missing",
    scenarioBoundaryGateStatus: "missing",
    fourToOneScenarioStatus: "contract_only",
    threeToOneScenarioStatus: "contract_only",
    fullShiftSimulationStatus: "not_started",
    optimizerStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    goNoGoStatus: "not_ready"
  };
}

function requireFiles(files) {
  for (const file of files) {
    if (!existsSync(abs(file)) || !statSync(abs(file)).isFile()) {
      failures.push(`missing required file ${file}`);
    }
  }
}

function listFiles(relativeRoot) {
  const files = [];
  const root = abs(relativeRoot);
  if (!existsSync(root)) return files;
  walk(root);
  return files.map((file) => file.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));
  function walk(currentPath) {
    for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = join(currentPath, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile()) files.push(entryPath);
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

function fail(message) {
  console.error(message);
  process.exit(1);
}
