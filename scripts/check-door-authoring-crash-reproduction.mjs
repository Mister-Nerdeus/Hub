#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  requiredIssueCommands,
  statusFromChecks,
  updateDoorAuthoringManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidenceSlots,
  writeJson,
  writeTextIfMissing
} from "./lib/door-authoring-crash-hardening-utils.mjs";
import {
  delay,
  editorRuntimeBuildMarker,
  waitForExpression,
  withBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";

const issue = readArg("--issue", "670");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];
const supportedStages = [
  "red-mode-detects-recovery",
  "left-pod",
  "right-pod",
  "grey-wall-adjacent",
  "recovery-screen-negative",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported door authoring crash reproduction stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: browser harness must detect recovery in RED mode and reject recovery during normal top-pod door work.\n"
);

const stages = stage === "final"
  ? [
      "red-mode-detects-recovery",
      "left-pod",
      "right-pod",
      "grey-wall-adjacent",
      "recovery-screen-negative"
    ]
  : [stage];

const stageOutputs = {};
for (const selectedStage of stages) {
  stageOutputs[selectedStage] = await runStage(selectedStage);
}

const status = statusFromChecks(checks);
const leftPassed = stageOutputs["left-pod"]?.status === "passed" || stageOutputs["recovery-screen-negative"]?.leftPod?.status === "passed";
const rightPassed = stageOutputs["right-pod"]?.status === "passed" || stageOutputs["recovery-screen-negative"]?.rightPod?.status === "passed";
if (status === "passed") {
  updateDoorAuthoringManifest(issue, {
    doorCrashReproductionStatus: "passed",
    leftPodDoorCrashProof: true,
    rightPodDoorCrashProof: true,
    goNoGoStatus: "not_ready"
  });
}

writeJson(`${dir}/screenshot-index.json`, {
  status,
  screenshots: [
    "screenshots/left-pod-before-door.png",
    "screenshots/left-pod-after-door-action.png",
    "screenshots/right-pod-before-door.png",
    "screenshots/right-pod-after-door-action.png",
    "screenshots/recovery-screen-if-triggered.png"
  ].map((path) => `${dir}/${path}`)
});
writeJson(`${dir}/test-output/door-crash-reproduction.txt`, { status, issue, stage, checks, stageOutputs });
writeEvidenceSlots(issue, "door-crash-reproduction", status, stage, checks);
writeCommandsAndCloseout(status);
console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "red-mode-detects-recovery") {
    const output = await runForcedRecoveryScenario();
    const passed = output.recoveryScreenVisible === true && output.detectedAsFailure === true;
    addCheck(checks, "RED mode detects editor recovery screen", passed, output);
    writeJson(`${dir}/red-mode-detection-output.json`, { status: passed ? "passed" : "failed", ...output });
    return { status: passed ? "passed" : "failed", ...output };
  }

  if (selectedStage === "left-pod") {
    const output = await runDoorWorkScenario({
      roomId: "room-02",
      beforeScreenshot: `${dir}/screenshots/left-pod-before-door.png`,
      afterScreenshot: `${dir}/screenshots/left-pod-after-door-action.png`
    });
    const passed = output.status === "passed" && output.recoveryScreenVisible === false;
    addCheck(checks, "left/top pod door action does not enter recovery", passed, output);
    writeJson(`${dir}/green-mode-left-pod-output.json`, { status: passed ? "passed" : "failed", ...output });
    return { status: passed ? "passed" : "failed", ...output };
  }

  if (selectedStage === "right-pod") {
    const output = await runDoorWorkScenario({
      roomId: "room-06",
      beforeScreenshot: `${dir}/screenshots/right-pod-before-door.png`,
      afterScreenshot: `${dir}/screenshots/right-pod-after-door-action.png`
    });
    const passed = output.status === "passed" && output.recoveryScreenVisible === false;
    addCheck(checks, "right/top pod door action does not enter recovery", passed, output);
    writeJson(`${dir}/green-mode-right-pod-output.json`, { status: passed ? "passed" : "failed", ...output });
    return { status: passed ? "passed" : "failed", ...output };
  }

  if (selectedStage === "grey-wall-adjacent") {
    const output = await runDoorWorkScenario({
      roomId: "room-14",
      beforeScreenshot: `${dir}/screenshots/left-pod-before-door.png`,
      afterScreenshot: `${dir}/screenshots/left-pod-after-door-action.png`,
      allowReadOnlyCandidate: true
    });
    const passed = output.recoveryScreenVisible === false && output.runtimeMarkerMatched === true;
    addCheck(checks, "grey wall/storage adjacent workflow is detected without recovery", passed, output);
    writeJson(`${dir}/grey-wall-adjacent-output.json`, { status: passed ? "passed" : "failed", ...output });
    return { status: passed ? "passed" : "failed", ...output };
  }

  if (selectedStage === "recovery-screen-negative") {
    const leftPod = await runDoorWorkScenario({
      roomId: "room-02",
      beforeScreenshot: `${dir}/screenshots/left-pod-before-door.png`,
      afterScreenshot: `${dir}/screenshots/left-pod-after-door-action.png`
    });
    const rightPod = await runDoorWorkScenario({
      roomId: "room-06",
      beforeScreenshot: `${dir}/screenshots/right-pod-before-door.png`,
      afterScreenshot: `${dir}/screenshots/right-pod-after-door-action.png`
    });
    const passed = leftPod.recoveryScreenVisible === false && rightPod.recoveryScreenVisible === false;
    addCheck(checks, "recovery screen remains absent during normal top-pod door work", passed, { leftPod, rightPod });
    writeJson(`${dir}/recovery-screen-negative-output.json`, {
      status: passed ? "passed" : "failed",
      leftPod,
      rightPod
    });
    return { status: passed ? "passed" : "failed", leftPod, rightPod };
  }

  throw new Error(`Unsupported stage: ${selectedStage}`);
}

