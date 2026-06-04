#!/usr/bin/env node
import { delay, waitForExpression, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueArtifacts,
  issuePath,
  readArg,
  readJson,
  runNoPhi,
  screenshotIndex,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/manual-scenario-foundation-utils.mjs";

const issue = readArg("--issue", "887");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-browser-proof";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];
const screenshots = [
  "manual-scenario-browser-overlay.png",
  "manual-scenario-browser-created.png",
  "manual-scenario-browser-after-reload.png"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommands(issue, commands);

const assignmentFoundationManifest = readJson("docs/verification/assignment-foundation-manifest.json");
const proof = await runBrowserProof();
const checks = [];
addCheck(checks, "assignment foundation closeout permits manual scenarios", assignmentFoundationManifest.manualScenarioFoundationCanStartNext === true, assignmentFoundationManifest);
addCheck(checks, "manual scenario created in browser", proof.manualScenarioCreateBrowserProof, proof);
addCheck(checks, "manual scenario duplicated in browser", proof.manualScenarioDuplicateBrowserProof, proof);
addCheck(checks, "manual scenario renamed in browser", proof.manualScenarioRenameBrowserProof, proof);
addCheck(checks, "linked floorplan verified in browser", proof.linkedFloorplanVisible, proof);
addCheck(checks, "linked staff roster verified in browser", proof.linkedStaffRosterVisible, proof);
addCheck(checks, "linked assignment set verified in browser", proof.linkedAssignmentSetVisible, proof);
addCheck(checks, "manual assignment overlay verified in browser", proof.overlayBadgesVisible, proof);
addCheck(checks, "manual scenarios persist after reload", proof.manualScenarioPersistsAfterReload, proof);
addCheck(checks, "blocked browser copy absent from manual scenario panel", proof.browserProofContainsNoRecommendations && proof.browserProofContainsNoScoring, proof);
const status = statusFromChecks(checks);

writeJson(issuePath(issue, "manual-scenario-browser-proof-output.json"), {
  status,
  manualScenarioBrowserProofStatus: status,
  ...proof
});
writeJson(issuePath(issue, "manual-scenario-browser-trace.json"), { status, steps: proof.steps });
writeJson(issuePath(issue, "scenario-before.json"), proof.scenarioBefore);
writeJson(issuePath(issue, "scenario-after.json"), proof.scenarioAfter);
screenshotIndex(issue, screenshots);
if (status === "passed") {
  updateManifest(issue, {
    manualScenarioBrowserProofStatus: "passed",
    manualScenarioCreateBrowserProof: true,
    manualScenarioDuplicateBrowserProof: true,
    manualScenarioRenameBrowserProof: true,
    manualScenarioPersistsAfterReload: true,
    browserProofContainsNoRecommendations: true,
    browserProofContainsNoScoring: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Scenario Browser Proof",
  reviewFinding: "Browser proof uses rendered controls to create, rename, duplicate, save, reload, and verify manual scenario references.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [`scripts/${scriptName}.mjs`, "docs/verification/manual-scenario-foundation-manifest.json", issuePath(issue)],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-browser-proof-output.json"),
    issuePath(issue, "manual-scenario-browser-trace.json"),
    issuePath(issue, "scenario-before.json"),
    issuePath(issue, "scenario-after.json"),
    issuePath(issue, "screenshot-index.json"),
    issuePath(issue, "screenshots"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Browser proof runs against the deterministic canonical proof fixture and local browser storage."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

async function runBrowserProof() {
  const port = Number(readArg("--port", "6886"));
  const chromePort = Number(readArg("--chrome-port", "9886"));
  return (await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1100, initScript: unlockScript() }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=manual-assignment&manualAssignmentFixtureMode=canonical_proof`, `document.querySelector('[data-manual-assignment-editor="true"]') != null`);
    await browser.evaluate("localStorage.clear()");
    await browser.navigate(`${browser.baseUrl}/?section=manual-assignment&manualAssignmentFixtureMode=canonical_proof`, `document.querySelector('[data-manual-assignment-editor="true"]') != null`);
    await addAssignment(browser, "staff-rn-a", "room", 0);
    await addAssignment(browser, "staff-rn-b", "bed_position", 0);
    await addAssignment(browser, "staff-rn-c", "bed_position", 1);
    await clickButton(browser, "Save assignment set");
    await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('.layout-editor-stage__svg') != null`);
    await waitForExpression(browser, `document.querySelectorAll('[data-manual-assignment-badge="true"]').length >= 3`, 15_000);
    const overlayText = await browser.evaluate("document.body.textContent");
    await browser.screenshot(issuePath(issue, "screenshots/manual-scenario-browser-overlay.png"));

    await browser.navigate(`${browser.baseUrl}/?section=scenarios`, `document.querySelector('[data-manual-scenario-panel="true"]') != null`);
    await clickButton(browser, "Create scenario");
    await setRenameValue(browser, "Manual Scenario Browser Proof");
    await clickButton(browser, "Rename scenario");
    await waitForExpression(browser, `document.querySelector('[data-manual-scenario-panel="true"]')?.textContent?.includes('Manual Scenario Browser Proof') === true`, 5_000);
    await clickButton(browser, "Duplicate scenario");
    await waitForExpression(browser, `document.querySelectorAll('.manual-scenario-list li').length >= 2`, 5_000);
    const panelTextBefore = await browser.evaluate(`document.querySelector('[data-manual-scenario-panel="true"]')?.textContent ?? ""`);
    await clickButton(browser, "Save scenarios");
    await waitForExpression(browser, `localStorage.getItem('nerdeus.manualScenarioFoundation.scenarios.v1') != null`, 5_000);
    const scenarioBefore = await storedScenarioState(browser);
    await browser.screenshot(issuePath(issue, "screenshots/manual-scenario-browser-created.png"));

    await browser.navigate(`${browser.baseUrl}/?section=scenarios`, `document.querySelector('[data-manual-scenario-panel="true"]') != null`);
    await waitForExpression(browser, `document.querySelectorAll('.manual-scenario-list li').length >= 2`, 10_000);
    const scenarioAfter = await storedScenarioState(browser);
    const panelTextAfter = await browser.evaluate(`document.querySelector('[data-manual-scenario-panel="true"]')?.textContent ?? ""`);
    await browser.screenshot(issuePath(issue, "screenshots/manual-scenario-browser-after-reload.png"));

    return {
      manualScenarioCreateBrowserProof: scenarioBefore.scenarios.length >= 1,
      manualScenarioDuplicateBrowserProof: scenarioBefore.scenarios.length >= 2,
      manualScenarioRenameBrowserProof: scenarioBefore.scenarios.some((scenario) => scenario.label === "Manual Scenario Browser Proof"),
      linkedFloorplanVisible: /Linked floorplan/u.test(panelTextAfter) &&
        !/No active floorplan/u.test(panelTextAfter) &&
        scenarioAfter.scenarios.every((scenario) => scenario.floorplanId === "default-er-layout-plan-1"),
      linkedStaffRosterVisible: /Linked staff roster/u.test(panelTextAfter) &&
        scenarioAfter.scenarios.every((scenario) => scenario.staffRosterId === "manual-staff-roster-active"),
      linkedAssignmentSetVisible: /Linked assignment set/u.test(panelTextAfter) && /Manual assignment set/u.test(panelTextAfter),
      overlayBadgesVisible: /RN A/u.test(overlayText) && /RN B/u.test(overlayText) && /RN C/u.test(overlayText),
      manualScenarioPersistsAfterReload: JSON.stringify(scenarioBefore) === JSON.stringify(scenarioAfter),
      browserProofContainsNoRecommendations: !/recommended|recommendation|optimized|optimizer|best/iu.test(`${panelTextBefore} ${panelTextAfter}`),
      browserProofContainsNoScoring: !/workload score|burden score|scenario score|assignment score/iu.test(`${panelTextBefore} ${panelTextAfter}`),
      scenarioBefore,
      scenarioAfter,
      steps: [
        "open manual assignment workspace",
        "create manual assignment set",
        "verify assignment overlay",
        "open manual scenario workspace",
        "create manual scenario",
        "rename manual scenario",
        "duplicate manual scenario",
        "save manual scenarios",
        "reload manual scenario workspace",
        "verify persisted manual scenario references"
      ]
    };
  })).result;
}

async function addAssignment(browser, staffId, targetKind, targetIndex = 0) {
  const staffSelector = `[data-manual-staff-id="${staffId}"]`;
  await browser.evaluate(`document.querySelector(${JSON.stringify(staffSelector)})?.click()`);
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(staffSelector)})?.getAttribute("aria-pressed") === "true"`, 5_000);
  const targetSelector = await browser.evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('[data-assignment-target-kind="${targetKind}"]'));
    const button = buttons[${Number(targetIndex)}];
    button?.click();
    const targetId = button?.getAttribute("data-assignment-target-id");
    return targetId == null ? null : \`[data-assignment-target-id="\${targetId}"]\`;
  })()`);
  if (targetSelector == null) {
    throw new Error(`Assignment target ${targetKind} at index ${targetIndex} was not found`);
  }
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(targetSelector)})?.getAttribute("aria-pressed") === "true"`, 5_000);
  await clickButton(browser, "Add assignment");
  await delay(200);
}

async function clickButton(browser, text) {
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === ${JSON.stringify(text)} && !button.disabled)?.click()`);
  await delay(250);
}

async function setRenameValue(browser, value) {
  await browser.evaluate(`(() => {
    const input = document.querySelector('.manual-scenario-controls input');
    if (input == null) throw new Error('missing manual scenario rename input');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(value)} }));
  })()`);
  await delay(250);
}

async function storedScenarioState(browser) {
  return browser.evaluate(`JSON.parse(localStorage.getItem('nerdeus.manualScenarioFoundation.scenarios.v1'))`);
}

function unlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}
