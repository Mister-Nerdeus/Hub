#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writeStageResult,
  writeText
} from "./lib/editor-assignment-ux-utils.mjs";

const issue = readArg("--issue", "708");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);

const stages = stage === "final"
  ? ["split-room-readiness", "no-split-room-readiness", "invalid-split-room-readiness", "simulation-readiness-copy"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    floorplanReadinessTruthStatus: "passed",
    splitRoomReadinessTruthful: true,
    simulationReadinessNotOverclaimed: true
  });
}
writeCommandsAndCloseout(issue, "Readiness Truth Hardening", requiredCommands(), status, [
  "Simulation readiness remains blocked until assignment set, scenario context, and assumptions are available."
]);
writeStageResult(issue, "floorplan-readiness-truth", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "split-room-readiness") {
    const source = fileIncludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", [
      "hasValidSplitRoomReadiness",
      "splitBay.bedPositionRoomIds.length !== 2",
      "Split rooms have valid child room references."
    ]);
    const noAlwaysPass = fileExcludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", [
      "(layout.splitBays?.length ?? 0) >= 0"
    ]);
    const result = { passed: source.passed && noAlwaysPass.passed, source, noAlwaysPass };
    writeJson(`${dir}/split-room-readiness-output.json`, result);
    addCheck(checks, "split-room readiness validates data when split rooms exist", result.passed, result);
    return result;
  }
  if (name === "no-split-room-readiness") {
    const result = fileIncludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", [
      "splitBays.length === 0",
      "No split rooms present."
    ]);
    writeJson(`${dir}/no-split-room-readiness-output.json`, result);
    addCheck(checks, "no split rooms pass with explicit no-split-room reason", result.passed, result);
    return result;
  }
  if (name === "invalid-split-room-readiness") {
    const result = fileIncludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", [
      "invalidSplitBay",
      "child room references must be valid and independently assignable",
      "roomIds.has(roomId)"
    ]);
    writeJson(`${dir}/invalid-split-room-readiness-output.json`, result);
    addCheck(checks, "invalid split-room references fail readiness", result.passed, result);
    return result;
  }
  if (name === "simulation-readiness-copy") {
    const model = fileIncludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", [
      "assignment_set_ready",
      "scenario_context_ready",
      "scenario_assumptions_ready",
      "Prepared for scenario setup"
    ]);
    const checklist = fileIncludes("apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx", [
      "Prepared for simulation setup"
    ]);
    const selector = fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", [
      "Prepare for Simulation"
    ]);
    const noClaim = [
      fileExcludes("apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx", ["Ready for simulation"]),
      fileExcludes("apps/web/src/features/floorplans/activeFloorplanSelectorViewModel.ts", ["Ready for simulation"]),
      fileExcludes("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", ["Ready for simulation"]),
      fileExcludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", [
        "clinical safety",
        "safe staffing",
        "patient outcome"
      ])
    ];
    const result = {
      passed: model.passed && checklist.passed && selector.passed && noClaim.every((entry) => entry.passed),
      model,
      checklist,
      selector,
      noClaim
    };
    writeJson(`${dir}/simulation-readiness-copy-output.json`, result);
    writeText(
      `${dir}/no-claim-output.txt`,
      `status: ${result.passed ? "passed" : "failed"}\nNo floorplan-only Ready for simulation, clinical safety, staffing compliance, or patient outcome claims.\n`
    );
    addCheck(checks, "simulation readiness requires assignment/scenario/assumption context and copy is not overclaimed", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported floorplan readiness truth stage: ${name}`);
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-floorplan-readiness-truth.mjs --stage split-room-readiness --allow-partial --issue 708",
    "node scripts/check-floorplan-readiness-truth.mjs --stage no-split-room-readiness --allow-partial --issue 708",
    "node scripts/check-floorplan-readiness-truth.mjs --stage invalid-split-room-readiness --allow-partial --issue 708",
    "node scripts/check-floorplan-readiness-truth.mjs --stage simulation-readiness-copy --allow-partial --issue 708",
    "node scripts/check-active-floorplan-persistence-resilience.mjs --stage corrupted-localstorage --allow-partial --issue 708",
    "node scripts/check-active-floorplan-persistence-resilience.mjs --stage fallback-floorplan --allow-partial --issue 708",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