async function runForcedRecoveryScenario() {
  const initScript = workspaceUnlockScript();
  const port = Number(readArg("--port", "6870"));
  const chromePort = Number(readArg("--chrome-port", "9870"));
  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await browser.navigate(
        `${browser.baseUrl}/?section=editor&forceLayoutEditorCrash=1`,
        `document.querySelector('.layout-editor-recovery-screen') != null`
      );
      await browser.screenshot(`${dir}/screenshots/recovery-screen-if-triggered.png`);
      const recoveryScreenVisible = await hasRecoveryScreen(browser);
      return {
        recoveryScreenVisible,
        detectedAsFailure: recoveryScreenVisible,
        runtimeUrl: `${browser.baseUrl}/?section=editor&forceLayoutEditorCrash=1`
      };
    }
  );
  return result;
}

async function runDoorWorkScenario({
  roomId,
  beforeScreenshot,
  afterScreenshot,
  allowReadOnlyCandidate = false
}) {
  const initScript = workspaceUnlockScript();
  const port = Number(readArg("--port", "6871")) + portOffset(roomId);
  const chromePort = Number(readArg("--chrome-port", "9871")) + portOffset(roomId);
  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1100, initScript },
    async (browser) => {
      await openSavedWorkingEditor(browser);
      const runtimeState = await readRuntimeState(browser);
      await selectRoom(browser, roomId);
      await browser.screenshot(beforeScreenshot);
      const before = await readDoorWorkState(browser);
      const addDoorResult = await clickRoomButton(browser, "Add door");
      await delay(250);
      const afterAddRecovery = await hasRecoveryScreen(browser);
      const selectedDoorId = await readSelectedDoorId(browser);
      let candidateResult = { attempted: false, reason: "no door selected" };
      if (!afterAddRecovery && selectedDoorId != null) {
        candidateResult = await attemptAdjacentCandidateSelection(browser, allowReadOnlyCandidate);
      }
      await delay(250);
      const recoveryScreenVisible = await hasRecoveryScreen(browser);
      await browser.screenshot(afterScreenshot);
      const after = await readDoorWorkState(browser);
      return {
        status: recoveryScreenVisible ? "failed" : "passed",
        roomId,
        runtimeMarker: runtimeState.batchMarker,
        runtimeMarkerMatched: runtimeState.batchMarker === editorRuntimeBuildMarker,
        commandBarExists: runtimeState.commandBarExists,
        addDoorResult,
        selectedDoorId,
        candidateResult,
        recoveryScreenVisible,
        before,
        after
      };
    }
  );
  return result;
}

async function openSavedWorkingEditor(browser) {
  await browser.navigate(
    `${browser.baseUrl}/?section=editor`,
    `document.querySelector('[data-runtime-build-info="true"]') != null`
  );
  await waitForExpression(
    browser,
    `document.querySelector('[data-runtime-build-info="true"]')?.getAttribute('data-batch-marker') === ${JSON.stringify(editorRuntimeBuildMarker)}`,
    10_000
  );
  await browser.evaluate(`localStorage.removeItem('nerdeus.floorplans.savedAuthoringRecords.v1')`);
  await browser.navigate(
    `${browser.baseUrl}/?section=editor`,
    `document.querySelector('[data-editor-command-bar="consolidated"]') != null`
  );
  await browser.evaluate(clickEnabledButton("Save working copy"));
  await waitForExpression(
    browser,
    `document.querySelector('[data-command-group="editor-tools"] button')?.disabled === false`,
    10_000
  );
}

