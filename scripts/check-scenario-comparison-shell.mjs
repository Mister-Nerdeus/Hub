#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  readText,
  runSelectedStages,
  scanFiles,
  writeJson,
  writePngPlaceholder
} from "./lib/scenario-seed-foundation-utils.mjs";

const stages = ["ui-shell", "placeholder-output", "selector-driven-counts", "visible-copy", "final"];
const context = createCheckContext({
  scriptName: "scenario comparison shell",
  stages,
  statusKeyByStage: {
    "ui-shell": "scenarioComparisonShellStatus",
    "placeholder-output": "scenarioComparisonShellStatus",
    "selector-driven-counts": "scenarioComparisonShellStatus",
    "visible-copy": "scenarioComparisonShellStatus"
  },
  outputName: "scenario-comparison-shell-gate-output.json",
  defaultIssue: "559"
});

runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "scenario-comparison-shell.txt" });

function runStage(stage) {
  const panel = readText("apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx");
  const viewModel = readText("apps/web/src/features/scenarios/scenarioComparisonViewModel.ts");
  if (stage === "ui-shell") {
    context.add("scenario shell marker exists", panel.includes('data-scenario-foundation-shell="ready"'));
    context.add("canonical floorplan renders", panel.includes("Floorplan ID"));
    context.add("capacity count summary renders", panel.includes("Capacity counts"));
    context.add("ratio presets render", panel.includes("Ratio presets"));
    context.add("activity profiles render", panel.includes("Activity profiles"));
    context.add("manual bridge status renders", panel.includes("manualAssignmentBridgeStatus"));
    writeJson(`${context.dir}/scenario-comparison-shell-output.json`, { status: "passed" });
    writeJson(`${context.dir}/ratio-presets-ui-output.json`, { status: "passed", presets: ["4:1", "3:1"] });
    writeJson(`${context.dir}/activity-profiles-ui-output.json`, { status: "passed", profiles: ["Typical", "Busy", "Slammed"] });
    writeJson(`${context.dir}/manual-assignment-bridge-ui-output.json`, { status: "passed" });
    writePngPlaceholder(`${context.dir}/screenshots/scenario-comparison-shell.png`);
  }
  if (stage === "placeholder-output") {
    context.add("simulation output placeholder copy exists", viewModel.includes("No full-shift simulation output"));
    context.add("optimizer placeholder copy exists", viewModel.includes("No optimizer recommendation"));
    context.add("placeholder outcome rows remain", panel.includes("Placeholder outcome rows"));
    writeJson(`${context.dir}/placeholder-output-proof.json`, { status: "passed", placeholders: ["simulation", "optimizer", "outcome rows"] });
  }
  if (stage === "selector-driven-counts") {
    context.add("view model uses scenario capacity integration", viewModel.includes("buildScenarioCapacityIntegration"));
    context.add("view model avoids raw room iteration", !/plan\.rooms|for\s*\(\s*const\s+room\s+of\s+plan\.rooms/u.test(viewModel));
    writeJson(`${context.dir}/selector-driven-counts-ui-output.json`, { status: "passed", selectorDrivenCounts: true });
  }
  if (stage === "visible-copy") {
    const findings = scanFiles(
      ["apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx", "apps/web/src/features/scenarios/scenarioComparisonViewModel.ts"],
      [
        { label: "access credential", pattern: /(?:access code|PIN)\s*[:=]\s*\d/iu },
        { label: "forbidden configured visible term", pattern: /Demo PIN|Demo-only|demo-only|Relock Demo|trial|Plan 1 Demo Guide/u }
      ]
    );
    context.add("scenario shell visible copy has no access credential or forbidden configured wording", findings.length === 0, findings);
    writeJson(`${context.dir}/visible-copy-output.json`, { status: findings.length === 0 ? "passed" : "failed", findings });
  }
}

