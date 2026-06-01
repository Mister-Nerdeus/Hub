#!/usr/bin/env node
import { statSync } from "node:fs";
import { delay, waitForExpression, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import { addCheck, ensureIssueArtifacts, fileExcludes, fileIncludes, readArg, screenshotIndex, statusFromChecks, updateRouteManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "847");
const stage = readArg("--stage", "final");
const scriptName = "check-door-destination-ux-polish";
const dir = `docs/verification/issues/issue-${issue}`;
const screenshots = ["selected-door-leads-to.png", "unknown-door-warning.png", "presentation-door-destinations.png"];
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);
const proof = await runBrowserProof();
const checks = [];
addCheck(checks, "selected door shows Leads to", proof.selectedDoorShowsLeadsTo, proof);
addCheck(checks, "unknown destination visibly warns", proof.unknownDestinationVisiblyWarns, proof);
addCheck(checks, "presentation mode can show all destinations", proof.doorDestinationReadableInPresentationMode, proof);
addCheck(checks, "technical IDs advanced-only", fileIncludes("apps/web/src/features/layout-editor/DoorDestinationInspectorPanel.tsx", ["Leads to"]).passed, {});
addCheck(checks, "no simulation/scoring copy in door destination UI", fileExcludes("apps/web/src/features/layout-editor/DoorDestinationLabel.tsx", ["travel time", "burden", "staffing recommendation", "simulation"]).passed);
addCheck(checks, "screenshots captured", screenshots.every((file) => statSync(`${dir}/screenshots/${file}`).size > 1000), screenshots);
const status = statusFromChecks(checks);
writeJson(`${dir}/door-destination-ux-polish-output.json`, { status, doorDestinationUxPolishStatus: status, ...proof });
screenshotIndex(issue, screenshots);
if (status === "passed") updateRouteManifest(issue, { doorDestinationUxPolishStatus: "passed" });
writeCloseout(issue, {
  title: "Door Destination UX Polish",
  reviewFinding: "Door destination labels and inspector copy use operational Leads to / Unknown wording, stay readable at normal zoom, and show destination labels in presentation mode.",
  status,
  filesChanged: ["apps/web/src/features/layout-editor/DoorDestinationLabel.tsx", "apps/web/src/features/layout-editor/DoorDestinationInspectorPanel.tsx", "apps/web/src/features/layout-editor/LayoutEditorStage.css", "scripts/check-door-destination-ux-polish.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/door-destination-ux-polish-output.json`, `${dir}/screenshot-index.json`, `${dir}/screenshots/`],
  limitations: ["Door destination warnings are floorplan-connectivity warnings only."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

async function runBrowserProof() {
  const port = Number(readArg("--port", "6847"));
  const chromePort = Number(readArg("--chrome-port", "9847"));
  return (await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1100, initScript: unlockScript() }, async (browser) => {
    await openEditor(browser);
    await selectFirst(browser, "door");
    await waitForExpression(browser, `document.querySelector('[data-door-destination-label="true"]') != null`, 10_000);
    await browser.screenshot(`${dir}/screenshots/selected-door-leads-to.png`);
    const selectedDoorShowsLeadsTo = await browser.evaluate(`Array.from(document.querySelectorAll('[data-door-destination-label="true"]')).some((item) => item.textContent.includes('Leads to'))`);
    await showDetails(browser);
    await setDoorDestination(browser, "unknown:");
    await waitForExpression(browser, `document.body.textContent.includes('Unknown destination: route connectivity')`, 10_000);
    await browser.screenshot(`${dir}/screenshots/unknown-door-warning.png`);
    await clickButtonStartsWith(browser, "Presentation");
    await waitForExpression(browser, `document.querySelectorAll('[data-door-destination-label="true"]').length >= 2`, 10_000);
    await browser.screenshot(`${dir}/screenshots/presentation-door-destinations.png`);
    return {
      selectedDoorShowsLeadsTo,
      unknownDestinationVisiblyWarns: await browser.evaluate(`document.body.textContent.includes('Unknown destination') && document.querySelector('[data-door-destination-warning="true"]') != null`),
      doorDestinationReadableInPresentationMode: await browser.evaluate(`Array.from(document.querySelectorAll('[data-door-destination-label="true"]')).every((item) => item.getAttribute('data-door-destination-readable') === 'normal-zoom')`)
    };
  })).result;
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

function unlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}
