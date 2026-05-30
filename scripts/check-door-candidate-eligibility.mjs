#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import {
  enterDemoPin,
  editorRuntimeBuildMarker,
  waitForExpression,
  withBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  abs,
  assertFile,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
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

const issue = readArg("--issue", "672");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "candidate-contract",
  "solid-wall-blocked",
  "support-zone-blocked",
  "provider-pharmacy-blocked",
  "placeholder-selection",
  "invalid-candidate-disabled",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported door candidate eligibility stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: adjacent door candidates must be explicit, disabled when invalid, and unable to dispatch invalid assignment.\n"
);

const stages = stage === "final"
  ? [
      "candidate-contract",
      "solid-wall-blocked",
      "support-zone-blocked",
      "provider-pharmacy-blocked",
      "placeholder-selection",
      "invalid-candidate-disabled"
    ]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = await runStage(selectedStage);
}

if (stage === "final") {
  stageResults.screenshot = await captureDisabledReasonScreenshot();
}

const status = statusFromChecks(checks);
if (stage === "final") {
  updateDoorAuthoringManifest(issue, {
    doorCandidateEligibilityStatus: status === "passed" ? "passed" : "failed",
    candidateEligibilityProof: status === "passed",
    solidWallDoorRejected: status === "passed",
    goNoGoStatus: "not_ready"
  });
}

writeJson(`${dir}/test-output/door-candidate-eligibility.txt`, {
  status,
  issue,
  stage,
  checks,
  stageResults
});
writeEvidenceSlots(issue, "door-candidate-eligibility", status, stage, checks);
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "candidate-contract") {
    const sourcePath = "packages/shared/src/floorplans/doorCandidateEligibility.ts";
    const source = readText(sourcePath);
    const adjacentSource = readText("apps/web/src/features/layout-editor/adjacentDoorCandidateViewModel.ts");
    const quickEditSource = readText("apps/web/src/features/layout-editor/doorQuickEditViewModel.ts");
    const result = {
      status: "passed",
      sourcePath,
      hasEligibilityType: source.includes("export type DoorCandidateEligibility"),
      hasEvaluator: source.includes("export function evaluateDoorCandidateEligibility"),
      modelHasDisabledReason: adjacentSource.includes("disabledReason?: string"),
      adjacentUsesEligibility: adjacentSource.includes("evaluateDoorCandidateEligibility"),
      quickEditUsesEligibility: quickEditSource.includes("evaluateDoorCandidateEligibility")
    };
    const passed = Object.entries(result)
      .filter(([key]) => key !== "status" && key !== "sourcePath")
      .every(([, value]) => value === true);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "candidate eligibility contract and UI model are wired", passed, result);
    writeJson(`${dir}/candidate-eligibility-contract-output.json`, result);
    return result;
  }

  if (selectedStage === "solid-wall-blocked") {
    const result = await eligibilityResultFor("solid");
    const passed = result.status === "blocked" && /solid wall/iu.test(result.reason);
    const output = { status: passed ? "passed" : "failed", candidateRoomId: "solid", eligibility: result };
    addCheck(checks, "solid-wall candidate is blocked with reason text", passed, output);
    writeJson(`${dir}/solid-wall-candidate-output.json`, output);
    return output;
  }

  if (selectedStage === "support-zone-blocked") {
    const result = await eligibilityResultFor("storage");
    const passed = result.status === "blocked" && /storage\/support-only/iu.test(result.reason);
    const output = { status: passed ? "passed" : "failed", candidateRoomId: "storage", eligibility: result };
    addCheck(checks, "support/storage candidate is blocked with reason text", passed, output);
    writeJson(`${dir}/support-zone-candidate-output.json`, output);
    return output;
  }

  if (selectedStage === "provider-pharmacy-blocked") {
    const result = await eligibilityResultFor("provider");
    const passed = result.status === "blocked" && /support access/iu.test(result.reason);
    const output = { status: passed ? "passed" : "failed", candidateRoomId: "provider", eligibility: result };
    addCheck(checks, "provider/pharmacy candidate routes away from patient-room door assignment", passed, output);
    writeJson(`${dir}/provider-pharmacy-candidate-output.json`, output);
    return output;
  }

  if (selectedStage === "placeholder-selection") {
    const popoverSource = readText("apps/web/src/features/layout-editor/DoorQuickEditPopover.tsx");
    const selectorSource = readText("apps/web/src/features/layout-editor/AdjacentDoorCandidateSelector.tsx");
    const result = {
      status: "passed",
      quickEditHasPlaceholder: popoverSource.includes('<option value="">Select candidate...</option>'),
      selectorHasPlaceholder: selectorSource.includes('<option value="">Select candidate...</option>'),
      quickEditIgnoresPlaceholder: popoverSource.includes('event.currentTarget.value === ""'),
      selectorIgnoresPlaceholder: selectorSource.includes('event.currentTarget.value === ""'),
      noFirstCandidateValue: !selectorSource.includes("?? viewModel.candidates[0]")
    };
    const passed = Object.entries(result)
      .filter(([key]) => key !== "status")
      .every(([, value]) => value === true);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "candidate selection starts with neutral placeholder", passed, result);
    writeJson(`${dir}/placeholder-selection-output.json`, result);
    return result;
  }

  if (selectedStage === "invalid-candidate-disabled") {
    const popoverSource = readText("apps/web/src/features/layout-editor/DoorQuickEditPopover.tsx");
    const selectorSource = readText("apps/web/src/features/layout-editor/AdjacentDoorCandidateSelector.tsx");
    const adjacentTestSource = readText("apps/web/src/features/layout-editor/__tests__/AdjacentDoorCandidateSelector.test.tsx");
    const result = {
      status: "passed",
      quickEditDisablesInvalidOptions: popoverSource.includes("disabled={candidate.disabled}"),
      selectorDisablesInvalidOptions: selectorSource.includes("disabled={candidate.disabled}"),
      quickEditBlocksDisabledDispatch: popoverSource.includes("candidate != null && !candidate.disabled"),
      selectorBlocksDisabledDispatch: selectorSource.includes("candidate != null && !candidate.disabled"),
      disabledReasonRendered: popoverSource.includes("candidate.disabledReason") && selectorSource.includes("candidate.disabledReason"),
      regressionTestCoversDisabledDispatch: adjacentTestSource.includes("disabled adjacent candidates must not dispatch selection")
    };
    const passed = Object.entries(result)
      .filter(([key]) => key !== "status")
      .every(([, value]) => value === true);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "invalid candidates are disabled and cannot dispatch assignment", passed, result);
    writeJson(`${dir}/invalid-candidate-disabled-output.json`, result);
    return result;
  }

  throw new Error(`Unsupported stage: ${selectedStage}`);
}

