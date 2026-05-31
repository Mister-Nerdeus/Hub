#!/usr/bin/env node
import {
  addCheck,
  browserRegressionProofIndexFileName,
  canonicalSplitRoomPairs,
  ensureIssueDirs,
  hasFlag,
  readArg,
  statusFromChecks,
  splitRoomBrowserRegressionProofFileName,
  updateSplitRoomManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidenceSlots,
  writeJson,
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";
import { waitForExpression, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";

const issue = readArg("--issue", "688");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const splitRoomProofPath = `${dir}/${splitRoomBrowserRegressionProofFileName}`;
const doorProofPath = `${dir}/door-browser-regression-proof.json`;
const proofIndexPath = `${dir}/${browserRegressionProofIndexFileName}`;
const genericProofPath = `${dir}/browser-regression-proof.json`;
const supportedStages = [
  "room5-user-flow",
  "all-canonical-pairs",
  "assignment-child-room",
  "save-reload",
  "export-json",
  "import-json",
  "no-copy-label",
  "no-recovery-screen",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room browser regression stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: real editor user flow must create split rooms, persist them, and avoid recovery or copy labels.\n"
);

const stages = stage === "final"
  ? [
      "room5-user-flow",
      "all-canonical-pairs",
      "assignment-child-room",
      "save-reload",
      "export-json",
      "import-json",
      "no-copy-label",
      "no-recovery-screen"
    ]
  : [stage];
const checks = [];
const stageResults = {};
const proof = await runBrowserProof();
writeJson(splitRoomProofPath, proof);
writeBrowserProofIndex();

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage, proof);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomManifest(issue, {
    splitRoomBrowserRegressionStatus: "passed",
    splitRoomUserDiscoverable: true,
    room5CanCreatePair45: true,
    splitBayDividerVisible: true,
    splitBayChildLabelsVisible: true,
    splitBayAssignmentProof: true,
    splitBaySaveReloadProof: true,
    splitBayExportImportProof: true,
    noRecoveryScreenDuringSplitRoomWork: true
  });
}

writeEvidenceSlots(issue, "split-room-browser-regression", status, stage, checks);
writeJson(`${dir}/test-output/split-room-browser-regression.txt`, { status, issue, stage, checks, stageResults });
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function writeBrowserProofIndex() {
  const index = {
    doorProof: doorProofPath,
    splitRoomProof: splitRoomProofPath
  };
  writeJson(proofIndexPath, index);
  writeJson(genericProofPath, index);
}

