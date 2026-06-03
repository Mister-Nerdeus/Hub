#!/usr/bin/env node
import { delay, waitForExpression, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueArtifacts,
  issuePath,
  readArg,
  runNoPhi,
  screenshotIndex,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/assignment-foundation-utils.mjs";

const issue = readArg("--issue", "870");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-assignment-browser-proof";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];
const screenshots = [
  "manual-assignment-browser-editor.png",
  "manual-assignment-browser-overlay.png",
  "manual-assignment-browser-after-reload.png"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommands(issue, commands);
const proof = await runBrowserProof();
const checks = [];
addCheck(checks, "normal room assigned in browser", proof.normalRoomManualAssignmentBrowserProof, proof);
addCheck(checks, "split beds assigned in browser", proof.splitBedManualAssignmentBrowserProof, proof);
addCheck(checks, "overlay verified in browser", proof.overlayBadgesVisible, proof);
addCheck(checks, "assignment persists after reload", proof.manualAssignmentPersistsAfterReload, proof);
addCheck(checks, "blocked browser copy absent", proof.browserProofContainsNoRecommendations && proof.browserProofContainsNoScoring, proof);
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-assignment-browser-proof-output.json"), {
  status,
  manualAssignmentBrowserProofStatus: status,
  ...proof
});
writeJson(issuePath(issue, "manual-assignment-browser-trace.json"), { status, steps: proof.steps });
writeJson(issuePath(issue, "assignment-before.json"), proof.assignmentBefore);
writeJson(issuePath(issue, "assignment-after.json"), proof.assignmentAfter);
screenshotIndex(issue, screenshots);
if (status === "passed") {
  updateManifest(issue, {
    manualAssignmentBrowserProofStatus: "passed",
    normalRoomManualAssignmentBrowserProof: true,
    splitBedManualAssignmentBrowserProof: true,
    manualAssignmentPersistsAfterReload: true,
    browserProofContainsNoRecommendations: true,
    browserProofContainsNoScoring: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Assignment Browser Proof",
  reviewFinding: "Browser proof uses rendered controls to create manual assignments, save, reload, and verify editor overlay badges.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: ["scripts/check-manual-assignment-browser-proof.mjs", issuePath(issue)],
  commands,
  evidence: [
    issuePath(issue, "manual-assignment-browser-proof-output.json"),
    issuePath(issue, "manual-assignment-browser-trace.json"),
    issuePath(issue, "screenshot-index.json"),
    issuePath(issue, "screenshots")
  ],
  limitations: ["Browser proof covers the canonical active floorplan loaded by the app."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

async function runBrowserProof() {
  const port = Number(readArg("--port", "6870"));
  const chromePort = Number(readArg("--chrome-port", "9870"));
  return (await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1100, initScript: unlockScript() }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=manual-assignment&manualAssignmentFixtureMode=canonical_proof`, `document.querySelector('[data-manual-assignment-editor="true"]') != null`);
    await browser.evaluate("localStorage.clear()");
    await browser.navigate(`${browser.baseUrl}/?section=manual-assignment&manualAssignmentFixtureMode=canonical_proof`, `document.querySelector('[data-manual-assignment-editor="true"]') != null`);
    await addAssignment(browser, "staff-rn-a", "room", 0);
    await addAssignment(browser, "staff-rn-b", "bed_position", 0);
    await addAssignment(browser, "staff-rn-c", "bed_position", 1);
    await clickButton(browser, "Save assignment set");
    const assignmentBefore = await storedAssignmentSet(browser);
    await browser.screenshot(issuePath(issue, "screenshots/manual-assignment-browser-editor.png"));
    await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('.layout-editor-stage__svg') != null`);
    await waitForExpression(browser, `document.querySelectorAll('[data-manual-assignment-badge="true"]').length >= 3`, 15_000);
    const badgeText = await browser.evaluate(`document.body.textContent`);
    await browser.screenshot(issuePath(issue, "screenshots/manual-assignment-browser-overlay.png"));
    await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('.layout-editor-stage__svg') != null`);
    await waitForExpression(browser, `document.querySelectorAll('[data-manual-assignment-badge="true"]').length >= 3`, 15_000);
    const assignmentAfter = await storedAssignmentSet(browser);
    await browser.screenshot(issuePath(issue, "screenshots/manual-assignment-browser-after-reload.png"));
    const bodyText = await browser.evaluate(`document.body.textContent`);
    return {
      normalRoomManualAssignmentBrowserProof: assignmentBefore.assignments.some((assignment) => assignment.assignmentTargetKind === "room"),
      splitBedManualAssignmentBrowserProof: assignmentBefore.assignments.filter((assignment) => assignment.assignmentTargetKind === "bed_position").length >= 2,
      overlayBadgesVisible: /RN A/u.test(badgeText) && /RN B/u.test(badgeText) && /RN C/u.test(badgeText),
      manualAssignmentPersistsAfterReload: JSON.stringify(assignmentBefore) === JSON.stringify(assignmentAfter),
      browserProofContainsNoRecommendations: !/recommended|recommendation|optimized|optimizer/iu.test(bodyText),
      browserProofContainsNoScoring: !/workload score|burden score|assignment score/iu.test(bodyText),
      assignmentBefore,
      assignmentAfter,
      steps: ["open assignment workspace", "assign room", "assign split bed 2A", "assign split bed 2B", "save", "open editor", "verify overlay", "reload editor"]
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

async function storedAssignmentSet(browser) {
  return browser.evaluate(`JSON.parse(localStorage.getItem('nerdeus.manualAssignmentFoundation.assignmentSet.v1'))`);
}

function unlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}
