#!/usr/bin/env node
import {
  editorRuntimeBuildMarker,
  waitForExpression,
  withBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  assertFile,
  browserRegressionProofIndexFileName,
  doorBrowserRegressionProofFileName,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readJson,
  requiredIssueCommands,
  statusFromChecks,
  updateDoorAuthoringManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/door-authoring-crash-hardening-utils.mjs";

const issue = readArg("--issue", "677");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const proofPath = `${dir}/${doorBrowserRegressionProofFileName}`;
const genericProofPath = `${dir}/browser-regression-proof.json`;
const proofIndexPath = `${dir}/${browserRegressionProofIndexFileName}`;
const splitRoomProofPath = `${dir}/split-room-browser-regression-proof.json`;
const exportedJsonPath = `${dir}/exported-json/door-regression-after-reload.json`;
const supportedStages = [
  "valid-patient-door",
  "invalid-target-warnings",
  "left-pod",
  "right-pod",
  "save-reload-export",
  "no-recovery-screen",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported door authoring browser regression stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: browser regression pack must prove door workflows avoid recovery and persist valid edits.\n"
);

const stages = stage === "final"
  ? [
      "valid-patient-door",
      "invalid-target-warnings",
      "left-pod",
      "right-pod",
      "save-reload-export",
      "no-recovery-screen"
    ]
  : [stage];
const checks = [];
const stageResults = {};
let browserProof = null;

for (const selectedStage of stages) {
  stageResults[selectedStage] = await runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (stage === "final") {
  updateDoorAuthoringManifest(issue, {
    doorRegressionPackStatus: status === "passed" ? "passed" : "failed",
    doorSaveReloadProof: status === "passed",
    noRecoveryScreenDuringDoorWork: status === "passed",
    reconstructionStatus: status === "passed" ? "go_for_full_er_floorplan_reconstruction" : "no_go_until_door_authoring_crash_hardening_passes",
    goNoGoStatus: status === "passed" ? "go_for_full_er_floorplan_reconstruction" : "not_ready"
  });
}

writeJson(`${dir}/test-output/door-authoring-browser-regression.txt`, {
  status,
  issue,
  stage,
  checks,
  stageResults
});
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  const proof = await loadOrCaptureProof();

  if (selectedStage === "valid-patient-door") {
    const valid = proof.validPatientDoor;
    const move = proof.doorMove;
    const width = proof.doorWidth;
    const adjacent = proof.adjacentValidCandidate;
    const deleted = proof.doorDelete;
    writeJson(`${dir}/valid-patient-door-output.json`, valid);
    writeJson(`${dir}/door-move-output.json`, move);
    writeJson(`${dir}/door-width-output.json`, width);
    writeJson(`${dir}/adjacent-valid-candidate-output.json`, adjacent);
    writeJson(`${dir}/door-delete-output.json`, deleted);
    addCheck(
      checks,
      "valid patient-room door add, move, width, adjacent assignment, and delete pass in browser",
      [valid, move, width, adjacent, deleted].every((item) => item.status === "passed"),
      { valid, move, width, adjacent, deleted }
    );
    return { valid, move, width, adjacent, deleted };
  }

  if (selectedStage === "invalid-target-warnings") {
    const invalidCandidate = proof.invalidCandidateWarning;
    const solidWall = proof.solidWallReject;
    const supportSpace = proof.supportSpaceReject;
    const providerSupport = proof.providerPharmacySupportAccess;
    writeJson(`${dir}/invalid-candidate-warning-output.json`, invalidCandidate);
    writeJson(`${dir}/solid-wall-reject-output.json`, solidWall);
    writeJson(`${dir}/support-space-reject-output.json`, supportSpace);
    writeJson(`${dir}/provider-pharmacy-support-access-output.json`, providerSupport);
    addCheck(
      checks,
      "invalid targets produce warnings or disabled candidates while provider/pharmacy uses support access",
      [invalidCandidate, solidWall, supportSpace, providerSupport].every((item) => item.status === "passed"),
      { invalidCandidate, solidWall, supportSpace, providerSupport }
    );
    return { invalidCandidate, solidWall, supportSpace, providerSupport };
  }

  if (selectedStage === "left-pod") {
    writeJson(`${dir}/left-pod-regression-output.json`, proof.leftPodRegression);
    addCheck(checks, "left/top pod door workflow stays out of recovery", proof.leftPodRegression.status === "passed", proof.leftPodRegression);
    return proof.leftPodRegression;
  }

  if (selectedStage === "right-pod") {
    writeJson(`${dir}/right-pod-regression-output.json`, proof.rightPodRegression);
    addCheck(checks, "right/top pod door workflow stays out of recovery", proof.rightPodRegression.status === "passed", proof.rightPodRegression);
    return proof.rightPodRegression;
  }

  if (selectedStage === "save-reload-export") {
    writeJson(`${dir}/save-reload-export-output.json`, proof.saveReloadExport);
    writeJson(`${dir}/exported-json-artifacts-index.json`, {
      status: proof.saveReloadExport.status,
      artifacts: [exportedJsonPath]
    });
    addCheck(checks, "valid door edit persists through save, reopen, and export", proof.saveReloadExport.status === "passed", proof.saveReloadExport);
    return proof.saveReloadExport;
  }

  if (selectedStage === "no-recovery-screen") {
    writeJson(`${dir}/no-recovery-screen-output.json`, proof.noRecoveryScreen);
    addCheck(checks, "recovery screen remains absent during regression pack", proof.noRecoveryScreen.status === "passed", proof.noRecoveryScreen);
    return proof.noRecoveryScreen;
  }

  throw new Error(`Unsupported stage: ${selectedStage}`);
}

async function loadOrCaptureProof() {
  if (browserProof != null) return browserProof;
  if (stage !== "final" && assertFile(proofPath) && assertFile(exportedJsonPath)) {
    browserProof = readJson(proofPath);
    return browserProof;
  }
  if (stage !== "final" && !assertFile(proofPath) && assertFile(genericProofPath) && assertFile(exportedJsonPath)) {
    const legacyProof = readJson(genericProofPath);
    if (legacyProof.validPatientDoor != null || legacyProof.doorMove != null) {
      browserProof = legacyProof;
      writeJson(proofPath, browserProof);
      writeBrowserProofIndex();
      return browserProof;
    }
  }
  browserProof = await captureBrowserRegressionProof();
  writeJson(proofPath, browserProof);
  writeBrowserProofIndex();
  writeJson(`${dir}/screenshot-index.json`, {
    status: browserProof.status,
    screenshots: [
      "valid-door-added.png",
      "invalid-door-warning.png",
      "left-pod-door-proof.png",
      "right-pod-door-proof.png",
      "door-save-reload-proof.png"
    ].map((name) => `${dir}/screenshots/${name}`)
  });
  writeJson(`${dir}/exported-json-artifacts-index.json`, {
    status: browserProof.saveReloadExport.status,
    artifacts: [exportedJsonPath]
  });
  return browserProof;
}

function writeBrowserProofIndex() {
  const index = {
    doorProof: proofPath,
    splitRoomProof: splitRoomProofPath
  };
  writeJson(proofIndexPath, index);
  writeJson(genericProofPath, index);
}

async function captureBrowserRegressionProof() {
  const recoveryChecks = [];
  const result = await withBrowserRenderedApp({
    port: 6897,
    chromePort: 9897,
    width: 1440,
    height: 1100,
    initScript: workspaceUnlockScript()
  }, async (browser) => {
    await openSavedWorkingEditor(browser);
    const runtime = await readRuntimeState(browser);

    const validDoor = await runPatientDoorWorkflow(browser, recoveryChecks);
    const saveReloadExport = await runSaveReloadExportWorkflow(browser, validDoor.doorId, recoveryChecks);
    const doorDelete = await deleteDoorById(browser, validDoor.doorId, recoveryChecks);

    const supportSpaceReject = await runSupportSpaceReject(browser, recoveryChecks);
    const solidWallReject = await runSolidWallReject(browser, recoveryChecks);
    const candidateProof = await runCandidateWorkflows(browser, recoveryChecks);
    const providerSupport = await runProviderPharmacySupportAccess(browser, recoveryChecks);

    const leftPod = await runPodRegression(browser, {
      roomId: "room-02",
      screenshot: `${dir}/screenshots/left-pod-door-proof.png`,
      recoveryChecks
    });
    const rightPod = await runPodRegression(browser, {
      roomId: "room-06",
      screenshot: `${dir}/screenshots/right-pod-door-proof.png`,
      recoveryChecks
    });

    return {
      runtime,
      validDoor,
      saveReloadExport,
      doorDelete,
      supportSpaceReject,
      solidWallReject,
      invalidCandidateWarning: candidateProof.invalidCandidateWarning,
      adjacentValidCandidate: candidateProof.adjacentValidCandidate,
      providerSupport,
      leftPod,
      rightPod,
      recoveryChecks
    };
  });

  const noRecoveryScreen = {
    status: result.result.recoveryChecks.every((check) => check.recoveryScreenVisible === false) ? "passed" : "failed",
    checks: result.result.recoveryChecks
  };
  const proof = {
    status: "passed",
    serverLogBytes: result.serverLog.length,
    runtime: result.result.runtime,
    validPatientDoor: result.result.validDoor.validPatientDoor,
    doorMove: result.result.validDoor.doorMove,
    doorWidth: result.result.validDoor.doorWidth,
    adjacentValidCandidate: result.result.adjacentValidCandidate,
    invalidCandidateWarning: result.result.invalidCandidateWarning,
    solidWallReject: result.result.solidWallReject,
    supportSpaceReject: result.result.supportSpaceReject,
    providerPharmacySupportAccess: result.result.providerSupport,
    doorDelete: result.result.doorDelete,
    saveReloadExport: result.result.saveReloadExport,
    leftPodRegression: result.result.leftPod,
    rightPodRegression: result.result.rightPod,
    noRecoveryScreen
  };
  const allStatuses = [
    proof.validPatientDoor,
    proof.doorMove,
    proof.doorWidth,
    proof.adjacentValidCandidate,
    proof.invalidCandidateWarning,
    proof.solidWallReject,
    proof.supportSpaceReject,
    proof.providerPharmacySupportAccess,
    proof.doorDelete,
    proof.saveReloadExport,
    proof.leftPodRegression,
    proof.rightPodRegression,
    proof.noRecoveryScreen
  ];
  proof.status = allStatuses.every((item) => item.status === "passed") ? "passed" : "failed";
  return proof;
}

async function runPatientDoorWorkflow(browser, recoveryChecks) {
  await selectObject(browser, "room", "room-02");
  const beforeDoorIds = await readObjectIds(browser, "door");
  const addDoorResult = await clickScopedButton(browser, '[data-room-quick-edit="ready"]', "Add door");
  await waitForExpression(browser, `document.querySelector('[data-door-quick-edit="ready"]') != null`, 10_000);
  const afterDoorIds = await readObjectIds(browser, "door");
  const doorId = afterDoorIds.find((id) => !beforeDoorIds.includes(id)) ?? afterDoorIds.at(-1);
  await browser.screenshot(`${dir}/screenshots/valid-door-added.png`);
  await recordRecoveryCheck(browser, recoveryChecks, "valid-patient-door-add");

  const initialWall = await readDoorWall(browser, doorId);
  await setDoorWall(browser, "west");
  await waitForExpression(browser, `document.querySelector('[data-layout-object-type="door"][data-layout-object-id="${doorId}"]')?.getAttribute('data-door-wall') === 'west'`, 10_000);
  const movedWall = await readDoorWall(browser, doorId);
  await recordRecoveryCheck(browser, recoveryChecks, "door-move");

  const nudgeResult = await clickScopedButton(browser, '[data-door-quick-edit="ready"]', "Nudge +");
  await recordRecoveryCheck(browser, recoveryChecks, "door-nudge");
  const widthResult = await clickScopedButton(browser, '[data-door-quick-edit="ready"]', "6 ft");
  await recordRecoveryCheck(browser, recoveryChecks, "door-width");

  return {
    doorId,
    validPatientDoor: {
      status: addDoorResult.clicked && doorId != null ? "passed" : "failed",
      roomId: "room-02",
      doorId,
      beforeDoorCount: beforeDoorIds.length,
      afterDoorCount: afterDoorIds.length,
      screenshot: `${dir}/screenshots/valid-door-added.png`
    },
    doorMove: {
      status: initialWall !== movedWall && movedWall === "west" ? "passed" : "failed",
      doorId,
      initialWall,
      movedWall,
      nudgeClicked: nudgeResult.clicked
    },
    doorWidth: {
      status: widthResult.clicked ? "passed" : "failed",
      doorId,
      widthPresetFeet: 6,
      widthClicked: widthResult.clicked
    }
  };
}

async function runSaveReloadExportWorkflow(browser, doorId, recoveryChecks) {
  const saveResult = await clickGlobalButton(browser, "Save Floorplan");
  await waitForExpression(
    browser,
    `(() => {
      const recordId = document.querySelector('[data-active-record-id]')?.getAttribute('data-active-record-id') ?? null;
      return document.querySelector('[data-editor-control="save-working-copy"]') != null &&
        recordId != null &&
        recordId !== 'No active record';
    })()`,
    10_000
  );
  const savedRecordId = await readActiveRecordId(browser);
  await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('.floorplan-library') != null`);
  await clickOpenSavedFloorplan(browser, savedRecordId);
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-normal-toolbar="true"]') != null`);
  await waitForExpression(
    browser,
    `document.querySelector('[data-active-record-id]')?.getAttribute('data-active-record-id') === ${JSON.stringify(savedRecordId)} || document.body.innerText.includes(${JSON.stringify(savedRecordId)})`,
    10_000
  );
  const exportResult = await clickGlobalButton(browser, "Export JSON Backup");
  await waitForExpression(
    browser,
    `document.querySelector('textarea[aria-label="Floorplan JSON"]')?.value?.includes(${JSON.stringify(doorId)}) === true`,
    10_000
  );
  const exportedJson = await browser.evaluate(`document.querySelector('textarea[aria-label="Floorplan JSON"]')?.value ?? ''`);
  writeText(exportedJsonPath, exportedJson);
  await browser.screenshot(`${dir}/screenshots/door-save-reload-proof.png`);
  const parsed = JSON.parse(exportedJson);
  const exportedDoor = Array.isArray(parsed.doors)
    ? parsed.doors.find((door) => door.id === doorId)
    : null;
  await recordRecoveryCheck(browser, recoveryChecks, "save-reload-export");
  return {
    status: saveResult.clicked && exportResult.clicked && exportedDoor != null && exportedDoor.widthFeet === 6
      ? "passed"
      : "failed",
    doorId,
    savedRecordId,
    exportedJson: exportedJsonPath,
    exportedDoor: exportedDoor == null
      ? null
      : {
          id: exportedDoor.id,
          widthFeet: exportedDoor.widthFeet,
          roomId: exportedDoor.roomId ?? null
        },
    screenshot: `${dir}/screenshots/door-save-reload-proof.png`
  };
}