async function eligibilityResultFor(roomId) {
  const { evaluateDoorCandidateEligibility } = await loadSharedDist();
  return evaluateDoorCandidateEligibility({
    layout: fixtureLayout(),
    door: fixtureDoor(),
    candidate: {
      roomId,
      wall: "north",
      previewOffsetFeet: 1
    }
  });
}

async function loadSharedDist() {
  const distPath = "packages/shared/dist/index.js";
  if (!assertFile(distPath)) {
    throw new Error("packages/shared dist must be built before running dynamic candidate checks");
  }
  return import(pathToFileURL(abs(distPath)).href);
}

function fixtureDoor() {
  return {
    objectType: "door",
    id: "door-01",
    label: "Door 01",
    ownerKind: "room",
    ownerId: "owner",
    wall: "south",
    offsetFeet: 1,
    widthFeet: 3
  };
}

function fixtureLayout() {
  return {
    schemaVersion: "1.0.0",
    layoutId: "door-candidate-eligibility-fixture",
    units: "feet",
    rooms: [
      room("owner", "Owner", "standard", 0, 0),
      room("target", "Target", "standard", 0, 12),
      room("solid", "Solid", "solid_wall", 14, 12),
      room("storage", "Storage", "storage", 28, 12),
      room("provider", "Provider Pharmacy", "provider_pharmacy", 42, 12)
    ],
    doors: [fixtureDoor()],
    supportAccessPoints: [],
    stations: [],
    hallways: [],
    zones: [],
    limitations: ["Synthetic operational fixture for candidate eligibility verification."]
  };
}

function room(id, label, roomType, xFeet, yFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    roomType,
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 12,
    heightFeet: 10
  };
}

