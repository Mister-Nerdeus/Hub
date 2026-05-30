#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  requiredIssueCommands,
  statusFromChecks,
  updateSplitRoomCloseoutHardeningManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageSummary,
  writeText,
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";
import {
  waitForExpression,
  withBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";

const issue = readArg("--issue", "690");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "user-flow",
  "child-room-4-assignment",
  "child-room-5-assignment",
  "parent-not-assignable",
  "assigned-counts",
  "child-burden-output",
  "editor-overlay-colors",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room manual assignment browser stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: real Manual Assignment browser workflow must assign split-room child rooms and keep the parent split bay unassignable.\n"
);

const stages = stage === "final"
  ? [
      "user-flow",
      "child-room-4-assignment",
      "child-room-5-assignment",
      "parent-not-assignable",
      "assigned-counts",
      "child-burden-output",
      "editor-overlay-colors"
    ]
  : [stage];
const checks = [];
const stageResults = {};
const proof = await runBrowserProof();

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage, proof);
}

const status = statusFromChecks(checks);
if (proofOverallPassed(proof)) {
  updateSplitRoomCloseoutHardeningManifest(issue, {
    splitRoomManualAssignmentBrowserStatus: "passed",
    splitRoomChildManualAssignmentProof: true,
    splitRoomParentNotAssignableProof: true,
    splitRoomChildBurdenProof: true,
    splitRoomIndependentColorProof: true
  });
}