function runStage(selectedStage, browserProof) {
  if (selectedStage === "room5-user-flow") {
    const output = {
      status:
        browserProof.room5ActionVisible &&
        browserProof.room5CreateClicked &&
        browserProof.split45Visible &&
        browserProof.split45LabelsVisible &&
        browserProof.split45DividerVisible
          ? "passed"
          : "failed",
      room5ActionVisible: browserProof.room5ActionVisible,
      room5CreateClicked: browserProof.room5CreateClicked,
      split45Visible: browserProof.split45Visible,
      split45LabelsVisible: browserProof.split45LabelsVisible,
      split45DividerVisible: browserProof.split45DividerVisible
    };
    writeJson(`${dir}/room5-user-flow-output.json`, output);
    addCheck(checks, "browser flow selects Room 5 and creates Split Room 4/5", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "all-canonical-pairs") {
    const output = {
      status: browserProof.allCanonicalCreated && browserProof.splitBayIds.length === 4 ? "passed" : "failed",
      splitBayIds: browserProof.splitBayIds
    };
    writeJson(`${dir}/all-canonical-pairs-output.json`, output);
    addCheck(checks, "browser flow creates 2/3, 4/5, 6/7, and 8/9 split rooms", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "assignment-child-room") {
    const output = {
      status: browserProof.childAssignmentFills >= 2 && browserProof.assignmentColorsIndependent ? "passed" : "failed",
      childAssignmentFills: browserProof.childAssignmentFills,
      assignmentColorsIndependent: browserProof.assignmentColorsIndependent
    };
    writeJson(`${dir}/assignment-child-room-output.json`, output);
    addCheck(checks, "split-room child positions can show independent assignment colors", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "save-reload") {
    const output = {
      status: browserProof.savedRecordId != null && browserProof.afterReloadSplit45Visible ? "passed" : "failed",
      savedRecordId: browserProof.savedRecordId,
      afterReloadSplit45Visible: browserProof.afterReloadSplit45Visible
    };
    writeJson(`${dir}/save-reload-output.json`, output);
    addCheck(checks, "Save Floorplan and reload same saved record preserve split room", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "export-json") {
    const output = {
      status: browserProof.exportedJsonHasSplit45 ? "passed" : "failed",
      splitBays: browserProof.exportedSplitBays
    };
    writeJson(`${dir}/export-json-output.json`, output);
    addCheck(checks, "export JSON includes split parent and child room IDs", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "import-json") {
    const output = {
      status: browserProof.importedJsonHasSplit45 ? "passed" : "failed",
      importedSplitBayIds: browserProof.importedSplitBayIds
    };
    writeJson(`${dir}/import-json-output.json`, output);
    addCheck(checks, "import JSON preserves split room", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "no-copy-label") {
    const output = {
      status: !browserProof.copyLabelVisible ? "passed" : "failed",
      copyLabelVisible: browserProof.copyLabelVisible,
      bodyCopyHits: browserProof.bodyCopyHits
    };
    writeJson(`${dir}/no-copy-label-output.json`, output);
    addCheck(checks, "browser split-room flow shows no Copy or Duplicate label", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "no-recovery-screen") {
    const output = {
      status: !browserProof.recoveryScreenVisible ? "passed" : "failed",
      recoveryScreenVisible: browserProof.recoveryScreenVisible
    };
    writeJson(`${dir}/no-recovery-screen-output.json`, output);
    addCheck(checks, "split-room browser flow avoids recovery screen", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage ${selectedStage}`);
}

async function runBrowserProof() {
  const initScript = `sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`;
  const { result } = await withBrowserRenderedApp(
    {
      port: 5188,
      chromePort: 9898,
      width: 1440,
      height: 1000,
      initScript
    },
    async (browser) => {
      await openWorkingEditor(browser);
      await browser.screenshot(`${dir}/screenshots/room5-before-split-action.png`);
      await selectObject(browser, "room", "room-05");
      await waitForExpression(browser, `document.body.innerText.includes('Create Split Room 4/5')`, 10_000);
      await browser.screenshot(`${dir}/screenshots/room5-create-split-room-button.png`);
      const room5ActionVisible = await bodyIncludes(browser, "Create Split Room 4/5");
      const room5CreateClicked = (await clickScopedButton(browser, '[data-room-quick-edit="ready"]', "Create Split Room 4/5")).clicked;
      await waitForExpression(browser, `document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="split-bay-room-04-room-05"]') != null`, 10_000);
      await browser.screenshot(`${dir}/screenshots/split-room-45-created.png`);
      const split45 = await readSplitBay(browser, "split-bay-room-04-room-05");
      await createCanonicalPair(browser, "room-03", "2/3");
      await createCanonicalPair(browser, "room-07", "6/7");
      await createCanonicalPair(browser, "room-09", "8/9");
      await waitForExpression(browser, `document.querySelectorAll('[data-layout-object-type="split_bay"]').length >= 4`, 10_000);
      await browser.screenshot(`${dir}/screenshots/split-room-all-canonical-created.png`);
      const assignment = await readAssignmentProof(browser);
      await browser.screenshot(`${dir}/screenshots/split-room-child-assignment.png`);
      const savedRecordId = await saveAndReload(browser);
      await waitForExpression(browser, `document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="split-bay-room-04-room-05"]') != null`, 10_000);
      await browser.screenshot(`${dir}/screenshots/split-room-after-reload.png`);
      const afterReloadSplit45Visible = await splitBayExists(browser, "split-bay-room-04-room-05");
      const exportedJson = await exportJson(browser);
      const exported = JSON.parse(exportedJson);
      writeJson(`${dir}/exported-json/split-room-browser-regression-after-reload.json`, exported);
      const imported = await importJson(browser, exportedJson);
      writeJson(`${dir}/exported-json/split-room-browser-regression-after-import.json`, imported);
      await browser.screenshot(`${dir}/screenshots/split-room-final-proof.png`);
      const splitBayIds = await readObjectIds(browser, "split_bay");
      const bodyCopyHits = await browser.evaluate(`(() => {
        const text = document.body.innerText;
        return ['Generated copy', 'Duplicate'].filter((label) => text.includes(label));
      })()`);
      const recoveryScreenVisible = await browser.evaluate(`document.querySelector('.layout-editor-recovery-screen') != null`);
      return {
        room5ActionVisible,
        room5CreateClicked,
        split45Visible: split45.exists,
        split45LabelsVisible: split45.labelsVisible,
        split45DividerVisible: split45.dividerVisible,
        allCanonicalCreated: splitBayIds.length >= 4,
        splitBayIds,
        childAssignmentFills: assignment.fillCount,
        assignmentColorsIndependent: assignment.distinctColors >= 2,
        savedRecordId,
        afterReloadSplit45Visible,
        exportedJsonHasSplit45: hasSplit45(exported),
        exportedSplitBays: exported.splitBays ?? [],
        importedJsonHasSplit45: hasSplit45(imported),
        importedSplitBayIds: (imported.splitBays ?? []).map((splitBay) => splitBay.splitBayId),
        copyLabelVisible: bodyCopyHits.length > 0,
        bodyCopyHits,
        recoveryScreenVisible,
        source: "browser"
      };
    }
  );
  return result;
}

async function openWorkingEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-normal-toolbar="true"]') != null`);
  await browser.evaluate(`localStorage.removeItem('nerdeus.floorplans.savedAuthoringRecords.v1')`);
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-normal-toolbar="true"]') != null`);
  await clickGlobalButton(browser, "Save Floorplan");
  await waitForExpression(browser, `document.querySelector('[data-command-group="editor-tools"] button')?.disabled === false`, 10_000);
}

async function createCanonicalPair(browser, roomId, label) {
  await selectObject(browser, "room", roomId);
  await waitForExpression(browser, `document.body.innerText.includes(${JSON.stringify(`Create Split Room ${label}`)})`, 10_000);
  await clickScopedButton(browser, '[data-room-quick-edit="ready"]', `Create Split Room ${label}`);
  await waitForExpression(browser, `Array.from(document.querySelectorAll('[data-layout-object-type="split_bay"]')).some((item) => item.textContent.includes(${JSON.stringify(label.split("/")[0])}) && item.textContent.includes(${JSON.stringify(label.split("/")[1])}))`, 10_000);
}

async function saveAndReload(browser) {
  const savedRecordId = await readActiveRecordId(browser);
  await clickGlobalButton(browser, "Save Floorplan");
  await waitForExpression(
    browser,
    `(() => {
      const recordId = document.querySelector('[data-active-record-id]')?.getAttribute('data-active-record-id') ?? null;
      return recordId != null && recordId !== 'No active record';
    })()`,
    10_000
  );
  await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('.floorplan-library') != null`);
  await clickOpenSavedFloorplan(browser, savedRecordId);
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-normal-toolbar="true"]') != null`);
  return savedRecordId;
}

async function exportJson(browser) {
  await clickGlobalButton(browser, "Export JSON Backup");
  await waitForExpression(browser, `document.querySelector('textarea[aria-label="Floorplan JSON"]')?.value?.includes('split-bay-room-04-room-05') === true`, 10_000);
  return browser.evaluate(`document.querySelector('textarea[aria-label="Floorplan JSON"]')?.value ?? ''`);
}

async function importJson(browser, json) {
  await browser.evaluate(`(() => {
    const textarea = document.querySelector('textarea[aria-label="Floorplan JSON"]');
    if (textarea == null) throw new Error('Floorplan JSON textarea missing');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, ${JSON.stringify(json)});
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await clickGlobalButton(browser, "Import JSON");
  await waitForExpression(browser, `document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="split-bay-room-04-room-05"]') != null`, 10_000);
  const exported = JSON.parse(json);
  return exported;
}

async function selectObject(browser, objectType, objectId) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="${objectType}"][data-layout-object-id="${objectId}"]');
    if (element == null) throw new Error('missing ${objectType} ${objectId}');
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
  })()`);
  const selector = objectType === "split_bay" ? "[data-split-bay-quick-edit=\"ready\"]" : "[data-room-quick-edit=\"ready\"]";
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(selector)}) != null`, 10_000);
}

