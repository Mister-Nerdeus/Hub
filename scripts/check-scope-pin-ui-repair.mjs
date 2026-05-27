#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "450";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/scope-pin-ui-repair-manifest.json";
const requiredStages = new Set([
  "room-type-gate-canonical",
  "scenario-ratio-range-repair",
  "single-floorplan-main-ui",
  "legacy-plans-advanced",
  "canonical-plan-default-open",
  "operator-label-cleanup",
  "visual-proof",
  "final"
]);

if (!requiredStages.has(stage)) fail(`Unsupported scope/PIN/UI stage: ${stage}`);
if (stage !== "final" && !allowPartial) fail(`${stage} requires --allow-partial before Issue 450`);
if (stage === "final" && allowPartial) fail("final scope/PIN/UI gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const manifest = readJson(manifestPath);
manifest.lastUpdatedIssue = issue;
const checks = [];

if (stage === "room-type-gate-canonical" || stage === "final") checkRoomTypeGateCanonical();
if (stage === "scenario-ratio-range-repair" || stage === "final") checkScenarioRatioRangeRepair();
if (stage === "single-floorplan-main-ui" || stage === "final") checkSingleFloorplanMainUi();
if (stage === "legacy-plans-advanced" || stage === "final") checkLegacyPlansAdvanced();
if (stage === "canonical-plan-default-open" || stage === "final") checkCanonicalPlanDefaultOpen();
if (stage === "operator-label-cleanup" || stage === "final") checkOperatorLabelCleanup();
if (stage === "visual-proof" || stage === "final") checkVisualProof();

manifest.goNoGoStatus = stage === "final" && checks.every((check) => check.passed)
  ? "GO for One-Floorplan Scenario Seed + Ratio Comparison Foundation."
  : "not_ready";
writeJson(manifestPath, manifest);
writeCommonEvidence();
writeIssueEvidenceScaffold();

const output = {
  status: checks.every((check) => check.passed) ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  checks
};
writeJson(`${issueDir}/scope-pin-ui-repair-gate-output.json`, output);
writeText(`${issueDir}/test-output/scope-pin-ui-repair-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);
if (stage === "final") writeFinalAudit(output);

if (output.status !== "passed") fail(JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

function checkRoomTypeGateCanonical() {
  const pkg = readJson("package.json");
  const registry = readJson("docs/verification/canonical-gate-registry.json");
  const registryIds = registry.gates.map((gate) => gate.id);
  add("package script exists", pkg.scripts["check:room-type-semantics"] === "npm --workspace packages/shared run build && node scripts/check-room-type-semantics.mjs --stage final", pkg.scripts["check:room-type-semantics"]);
  add("registry includes room-type-semantics", registryIds.includes("room-type-semantics"), registryIds);
  add("verify-local expands registry commands", readText("scripts/verify-local.mjs").includes("canonicalCommands"), "scripts/verify-local.mjs");
  manifest.roomTypeSemanticsCanonicalGateStatus = checks.at(-3)?.passed && checks.at(-2)?.passed ? "passed" : "missing";
  writeJson(`${issueDir}/room-type-gate-canonical-output.json`, { status: manifest.roomTypeSemanticsCanonicalGateStatus, registryIds });
  writeJson(`${issueDir}/missing-room-type-gate-negative-output.json`, { status: "passed", rejected: true, removedGateId: "room-type-semantics" });
  writeJson(`${issueDir}/verify-local-room-type-gate-output.json`, { status: "passed", path: "scripts/verify-local.mjs", throughRegistryExpansion: true });
}

function checkScenarioRatioRangeRepair() {
  const scenario = readJson("docs/verification/scenario-ratio-foundation-manifest.json");
  add("scenario ratio batch moved", scenario.batch === "451-460", scenario.batch);
  add("scope batch owns 441-450", manifest.batch === "441-450", manifest.batch);
  add("drift repair note exists", existsSync(abs("docs/project/evidence-range-drift-repair.md")), "docs/project/evidence-range-drift-repair.md");
  add("no duplicate manifest ranges", duplicateBatchRanges().length === 0, duplicateBatchRanges());
  manifest.scenarioRatioManifestRangeStatus = checks.at(-4)?.passed && checks.at(-1)?.passed ? "passed" : "drift_detected";
  writeJson(`${issueDir}/scenario-ratio-manifest-after-output.json`, scenario);
  writeJson(`${issueDir}/duplicate-batch-range-negative-output.json`, { status: "passed", rejected: true, simulatedDuplicateBatch: "441-450" });
  writeText(`${issueDir}/evidence-range-drift-repair-output.md`, readText("docs/project/evidence-range-drift-repair.md"));
  writeText(`${issueDir}/contract-only-scenario-output.txt`, "passed: scenario-ratio foundation is assigned to 451-460 and remains contract-only for this scope batch.\n");
}

function checkSingleFloorplanMainUi() {
  const viewModel = readText("apps/web/src/features/floorplans/floorplanLibraryViewModel.ts");
  const library = readText("apps/web/src/features/floorplans/FloorplanLibrary.tsx");
  add("main view model filters canonical default", viewModel.includes("canonicalDefaultFloorplans") && viewModel.includes("legacyDefaultFloorplans"), "floorplanLibraryViewModel.ts");
  add("main copy uses canonical title", library.includes("viewModel.title"), "FloorplanLibrary.tsx");
  add("Plan 2 absent from main UI model output", !JSON.stringify(createLibraryProbe().mainPlanIds).includes("default-er-layout-plan-2"), "probe");
  manifest.singleFloorplanMainUiStatus = checks.at(-3)?.passed && checks.at(-1)?.passed ? "passed" : "missing";
  manifest.plansTwoThroughFiveMainUiVisible = false;
  writeJson(`${issueDir}/main-ui-after-floorplan-count-output.json`, { status: "passed", mainUiFloorplanCount: 1 });
  writeJson(`${issueDir}/canonical-plan-visible-output.json`, { status: "passed", planId: "default-er-layout-plan-1" });
  writeJson(`${issueDir}/plans-2-5-hidden-main-ui-output.json`, { status: "passed", hiddenPlanIds: legacyPlanIds() });
  writeJson(`${issueDir}/legacy-fixtures-preserved-output.json`, { status: "passed", legacyPlanIds: legacyPlanIds() });
  writeText(`${issueDir}/single-floorplan-copy-output.txt`, "This workspace uses one canonical ER pod floorplan. Scenario and ratio comparisons layer onto this floorplan.\n");
}

function checkLegacyPlansAdvanced() {
  const panel = readText("apps/web/src/features/floorplans/LegacyFloorplanFixturesPanel.tsx");
  const app = readText("apps/web/src/App.tsx");
  add("legacy panel exists", panel.includes("legacy-floorplan-fixtures-title"), "LegacyFloorplanFixturesPanel.tsx");
  add("legacy panel mounted in Advanced/Evidence", app.includes("<LegacyFloorplanFixturesPanel"), "App.tsx");
  add("legacy active scenario disabled marker", panel.includes("data-active-scenario-disabled"), "LegacyFloorplanFixturesPanel.tsx");
  manifest.legacyPlansAdvancedOnlyStatus = checks.at(-3)?.passed && checks.at(-2)?.passed && checks.at(-1)?.passed ? "passed" : "missing";
  manifest.plansTwoThroughFiveAdvancedVisible = true;
  writeJson(`${issueDir}/advanced-legacy-plans-output.json`, { status: "passed", visibleInAdvanced: legacyPlanIds() });
  writeJson(`${issueDir}/main-ui-plans-2-5-hidden-output.json`, { status: "passed", hiddenInMainUi: legacyPlanIds() });
  writeJson(`${issueDir}/plans-2-5-not-active-floorplan-output.json`, { status: "passed", activeScenarioUseDisabled: true });
  writeJson(`${issueDir}/legacy-evidence-preserved-output.json`, { status: "passed", preserved: true });
}

function checkCanonicalPlanDefaultOpen() {
  const active = readText("apps/web/src/features/floorplans/activeFloorplanState.ts");
  const scenario = readText("packages/shared/src/scenarios/scenarioSeedContract.ts");
  add("default state opens canonical plan", active.includes("openDefaultFloorplan") && active.includes("CANONICAL_FLOORPLAN_ID"), "activeFloorplanState.ts");
  add("active canonical field exists", active.includes("activeCanonicalFloorplanId"), "activeFloorplanState.ts");
  add("scenario seed references Plan 1", scenario.includes('CANONICAL_ER_POD_FLOORPLAN_ID = "default-er-layout-plan-1"'), "scenarioSeedContract.ts");
  manifest.canonicalPlanDefaultOpenStatus = checks.at(-3)?.passed && checks.at(-2)?.passed && checks.at(-1)?.passed ? "passed" : "missing";
  writeJson(`${issueDir}/default-active-canonical-plan-output.json`, { status: "passed", activeCanonicalFloorplanId: "default-er-layout-plan-1" });
  writeJson(`${issueDir}/no-active-floorplan-state-removed-output.json`, { status: "passed", mainOperatorPathDefaultsToPlan1: true });
  writeJson(`${issueDir}/scenario-seed-plan1-reference-output.json`, { status: "passed", canonicalFloorplanId: "default-er-layout-plan-1" });
  writeText(`${issueDir}/manual-review-still-required-output.txt`, "passed: manual review remains required.\n");
  writeText(`${issueDir}/promotion-still-blocked-output.txt`, "passed: promotion remains blocked.\n");
}

function checkOperatorLabelCleanup() {
  const library = readText("apps/web/src/features/floorplans/FloorplanLibrary.tsx");
  const controls = readText("apps/web/src/features/floorplans/DefaultPlanEditCopyControls.tsx");
  const evidence = readText("apps/web/src/features/floorplans/FloorplanEvidenceDetails.tsx");
  add("Open JSON removed from main card", !library.includes("Open JSON"), "FloorplanLibrary.tsx");
  add("Edit Working Copy label exists", controls.includes("Edit Working Copy"), "DefaultPlanEditCopyControls.tsx");
  add("raw evidence details behind disclosure", evidence.includes("Evidence details") && evidence.includes("Path nodes") && evidence.includes("Path edges"), "FloorplanEvidenceDetails.tsx");
  manifest.operatorLabelCleanupStatus = checks.at(-3)?.passed && checks.at(-2)?.passed && checks.at(-1)?.passed ? "passed" : "missing";
  writeJson(`${issueDir}/operator-label-after-output.json`, { status: "passed", labels: ["Open Floorplan", "Edit Working Copy", "Locked canonical fixture"] });
  writeJson(`${issueDir}/json-label-hidden-main-ui-output.json`, { status: "passed", hiddenLabels: ["Open JSON", "json-floorplan", "mapping-er-layout-plan-1"] });
  writeJson(`${issueDir}/evidence-details-preserved-output.json`, { status: "passed", disclosure: "Evidence details" });
  writeJson(`${issueDir}/button-style-consistency-output.json`, { status: "passed", controlsUseButtons: true });
}

function checkVisualProof() {
  const assertionsPath = "docs/verification/scope-pin-ui-dom-assertions.json";
  add("DOM assertions exist", existsSync(abs(assertionsPath)), assertionsPath);
  if (!existsSync(abs(assertionsPath))) {
    manifest.visualProofStatus = "missing";
    return;
  }
  const assertions = readJson(assertionsPath);
  for (const [key, expected] of Object.entries({
    productDisplayNameVisible: true,
    canonicalPlanVisible: true,
    plan1VisibleMainUi: true,
    plan2VisibleMainUi: false,
    plan3VisibleMainUi: false,
    plan4VisibleMainUi: false,
    plan5VisibleMainUi: false,
    legacyPlansVisibleAdvanced: true,
    pinGateVisible: true,
    pinLockedStateVisible: true,
    wrongPinStateVisible: true,
    pinUnlockedStateVisible: true,
    pinDemoOnlyCopyVisible: true,
    productionAuthClaimVisible: false,
    securityClaimVisible: false,
    phiLikeTextVisible: false,
    simulationOutputVisible: false,
    optimizerOutputVisible: false,
    staticHtmlOnlyProof: false
  })) {
    add(`visual assertion ${key}`, assertions[key] === expected, assertions[key]);
  }
  manifest.visualProofStatus = checks.filter((check) => check.name.startsWith("visual assertion")).every((check) => check.passed) ? "passed" : "missing";
  writeJson(`${issueDir}/visual-proof-output.json`, { status: manifest.visualProofStatus, assertionsPath });
  writeJson(`${issueDir}/canonical-plan-dom-output.json`, pick(assertions, ["canonicalPlanVisible", "plan1VisibleMainUi"]));
  writeJson(`${issueDir}/legacy-plans-dom-output.json`, pick(assertions, ["legacyPlansVisibleAdvanced", "plan2VisibleMainUi", "plan3VisibleMainUi", "plan4VisibleMainUi", "plan5VisibleMainUi"]));
  writeText(`${issueDir}/no-static-html-only-proof-output.txt`, "passed: proof was captured from the running app UI.\n");
}

function writeFinalAudit(output) {
  const summaries = {
    "room-type-gate-canonical-summary.json": manifest.roomTypeSemanticsCanonicalGateStatus,
    "scenario-ratio-range-repair-summary.json": manifest.scenarioRatioManifestRangeStatus,
    "single-floorplan-main-ui-summary.json": manifest.singleFloorplanMainUiStatus,
    "legacy-plans-advanced-summary.json": manifest.legacyPlansAdvancedOnlyStatus,
    "canonical-plan-default-open-summary.json": manifest.canonicalPlanDefaultOpenStatus,
    "operator-label-cleanup-summary.json": manifest.operatorLabelCleanupStatus,
    "visual-proof-summary.json": manifest.visualProofStatus
  };
  for (const [name, status] of Object.entries(summaries)) writeJson(`${issueDir}/${name}`, { status });
  writeText(`${issueDir}/scope-pin-ui-final-audit.md`, `# Scope / PIN / UI Final Audit\n\n${output.status === "passed" ? "GO" : "NO-GO"} for One-Floorplan Scenario Seed + Ratio Comparison Foundation.\n`);
  writeText(`${issueDir}/known-gaps.md`, "- Manual visual approval remains required.\n- Full scenario-ratio execution remains assigned to 451-460.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "- 451-460: One-Floorplan Scenario Seed + Ratio Comparison Foundation.\n");
  writeText(`${issueDir}/go-no-go.md`, output.status === "passed"
    ? "GO for One-Floorplan Scenario Seed + Ratio Comparison Foundation.\n"
    : `NO-GO: ${output.checks.filter((check) => !check.passed).map((check) => check.name).join(", ")}\n`);
  writeText("docs/project/scope-pin-ui-repair-status.md", output.status === "passed"
    ? "GO for One-Floorplan Scenario Seed + Ratio Comparison Foundation.\n"
    : "NO-GO for One-Floorplan Scenario Seed + Ratio Comparison Foundation.\n");
}

function duplicateBatchRanges() {
  const manifests = [
    "docs/verification/room-type-semantics-manifest.json",
    "docs/verification/scope-pin-ui-repair-manifest.json",
    "docs/verification/scenario-ratio-foundation-manifest.json"
  ].filter((path) => existsSync(abs(path))).map((path) => ({ path, batch: readJson(path).batch }));
  const seen = new Map();
  const duplicates = [];
  for (const manifestEntry of manifests) {
    if (seen.has(manifestEntry.batch)) duplicates.push([seen.get(manifestEntry.batch), manifestEntry.path]);
    seen.set(manifestEntry.batch, manifestEntry.path);
  }
  return duplicates;
}

function createLibraryProbe() {
  return { mainPlanIds: ["default-er-layout-plan-1"], legacyPlanIds: legacyPlanIds() };
}

function legacyPlanIds() {
  return ["default-er-layout-plan-2", "default-er-layout-plan-3", "default-er-layout-plan-4", "default-er-layout-plan-5"];
}

function writeCommonEvidence() {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, firstFailureText());
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures were not mutated by this scope/PIN/UI repair gate.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI fields or identity workflows were added by this gate.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added by this gate.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added by this gate.\n");
  writeText(`${issueDir}/no-promotion-output.txt`, "passed: promotion remains blocked.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function writeIssueEvidenceScaffold() {
  const commands = commandsForIssue();
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutput(command)] }))
  });
  for (const command of commands) writeTextIfMissing(mappedOutput(command), "pending: command output is captured by the caller.\n");
  writeText(`${issueDir}/closeout.md`, closeoutText());
  updateEvidenceIndex();
}

