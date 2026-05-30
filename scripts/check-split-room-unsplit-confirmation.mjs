#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  requiredIssueCommands,
  statusFromChecks,
  updateSplitRoomCloseoutHardeningManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageSummary,
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";
import {
  waitForExpression,
  withBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";

const issue = readArg("--issue", "692");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "confirmation-ui",
  "cancel-preserves-split",
  "confirm-removes-parent",
  "child-rooms-preserved",
  "undo-proof",
  "status-copy",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room unsplit confirmation stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: Unsplit must require explicit confirmation, preserve child rooms, and remain undoable.\n"
);

const stages = stage === "final"
  ? [
      "confirmation-ui",
      "cancel-preserves-split",
      "confirm-removes-parent",
      "child-rooms-preserved",
      "undo-proof",
      "status-copy"
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
    splitRoomUnsplitConfirmationStatus: "passed",
    unsplitRequiresConfirmation: true,
    unsplitCancelPreservesSplit: true,
    unsplitPreservesChildRooms: true,
    splitRoomStatusCopyCurrentGo: true
  });
}

writeStageSummary(issue, "split-room-unsplit-confirmation", status, stage, checks, stageResults);
writeJson(`${dir}/screenshot-index.json`, {
  status: proof.status,
  screenshots: [
    "unsplit-confirmation-open.png",
    "unsplit-cancel-preserves-split.png",
    "unsplit-confirm-removes-parent.png",
    "split-room-status-current-go.png"
  ].map((name) => `${dir}/screenshots/${name}`)
});
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage, browserProof) {
  if (selectedStage === "confirmation-ui") {
    const output = {
      status: browserProof.confirmationUiOpened && browserProof.splitStillExistsAfterRequest && browserProof.nativeConfirmCalls === 0
        ? "passed"
        : "failed",
      confirmationText: browserProof.confirmationText,
      splitStillExistsAfterRequest: browserProof.splitStillExistsAfterRequest,
      nativeConfirmCalls: browserProof.nativeConfirmCalls
    };
    writeJson(`${dir}/confirmation-ui-output.json`, output);
    addCheck(checks, "first Unsplit click opens confirmation without removing the split room", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "cancel-preserves-split") {
    const output = {
      status: browserProof.cancelPreservedSplit ? "passed" : "failed",
      splitExistsAfterCancel: browserProof.splitExistsAfterCancel,
      confirmationOpenAfterCancel: browserProof.confirmationOpenAfterCancel
    };
    writeJson(`${dir}/cancel-preserves-split-output.json`, output);
    addCheck(checks, "Cancel preserves Split Room 4/5", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "confirm-removes-parent") {
    const output = {
      status: browserProof.confirmRemovedParentOnly ? "passed" : "failed",
      splitExistsAfterConfirm: browserProof.splitExistsAfterConfirm,
      statusMessage: browserProof.statusMessage
    };
    writeJson(`${dir}/confirm-removes-parent-output.json`, output);
    addCheck(checks, "Confirm removes the parent split grouping", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "child-rooms-preserved") {
    const output = {
      status: browserProof.childRoomsPreserved ? "passed" : "failed",
      visibleChildRoomIdsAfterConfirm: browserProof.visibleChildRoomIdsAfterConfirm
    };
    writeJson(`${dir}/child-rooms-preserved-output.json`, output);
    addCheck(checks, "Rooms 4 and 5 remain available after unsplit", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "undo-proof") {
    const output = {
      status: browserProof.undoRestoredSplit ? "passed" : "failed",
      splitExistsAfterUndo: browserProof.splitExistsAfterUndo,
      undoButtonClicked: browserProof.undoButtonClicked
    };
    writeJson(`${dir}/undo-proof-output.json`, output);
    addCheck(checks, "Undo restores Split Room 4/5 after confirmed unsplit", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "status-copy") {
    const output = {
      status: browserProof.statusCopyCurrentGo ? "passed" : "failed",
      topBlock: browserProof.statusTopBlock
    };
    writeJson(`${dir}/status-copy-output.json`, output);
    addCheck(checks, "split-room status document starts with current GO status", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage: ${selectedStage}`);
}

async function runBrowserProof() {
  const statusDocProof = readStatusDocProof();
  const { result } = await withBrowserRenderedApp({
    port: 5392,
    chromePort: 9892,
    width: 1440,
    height: 1100,
    initScript: workspaceUnlockScript()
  }, async (browser) => {
    await openWorkingEditor(browser);
    await selectObject(browser, "room", "room-05");
    await waitForExpression(browser, `document.body.innerText.includes('Create Split Room 4/5')`, 10_000);
    const createSplit = await clickScopedButton(browser, '[data-room-quick-edit="ready"]', "Create Split Room 4/5");
    await waitForExpression(browser, splitBayExistsExpression("split-bay-room-04-room-05"), 10_000);
    await selectObject(browser, "split_bay", "split-bay-room-04-room-05");
    await waitForExpression(browser, `document.querySelector('[data-split-room-inspector="ready"]') != null`, 10_000);
    await browser.evaluate(`(() => {
      window.__unsplitNativeConfirmCalls = 0;
      window.confirm = () => {
        window.__unsplitNativeConfirmCalls += 1;
        return true;
      };
    })()`);

    const requestClick = await clickScopedButton(browser, '[data-split-room-inspector="ready"]', "Unsplit 4/5");
    await waitForExpression(browser, `document.querySelector('[data-unsplit-confirmation="open"]') != null`, 10_000);
    await browser.screenshot(`${dir}/screenshots/unsplit-confirmation-open.png`);
    const confirmationState = await readConfirmationState(browser);

    const cancelClick = await clickScopedButton(browser, '[data-unsplit-confirmation="open"]', "Cancel");
    await waitForExpression(browser, `document.querySelector('[data-unsplit-confirmation="open"]') == null`, 10_000);
    await browser.screenshot(`${dir}/screenshots/unsplit-cancel-preserves-split.png`);
    const cancelState = await readCancelState(browser);

    const secondRequestClick = await clickScopedButton(browser, '[data-split-room-inspector="ready"]', "Unsplit 4/5");
    await waitForExpression(browser, `document.querySelector('[data-unsplit-confirmation="open"]') != null`, 10_000);
    const confirmClick = await clickScopedButton(browser, '[data-unsplit-confirmation="open"]', "Confirm Unsplit");
    await waitForExpression(browser, `document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="split-bay-room-04-room-05"]') == null`, 10_000);
    await waitForExpression(browser, `document.querySelector('[data-split-room-status-message="true"]')?.textContent?.includes('Split Room 4/5 removed') === true`, 10_000);
    await browser.screenshot(`${dir}/screenshots/unsplit-confirm-removes-parent.png`);
    const confirmState = await readConfirmState(browser);

    const undoButtonClicked = await clickGlobalButton(browser, "Undo");
    await waitForExpression(browser, splitBayExistsExpression("split-bay-room-04-room-05"), 10_000);
    const undoState = await readUndoState(browser, undoButtonClicked.clicked);

    const recoveryScreenVisible = await browser.evaluate(`document.querySelector('.layout-editor-recovery-screen') != null`);
    writeJson(`${dir}/no-recovery-screen-output.json`, {
      status: recoveryScreenVisible ? "failed" : "passed",
      recoveryScreenVisible
    });

    await renderStatusDocScreenshot(browser, statusDocProof.statusTopBlock);

    const proof = {
      createSplitClicked: createSplit.clicked,
      requestClick,
      cancelClick,
      secondRequestClick,
      confirmClick,
      recoveryScreenVisible,
      ...confirmationState,
      ...cancelState,
      ...confirmState,
      ...undoState,
      ...statusDocProof
    };

    return {
      ...proof,
      status: proofOverallPassed(proof) ? "passed" : "failed"
    };
  });

  return result;
}

async function openWorkingEditor(browser) {
  const editorUrl = `${browser.baseUrl}/?section=editor&proof=unsplit-confirmation-${Date.now()}`;
  await browser.navigate(editorUrl, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate(`(() => {
    localStorage.removeItem('nerdeus.floorplans.savedAuthoringRecords.v1');
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('nerdeus.layoutEditor.localDraft.v2.')) localStorage.removeItem(key);
    }
  })()`);
  await browser.navigate(editorUrl, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  let createdWorkingCopy = await clickGlobalButtonEventually(browser, "Save Working Copy", 1_500);
  if (!createdWorkingCopy.clicked) {
    createdWorkingCopy = await clickGlobalButtonEventually(browser, "Create working copy");
  }
  if (!createdWorkingCopy.clicked) {
    const editorState = await browser.evaluate(`(() => ({
      bodyText: document.body.textContent.slice(0, 800),
      readOnly: document.querySelector('.layout-editor-stage__svg')?.getAttribute('data-read-only') ?? null,
      buttons: Array.from(document.querySelectorAll('button')).map((button) => ({
        text: button.textContent.trim(),
        disabled: button.disabled,
        control: button.getAttribute('data-editor-control')
      }))
    }))()`);
    throw new Error(`Working copy control was not available while opening the working editor: ${JSON.stringify(editorState)}`);
  }
  await waitForExpression(
    browser,
    `document.querySelector('.layout-editor-stage__svg')?.getAttribute('data-read-only') === 'false'`,
    10_000
  );
}

async function selectObject(browser, objectType, objectId) {
  const readyExpression = objectType === "split_bay"
    ? `document.querySelector('[data-split-bay-quick-edit="ready"]')?.textContent?.includes('Split Room 4/5') === true`
    : `document.querySelector('[data-room-quick-edit="ready"]')?.textContent?.includes('Create Split Room 4/5') === true`;
  const start = Date.now();
  while (Date.now() - start < 10_000) {
    await browser.evaluate(`(() => {
      const element = document.querySelector('[data-layout-object-type="${objectType}"][data-layout-object-id="${objectId}"]');
      if (element == null) return false;
      const rect = element.getBoundingClientRect();
      element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
      return true;
    })()`);
    if (await browser.evaluate(readyExpression)) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  const selectedText = await browser.evaluate(`document.querySelector('[data-room-quick-edit="ready"], [data-split-bay-quick-edit="ready"]')?.textContent?.replace(/\\s+/g, ' ').trim() ?? null`);
  throw new Error(`Timed out selecting ${objectType} ${objectId}: ${selectedText}`);
}

async function readConfirmationState(browser) {
  return browser.evaluate(`(() => {
    const confirmation = document.querySelector('[data-unsplit-confirmation="open"]');
    const text = confirmation?.textContent?.replace(/\\s+/g, ' ').trim() ?? '';
    return {
      confirmationUiOpened: confirmation != null &&
        text.includes('Unsplit Split Room 4/5?') &&
        text.includes('This removes the split-room grouping but preserves Room 4 and Room 5.') &&
        text.includes('Child assignments may remain if assignment state exists.') &&
        text.includes('Cancel') &&
        text.includes('Confirm Unsplit'),
      confirmationText: text,
      splitStillExistsAfterRequest: document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="split-bay-room-04-room-05"]') != null,
      nativeConfirmCalls: Number(window.__unsplitNativeConfirmCalls ?? 0)
    };
  })()`);
}

async function readCancelState(browser) {
  return browser.evaluate(`(() => ({
    splitExistsAfterCancel: document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="split-bay-room-04-room-05"]') != null,
    confirmationOpenAfterCancel: document.querySelector('[data-unsplit-confirmation="open"]') != null,
    cancelPreservedSplit:
      document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="split-bay-room-04-room-05"]') != null &&
      document.querySelector('[data-unsplit-confirmation="open"]') == null
  }))()`);
}

async function readConfirmState(browser) {
  return browser.evaluate(`(() => {
    const statusMessage = document.querySelector('[data-split-room-status-message="true"]')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '';
    const visibleChildRoomIdsAfterConfirm = ['room-04', 'room-05'].filter((roomId) =>
      document.querySelector('[data-layout-object-type="room"][data-layout-object-id="' + roomId + '"]') != null
    );
    const splitExistsAfterConfirm = document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="split-bay-room-04-room-05"]') != null;
    return {
      splitExistsAfterConfirm,
      statusMessage,
      visibleChildRoomIdsAfterConfirm,
      confirmRemovedParentOnly:
        !splitExistsAfterConfirm &&
        statusMessage === 'Split Room 4/5 removed. Rooms 4 and 5 remain available.',
      childRoomsPreserved:
        visibleChildRoomIdsAfterConfirm.includes('room-04') &&
        visibleChildRoomIdsAfterConfirm.includes('room-05')
    };
  })()`);
}

async function readUndoState(browser, undoButtonClicked) {
  return browser.evaluate(`(() => ({
    undoButtonClicked: ${JSON.stringify(Boolean(undoButtonClicked))},
    splitExistsAfterUndo: document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="split-bay-room-04-room-05"]') != null,
    undoRestoredSplit:
      ${JSON.stringify(Boolean(undoButtonClicked))} &&
      document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="split-bay-room-04-room-05"]') != null
  }))()`);
}

async function renderStatusDocScreenshot(browser, topBlock) {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { background: #f8fafc; color: #111827; font: 16px/1.5 system-ui, sans-serif; margin: 0; padding: 32px; }
      main { background: #ffffff; border: 1px solid #c4d0dc; border-radius: 8px; max-width: 880px; padding: 24px; }
      h1 { font-size: 28px; line-height: 1.2; margin: 0 0 18px; }
      p { margin: 0 0 12px; }
    </style>
  </head>
  <body>
    <main data-status-doc-top="true">
      ${topBlock.split("\n").map((line, index) => index === 0
        ? `<h1>${escapeHtml(line.replace(/^#\\s*/, ""))}</h1>`
        : line.trim() === ""
          ? ""
          : `<p>${escapeHtml(line)}</p>`).join("")}
    </main>
  </body>
</html>`;
  await browser.navigate(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`, `document.querySelector('[data-status-doc-top="true"]') != null`);
  await browser.screenshot(`${dir}/screenshots/split-room-status-current-go.png`);
}

function readStatusDocProof() {
  const expectedTopBlock = [
    "# Split-Room Authoring Status",
    "",
    "Current Status: GO for full ER floorplan reconstruction.",
    "",
    "Issue 688 closed the user workflow: select Room 5, create Split Room 4/5, verify divider and labels, save, reload, export/import JSON, and assign child positions independently.",
    "",
    "Historical note: Issue 679 began with split-room authoring not user-ready. The status changed after the 679–688 truth loop passed."
  ].join("\n");
  const text = readText("docs/project/split-room-authoring-status.md").replace(/\r\n/g, "\n");
  const topBlock = text.split("\n").slice(0, 7).join("\n");
  return {
    statusTopBlock: topBlock,
    statusCopyCurrentGo: topBlock === expectedTopBlock
  };
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

async function clickGlobalButtonEventually(browser, label, timeoutMs = 10_000) {
  const start = Date.now();
  let lastResult = null;
  while (Date.now() - start < timeoutMs) {
    lastResult = await clickGlobalButton(browser, label);
    if (lastResult.clicked) return lastResult;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  return lastResult ?? { clicked: false, reason: "timeout waiting for enabled button", label };
}

function splitBayExistsExpression(splitBayId) {
  return `document.querySelector('[data-layout-object-type="split_bay"][data-layout-object-id="${splitBayId}"]') != null`;
}

function proofOverallPassed(proof) {
  return Boolean(
    proof.createSplitClicked &&
    proof.requestClick?.clicked &&
    proof.confirmationUiOpened &&
    proof.splitStillExistsAfterRequest &&
    proof.nativeConfirmCalls === 0 &&
    proof.cancelClick?.clicked &&
    proof.cancelPreservedSplit &&
    proof.secondRequestClick?.clicked &&
    proof.confirmClick?.clicked &&
    proof.confirmRemovedParentOnly &&
    proof.childRoomsPreserved &&
    proof.undoRestoredSplit &&
    proof.statusCopyCurrentGo &&
    !proof.recoveryScreenVisible
  );
}

function workspaceUnlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}

function escapeHtml(value) {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-unsplit-confirmation", [
    "confirmation-ui",
    "cancel-preserves-split",
    "confirm-removes-parent",
    "child-rooms-preserved",
    "undo-proof",
    "status-copy"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-unsplit-confirmation.mjs --stage confirmation-ui --allow-partial --issue ${issue}`]: `${dir}/confirmation-ui-output.json`,
    [`node scripts/check-split-room-unsplit-confirmation.mjs --stage cancel-preserves-split --allow-partial --issue ${issue}`]: `${dir}/cancel-preserves-split-output.json`,
    [`node scripts/check-split-room-unsplit-confirmation.mjs --stage confirm-removes-parent --allow-partial --issue ${issue}`]: `${dir}/confirm-removes-parent-output.json`,
    [`node scripts/check-split-room-unsplit-confirmation.mjs --stage child-rooms-preserved --allow-partial --issue ${issue}`]: `${dir}/child-rooms-preserved-output.json`,
    [`node scripts/check-split-room-unsplit-confirmation.mjs --stage undo-proof --allow-partial --issue ${issue}`]: `${dir}/undo-proof-output.json`,
    [`node scripts/check-split-room-unsplit-confirmation.mjs --stage status-copy --allow-partial --issue ${issue}`]: `${dir}/status-copy-output.json`
  });
  writeCloseout(
    issue,
    "Unsplit confirmation and split-room status copy cleanup.",
    status,
    commands,
    [
      "Browser proof uses the real editor route and local working-copy authoring flow.",
      "Unsplit removes only the split-room grouping; child room geometry is preserved by the existing reducer contract."
    ],
    ["docs/verification/split-room-closeout-hardening-manifest.json"]
  );
}
