#!/usr/bin/env node
import { statSync } from "node:fs";
import { delay, waitForExpression, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import { addCheck, ensureIssueArtifacts, fileExcludes, fileIncludes, readArg, screenshotIndex, statusFromChecks, updateRouteManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "853");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-overlay";
const dir = `docs/verification/issues/issue-${issue}`;
const screenshots = ["route-graph-overlay-visible.png", "route-graph-overlay-warning.png"];
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);
const proof = await runBrowserProof();
const checks = [];
addCheck(checks, "overlay is optional and toggleable", proof.routeGraphOverlayVisible, proof);
addCheck(checks, "overlay shows nodes and edges", proof.routeNodeCount > 0 && proof.routeEdgeCount > 0, proof);
addCheck(checks, "unknown destinations show warning markers", proof.routeWarningMarkerCount > 0, proof);
addCheck(checks, "overlay is connectivity-only", proof.routeGraphOverlayConnectivityOnly, proof);
addCheck(checks, "source has route overlay component", fileIncludes("apps/web/src/features/layout-editor/RouteGraphOverlay.tsx", ["data-route-node", "data-route-edge", "data-route-warning-marker"]).passed);
addCheck(checks, "no travel-time or burden labels", fileExcludes("apps/web/src/features/layout-editor/RouteGraphOverlay.tsx", ["travel time", "burden", "staffing recommendation", "simulation"]).passed);
addCheck(checks, "screenshots captured", screenshots.every((file) => statSync(`${dir}/screenshots/${file}`).size > 1000), screenshots);
const status = statusFromChecks(checks);
writeJson(`${dir}/route-graph-overlay-output.json`, { status, routeGraphRendererStatus: status, ...proof });
screenshotIndex(issue, screenshots);
if (status === "passed") updateRouteManifest(issue, { routeGraphRendererStatus: "passed" });
writeCloseout(issue, {
  title: "Route Graph Visual Overlay",
  reviewFinding: "The editor has a toggleable route-connectivity overlay that renders route nodes, edges, blocked styling, and warning markers without route timing, burden, staffing, or simulation labels.",
  status,
  filesChanged: ["apps/web/src/features/layout-editor/RouteGraphOverlay.tsx", "apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "apps/web/src/features/layout-editor/LayoutEditorStage.css", "scripts/check-route-graph-overlay.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-overlay-output.json`, `${dir}/screenshot-index.json`, `${dir}/screenshots/`],
  limitations: ["Overlay visualizes connectivity only; it does not calculate best paths or timings."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

async function runBrowserProof() {
  const port = Number(readArg("--port", "6853"));
  const chromePort = Number(readArg("--chrome-port", "9853"));
  return (await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1100, initScript: unlockScript() }, async (browser) => {
    await openEditor(browser);
    await clickButtonStartsWith(browser, "Show Routes");
    await waitForExpression(browser, `document.querySelector('[data-route-graph-overlay="visible"]') != null`, 10_000);
    await browser.screenshot(`${dir}/screenshots/route-graph-overlay-visible.png`);
    await selectFirst(browser, "door");
    await showDetails(browser);
    await setDoorDestination(browser, "unknown:");
    await waitForExpression(browser, `document.querySelector('[data-route-warning-marker="true"]') != null`, 10_000);
    await browser.screenshot(`${dir}/screenshots/route-graph-overlay-warning.png`);
    return browser.evaluate(`(() => ({
      routeGraphOverlayVisible: document.querySelector('[data-route-graph-overlay="visible"]') != null,
      routeNodeCount: document.querySelectorAll('[data-route-node="true"]').length,
      routeEdgeCount: document.querySelectorAll('[data-route-edge="true"]').length,
      blockedEdgeCount: document.querySelectorAll('[data-route-edge-blocked-by-wall="true"]').length,
      routeWarningMarkerCount: document.querySelectorAll('[data-route-warning-marker="true"]').length,
      routeGraphOverlayConnectivityOnly: document.querySelector('[data-route-graph-overlay="visible"]')?.getAttribute('data-route-graph-scope') === 'connectivity_only'
        && !/travel time|burden|staffing recommendation|simulation/i.test(document.querySelector('[data-route-graph-overlay="visible"]')?.textContent ?? '')
    }))()`);
  })).result;
}

async function openEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate("localStorage.clear()");
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Create working copy' && !button.disabled)?.click()`);
  await waitForExpression(browser, `document.querySelector('[data-editor-normal-action="toggle-route-graph"]') != null`, 10_000);
}

async function clickButtonStartsWith(browser, label) {
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim().startsWith(${JSON.stringify(label)}) && !item.disabled)?.click()`);
  await delay(500);
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

function unlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}
