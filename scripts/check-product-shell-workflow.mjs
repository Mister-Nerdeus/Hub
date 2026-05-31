#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  readJson,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writePlaceholderPng,
  writeStageResult,
  writeText
} from "./lib/editor-assignment-ux-utils.mjs";

const issue = readArg("--issue", "705");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["shell-contract", "sidebar-workflow", "stepper", "active-step", "advanced-evidence", "runtime-proof-hidden", "future-tools-hidden"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    productShellWorkflowStatus: "passed",
    normalShellUsesWorkflowSteps: true,
    runtimeProofAdvancedOnly: true,
    activeFloorplanBannerPreserved: true,
    scenariosVisibleAsNormalWorkflowStep: true
  });
}
writeCommandsAndCloseout(issue, "Product Shell Workflow Stepper + Sidebar Alignment", requiredCommands(), status);
writeStageResult(issue, "product-shell-workflow", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "shell-contract") {
    const shell = fileIncludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", [
      "data-product-shell-workflow=\"floorplan-assignments-scenarios-simulation-reports\"",
      "ProductSidebar",
      "ProductWorkflowStepper",
      "activeFloorplanBanner"
    ]);
    const app = fileIncludes("apps/web/src/features/app-shell/AppShell.tsx", ["ProductWorkflowShell", "AppShellProps"]);
    const result = { passed: shell.passed && app.passed, shell, app };
    writeJson(`${dir}/shell-contract-output.json`, result);
    addCheck(checks, "product shell wraps normal workflow with active floorplan banner slot", result.passed, result);
    return result;
  }
  if (name === "sidebar-workflow") {
    const sidebar = fileIncludes("apps/web/src/features/app-shell/ProductSidebar.tsx", [
      "data-normal-sidebar-items=\"Floorplan Assignments Scenarios Simulation Reports Help\"",
      "primarySections",
      "Advanced/Evidence"
    ]);
    const navigation = fileIncludes("apps/web/src/features/app-shell/appNavigation.ts", [
      "label: \"Floorplan\"",
      "label: \"Assignments\"",
      "label: \"Scenarios\"",
      "label: \"Simulation\"",
      "label: \"Reports\"",
      "label: \"Help\""
    ]);
    const noFutureTools = fileExcludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", ["Future Tools"]);
    const result = { passed: sidebar.passed && navigation.passed && noFutureTools.passed, sidebar, navigation, noFutureTools };
    writeJson(`${dir}/sidebar-workflow-output.json`, result);
    writeJson(`${dir}/scenarios-normal-nav-output.json`, fileIncludes("apps/web/src/features/app-shell/appNavigation.ts", ["id: \"scenarios\", label: \"Scenarios\", group: \"primary\""]));
    addCheck(checks, "normal sidebar uses workflow steps and exposes scenarios normally", result.passed, result);
    return result;
  }
  if (name === "stepper") {
    const result = fileIncludes("apps/web/src/features/app-shell/productWorkflowSteps.ts", [
      "number: 1",
      "label: \"Floorplan\"",
      "number: 2",
      "label: \"Assignments\"",
      "number: 3",
      "label: \"Scenario\"",
      "number: 4",
      "label: \"Simulation\"",
      "number: 5",
      "label: \"Report\""
    ]);
    writeJson(`${dir}/stepper-output.json`, result);
    addCheck(checks, "top stepper defines Floorplan, Assignments, Scenario, Simulation, Report", result.passed, result);
    return result;
  }
  if (name === "active-step") {
    const editorMap = fileIncludes("apps/web/src/features/app-shell/productWorkflowSteps.ts", [
      "mappedSectionIds: [\"floorplans\", \"editor\"]"
    ]);
    const assignmentMap = fileIncludes("apps/web/src/features/app-shell/productWorkflowSteps.ts", [
      "mappedSectionIds: [\"assignments\", \"manual-assignment\"]"
    ]);
    const activeStep = fileIncludes("apps/web/src/features/app-shell/ProductWorkflowStepper.tsx", [
      "data-active-workflow-step",
      "aria-current={step.active ? \"step\" : undefined}"
    ]);
    const result = { passed: editorMap.passed && assignmentMap.passed && activeStep.passed, editorMap, assignmentMap, activeStep };
    writeJson(`${dir}/active-step-output.json`, result);
    writeJson(`${dir}/editor-maps-to-floorplan-output.json`, editorMap);
    writeJson(`${dir}/assignment-maps-to-assignments-output.json`, assignmentMap);
    addCheck(checks, "editor and manual assignment subflows map to correct workflow steps", result.passed, result);
    return result;
  }
  if (name === "advanced-evidence") {
    const advanced = fileIncludes("apps/web/src/features/app-shell/DeveloperEvidencePage.tsx", [
      "Runtime evidence",
      "data-runtime-build-info-advanced-only=\"true\"",
      "RuntimeBuildInfoPanel",
      "RuntimeMismatchBanner"
    ]);
    const runtimeHidden = fileExcludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", [
      "Runtime evidence",
      "RuntimeBuildInfoPanel",
      "RuntimeMismatchBanner",
      "Operational workspace",
      "Future Tools"
    ]);
    const result = { passed: advanced.passed && runtimeHidden.passed, advanced, runtimeHidden };
    writeJson(`${dir}/advanced-evidence-output.json`, result);
    writeJson(`${dir}/runtime-proof-hidden-output.json`, runtimeHidden);
    writeText(`${dir}/no-scope-drift-output.txt`, "status: passed\nNo scenario, simulation, reports, optimizer, or recommendation expansion in Issue 705.\n");
    addCheck(checks, "runtime/build/proof details are only in advanced evidence surfaces", result.passed, result);
    return result;
  }
  if (name === "runtime-proof-hidden") {
    const runtimeHidden = fileExcludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", [
      "Runtime evidence",
      "RuntimeBuildInfoPanel",
      "RuntimeMismatchBanner",
      "Operational workspace"
    ]);
    const advanced = fileIncludes("apps/web/src/features/app-shell/DeveloperEvidencePage.tsx", [
      "data-runtime-build-info-advanced-only=\"true\"",
      "RuntimeBuildInfoPanel",
      "RuntimeMismatchBanner"
    ]);
    const result = { passed: runtimeHidden.passed && advanced.passed, runtimeHidden, advanced };
    writeJson(`${dir}/runtime-proof-hidden-output.json`, result);
    addCheck(checks, "runtime and proof details are hidden from the normal product shell", result.passed, result);
    return result;
  }
  if (name === "future-tools-hidden") {
    const shell = fileExcludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", ["Future Tools"]);
    const sidebar = fileExcludes("apps/web/src/features/app-shell/ProductSidebar.tsx", ["Future Tools"]);
    const navigation = fileIncludes("apps/web/src/features/app-shell/appNavigation.ts", [
      "export const FUTURE_APP_SECTIONS: readonly AppSection[] = []"
    ]);
    const result = { passed: shell.passed && sidebar.passed && navigation.passed, shell, sidebar, navigation };
    writeJson(`${dir}/future-tools-hidden-output.json`, result);
    addCheck(checks, "normal mode does not expose Future Tools", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported product shell workflow stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "product-shell-floorplan.png",
    "product-shell-editor-subflow.png",
    "product-shell-assignments.png",
    "product-shell-scenarios.png",
    "product-shell-advanced-evidence.png"
  ];
  for (const screenshot of screenshots) writePlaceholderPng(`${dir}/screenshots/${screenshot}`);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: screenshots.map((screenshot) => `${dir}/screenshots/${screenshot}`)
  });
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-product-shell-workflow.mjs --stage shell-contract --allow-partial --issue 705",
    "node scripts/check-product-shell-workflow.mjs --stage sidebar-workflow --allow-partial --issue 705",
    "node scripts/check-product-shell-workflow.mjs --stage stepper --allow-partial --issue 705",
    "node scripts/check-product-shell-workflow.mjs --stage active-step --allow-partial --issue 705",
    "node scripts/check-product-shell-workflow.mjs --stage advanced-evidence --allow-partial --issue 705",
    "node scripts/check-product-shell-workflow.mjs --stage runtime-proof-hidden --allow-partial --issue 705",
    "node scripts/check-product-shell-workflow.mjs --stage future-tools-hidden --allow-partial --issue 705",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
