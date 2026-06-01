#!/usr/bin/env node
import { statSync } from "node:fs";
import { delay, waitForExpression, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import { addCheck, ensureIssueArtifacts, readArg, screenshotIndex, statusFromChecks, updateRouteManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "855");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-browser-proof";
const dir = `docs/verification/issues/issue-${issue}`;
const screenshots = ["route-browser-initial-geometry.png", "route-browser-overlay.png", "route-browser-unknown-warning.png", "route-browser-after-reload.png"];
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);
const proof = await runBrowserProof();
const checks = [];
addCheck(checks, "browser verifies perimeter wall, entry/exit, and door destinations", proof.perimeterWallVisible && proof.entryExitVisible && proof.doorDestinationsVisible, proof);
addCheck(checks, "browser verifies route nodes and edges", proof.routeGraphVisibleInBrowser, proof);
addCheck(checks, "browser verifies warnings", proof.warningVisible, proof);
addCheck(checks, "browser save/reload stability", proof.routeGraphStableAfterReload, proof);
addCheck(checks, "browser rejects simulation output", proof.routeGraphDoesNotShowSimulationResults, proof);
addCheck(checks, "screenshots captured", screenshots.every((file) => statSync(`${dir}/screenshots/${file}`).size > 1000), screenshots);
const status = statusFromChecks(checks);
writeJson(`${dir}/route-graph-browser-proof-output.json`, { status, routeGraphBrowserProofStatus: status, ...proof });
writeJson(`${dir}/route-graph-browser-trace.json`, { status, steps: proof.steps });
writeJson(`${dir}/route-graph-before.json`, proof.before);
writeJson(`${dir}/route-graph-after.json`, proof.after);
writeJson(`${dir}/route-node-edge-stability-proof.json`, proof.stability);
screenshotIndex(issue, screenshots);
if (status === "passed") updateRouteManifest(issue, { routeGraphBrowserProofStatus: "passed" });
writeCloseout(issue, {
  title: "Route Graph Browser Proof",
  reviewFinding: "Browser proof opens the editor, verifies physical geometry, toggles route connectivity, verifies nodes/edges/warnings, changes one door to unknown, saves/reloads, and confirms stable route IDs with no simulation output.",
  status,
  filesChanged: ["scripts/check-route-graph-browser-proof.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-browser-proof-output.json`, `${dir}/route-graph-browser-trace.json`, `${dir}/screenshot-index.json`, `${dir}/screenshots/`],
  limitations: ["Browser proof validates connectivity overlay behavior only."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

async function runBrowserProof() {
  const port = Number(readArg("--port", "6855"));
  const chromePort = Number(readArg("--chrome-port", "9855"));
  return (await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1100, initScript: unlockScript() }, async (browser) => {
    await openEditor(browser);
    await waitForExpression(browser, `document.querySelector('[data-layout-object-type="perimeter_wall"]') != null`, 10_000);
    await selectFirst(browser, "door");
    await waitForExpression(browser, `document.querySelector('[data-door-destination-label="true"]') != null`, 10_000);
    const initial = await browser.evaluate(stateExpression());
    await browser.screenshot(`${dir}/screenshots/route-browser-initial-geometry.png`);
    await clickButtonStartsWith(browser, "Show Routes");
    await waitForExpression(browser, `document.querySelectorAll('[data-route-node="true"]').length > 0 && document.querySelectorAll('[data-route-edge="true"]').length > 0`, 10_000);
    const before = await routeState(browser);
    await browser.screenshot(`${dir}/screenshots/route-browser-overlay.png`);
    await selectFirst(browser, "door");
    await showDetails(browser);
    await setDoorDestination(browser, "unknown:");
    await waitForExpression(browser, `document.querySelector('[data-door-destination-warning="true"], [data-route-warning-marker="true"]') != null`, 15_000);
    const warningBeforeReload = await routeState(browser);
    await browser.screenshot(`${dir}/screenshots/route-browser-unknown-warning.png`);
    await clickSaveIfPresent(browser);
    await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
    await clickButtonStartsWith(browser, "Show Routes");
    await waitForExpression(browser, `document.querySelectorAll('[data-route-node="true"]').length > 0`, 10_000);
    const after = await routeState(browser);
    await browser.screenshot(`${dir}/screenshots/route-browser-after-reload.png`);
    const stability = {
      beforeNodeIds: before.nodeIds,
      afterNodeIds: after.nodeIds,
      beforeEdgeIds: before.edgeIds,
      afterEdgeIds: after.edgeIds,
      routeNodesStableAfterReload: JSON.stringify(before.nodeIds) === JSON.stringify(after.nodeIds),
      routeEdgesStableAfterReload: JSON.stringify(before.edgeIds) === JSON.stringify(after.edgeIds)
    };
    return {
      perimeterWallVisible: initial.perimeterWallCount > 0,
      entryExitVisible: initial.entryExitCount > 0,
      doorDestinationsVisible: initial.doorDestinationLabelCount > 0,
      routeGraphVisibleInBrowser: before.nodeIds.length > 0 && before.edgeIds.length > 0,
      warningVisible: warningBeforeReload.warningCount > 0,
      routeGraphStableAfterReload: stability.routeNodesStableAfterReload && stability.routeEdgesStableAfterReload,
      routeGraphDoesNotShowSimulationResults: await browser.evaluate(`!/simulation result|travel time|burden score|staffing recommendation/i.test(document.body.textContent)`),
      before,
      after,
      stability,
      steps: ["open editor", "verify geometry", "toggle route overlay", "verify nodes and edges", "set door unknown", "verify warning", "save reload", "verify stable ids"]
    };
  })).result;
}

function stateExpression() {
  return `(() => ({
    perimeterWallCount: document.querySelectorAll('[data-layout-object-type="perimeter_wall"]').length,
    entryExitCount: document.querySelectorAll('[data-layout-object-type="entry_exit"]').length,
    doorDestinationLabelCount: document.querySelectorAll('[data-door-destination-label="true"]').length,
    warningCount: document.querySelectorAll('[data-route-warning-marker="true"], [data-door-destination-warning="true"]').length
  }))()`;
}

async function routeState(browser) {
  return browser.evaluate(`(() => ({
    nodeIds: Array.from(document.querySelectorAll('[data-route-node="true"]')).map((item) => item.getAttribute('data-route-node-id')).sort(),
    edgeIds: Array.from(document.querySelectorAll('[data-route-edge="true"]')).map((item) => item.getAttribute('data-route-edge-id')).sort(),
    warningCount: document.querySelectorAll('[data-route-warning-marker="true"], [data-door-destination-warning="true"]').length
  }))()`);
}

async function openEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate("localStorage.clear()");
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Create working copy' && !button.disabled)?.click()`);
  await waitForExpression(browser, `document.querySelector('[data-layout-object-type="door"]') != null`, 10_000);
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

async function setDoorDestination(browser, prefix) {
  await browser.evaluate(`(() => {
    const select = document.querySelector('[data-door-destination-inspector="normal"] select');
    const option = Array.from(select.options).find((item) => item.value.startsWith(${JSON.stringify(prefix)}));
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, option.value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await delay(500);
}

async function clickButtonStartsWith(browser, label) {
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim().startsWith(${JSON.stringify(label)}) && !item.disabled)?.click()`);
  await delay(500);
}

async function clickSaveIfPresent(browser) {
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim().startsWith('Save Floorplan') && !item.disabled)?.click()`);
  await delay(750);
}

function unlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}