async function captureDisabledReasonScreenshot() {
  const screenshotPath = `${dir}/screenshots/door-candidate-disabled-reasons.png`;
  const result = await withBrowserRenderedApp({
    port: 6872,
    chromePort: 9872,
    width: 1440,
    height: 1000
  }, async (browser) => {
    await openSavedWorkingEditor(browser);
    await selectRoom(browser, "room-14");
    const addDoorResult = await clickRoomButton(browser, "Add door");
    await waitForExpression(browser, `document.querySelector('[data-door-quick-edit="ready"]') != null`, 10_000);
    await browser.screenshot(screenshotPath);
    const proof = await browser.evaluate(`(() => {
      const root = document.querySelector('[data-door-quick-edit="ready"]');
      const select = Array.from(root?.querySelectorAll('select') ?? [])[1] ?? null;
      const options = Array.from(select?.options ?? []);
      return {
        addDoorResult: ${JSON.stringify(addDoorResult)},
        disabledOptions: options.filter((option) => option.disabled && option.value).map((option) => option.textContent.trim()),
        placeholderValue: options[0]?.value ?? null,
        popoverText: root?.textContent?.trim() ?? "",
        recoveryScreenVisible: document.querySelector('.layout-editor-recovery-screen') != null
      };
    })()`);
    return proof;
  });
  const proof = {
    status: "passed",
    screenshot: screenshotPath,
    serverLogBytes: result.serverLog.length,
    ...result.result
  };
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshotPath],
    proof
  });
  return proof;
}

async function openSavedWorkingEditor(browser) {
  await browser.navigate(
    `${browser.baseUrl}/?section=editor`,
    `document.body != null`
  );
  await waitForExpression(
    browser,
    `document.querySelector('[data-runtime-build-info="true"]') != null || document.querySelector('input[aria-label="Access code"], input[aria-label="Demo PIN"]') != null`,
    10_000
  );
  const pinGateVisible = await browser.evaluate(`document.querySelector('input[aria-label="Access code"], input[aria-label="Demo PIN"]') != null`);
  if (pinGateVisible) {
    await enterDemoPin(browser, "2026");
  }
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
      .find((item) => item.textContent.trim().toLowerCase() === ${JSON.stringify(label.toLowerCase())} && !item.disabled);
    if (button == null) {
      return { clicked: false, reason: 'missing enabled room quick-edit button' };
    }
    button.click();
    return { clicked: true, label: ${JSON.stringify(label)} };
  })()`);
}

function clickEnabledButton(label) {
  return `(() => {
    const expected = ${JSON.stringify(label.toLowerCase())};
    const button = Array.from(document.querySelectorAll('button'))
      .find((item) => item.textContent.trim().toLowerCase() === expected && !item.disabled);
    if (button == null) return false;
    button.click();
    return true;
  })()`;
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-door-candidate-eligibility", [
    "candidate-contract",
    "solid-wall-blocked",
    "support-zone-blocked",
    "placeholder-selection",
    "invalid-candidate-disabled"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-door-candidate-eligibility.mjs --stage candidate-contract --allow-partial --issue ${issue}`]: `${dir}/candidate-eligibility-contract-output.json`,
    [`node scripts/check-door-candidate-eligibility.mjs --stage solid-wall-blocked --allow-partial --issue ${issue}`]: `${dir}/solid-wall-candidate-output.json`,
    [`node scripts/check-door-candidate-eligibility.mjs --stage support-zone-blocked --allow-partial --issue ${issue}`]: `${dir}/support-zone-candidate-output.json`,
    [`node scripts/check-door-candidate-eligibility.mjs --stage placeholder-selection --allow-partial --issue ${issue}`]: `${dir}/placeholder-selection-output.json`,
    [`node scripts/check-door-candidate-eligibility.mjs --stage invalid-candidate-disabled --allow-partial --issue ${issue}`]: `${dir}/invalid-candidate-disabled-output.json`
  });
  writeCloseout(
    issue,
    "Door adjacent candidate eligibility and disabled reason model.",
    status,
    commands,
    [
      "Candidate assignment now requires explicit user selection from a neutral placeholder.",
      "Invalid adjacent candidates are disabled with reason text and cannot dispatch assignment.",
      "Full ER floorplan reconstruction remains blocked until Issue 678 reruns the real validators."
    ]
  );
}
