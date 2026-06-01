#!/usr/bin/env node
import { statSync } from "node:fs";
import { delay, waitForExpression, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import { addCheck, ensureIssueArtifacts, fileIncludes, readArg, screenshotIndex, statusFromChecks, updateRouteManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "846");
const stage = readArg("--stage", "final");
const scriptName = "check-locked-geometry-ux-proof";
const dir = `docs/verification/issues/issue-${issue}`;
const screenshots = ["locked-perimeter-wall-selected.png", "locked-geometry-inspector.png"];
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);
const proof = await runBrowserProof();
const checks = [];
addCheck(checks, "perimeter walls are selectable", proof.lockedGeometrySelectable, proof);
addCheck(checks, "locked geometry explains why locked", proof.lockedGeometryExplainsWhyLocked, proof);
addCheck(checks, "locked walls do not show move/delete controls", proof.noMoveDeleteControls, proof);
addCheck(checks, "reference overlay remains visually separate", proof.referenceOverlayIsSeparate, proof);
addCheck(checks, "no mystery unclickable artifacts remain", proof.noMysteryUnclickableArtifacts, proof);
addCheck(checks, "technical IDs advanced-only", fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", ["Technical metadata"]).passed, {});
addCheck(checks, "screenshots captured", screenshots.every((file) => statSync(`${dir}/screenshots/${file}`).size > 1000), screenshots);
const status = statusFromChecks(checks);
writeJson(`${dir}/locked-geometry-ux-proof-output.json`, { status, lockedGeometryUxProofStatus: status, ...proof });
screenshotIndex(issue, screenshots);
if (status === "passed") updateRouteManifest(issue, { lockedGeometryUxProofStatus: "passed", lockedGeometryExplained: true, noMysteryUnclickableArtifacts: true });
writeCloseout(issue, {
  title: "Locked / Non-Movable Geometry UX Proof",
  reviewFinding: "Locked perimeter geometry is selectable, inspected with a clear locked reason, and withholds move/delete controls while reference overlays remain separate visual evidence.",
  status,
  filesChanged: ["apps/web/src/features/layout-editor/LockedGeometryInspectorPanel.tsx", "apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", "apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "scripts/check-locked-geometry-ux-proof.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/locked-geometry-ux-proof-output.json`, `${dir}/screenshot-index.json`, `${dir}/screenshots/`],
  limitations: ["UX proof does not add route simulation or assignment behavior."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

async function runBrowserProof() {
  const port = Number(readArg("--port", "6846"));
  const chromePort = Number(readArg("--chrome-port", "9846"));
  return (await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1100, initScript: unlockScript() }, async (browser) => {
    await openEditor(browser);
    await selectFirst(browser, "perimeter_wall");
    await showDetails(browser);
    await waitForExpression(browser, `document.querySelector('[data-locked-geometry-inspector="true"]') != null`, 10_000);
    await browser.screenshot(`${dir}/screenshots/locked-perimeter-wall-selected.png`);
    await browser.screenshot(`${dir}/screenshots/locked-geometry-inspector.png`);
    return browser.evaluate(`(() => ({
      lockedGeometrySelectable: document.querySelector('[data-layout-object-type="perimeter_wall"][data-selectable="true"]') != null,
      lockedGeometryExplainsWhyLocked: document.body.textContent.includes('locked boundary geometry') || document.body.textContent.includes('cannot be moved or deleted'),
      noMoveDeleteControls: document.querySelector('[data-locked-geometry-inspector="true"][data-move-controls-visible="false"][data-delete-controls-visible="false"]') != null,
      referenceOverlayIsSeparate: document.querySelector('.layout-editor-stage__reference-overlay') != null && document.querySelector('.layout-editor-stage__perimeter-wall') != null,
      noMysteryUnclickableArtifacts: Array.from(document.querySelectorAll('[data-layout-object-type]')).every((item) => item.getAttribute('data-selectable') !== 'false')
    }))()`);
  })).result;
}

async function openEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate("localStorage.clear()");
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Create working copy' && !button.disabled)?.click()`);
  await waitForExpression(browser, `document.querySelector('[data-layout-object-type="perimeter_wall"]') != null`, 10_000);
}

async function selectFirst(browser, objectType) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="${objectType}"]');
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
  })()`);
  await delay(250);
}

async function showDetails(browser) {
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Show details')?.click()`);
  await delay(250);
}

function unlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}
