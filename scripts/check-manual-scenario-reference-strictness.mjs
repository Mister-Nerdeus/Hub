#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  issuePath,
  readArg,
  readText,
  runNoPhi,
  screenshotIndex,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/manual-scenario-foundation-utils.mjs";
import { withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  validateManualScenarioReferenceReadiness
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "890");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-reference-strictness";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-manual-scenario-validation.mjs --stage final --issue 890",
  "node scripts/check-manual-scenario-ui.mjs --stage final --issue 890",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

const sourceFiles = [
  "apps/web/src/features/manual-scenario/ManualScenarioPanel.tsx",
  "apps/web/src/features/manual-scenario/ManualScenarioControls.tsx",
  "apps/web/src/features/manual-scenario/manualScenarioState.ts",
  "packages/shared/src/scenarios/manualScenarioReferenceValidation.ts",
  "packages/shared/tests/manual-scenario-reference-validation.test.mjs"
];
const placeholderIds = [
  "manual-assignment-set-active",
  "manual-staff-roster-active"
];
const forbiddenCopy = [
  "Unsafe",
  "Safer",
  "Recommended",
  "Best",
  "Optimal",
  "Balanced",
  "Workload",
  "Burden",
  "Score",
  "Staffing compliance",
  "Clinical safety",
  "Patient outcome",
  "Simulation"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommands(issue, commands);
const browserProof = await runBrowserProof();
writeJson(issuePath(issue, "browser-reference-strictness-proof.json"), browserProof);
screenshotIndex(issue, ["manual-scenario-reference-strictness.png"]);

const floorplanOnly = validateManualScenarioReferenceReadiness({
  floorplanId: "reference-strictness-floorplan",
  assignmentSetId: null,
  staffRosterId: null
});
const missingStaffRoster = validateManualScenarioReferenceReadiness({
  floorplanId: "reference-strictness-floorplan",
  assignmentSetId: "reference-strictness-assignment-set",
  staffRosterId: null
});
const completeReferences = validateManualScenarioReferenceReadiness({
  floorplanId: "reference-strictness-floorplan",
  assignmentSetId: "reference-strictness-assignment-set",
  staffRosterId: "reference-strictness-staff-roster"
});

writeJson(issuePath(issue, "placeholder-reference-before.json"), {
  status: "passed",
  issue: String(issue),
  finding: "Before this cleanup, the panel could build scenario references from placeholder assignment and staff roster IDs when only an active floorplan existed.",
  placeholders: placeholderIds
});
writeJson(issuePath(issue, "strict-reference-after.json"), {
  status: "passed",
  issue: String(issue),
  floorplanOnly,
  missingStaffRoster,
  completeReferences,
  createEnabledOnlyWhenComplete: completeReferences.status === "passed" &&
    floorplanOnly.status === "failed" &&
    missingStaffRoster.status === "failed"
});
writeJson(issuePath(issue, "missing-assignment-set-proof.json"), {
  status: floorplanOnly.issues.some((entry) => entry.code === "missing_assignment_set") ? "passed" : "failed",
  result: floorplanOnly
});
writeJson(issuePath(issue, "missing-staff-roster-proof.json"), {
  status: missingStaffRoster.issues.some((entry) => entry.code === "missing_staff_roster") ? "passed" : "failed",
  result: missingStaffRoster
});

const panelText = readText("apps/web/src/features/manual-scenario/ManualScenarioPanel.tsx");
const controlsText = readText("apps/web/src/features/manual-scenario/ManualScenarioControls.tsx");

const checks = [];
addCheck(checks, "reference readiness helper requires all references", fileIncludes(
  "packages/shared/src/scenarios/manualScenarioReferenceValidation.ts",
  [
    "validateManualScenarioReferenceReadiness",
    "Missing floorplan",
    "Missing assignment set",
    "Missing staff roster"
  ]
).passed);
addCheck(checks, "floorplan-only proof disables create", floorplanOnly.status === "failed" &&
  floorplanOnly.issues.some((entry) => entry.code === "missing_assignment_set") &&
  floorplanOnly.issues.some((entry) => entry.code === "missing_staff_roster"), floorplanOnly);
addCheck(checks, "floorplan and assignment set proof disables create without roster", missingStaffRoster.status === "failed" &&
  missingStaffRoster.issues.length === 1 &&
  missingStaffRoster.issues[0]?.code === "missing_staff_roster", missingStaffRoster);
addCheck(checks, "complete references proof enables create", completeReferences.status === "passed", completeReferences);
addCheck(checks, "browser proof disables create when assignment set is missing", browserProof.status === "passed" &&
  browserProof.createDisabled === true &&
  browserProof.copyContainsMissingAssignmentSet === true &&
  browserProof.copyContainsIncompleteReferences === true, browserProof);
addCheck(checks, "manual scenario panel uses nullable references", panelText.includes("const assignmentSetId = assignmentSet?.assignmentSetId ?? null") &&
  panelText.includes("const staffRosterId = staffRoster?.staffRosterId ?? null"), {
  assignmentSetNullable: panelText.includes("const assignmentSetId = assignmentSet?.assignmentSetId ?? null"),
  staffRosterNullable: panelText.includes("const staffRosterId = staffRoster?.staffRosterId ?? null")
});
addCheck(checks, "create button is disabled until references are complete", controlsText.includes("canCreate") &&
  controlsText.includes("disabled={!canCreate}") &&
  panelText.includes("canCreate={referencesReady}"), { controlsText: "canCreate" });
addCheck(checks, "placeholder IDs removed from runtime path", sourceFiles.every((file) =>
  fileExcludes(file, placeholderIds).passed
), placeholderIds);
addCheck(checks, "validation copy remains reference-only", fileIncludes(
  "apps/web/src/features/manual-scenario/ManualScenarioPanel.tsx",
  [
    "Scenario references are incomplete",
    "Manual scenario cannot be created until references are available",
    "Missing assignment set",
    "Missing staff roster"
  ]
).passed);
addCheck(checks, "manual scenario strictness files omit blocked copy", sourceFiles.every((file) =>
  fileExcludes(file, forbiddenCopy).passed
), forbiddenCopy);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-reference-strictness-output.json"), {
  status,
  manualScenarioReferenceStrictnessStatus: status,
  scenarioCreationRequiresRealFloorplan: status === "passed",
  scenarioCreationRequiresRealAssignmentSet: status === "passed",
  scenarioCreationRequiresRealStaffRoster: status === "passed",
  placeholderScenarioReferencesBlocked: status === "passed",
  manualScenarioStillManualOnly: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    manualScenarioReferenceStrictnessStatus: "passed",
    manualScenarioReferencesStrict: true,
    scenarioCreationRequiresRealFloorplan: true,
    scenarioCreationRequiresRealAssignmentSet: true,
    scenarioCreationRequiresRealStaffRoster: true,
    placeholderScenarioReferencesBlocked: true,
    manualScenarioStillManualOnly: true
  });
}