async function deleteDoorById(browser, doorId, recoveryChecks) {
  await selectObject(browser, "door", doorId);
  const beforeDoorIds = await readObjectIds(browser, "door");
  const result = await clickScopedButton(browser, '[data-door-quick-edit="ready"]', "Delete door");
  await waitForExpression(
    browser,
    `document.querySelector('[data-layout-object-type="door"][data-layout-object-id="${doorId}"]') == null`,
    10_000
  );
  const afterDoorIds = await readObjectIds(browser, "door");
  await recordRecoveryCheck(browser, recoveryChecks, "door-delete");
  return {
    status: result.clicked && beforeDoorIds.includes(doorId) && !afterDoorIds.includes(doorId) ? "passed" : "failed",
    doorId,
    beforeDoorCount: beforeDoorIds.length,
    afterDoorCount: afterDoorIds.length
  };
}

async function runSupportSpaceReject(browser, recoveryChecks) {
  await selectObject(browser, "room", "room-14");
  const beforeDoorIds = await readObjectIds(browser, "door");
  const addDoorResult = await clickGlobalButton(browser, "Add door");
  await waitForWarning(browser, "Add door blocked");
  const afterDoorIds = await readObjectIds(browser, "door");
  await recordRecoveryCheck(browser, recoveryChecks, "support-space-reject");
  return {
    status: addDoorResult.clicked && beforeDoorIds.length === afterDoorIds.length ? "passed" : "failed",
    roomId: "room-14",
    warningVisible: await bodyIncludes(browser, "Add door blocked"),
    doorCountPreserved: beforeDoorIds.length === afterDoorIds.length
  };
}