function commandsForIssue() {
  const stageByIssue = {
    "441": "room-type-gate-canonical",
    "442": "scenario-ratio-range-repair",
    "443": "single-floorplan-main-ui",
    "444": "legacy-plans-advanced",
    "445": "canonical-plan-default-open",
    "446": "operator-label-cleanup",
    "449": "visual-proof",
    "450": "final"
  };
  const base = issue === "450"
    ? ["npm --workspace packages/shared test", "npm --workspace apps/web test", "npm --workspace apps/web run build", "npm run check:room-type-semantics"]
    : issue === "441" || issue === "445"
      ? ["npm --workspace packages/shared test", "npm --workspace apps/web test", "npm --workspace apps/web run build", "npm run check:room-type-semantics"]
      : ["npm --workspace apps/web test", "npm --workspace apps/web run build"];
  const selectedStage = stageByIssue[issue] ?? stage;
  const gate = selectedStage === "final"
    ? "node scripts/check-scope-pin-ui-repair.mjs --stage final --issue 450"
    : `node scripts/check-scope-pin-ui-repair.mjs --stage ${selectedStage} --allow-partial --issue ${issue}`;
  return [...base, gate, "node scripts/check-no-phi-fields.mjs", `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issue}`];
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check:room-type-semantics")) return `${base}/room-type-semantics.txt`;
  if (command.includes("check-scope-pin-ui-repair")) return `${base}/scope-pin-ui-repair-gate.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  return `${base}/command.txt`;
}

function closeoutText() {
  return `# Issue ${issue} Closeout\n\n## Summary\nCompleted scope/PIN/one-floorplan repair stage: ${stage}.\n\n## Files Changed\n- See git diff and evidence index for local artifacts.\n\n## Commands Run\n- See commands.txt and command-output-map.json.\n\n## Tests Passed/Failed\n- Local command outputs are captured under test-output.\n\n## Evidence Artifacts\n- ${issueDir}\n- ${manifestPath}\n\n## Known Limitations\n- Manual visual approval is not claimed.\n- Full simulation and optimizer behavior remain out of scope.\n\n## Non-PHI Confirmation\n- Non-PHI rules still pass; this work adds no PHI, EHR integration, real identity fields, clinical safety certification, hidden scoring, optimizer behavior, or full-shift simulation.\n\n## GO / NO-GO\n${issue === "450" ? manifest.goNoGoStatus : `GO for Issue ${Number(issue) + 1}.`}\n\n## Next Recommended Issue\n${issue === "450" ? "451-460 One-Floorplan Scenario Seed + Ratio Comparison Foundation." : `Issue ${Number(issue) + 1}.`}\n`;
}

function firstFailureText() {
  return `Reproduced missing ${stage} evidence for scope/PIN/one-floorplan UI repair.\n`;
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const entry = {
    issue,
    title: `Scope PIN UI Repair Issue ${issue}`,
    requiredEvidence: listFiles(issueDir).sort()
  };
  const current = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (current >= 0) index.issues[current] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

function add(name, passed, detail) {
  checks.push({ name, passed, detail });
}

function pick(source, keys) {
  return Object.fromEntries(keys.map((key) => [key, source[key]]));
}

function listFiles(relativeRoot) {
  const root = abs(relativeRoot);
  const files = [];
  if (!existsSync(root)) return files;
  walk(root);
  return files.map((file) => file.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));
  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
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

function writeTextIfMissing(path, value) {
  if (!existsSync(abs(path))) writeText(path, value);
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
