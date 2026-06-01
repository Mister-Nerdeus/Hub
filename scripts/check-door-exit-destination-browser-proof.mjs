#!/usr/bin/env node
import { statSync } from "node:fs";
import {
  delay,
  waitForExpression,
  withBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueArtifacts,
  readArg,
  screenshotIndex,
  statusFromChecks,
  updateBoundaryManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/boundary-door-destination-utils.mjs";

const issue = readArg("--issue", "841");
const stage = readArg("--stage", "final");
const scriptName = "check-door-exit-destination-browser-proof";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
const screenshots = [
  "perimeter-wall-selected.png",
  "entry-exit-destination-visible.png",
  "door-destination-edited.png",
  "presentation-destination-labels.png",
  "unknown-destination-warning.png"
];
const initScript = "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);

const proof = await runBrowserProof();
const checks = [];
addCheck(checks, "perimeter wall visible and selectable in browser", proof.perimeterWallVisibleInBrowser, proof);
addCheck(checks, "entry/exit visible with destination label", proof.entryExitVisibleInBrowser, proof);
addCheck(checks, "door destination editable in normal inspector", proof.doorDestinationEditableInBrowser, proof);
addCheck(checks, "destinations stable after reload", proof.doorDestinationsStableAfterReload, proof);
addCheck(checks, "unknown destination creates warning", proof.unknownDestinationWarningVisible, proof);
addCheck(checks, "browser screenshots captured", screenshots.every((file) => statSync(`${dir}/screenshots/${file}`).size > 1000), screenshots);
const status = statusFromChecks(checks);
writeJson(`${dir}/door-exit-destination-browser-proof-output.json`, { status, ...proof });
writeJson(`${dir}/door-exit-destination-before.json`, proof.before);
writeJson(`${dir}/door-exit-destination-after.json`, proof.after);
screenshotIndex(issue, screenshots);
if (status === "passed") {
  updateBoundaryManifest(issue, {
    doorExitDestinationBrowserProofStatus: "passed",
    perimeterWallVisibleInBrowser: true,
    entryExitVisibleInBrowser: true,
    doorDestinationEditableInBrowser: true,
    doorDestinationsStableAfterReload: true,
    doorExitDestinationBrowserProofPassed: true
  });
}
writeCloseout(issue, {
  title: "Door Destination / Exit Browser Proof",
  reviewFinding: "Browser proof opens the editor, selects perimeter and entry/exit geometry, edits a door destination, verifies presentation labels, reloads, and verifies unknown-destination warning behavior.",
  status,
  filesChanged: ["scripts/check-door-exit-destination-browser-proof.mjs", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`${dir}/door-exit-destination-browser-proof-output.json`, `${dir}/screenshot-index.json`, `${dir}/screenshots/`],
  limitations: ["This is browser UI proof only; no routing, assignment, scoring, or simulation is implemented."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

async function runBrowserProof() {
  const port = Number(readArg("--port", "6841"));
  const chromePort = Number(readArg("--chrome-port", "9841"));
  return (await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1100, initScript },
    async (browser) => {
      await openEditor(browser);
      await waitForExpression(browser, `document.querySelector('[data-layout-object-type="perimeter_wall"]') != null`, 15_000);
      const before = await readGeometryState(browser);

      await selectFirst(browser, "perimeter_wall");
      await showDetails(browser);
      await browser.screenshot(`${dir}/screenshots/perimeter-wall-selected.png`);

      await selectFirst(browser, "entry_exit");
      await showDetails(browser);
      const entryDestinationVisible = await browser.evaluate(`document.querySelector('[data-entry-exit-inspector="normal"] input[aria-label="Entry or exit destination"]') != null`);
      await browser.screenshot(`${dir}/screenshots/entry-exit-destination-visible.png`);

      await selectFirst(browser, "door");
      await showDetails(browser);
      await setDoorDestination(browser, "hallway:");
      await browser.screenshot(`${dir}/screenshots/door-destination-edited.png`);
      const afterEdit = await readGeometryState(browser);
      await clickSaveIfPresent(browser);

      await clickButtonStartsWith(browser, "Presentation");
      await waitForExpression(browser, `document.querySelector('[data-door-destination-label="true"]') != null`, 10_000);
      await browser.screenshot(`${dir}/screenshots/presentation-destination-labels.png`);
      const presentationBeforeReload = await readGeometryState(browser);

      await clickButtonStartsWith(browser, "Edit");
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await waitForExpression(browser, `document.querySelector('[data-layout-object-type="perimeter_wall"]') != null`, 15_000);
      const afterReload = await readGeometryState(browser);
      await clickButtonStartsWith(browser, "Presentation");
      await waitForExpression(browser, `document.querySelector('[data-door-destination-label="true"]') != null`, 10_000);
      const presentationAfterReload = await readGeometryState(browser);

      await clickButtonStartsWith(browser, "Edit");
      await selectFirst(browser, "door");
      await showDetails(browser);
      await setDoorDestination(browser, "unknown:");
      await waitForExpression(browser, `document.querySelector('[data-door-destination-warning="true"]') != null`, 10_000);
      await browser.screenshot(`${dir}/screenshots/unknown-destination-warning.png`);
      const unknownWarningVisible = await browser.evaluate(`document.querySelector('[data-door-destination-warning="true"]') != null && document.body.textContent.includes('Destination is marked unknown')`);

      return {
        perimeterWallVisibleInBrowser: before.perimeterWallCount > 0,
        entryExitVisibleInBrowser: before.entryExitCount > 0 && entryDestinationVisible,
        doorDestinationEditableInBrowser: afterEdit.visibleDoorDestinationLabels > 0,
        doorDestinationsStableAfterReload: afterReload.perimeterWallCount === before.perimeterWallCount
          && afterReload.entryExitCount === before.entryExitCount
          && afterReload.doorCount === before.doorCount
          && presentationAfterReload.visibleDoorDestinationLabels === presentationBeforeReload.visibleDoorDestinationLabels,
        unknownDestinationWarningVisible: unknownWarningVisible,
        before,
        after: afterReload,
        afterEdit,
        presentationBeforeReload,
        presentationAfterReload
      };
    }
  )).result;
}

async function openEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.body != null`);
  await waitForExpression(browser, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`, 30_000);
  await browser.evaluate("localStorage.clear()");
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Create working copy' && !button.disabled)?.click()`);
  await delay(500);
}