async function runSolidWallReject(browser, recoveryChecks) {
  await selectObject(browser, "room", "room-14");
  await setSelectedRoomType(browser, "solid_wall");
  const beforeDoorIds = await readObjectIds(browser, "door");
  const addDoorResult = await clickGlobalButton(browser, "Add door");
  await waitForWarning(browser, "Solid wall");
  const afterDoorIds = await readObjectIds(browser, "door");
  await recordRecoveryCheck(browser, recoveryChecks, "solid-wall-reject");
  return {
    status: addDoorResult.clicked && beforeDoorIds.length === afterDoorIds.length ? "passed" : "failed",
    roomId: "room-14",
    warningVisible: await bodyIncludes(browser, "Solid wall"),
    doorCountPreserved: beforeDoorIds.length === afterDoorIds.length
  };
}

async function runCandidateWorkflows(browser, recoveryChecks) {
  await selectObject(browser, "room", "room-14");
  await setSelectedRoomType(browser, "standard");
  const beforeDoorIds = await readObjectIds(browser, "door");
  await clickScopedButton(browser, '[data-room-quick-edit="ready"]', "Add door");
  await waitForExpression(browser, `document.querySelector('[data-door-quick-edit="ready"]') != null`, 10_000);
  const afterDoorIds = await readObjectIds(browser, "door");
  const doorId = afterDoorIds.find((id) => !beforeDoorIds.includes(id)) ?? afterDoorIds.at(-1);

  await selectObject(browser, "room", "room-19");
  await setSelectedRoomType(browser, "storage");
  await selectObject(browser, "door", doorId);
  const disabledCandidate = await readCandidateOption(browser, "room-19");
  await browser.screenshot(`${dir}/screenshots/invalid-door-warning.png`);
  await attemptCandidateSelection(browser, "room-19");
  await recordRecoveryCheck(browser, recoveryChecks, "invalid-candidate-disabled");

  await selectObject(browser, "room", "room-19");
  await setSelectedRoomType(browser, "standard");
  await selectObject(browser, "door", doorId);
  const enabledCandidate = await readCandidateOption(browser, "room-19");
  const candidateSelection = await attemptCandidateSelection(browser, "room-19");
  await recordRecoveryCheck(browser, recoveryChecks, "adjacent-valid-candidate");

  return {
    invalidCandidateWarning: {
      status: disabledCandidate?.disabled === true && disabledCandidate.text.includes("Storage/support-only") ? "passed" : "failed",
      doorId,
      candidateRoomId: "room-19",
      candidateText: disabledCandidate?.text ?? null,
      disabled: disabledCandidate?.disabled ?? null,
      screenshot: `${dir}/screenshots/invalid-door-warning.png`
    },
    adjacentValidCandidate: {
      status: enabledCandidate?.disabled === false && candidateSelection.selected === true ? "passed" : "failed",
      doorId,
      candidateRoomId: "room-19",
      candidateText: enabledCandidate?.text ?? null,
      selected: candidateSelection.selected
    }
  };
}