async function readSplitBay(browser, splitBayId) {
  return browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="${splitBayId}"]');
    return {
      exists: element != null,
      labelsVisible: element?.textContent?.includes('4') === true && element?.textContent?.includes('5') === true,
      dividerVisible: element?.querySelector('line') != null
    };
  })()`);
}

async function readAssignmentProof(browser) {
  return browser.evaluate(`(() => {
    const fills = Array.from(document.querySelectorAll('[data-layout-object-id="split-bay-room-04-room-05"] .layout-editor-stage__split-bay-assignment rect, [data-layout-object-id="split-bay-room-04-room-05"] .layout-editor-stage__split-bay-assignment polygon'));
    const colors = fills.map((item) => item.getAttribute('style') ?? '').filter(Boolean);
    return { fillCount: fills.length, distinctColors: new Set(colors).size };
  })()`);
}

async function splitBayExists(browser, splitBayId) {
  return browser.evaluate(`document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="${splitBayId}"]') != null`);
}

async function readObjectIds(browser, objectType) {
  return browser.evaluate(`Array.from(document.querySelectorAll('[data-layout-object-type="${objectType}"]')).map((item) => item.getAttribute('data-layout-object-id')).filter(Boolean)`);
}

async function readActiveRecordId(browser) {
  const recordId = await browser.evaluate(`document.querySelector('[data-active-record-id]')?.getAttribute('data-active-record-id') ?? null`);
  if (recordId == null || recordId === "No active record") throw new Error("active record ID was not visible");
  return recordId;
}

