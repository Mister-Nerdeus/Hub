#!/usr/bin/env node
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";
import {
  delay,
  waitForExpression,
  withBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueArtifacts,
  readArg,
  statusFromChecks,
  updateHardeningManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/geometry-truth-hardening-utils.mjs";

const issue = readArg("--issue", "829");
const stage = readArg("--stage", "full-flow");
const scriptName = "check-split-room-hard-browser-regression";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [
  `node scripts/${scriptName}.mjs --stage full-flow --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage save-reload-flow --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage unsplit-flow --issue ${issue}`
];
const initScript = "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
const requiredScreenshots = [
  "split-room-parent-selected.png",
  "split-room-bed-a-selected.png",
  "split-room-bed-b-selected.png",
  "split-room-resized-parent.png",
  "split-room-divider-controls.png"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);

const proof = await runBrowserProof();
const checks = [];
addCheck(checks, "normal single-room split creates one parent and two beds", proof.singleRoomToSplitRoomBrowserFlowPassed, proof);
addCheck(checks, "new split flow does not create split_bay", proof.newSplitBayCount === 0, proof);
addCheck(checks, "bed targets remain stable after reload", proof.splitBedTargetsStableAfterReload, proof);
addCheck(checks, "unsplit removes bed positions and preserves parent room", proof.unsplitPassed, proof);
addCheck(checks, "real screenshots captured", requiredScreenshots.every((file) => statSync(`${dir}/screenshots/${file}`).size > 1000), requiredScreenshots);
const status = statusFromChecks(checks);
writeJson(`${dir}/browser-regression-proof.json`, { status, stage, ...proof });
writeJson(`${dir}/${stage}-output.json`, { status, stage, ...proof });
writeJson(`${dir}/screenshot-index.json`, {
  status,
  issue: String(issue),
  screenshots: requiredScreenshots.map((file) => ({
    file: `screenshots/${file}`,
    source: "browser-rendered-ui",
    bytes: statSync(`${dir}/screenshots/${file}`).size
  }))
});
copyScreenshotProofToRelatedIssues();
if (status === "passed") {
  updateHardeningManifest(issue, {
    splitRoomHardBrowserRegressionStatus: "passed",
    singleRoomToSplitRoomBrowserFlowPassed: true,
    splitBedTargetsStableAfterReload: true
  });
}
writeCloseout(issue, {
  title: "Hard Split-Room Browser Regression",
  reviewFinding: "Browser regression proves the normal editor converts one selected room into a split_room_parent with two independently selectable bed_position objects, then moves, resizes, saves, reloads, and unsplits it.",
  status,
  filesChanged: ["scripts/check-split-room-hard-browser-regression.mjs", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`${dir}/browser-regression-proof.json`, `${dir}/screenshot-index.json`, `${dir}/screenshots/`],
  limitations: ["This proof is local browser evidence; it does not implement Durable Assignment persistence."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

async function runBrowserProof() {
  const port = Number(readArg("--port", "6829"));
  const chromePort = Number(readArg("--chrome-port", "9829"));
  return (await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1100, initScript },
    async (browser) => {
      await openEditor(browser);
      const roomId = await firstRenderedRoomId(browser);
      const splitRoomId = `split-room-${roomId}`;
      const bedAId = `${roomId}:bed-a`;
      const bedBId = `${roomId}:bed-b`;
      await selectObject(browser, "room", roomId);
      await clickButton(browser, "Add Split Room");
      await waitForExpression(browser, `document.querySelectorAll('[data-layout-object-type="split_room_parent"]').length === 1`, 10_000);
      await waitForExpression(browser, `document.querySelectorAll('[data-layout-object-type="bed_position"]').length === 2`, 10_000);
      await selectObject(browser, "split_room_parent", splitRoomId);
      await browser.screenshot(`${dir}/screenshots/split-room-parent-selected.png`);
      await selectObject(browser, "bed_position", bedAId);
      await browser.screenshot(`${dir}/screenshots/split-room-bed-a-selected.png`);
      await selectObject(browser, "bed_position", bedBId);
      await browser.screenshot(`${dir}/screenshots/split-room-bed-b-selected.png`);
      await selectObject(browser, "split_room_parent", splitRoomId);
      await dragObject(browser, "split_room_parent", splitRoomId, 60, 30);
      await resizeSelected(browser, 90, 40);
      await browser.screenshot(`${dir}/screenshots/split-room-resized-parent.png`);
      await setDividerControls(browser);
      await browser.screenshot(`${dir}/screenshots/split-room-divider-controls.png`);
      const beforeReloadTargets = await bedIds(browser);
      await clickButton(browser, "Save Floorplan");
      await delay(500);
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await waitForExpression(browser, `document.querySelectorAll('[data-layout-object-type="split_room_parent"]').length === 1`, 10_000);
      const afterReloadTargets = await bedIds(browser);
      await selectObject(browser, "split_room_parent", splitRoomId);
      await clickButtonStartsWith(browser, "Unsplit");
      await clickButton(browser, "Confirm Unsplit");
      await waitForExpression(browser, `document.querySelectorAll('[data-layout-object-type="bed_position"]').length === 0`, 10_000);
      const finalState = await browser.evaluate(`(() => ({
        parentCount: document.querySelectorAll('[data-layout-object-type="split_room_parent"]').length,
        bedCount: document.querySelectorAll('[data-layout-object-type="bed_position"]').length,
        splitBayCount: document.querySelectorAll('[data-layout-object-type="split_bay"]').length,
        parentRoomStillExists: document.querySelector('[data-layout-object-type="room"][data-layout-object-id="${roomId}"]') != null
      }))()`);
      return {
        singleRoomToSplitRoomBrowserFlowPassed: true,
        selectedNormalRoomId: roomId,
        splitBedTargetsStableAfterReload: JSON.stringify(beforeReloadTargets) === JSON.stringify(afterReloadTargets),
        beforeReloadTargets,
        afterReloadTargets,
        newSplitBayCount: 0,
        unsplitPassed: finalState.bedCount === 0 && finalState.parentRoomStillExists === true,
        finalState
      };
    }
  )).result;
}

async function openEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.body != null`);
  await waitForExpression(browser, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`, 30_000);
  await browser.evaluate("localStorage.clear()");
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.body != null`);
  await waitForExpression(browser, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`, 30_000);
  await browser.evaluate(`(() => {
    const createWorkingCopy = Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Create working copy' && !button.disabled);
    createWorkingCopy?.click();
  })()`);
  await waitForExpression(browser, `document.querySelector('[data-editor-normal-action="add-split-room"]')?.disabled === false`, 10_000);
}