async function runProviderPharmacySupportAccess(browser, recoveryChecks) {
  const before = await readObjectIds(browser, "support_access");
  await selectFirstProviderPharmacyZone(browser);
  const result = await clickScopedButton(browser, '[data-hallway-zone-quick-edit="zone"]', "Add Access Point");
  await waitForExpression(
    browser,
    `document.querySelectorAll('[data-layout-object-type="support_access"]').length > ${before.length}`,
    10_000
  );
  const after = await readObjectIds(browser, "support_access");
  await recordRecoveryCheck(browser, recoveryChecks, "provider-pharmacy-support-access");
  return {
    status: result.clicked && after.length > before.length ? "passed" : "failed",
    beforeSupportAccessCount: before.length,
    afterSupportAccessCount: after.length,
    usedSupportAccessWorkflow: true
  };
}

async function runPodRegression(browser, { roomId, screenshot, recoveryChecks }) {
  await selectObject(browser, "room", roomId);
  const beforeDoorIds = await readObjectIds(browser, "door");
  const addDoorResult = await clickScopedButton(browser, '[data-room-quick-edit="ready"]', "Add door");
  await waitForExpression(browser, `document.querySelector('[data-door-quick-edit="ready"]') != null`, 10_000);
  const afterDoorIds = await readObjectIds(browser, "door");
  await browser.screenshot(screenshot);
  await recordRecoveryCheck(browser, recoveryChecks, `${roomId}-pod-regression`);
  return {
    status: addDoorResult.clicked && afterDoorIds.length > beforeDoorIds.length ? "passed" : "failed",
    roomId,
    beforeDoorCount: beforeDoorIds.length,
    afterDoorCount: afterDoorIds.length,
    screenshot
  };
}