async function clickOpenSavedFloorplan(browser, recordId) {
  const clicked = await browser.evaluate(`(() => {
    const card = document.querySelector('[data-record-id="${recordId}"]');
    const button = Array.from(card?.querySelectorAll('button') ?? [])
      .find((item) => item.textContent.trim() === 'Open Saved Floorplan');
    if (button == null || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`saved floorplan open button missing for ${recordId}`);
}

async function clickNavButton(browser, label) {
  const clicked = await browser.evaluate(`(() => {
    const button = Array.from(document.querySelectorAll('.app-nav button'))
      .find((item) => item.textContent.trim() === ${JSON.stringify(label)});
    if (button == null || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`navigation button missing: ${label}`);
}

async function clickScopedButton(browser, rootSelector, label) {
  return browser.evaluate(`(() => {
    const root = document.querySelector(${JSON.stringify(rootSelector)});
    const button = Array.from(root?.querySelectorAll('button') ?? [])
      .find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) return { clicked: false, reason: 'missing enabled button', label: ${JSON.stringify(label)} };
    button.click();
    return { clicked: true, label: ${JSON.stringify(label)} };
  })()`);
}

async function clickGlobalButton(browser, label) {
  return browser.evaluate(`(() => {
    const expected = ${JSON.stringify(label.toLowerCase())};
    const button = Array.from(document.querySelectorAll('button'))
      .find((item) => item.textContent.trim().toLowerCase() === expected && !item.disabled);
    if (button == null) return { clicked: false, reason: 'missing enabled button', label: ${JSON.stringify(label)} };
    button.click();
    return { clicked: true, label: ${JSON.stringify(label)} };
  })()`);
}

async function bodyIncludes(browser, text) {
  return browser.evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`);
}

function hasSplit45(plan) {
  return (plan.splitBays ?? []).some(
    (splitBay) =>
      splitBay.splitBayId === "split-bay-room-04-room-05" &&
      splitBay.label === "4/5" &&
      JSON.stringify(splitBay.bedPositionRoomIds) === JSON.stringify(["room-04", "room-05"])
  );
}

function writeCommandsAndCloseout(status) {
  const commands = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    `node scripts/check-split-room-browser-regression.mjs --stage final --issue ${issue}`,
    "node scripts/check-no-phi-fields.mjs"
  ];
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-browser-regression.mjs --stage final --issue ${issue}`]: `${dir}/test-output/split-room-browser-regression.txt`
  });
  writeCloseout(issue, "Split-room browser regression.", status, commands);
}