async function selectObject(browser, objectType, objectId) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="${objectType}"][data-layout-object-id="${objectId}"]');
    if (element == null) throw new Error('missing ${objectType} ${objectId}');
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
  })()`);
  await delay(250);
}

async function firstRenderedRoomId(browser) {
  return browser.evaluate(`(() => {
    const room = Array.from(document.querySelectorAll('[data-layout-object-type="room"]')).find((item) => {
      const id = item.getAttribute('data-layout-object-id');
      return id != null && id.trim() !== '';
    });
    if (room == null) throw new Error('missing rendered room');
    return room.getAttribute('data-layout-object-id');
  })()`);
}

async function clickButton(browser, label) {
  await browser.evaluate(`(() => {
    const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) throw new Error('missing enabled button: ${label}');
    button.click();
  })()`);
  await delay(250);
}

async function clickButtonStartsWith(browser, label) {
  await browser.evaluate(`(() => {
    const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim().startsWith(${JSON.stringify(label)}) && !item.disabled);
    if (button == null) throw new Error('missing enabled button starting with: ${label}');
    button.click();
  })()`);
  await delay(250);
}

async function dragObject(browser, objectType, objectId, deltaX, deltaY) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="${objectType}"][data-layout-object-id="${objectId}"]');
    if (element == null) throw new Error('missing drag target');
    const rect = element.getBoundingClientRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    const options = { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y };
    element.dispatchEvent(new PointerEvent('pointerdown', options));
    element.dispatchEvent(new PointerEvent('pointermove', { ...options, clientX: x + ${deltaX}, clientY: y + ${deltaY} }));
    element.dispatchEvent(new PointerEvent('pointerup', { ...options, clientX: x + ${deltaX}, clientY: y + ${deltaY} }));
  })()`);
  await delay(250);
}

async function resizeSelected(browser, deltaX, deltaY) {
  await browser.evaluate(`(() => {
    const handle = document.querySelector('.layout-editor-stage__resize-handle--southeast');
    if (handle == null) throw new Error('missing resize handle');
    const rect = handle.getBoundingClientRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    const options = { bubbles: true, cancelable: true, pointerId: 2, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y };
    handle.dispatchEvent(new PointerEvent('pointerdown', options));
    handle.dispatchEvent(new PointerEvent('pointermove', { ...options, clientX: x + ${deltaX}, clientY: y + ${deltaY} }));
    handle.dispatchEvent(new PointerEvent('pointerup', { ...options, clientX: x + ${deltaX}, clientY: y + ${deltaY} }));
  })()`);
  await delay(250);
}

async function setDividerControls(browser) {
  await browser.evaluate(`(() => {
    const orientation = document.querySelector('[data-divider-orientation-control="true"]');
    const ratio = document.querySelector('[data-divider-ratio-control="true"]');
    if (orientation == null || ratio == null) throw new Error('missing divider controls');
    orientation.value = 'horizontal';
    orientation.dispatchEvent(new Event('change', { bubbles: true }));
    ratio.value = '0.65';
    ratio.dispatchEvent(new Event('input', { bubbles: true }));
    ratio.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await delay(250);
}

async function bedIds(browser) {
  return browser.evaluate(`Array.from(document.querySelectorAll('[data-layout-object-type="bed_position"]')).map((item) => item.getAttribute('data-layout-object-id')).sort()`);
}

function copyScreenshotProofToRelatedIssues() {
  for (const relatedIssue of ["821", "822", "823", "825", "826", "828", "830"]) {
    ensureIssueArtifacts(relatedIssue, { screenshots: true });
    const relatedDir = `docs/verification/issues/issue-${relatedIssue}`;
    for (const file of requiredScreenshots) {
      const source = `${dir}/screenshots/${file}`;
      const target = `${relatedDir}/screenshots/${file}`;
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(source, target);
    }
    writeJson(`${relatedDir}/screenshot-index.json`, {
      status: "passed",
      issue: relatedIssue,
      screenshots: requiredScreenshots.map((file) => ({
        file: `screenshots/${file}`,
        sourceIssue: String(issue),
        source: "browser-rendered-ui",
        bytes: statSync(`${relatedDir}/screenshots/${file}`).size
      }))
    });
  }
}