async function openSavedWorkingEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-normal-toolbar="true"]') != null`);
  await browser.evaluate(`localStorage.removeItem('nerdeus.floorplans.savedAuthoringRecords.v1')`);
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-normal-toolbar="true"]') != null`);
  await clickGlobalButton(browser, "Save Floorplan");
  await waitForExpression(
    browser,
    `document.querySelector('[data-command-group="editor-tools"] button')?.disabled === false`,
    10_000
  );
}

async function selectObject(browser, objectType, objectId) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="${objectType}"][data-layout-object-id="${objectId}"]');
    if (element == null) throw new Error('missing ${objectType} ${objectId}');
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
    return true;
  })()`);
  const readySelector = objectType === "room"
    ? '[data-room-quick-edit="ready"]'
    : objectType === "door"
      ? '[data-door-quick-edit="ready"]'
      : objectType === "zone"
        ? '[data-hallway-zone-quick-edit="zone"]'
        : '[data-support-access-quick-edit="ready"]';
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(readySelector)}) != null`, 10_000);
}

async function selectFirstProviderPharmacyZone(browser) {
  const zoneId = await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="zone"][data-zone-type="provider_pharmacy"]');
    if (element == null) return null;
    element.focus();
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    return element.getAttribute('data-layout-object-id');
  })()`);
  if (zoneId == null) throw new Error("provider/pharmacy zone was not rendered");
  await waitForExpression(browser, `document.querySelector('[data-hallway-zone-quick-edit="zone"]') != null`, 10_000);
  return zoneId;
}

async function setSelectedRoomType(browser, roomType) {
  await browser.evaluate(`(() => {
    const root = document.querySelector('[data-room-quick-edit="ready"]');
    const select = root?.querySelector('select');
    if (select == null) throw new Error('room type select missing');
    setNativeSelectValue(select, ${JSON.stringify(roomType)});
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
    function setNativeSelectValue(target, value) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
      if (setter == null) {
        target.value = value;
        return;
      }
      setter.call(target, value);
    }
  })()`);
  await waitForExpression(
    browser,
    `document.querySelector('[data-room-quick-edit="ready"] select')?.value === ${JSON.stringify(roomType)}`,
    10_000
  );
}

async function setDoorWall(browser, wall) {
  await browser.evaluate(`(() => {
    const root = document.querySelector('[data-door-quick-edit="ready"]');
    const select = root?.querySelector('select');
    if (select == null) throw new Error('door wall select missing');
    setNativeSelectValue(select, ${JSON.stringify(wall)});
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
    function setNativeSelectValue(target, value) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
      if (setter == null) {
        target.value = value;
        return;
      }
      setter.call(target, value);
    }
  })()`);
}

async function attemptCandidateSelection(browser, roomId) {
  return browser.evaluate(`(() => {
    const root = document.querySelector('[data-door-quick-edit="ready"]');
    const select = Array.from(root?.querySelectorAll('select') ?? [])[1] ?? null;
    if (select == null) return { selected: false, reason: 'candidate selector missing' };
    const option = Array.from(select.options).find((item) => item.value === ${JSON.stringify(roomId)}) ?? null;
    if (option == null) return { selected: false, reason: 'candidate option missing' };
    if (option.disabled) return { selected: false, reason: 'candidate disabled', text: option.textContent.trim() };
    setNativeSelectValue(select, option.value);
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return { selected: true, value: option.value, text: option.textContent.trim() };
    function setNativeSelectValue(target, value) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
      if (setter == null) {
        target.value = value;
        return;
      }
      setter.call(target, value);
    }
  })()`);
}

async function readCandidateOption(browser, roomId) {
  return browser.evaluate(`(() => {
    const root = document.querySelector('[data-door-quick-edit="ready"]');
    const select = Array.from(root?.querySelectorAll('select') ?? [])[1] ?? null;
    const option = Array.from(select?.options ?? []).find((item) => item.value === ${JSON.stringify(roomId)}) ?? null;
    return option == null
      ? null
      : { value: option.value, disabled: option.disabled, text: option.textContent.trim() };
  })()`);
}

async function readObjectIds(browser, objectType) {
  return browser.evaluate(`Array.from(document.querySelectorAll('[data-layout-object-type="${objectType}"]')).map((item) => item.getAttribute('data-layout-object-id')).filter(Boolean)`);
}

async function readDoorWall(browser, doorId) {
  return browser.evaluate(`document.querySelector('[data-layout-object-type="door"][data-layout-object-id="${doorId}"]')?.getAttribute('data-door-wall') ?? null`);
}

async function readActiveRecordId(browser) {
  const recordId = await browser.evaluate(`document.querySelector('[data-active-record-id]')?.getAttribute('data-active-record-id') ?? null`);
  if (recordId == null || recordId === "No active record") throw new Error("active record ID was not visible");
  return recordId;
}

async function readRuntimeState(browser) {
  return browser.evaluate(`(() => {
    const panel = document.querySelector('[data-runtime-build-info="true"]');
    return {
      batchMarker: panel?.getAttribute('data-batch-marker') ?? null,
      batchMarkerMatched: panel?.getAttribute('data-batch-marker') === ${JSON.stringify(editorRuntimeBuildMarker)}
    };
  })()`);
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

async function waitForWarning(browser, text) {
  await waitForExpression(
    browser,
    `document.body.innerText.includes(${JSON.stringify(text)}) || Number(document.querySelector('[data-validation-drawer="compact-bottom"]')?.getAttribute('data-warning-count') ?? '0') > 0`,
    10_000
  );
  await browser.evaluate(`document.querySelector('[data-validation-drawer="compact-bottom"] summary')?.click()`);
  await waitForExpression(browser, `document.body.innerText.includes(${JSON.stringify(text)})`, 10_000);
}

async function bodyIncludes(browser, text) {
  return browser.evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`);
}