writeStageSummary(issue, "split-room-manual-assignment-browser", status, stage, checks, stageResults);
writeJson(`${dir}/screenshot-index.json`, {
  status: proof.status,
  screenshots: [
    "split-room-45-created-before-assignment.png",
    "manual-assignment-room-4-nurse-a.png",
    "manual-assignment-room-5-nurse-b.png",
    "manual-assignment-cards-child-rooms.png",
    "editor-split-room-independent-assignment-colors.png"
  ].map((name) => `${dir}/screenshots/${name}`)
});
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage, browserProof) {
  if (selectedStage === "user-flow") {
    const output = {
      status: browserProof.userFlowStatus,
      splitRoomCreated: browserProof.splitRoomCreated,
      manualAssignmentRouteVisited: browserProof.manualAssignmentRouteVisited,
      nurseASelected: browserProof.nurseASelected,
      nurseBSelected: browserProof.nurseBSelected,
      noRecoveryScreen: !browserProof.recoveryScreenVisible
    };
    writeJson(`${dir}/manual-assignment-user-flow-output.json`, output);
    addCheck(checks, "real browser flow creates Split Room 4/5 and opens Manual Assignment", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "child-room-4-assignment") {
    const output = {
      status: browserProof.childRoom4AssignedToNurseA ? "passed" : "failed",
      nurseCardRoomIds: browserProof.nurseACard?.assignedRoomIds ?? [],
      nurseCardText: browserProof.nurseACard?.text ?? ""
    };
    writeJson(`${dir}/child-room-4-assignment-output.json`, output);
    addCheck(checks, "Nurse A card includes Room 4 through Manual Assignment UI", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "child-room-5-assignment") {
    const output = {
      status: browserProof.childRoom5AssignedToNurseB ? "passed" : "failed",
      nurseCardRoomIds: browserProof.nurseBCard?.assignedRoomIds ?? [],
      nurseCardText: browserProof.nurseBCard?.text ?? ""
    };
    writeJson(`${dir}/child-room-5-assignment-output.json`, output);
    addCheck(checks, "Nurse B card includes Room 5 through Manual Assignment UI", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "parent-not-assignable") {
    const output = {
      status: browserProof.parentNotAssignable ? "passed" : "failed",
      parentSplitBayId: "split-bay-room-04-room-05",
      roomCardIds: browserProof.manualRoomCardIds,
      parentSplitBaysAssignable: browserProof.parentSplitBaysAssignable
    };
    writeJson(`${dir}/parent-not-assignable-output.json`, output);
    addCheck(checks, "parent split bay is not an assignable patient room", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "assigned-counts") {
    const output = {
      status: browserProof.assignedCountIncludesChildren ? "passed" : "failed",
      assignedCount: browserProof.assignedCount,
      assignedRoomIds: browserProof.assignedRoomIds
    };
    writeJson(`${dir}/assigned-count-output.json`, output);
    addCheck(checks, "assigned count includes Room 4 and Room 5 child rooms", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "child-burden-output") {
    const output = {
      status: browserProof.childBurdenOutputReferencesChildIds ? "passed" : "failed",
      burdenRows: browserProof.burdenRows
    };
    writeJson(`${dir}/burden-child-room-output.json`, output);
    addCheck(checks, "burden output references split-room child room IDs", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "editor-overlay-colors") {
    const output = {
      status: browserProof.editorOverlayIndependentColors ? "passed" : "failed",
      childAssignmentColors: browserProof.editorChildAssignmentColors,
      fillCount: browserProof.editorSplitBayFillCount
    };
    writeJson(`${dir}/editor-overlay-independent-colors-output.json`, output);
    addCheck(checks, "returning to editor shows independent child assignment colors", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage: ${selectedStage}`);
}

async function runBrowserProof() {
  const { result } = await withBrowserRenderedApp({
    port: 5190,
    chromePort: 9900,
    width: 1440,
    height: 1100,
    initScript: workspaceUnlockScript()
  }, async (browser) => {
    await openWorkingEditor(browser);
    await selectObject(browser, "room", "room-05");
    await waitForExpression(browser, `document.body.innerText.includes('Create Split Room 4/5')`, 10_000);
    const createSplit = await clickScopedButton(browser, '[data-room-quick-edit="ready"]', "Create Split Room 4/5");
    await waitForExpression(browser, splitBayExistsExpression("split-bay-room-04-room-05"), 10_000);
    await browser.screenshot(`${dir}/screenshots/split-room-45-created-before-assignment.png`);
    const savedAfterSplit = await clickGlobalButton(browser, "Save Working Copy");
    await waitForExpression(browser, `document.body.innerText.includes('Saved working copy')`, 10_000);
    const splitRoomCreated = await browser.evaluate(splitBayExistsExpression("split-bay-room-04-room-05"));

    await clickNavButton(browser, "Manual Assignment");
    await waitForExpression(
      browser,
      `document.querySelector('.manual-assignment-workspace')?.getAttribute('data-split-parent-ids')?.includes('split-bay-room-04-room-05') === true`,
      10_000
    );
    const manualAssignmentRouteVisited = await browser.evaluate(`document.querySelector('.manual-assignment-workspace') != null`);

    const nurseASelected = await clickNurse(browser, "nurse-a");
    const room4Clicked = await clickManualRoom(browser, "room-04");
    await waitForExpression(
      browser,
      `document.querySelector('[data-manual-room-id="room-04"]')?.getAttribute('data-assigned-nurse-id') === 'nurse-a'`,
      10_000
    );
    await browser.screenshot(`${dir}/screenshots/manual-assignment-room-4-nurse-a.png`);

    const nurseBSelected = await clickNurse(browser, "nurse-b");
    const room5Clicked = await clickManualRoom(browser, "room-05");
    await waitForExpression(
      browser,
      `document.querySelector('[data-manual-room-id="room-05"]')?.getAttribute('data-assigned-nurse-id') === 'nurse-b'`,
      10_000
    );
    await browser.screenshot(`${dir}/screenshots/manual-assignment-room-5-nurse-b.png`);
    await browser.screenshot(`${dir}/screenshots/manual-assignment-cards-child-rooms.png`);

    const manualState = await readManualAssignmentState(browser);
    writeText(
      `${dir}/no-recommendation-output.txt`,
      manualState.noRecommendationCopy
        ? "passed: Manual Assignment route contains no optimizer or recommendation copy.\n"
        : "failed: optimizer or recommendation copy appeared on Manual Assignment route.\n"
    );

    await clickNavButton(browser, "Editor");
    await waitForExpression(browser, splitBayExistsExpression("split-bay-room-04-room-05"), 10_000);
    await waitForExpression(
      browser,
      `document.querySelector('[data-layout-object-id="split-bay-room-04-room-05"]')?.getAttribute('data-split-bay-child-assignment-colors')?.split('|').filter(Boolean).length >= 2`,
      10_000
    );
    await browser.screenshot(`${dir}/screenshots/editor-split-room-independent-assignment-colors.png`);
    const editorState = await readEditorAssignmentState(browser);
    const recoveryScreenVisible = await browser.evaluate(`document.querySelector('.layout-editor-recovery-screen') != null`);
    writeJson(`${dir}/no-recovery-screen-output.json`, {
      status: recoveryScreenVisible ? "failed" : "passed",
      recoveryScreenVisible
    });

    const proof = {
      splitRoomCreated,
      createSplitClicked: createSplit.clicked,
      savedAfterSplit: savedAfterSplit.clicked,
      manualAssignmentRouteVisited,
      nurseASelected,
      nurseBSelected,
      room4Clicked,
      room5Clicked,
      ...manualState,
      ...editorState,
      recoveryScreenVisible
    };

    return {
      ...proof,
      status: proofOverallPassed(proof) ? "passed" : "failed",
      userFlowStatus:
        createSplit.clicked &&
        splitRoomCreated &&
        savedAfterSplit.clicked &&
        manualAssignmentRouteVisited &&
        nurseASelected &&
        nurseBSelected &&
        room4Clicked &&
        room5Clicked &&
        !recoveryScreenVisible
          ? "passed"
          : "failed"
    };
  });

  return result;
}

async function openWorkingEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate(`(() => {
    localStorage.removeItem('nerdeus.floorplans.savedAuthoringRecords.v1');
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('nerdeus.layoutEditor.localDraft.v2.')) localStorage.removeItem(key);
    }
  })()`);
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  const createdWorkingCopy = await clickGlobalButton(browser, "Save Working Copy");
  if (!createdWorkingCopy.clicked) {
    throw new Error("Save Working Copy control was not available while opening the working editor");
  }
  await waitForExpression(
    browser,
    `document.querySelector('.layout-editor-stage__svg')?.getAttribute('data-read-only') === 'false'`,
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
  const selector = objectType === "split_bay" ? "[data-split-bay-quick-edit=\"ready\"]" : "[data-room-quick-edit=\"ready\"]";
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(selector)}) != null`, 10_000);
}

async function clickNurse(browser, nurseId) {
  return browser.evaluate(`(() => {
    const button = document.querySelector('[data-manual-nurse-id="${nurseId}"]');
    if (button == null || button.disabled) return false;
    button.click();
    return true;
  })()`);
}

async function clickManualRoom(browser, roomId) {
  return browser.evaluate(`(() => {
    const card = document.querySelector('[data-manual-room-id="${roomId}"]');
    const button = card?.querySelector('.manual-room-card__assign-button');
    if (button == null || button.disabled) return false;
    button.click();
    return true;
  })()`);
}

async function readManualAssignmentState(browser) {
  return browser.evaluate(`(() => {
    const workspace = document.querySelector('.manual-assignment-workspace');
    const roomCards = Array.from(document.querySelectorAll('[data-manual-room-id]'));
    const manualRoomCardIds = roomCards.map((card) => card.getAttribute('data-manual-room-id')).filter(Boolean);
    const assignedRoomIds = roomCards
      .filter((card) => card.getAttribute('data-assigned-nurse-id'))
      .map((card) => card.getAttribute('data-manual-room-id'))
      .filter(Boolean);
    const nurseCards = Array.from(document.querySelectorAll('[data-manual-nurse-card-id]')).map((card) => ({
      nurseId: card.getAttribute('data-manual-nurse-card-id'),
      assignedRoomIds: (card.getAttribute('data-assigned-room-ids') ?? '').split(',').filter(Boolean),
      text: card.textContent?.trim() ?? ''
    }));
    const burdenRows = Array.from(document.querySelectorAll('[data-burden-nurse-id]')).map((row) => ({
      nurseId: row.getAttribute('data-burden-nurse-id'),
      assignedRoomIds: (row.getAttribute('data-burden-room-ids') ?? '').split(',').filter(Boolean),
      text: row.textContent?.trim() ?? ''
    }));
    const nurseACard = nurseCards.find((card) => card.nurseId === 'nurse-a') ?? null;
    const nurseBCard = nurseCards.find((card) => card.nurseId === 'nurse-b') ?? null;
    const assignedCount = Number(workspace?.getAttribute('data-assigned-count') ?? '0');
    const parentSplitBaysAssignable = workspace?.getAttribute('data-parent-split-bays-assignable') ?? null;
    const manualSection = document.querySelector('[aria-labelledby="manual-assignment-section-title"]');
    const manualText = manualSection?.textContent ?? '';
    return {
      manualRoomCardIds,
      assignedRoomIds,
      assignedCount,
      nurseACard,
      nurseBCard,
      burdenRows,
      childRoom4AssignedToNurseA: nurseACard?.assignedRoomIds.includes('room-04') === true && nurseACard.text.includes('Room 4'),
      childRoom5AssignedToNurseB: nurseBCard?.assignedRoomIds.includes('room-05') === true && nurseBCard.text.includes('Room 5'),
      parentNotAssignable: !manualRoomCardIds.includes('split-bay-room-04-room-05') && parentSplitBaysAssignable === 'false',
      parentSplitBaysAssignable,
      assignedCountIncludesChildren: assignedCount >= 2 && assignedRoomIds.includes('room-04') && assignedRoomIds.includes('room-05'),
      childBurdenOutputReferencesChildIds: burdenRows.some((row) => row.assignedRoomIds.includes('room-04') && row.text.includes('room-04')) &&
        burdenRows.some((row) => row.assignedRoomIds.includes('room-05') && row.text.includes('room-05')),
      noRecommendationCopy: !/\\b(recommend|recommendation|optimizer|optimized|best assignment)\\b/i.test(manualText)
    };
  })()`);
}

async function readEditorAssignmentState(browser) {
  return browser.evaluate(`(() => {
    const splitBay = document.querySelector('[data-layout-object-id="split-bay-room-04-room-05"]');
    const colors = (splitBay?.getAttribute('data-split-bay-child-assignment-colors') ?? '').split('|').filter(Boolean);
    const fills = Array.from(splitBay?.querySelectorAll('.layout-editor-stage__split-bay-assignment rect, .layout-editor-stage__split-bay-assignment polygon') ?? []);
    return {
      editorChildAssignmentColors: colors,
      editorSplitBayFillCount: fills.length,
      editorOverlayIndependentColors: colors.length >= 2 && new Set(colors).size >= 2 && fills.length >= 2
    };
  })()`);
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

function splitBayExistsExpression(splitBayId) {
  return `document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="${splitBayId}"]') != null`;
}

function proofOverallPassed(proof) {
  return Boolean(
    proof.splitRoomCreated &&
    proof.manualAssignmentRouteVisited &&
    proof.childRoom4AssignedToNurseA &&
    proof.childRoom5AssignedToNurseB &&
    proof.parentNotAssignable &&
    proof.assignedCountIncludesChildren &&
    proof.childBurdenOutputReferencesChildIds &&
    proof.editorOverlayIndependentColors &&
    proof.noRecommendationCopy &&
    !proof.recoveryScreenVisible
  );
}

function workspaceUnlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-manual-assignment-browser", [
    "user-flow",
    "child-room-4-assignment",
    "child-room-5-assignment",
    "parent-not-assignable",
    "assigned-counts",
    "child-burden-output",
    "editor-overlay-colors"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-manual-assignment-browser.mjs --stage user-flow --allow-partial --issue ${issue}`]: `${dir}/manual-assignment-user-flow-output.json`,
    [`node scripts/check-split-room-manual-assignment-browser.mjs --stage child-room-4-assignment --allow-partial --issue ${issue}`]: `${dir}/child-room-4-assignment-output.json`,
    [`node scripts/check-split-room-manual-assignment-browser.mjs --stage child-room-5-assignment --allow-partial --issue ${issue}`]: `${dir}/child-room-5-assignment-output.json`,
    [`node scripts/check-split-room-manual-assignment-browser.mjs --stage parent-not-assignable --allow-partial --issue ${issue}`]: `${dir}/parent-not-assignable-output.json`,
    [`node scripts/check-split-room-manual-assignment-browser.mjs --stage assigned-counts --allow-partial --issue ${issue}`]: `${dir}/assigned-count-output.json`,
    [`node scripts/check-split-room-manual-assignment-browser.mjs --stage child-burden-output --allow-partial --issue ${issue}`]: `${dir}/burden-child-room-output.json`,
    [`node scripts/check-split-room-manual-assignment-browser.mjs --stage editor-overlay-colors --allow-partial --issue ${issue}`]: `${dir}/editor-overlay-independent-colors-output.json`
  });
  writeCloseout(
    issue,
    "Real Manual Assignment split-room browser workflow proof.",
    status,
    commands,
    [
      "Browser proof uses the real editor and Manual Assignment routes with synthetic operational room-load data.",
      "The split room is saved before route transition so the remounted editor receives the same saved working-copy layout."
    ],
    ["docs/verification/split-room-closeout-hardening-manifest.json"]
  );
}