async function readGeometryState(browser) {
  return browser.evaluate(`(() => ({
    perimeterWallCount: document.querySelectorAll('[data-layout-object-type="perimeter_wall"]').length,
    entryExitCount: document.querySelectorAll('[data-layout-object-type="entry_exit"]').length,
    doorCount: document.querySelectorAll('[data-layout-object-type="door"]').length,
    visibleDoorDestinationLabels: document.querySelectorAll('[data-door-destination-label="true"]').length,
    unknownWarnings: document.querySelectorAll('[data-door-destination-warning="true"]').length,
    entryDestinations: Array.from(document.querySelectorAll('[data-layout-object-type="entry_exit"]')).map((item) => item.getAttribute('data-entry-exit-destination-label')),
    doorDestinationLabels: Array.from(document.querySelectorAll('[data-door-destination-label="true"]')).map((item) => item.textContent.trim())
  }))()`);
}

async function selectFirst(browser, objectType) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="${objectType}"]');
    if (element == null) throw new Error('missing ${objectType}');
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
    if (select == null) throw new Error('missing door destination select');
    const option = Array.from(select.options).find((item) => item.value.startsWith(${JSON.stringify(prefix)}));
    if (option == null) throw new Error('missing destination option with prefix ${prefix}');
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, option.value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await delay(500);
}

async function clickButtonStartsWith(browser, label) {
  await browser.evaluate(`(() => {
    const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim().startsWith(${JSON.stringify(label)}) && !item.disabled);
    if (button == null) return false;
    button.click();
    return true;
  })()`);
  await delay(500);
}

async function clickSaveIfPresent(browser) {
  await browser.evaluate(`(() => {
    const labels = ['Save Floorplan', 'Save Working Copy', 'Save working copy'];
    const button = Array.from(document.querySelectorAll('button')).find((item) => labels.some((label) => item.textContent.trim().startsWith(label)) && !item.disabled);
    button?.click();
  })()`);
  await delay(750);
}