async function selectRoom(browser, roomId) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="room"][data-layout-object-id="${roomId}"]');
    if (element == null) throw new Error('missing room ${roomId}');
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
    return true;
  })()`);
  await waitForExpression(browser, `document.querySelector('[data-room-quick-edit="ready"]') != null`, 10_000);
}

async function clickRoomButton(browser, label) {
  return browser.evaluate(`(() => {
    const root = document.querySelector('[data-room-quick-edit="ready"]');
    const button = Array.from(root?.querySelectorAll('button') ?? [])
      .find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) {
      return { clicked: false, reason: 'missing enabled room quick-edit button' };
    }
    button.click();
    return { clicked: true, label: ${JSON.stringify(label)} };
  })()`);
}

async function attemptAdjacentCandidateSelection(browser, allowReadOnlyCandidate) {
  return browser.evaluate(`(() => {
    const root = document.querySelector('[data-door-quick-edit="ready"]');
    const selects = Array.from(root?.querySelectorAll('select') ?? []);
    const select = selects[1] ?? null;
    if (select == null) {
      return { attempted: false, reason: 'candidate selector missing' };
    }
    const options = Array.from(select.options);
    const selectable = options.find((option) => option.value && !option.disabled) ?? null;
    if (select.disabled && ${JSON.stringify(!allowReadOnlyCandidate)}) {
      return { attempted: false, reason: 'candidate selector disabled', optionCount: options.length };
    }
    if (selectable == null) {
      return { attempted: false, reason: 'no enabled candidate option', optionCount: options.length };
    }
    select.value = selectable.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      attempted: true,
      selectedValue: selectable.value,
      optionText: selectable.textContent.trim(),
      optionCount: options.length
    };
  })()`);
}

async function readSelectedDoorId(browser) {
  return browser.evaluate(`(() => {
    const selected = document.querySelector('[data-layout-object-type="door"].layout-editor-stage__door-marker--selected, [data-layout-object-type="door"].layout-editor-stage__door--selected');
    if (selected != null) return selected.getAttribute('data-layout-object-id');
    const popover = document.querySelector('[data-door-quick-edit="ready"]');
    if (popover == null) return null;
    const door = Array.from(document.querySelectorAll('[data-layout-object-type="door"]')).at(-1);
    return door?.getAttribute('data-layout-object-id') ?? null;
  })()`);
}

async function readDoorWorkState(browser) {
  return browser.evaluate(`(() => ({
    doorCount: document.querySelectorAll('[data-layout-object-type="door"]').length,
    roomQuickEditVisible: document.querySelector('[data-room-quick-edit="ready"]') != null,
    doorQuickEditVisible: document.querySelector('[data-door-quick-edit="ready"]') != null,
    recoveryVisible: document.querySelector('.layout-editor-recovery-screen') != null,
    warningText: Array.from(document.querySelectorAll('[role="status"], .layout-validation-panel, .validation-drawer'))
      .map((item) => item.textContent.trim())
      .filter(Boolean)
      .join('\\n')
  }))()`);
}

async function hasRecoveryScreen(browser) {
  return browser.evaluate(`document.querySelector('.layout-editor-recovery-screen') != null`);
}

async function readRuntimeState(browser) {
  return browser.evaluate(`(() => {
    const panel = document.querySelector('[data-runtime-build-info="true"]');
    const commandBar = document.querySelector('[data-editor-command-bar="consolidated"]');
    return {
      batchMarker: panel?.getAttribute('data-batch-marker') ?? null,
      commandBarExists: commandBar != null
    };
  })()`);
}

function clickEnabledButton(label) {
  return `(() => {
    const expected = ${JSON.stringify(label)}.toLowerCase();
    const button = Array.from(document.querySelectorAll('button'))
      .find((item) => item.textContent.trim().toLowerCase() === expected && !item.disabled);
    if (button == null) throw new Error('missing enabled button: ${label}');
    button.click();
    return true;
  })()`;
}

function workspaceUnlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}

function portOffset(roomId) {
  const digits = roomId.match(/\d+/u)?.[0] ?? "0";
  return Number(digits) % 20;
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-door-authoring-crash-reproduction", [
    "red-mode-detects-recovery",
    "left-pod",
    "right-pod",
    "grey-wall-adjacent",
    "recovery-screen-negative"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-door-authoring-crash-reproduction.mjs --stage red-mode-detects-recovery --allow-partial --issue ${issue}`]: `${dir}/red-mode-detection-output.json`,
    [`node scripts/check-door-authoring-crash-reproduction.mjs --stage left-pod --allow-partial --issue ${issue}`]: `${dir}/green-mode-left-pod-output.json`,
    [`node scripts/check-door-authoring-crash-reproduction.mjs --stage right-pod --allow-partial --issue ${issue}`]: `${dir}/green-mode-right-pod-output.json`,
    [`node scripts/check-door-authoring-crash-reproduction.mjs --stage grey-wall-adjacent --allow-partial --issue ${issue}`]: `${dir}/grey-wall-adjacent-output.json`,
    [`node scripts/check-door-authoring-crash-reproduction.mjs --stage recovery-screen-negative --allow-partial --issue ${issue}`]: `${dir}/recovery-screen-negative-output.json`
  });
  writeCloseout(
    issue,
    "Browser reproduction harness detects forced editor recovery and proves normal top-pod door work stays out of recovery.",
    status,
    commands,
    [
      "This issue adds harness coverage only; product repair is handled by later issues.",
      "Candidate assignment is attempted when an enabled candidate exists; no unsafe automatic candidate is selected."
    ]
  );
}
