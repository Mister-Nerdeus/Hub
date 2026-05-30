#!/usr/bin/env node
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";
import {
  delay,
  waitForExpression,
  readEditorRuntimeState,
  buildRuntimeProofSummary,
  withBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";
import {
  ensureIssueDirs,
  readArg,
  writeJson
} from "./lib/editor-runtime-save-ux-layout-batch-utils.mjs";

const issue = readArg("--issue", "650");
const dir = `docs/verification/issues/issue-${issue}`;
const initScript =
  "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
const captured = [];
const batchMarker = "641-650-editor-runtime-save-layout";

for (const evidenceIssue of ["641", "642", "643", "644", "645", "648", "649", "650"]) {
  ensureIssueDirs(evidenceIssue);
}

await captureDesktopEvidence();
await captureLaptopEvidence();
await captureSmallViewportEvidence();

writeJson(`${dir}/browser-screenshot-evidence-output.json`, {
  status: "passed",
  captured
});
console.log(JSON.stringify({ status: "passed", captured }, null, 2));

async function captureDesktopEvidence() {
  const port = Number(readArg("--port", "6850"));
  const chromePort = Number(readArg("--chrome-port", "9850"));
  await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1100, initScript },
    async (browser) => {
      await openFreshEditor(browser);
      const state = await readEditorRuntimeState(browser);
      writeJson(`${dir}/fresh-runtime-proof-summary.json`, buildRuntimeProofSummary(state, {
        proofType: "fresh-runtime",
        baseUrl: `http://127.0.0.1:${port}`,
        port,
        batchMarker
      }));
      await browser.screenshot(`${dir}/screenshots/fresh-runtime-proof.png`);
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-641/screenshots/runtime-build-info.png",
        "docs/verification/issues/issue-650/screenshots/runtime-build-info.png",
        "docs/verification/issues/issue-650/screenshots/runtime-build-info-visible.png"
      ]);
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-642/screenshots/expected-save-controls-visible.png",
        "docs/verification/issues/issue-643/screenshots/redesigned-command-bar.png",
        "docs/verification/issues/issue-644/screenshots/canonical-default-warning.png",
        "docs/verification/issues/issue-650/screenshots/expected-save-controls-visible.png",
        "docs/verification/issues/issue-650/screenshots/redesigned-command-bar.png",
        "docs/verification/issues/issue-650/screenshots/save-controls-visible.png",
        "docs/verification/issues/issue-650/screenshots/canonical-default-warning.png"
      ]);

      await clickButton(browser, "Save Working Copy");
      await waitForExpression(
        browser,
        `document.querySelector('[data-editor-save-status-panel="true"]')?.innerText.includes('Saved working copy')`,
        10_000
      );
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-644/screenshots/active-copy-save-status.png",
        "docs/verification/issues/issue-645/screenshots/truthful-save-language-saved.png",
        "docs/verification/issues/issue-650/screenshots/active-copy-save-status.png",
        "docs/verification/issues/issue-650/screenshots/truthful-save-language-saved.png"
      ]);

      await dragRoom(browser, "room-02", 144, 72);
      await waitForExpression(
        browser,
        `document.querySelector('[data-editor-save-status-panel="true"]')?.innerText.includes('Local editor state: changed')`,
        10_000
      );
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-645/screenshots/truthful-save-language-unsaved.png",
        "docs/verification/issues/issue-650/screenshots/truthful-save-language-unsaved.png"
      ]);

      await clickButton(browser, "Save Working Copy");
      await waitForExpression(
        browser,
        `document.querySelector('[data-editor-save-status-panel="true"]')?.innerText.includes('Local editor state: unchanged')`,
        10_000
      );
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-648/screenshots/canvas-height-desktop.png",
        "docs/verification/issues/issue-650/screenshots/canvas-height-desktop.png",
        "docs/verification/issues/issue-650/screenshots/final-editor-ready-proof.png"
      ]);

      await selectObject(browser, "room", "room-02");
      await waitForExpression(browser, `document.querySelector('[data-room-quick-edit="ready"]') != null`, 10_000);
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-649/screenshots/popup-auto-clamped.png",
        "docs/verification/issues/issue-650/screenshots/popup-auto-clamped.png"
      ]);

      await clickButton(browser, "Docked");
      await waitForExpression(browser, `document.querySelector('[data-popup-docked-panel="true"]') != null`, 10_000);
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-649/screenshots/popup-docked.png",
        "docs/verification/issues/issue-650/screenshots/popup-docked.png"
      ]);

      await clickButton(browser, "Hide inspector");
      await waitForExpression(
        browser,
        `document.querySelector('[data-inspector-state="collapsed"]') != null`,
        10_000
      );
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-648/screenshots/canvas-height-inspector-collapsed.png",
        "docs/verification/issues/issue-650/screenshots/canvas-height-inspector-collapsed.png"
      ]);

      await openFreshEditor(browser);
      await browser.evaluate(`(() => {
        document.querySelectorAll('[data-editor-control="save-working-copy"], [data-editor-control="save-as-new-copy"]').forEach((node) => node.remove());
      })()`);
      await waitForExpression(browser, `document.querySelector('[data-runtime-mismatch-banner="true"]') != null`, 10_000);
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-642/screenshots/stale-runtime-warning.png",
        "docs/verification/issues/issue-650/screenshots/stale-runtime-warning.png",
        "docs/verification/issues/issue-650/screenshots/runtime-mismatch-warning.png"
      ]);
    }
  );
}