async function recordRecoveryCheck(browser, recoveryChecks, label) {
  const recoveryScreenVisible = await browser.evaluate(`document.querySelector('.layout-editor-recovery-screen') != null`);
  recoveryChecks.push({ label, recoveryScreenVisible });
  return recoveryScreenVisible;
}

function workspaceUnlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-door-authoring-browser-regression", [
    "valid-patient-door",
    "invalid-target-warnings",
    "left-pod",
    "right-pod",
    "save-reload-export",
    "no-recovery-screen"
  ], [
    `node scripts/check-door-authoring-browser-regression.mjs --stage final --issue ${issue}`
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-door-authoring-browser-regression.mjs --stage valid-patient-door --allow-partial --issue ${issue}`]: `${dir}/valid-patient-door-output.json`,
    [`node scripts/check-door-authoring-browser-regression.mjs --stage invalid-target-warnings --allow-partial --issue ${issue}`]: `${dir}/invalid-candidate-warning-output.json`,
    [`node scripts/check-door-authoring-browser-regression.mjs --stage left-pod --allow-partial --issue ${issue}`]: `${dir}/left-pod-regression-output.json`,
    [`node scripts/check-door-authoring-browser-regression.mjs --stage right-pod --allow-partial --issue ${issue}`]: `${dir}/right-pod-regression-output.json`,
    [`node scripts/check-door-authoring-browser-regression.mjs --stage save-reload-export --allow-partial --issue ${issue}`]: `${dir}/save-reload-export-output.json`,
    [`node scripts/check-door-authoring-browser-regression.mjs --stage no-recovery-screen --allow-partial --issue ${issue}`]: `${dir}/no-recovery-screen-output.json`,
    [`node scripts/check-door-authoring-browser-regression.mjs --stage final --issue ${issue}`]: `${dir}/test-output/door-authoring-browser-regression.txt`
  });
  writeCloseout(
    issue,
    "Door authoring browser regression pack.",
    status,
    commands,
    [
      "Browser automation covers valid door add/move/width/candidate/delete workflows and invalid-target warnings.",
      "Save/reopen/export proof is stored as a local JSON artifact.",
      "Full ER floorplan reconstruction remains blocked until Issue 678 reruns the real validators."
    ]
  );
}