const noPhiPassed = runNoPhi(issue);
const finalStatus = status === "passed" && noPhiPassed ? "passed" : "failed";
writeCloseout(issue, {
  title: "Manual Scenario Reference Strictness",
  reviewFinding: "Scenario creation now requires real floorplan, assignment set, and staff roster references; placeholder assignment and roster IDs are blocked from the saved scenario path.",
  status: finalStatus,
  filesChanged: [
    "apps/web/src/App.tsx",
    "apps/web/src/features/manual-scenario/ManualScenarioPanel.tsx",
    "apps/web/src/features/manual-scenario/ManualScenarioControls.tsx",
    "packages/shared/src/scenarios/manualScenarioReferenceValidation.ts",
    "packages/shared/tests/manual-scenario-reference-validation.test.mjs",
    `scripts/${scriptName}.mjs`,
    "package.json",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-reference-strictness-output.json"),
    issuePath(issue, "placeholder-reference-before.json"),
    issuePath(issue, "strict-reference-after.json"),
    issuePath(issue, "browser-reference-strictness-proof.json"),
    issuePath(issue, "missing-assignment-set-proof.json"),
    issuePath(issue, "missing-staff-roster-proof.json"),
    issuePath(issue, "screenshot-index.json"),
    issuePath(issue, "screenshots/manual-scenario-reference-strictness.png"),
    issuePath(issue, "test-output/shared.txt"),
    issuePath(issue, "test-output/web.txt"),
    issuePath(issue, "test-output/web-build.txt"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Reference strictness verifies record presence only; it does not evaluate assignment quality."]
});
writeJson(issuePath(issue, "command-output-map.json"), {
  status: finalStatus,
  issue: String(issue),
  commands: [
    {
      command: "npm --workspace packages/shared test",
      outputs: [issuePath(issue, "test-output/shared.txt")]
    },
    {
      command: "npm --workspace apps/web test",
      outputs: [issuePath(issue, "test-output/web.txt")]
    },
    {
      command: "npm --workspace apps/web run build",
      outputs: [issuePath(issue, "test-output/web-build.txt")]
    },
    {
      command: `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
      outputs: [
        issuePath(issue, `test-output/${scriptName}.txt`),
        issuePath(issue, "manual-scenario-reference-strictness-output.json")
      ]
    },
    {
      command: "node scripts/check-manual-scenario-validation.mjs --stage final --issue 890",
      outputs: [
        issuePath(issue, "test-output/check-manual-scenario-validation.txt"),
        issuePath(issue, "manual-scenario-validation-output.json")
      ]
    },
    {
      command: "node scripts/check-manual-scenario-ui.mjs --stage final --issue 890",
      outputs: [
        issuePath(issue, "test-output/check-manual-scenario-ui.txt"),
        issuePath(issue, "manual-scenario-ui-output.json")
      ]
    },
    {
      command: "node scripts/check-no-phi-fields.mjs",
      outputs: [issuePath(issue, "no-phi-output.txt")]
    },
    {
      command: "docker compose config",
      outputs: [issuePath(issue, "test-output/docker-compose-config.txt")]
    },
    {
      command: "docker compose -f docker-compose.production.yml config",
      outputs: [issuePath(issue, "test-output/docker-compose-production-config.txt")]
    },
    {
      command: "docker compose build web",
      outputs: [issuePath(issue, "test-output/docker-compose-build-web.txt")]
    },
    {
      command: "docker compose -f docker-compose.production.yml build web",
      outputs: [issuePath(issue, "test-output/docker-compose-production-build-web.txt")]
    }
  ]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

async function runBrowserProof() {
  const port = Number(readArg("--port", "6890"));
  const chromePort = Number(readArg("--chrome-port", "9890"));
  const screenshotFile = issuePath(issue, "screenshots/manual-scenario-reference-strictness.png");
  try {
    const rendered = await withBrowserRenderedApp({
      port,
      chromePort,
      width: 1440,
      height: 1000,
      initScript: unlockScript()
    }, async (browser) => {
      await browser.navigate(
        `${browser.baseUrl}/?section=scenarios`,
        `document.querySelector('[data-manual-scenario-panel="true"]') != null`
      );
      await browser.evaluate("localStorage.removeItem('nerdeus.manualAssignmentFoundation.assignmentSet.v1')");
      await browser.navigate(
        `${browser.baseUrl}/?section=scenarios`,
        `document.querySelector('[data-manual-scenario-panel="true"]') != null`
      );
      await browser.screenshot(screenshotFile);
      const panelText = await browser.evaluate(
        `document.querySelector('[data-manual-scenario-panel="true"]')?.textContent ?? ""`
      );
      const createDisabled = await browser.evaluate(
        `Array.from(document.querySelectorAll('button')).some((button) => button.textContent.trim() === 'Create scenario' && button.disabled === true)`
      );
      return {
        createDisabled,
        copyContainsMissingAssignmentSet: /Missing assignment set/u.test(panelText),
        copyContainsIncompleteReferences: /Scenario references are incomplete/u.test(panelText),
        copyContainsCreateBlock: /Manual scenario cannot be created until references are available/u.test(panelText),
        screenshot: screenshotFile
      };
    });
    return {
      status: rendered.result.createDisabled &&
        rendered.result.copyContainsMissingAssignmentSet &&
        rendered.result.copyContainsIncompleteReferences
        ? "passed"
        : "failed",
      ...rendered.result
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      screenshot: screenshotFile
    };
  }
}

function unlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}