async function captureLaptopEvidence() {
  const port = Number(readArg("--laptop-port", "6851"));
  const chromePort = Number(readArg("--laptop-chrome-port", "9851"));
  await withBrowserRenderedApp(
    { port, chromePort, width: 1100, height: 900, initScript },
    async (browser) => {
      await openFreshEditor(browser);
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-648/screenshots/canvas-height-laptop.png",
        "docs/verification/issues/issue-650/screenshots/canvas-height-laptop.png"
      ]);
    }
  );
}

async function captureSmallViewportEvidence() {
  const port = Number(readArg("--small-port", "6852"));
  const chromePort = Number(readArg("--small-chrome-port", "9852"));
  await withBrowserRenderedApp(
    { port, chromePort, width: 760, height: 900, initScript },
    async (browser) => {
      await openFreshEditor(browser);
      await clickButton(browser, "Save Working Copy");
      await waitForExpression(browser, `document.querySelector('[data-editor-save-status-panel="true"]')?.innerText.includes('Saved working copy')`, 10_000);
      await selectObject(browser, "room", "room-02");
      await waitForExpression(browser, `document.querySelector('[data-room-quick-edit="ready"], [data-popup-docked-panel="true"]') != null`, 10_000);
      await saveScreenshot(browser, [
        "docs/verification/issues/issue-649/screenshots/popup-small-viewport.png",
        "docs/verification/issues/issue-650/screenshots/popup-small-viewport.png"
      ]);
    }
  );
}

async function openFreshEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-runtime-build-info="true"]') != null`);
  await browser.evaluate("localStorage.clear()");
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await waitForExpression(
    browser,
    `document.querySelector('[data-runtime-build-info="true"]')?.getAttribute('data-batch-marker') === '641-650-editor-runtime-save-layout'`,
    10_000
  );
}

async function saveScreenshot(browser, paths) {
  const [first, ...rest] = paths;
  await browser.screenshot(first);
  remember(first);
  for (const path of rest) {
    mkdirSync(dirname(path), { recursive: true });
    copyFileSync(first, path);
    remember(path);
  }
}

function remember(path) {
  captured.push({ path, bytes: statSync(path).size });
}

async function clickButton(browser, label) {
  await browser.evaluate(`(() => {
    const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) throw new Error('missing enabled button: ${label}');
    button.click();
  })()`);
  await delay(250);
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

async function dragRoom(browser, roomId, deltaX, deltaY) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="room"][data-layout-object-id="${roomId}"]');
    if (element == null) throw new Error('missing room ${roomId}');
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
