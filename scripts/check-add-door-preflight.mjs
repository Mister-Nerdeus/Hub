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

const issue = readArg("--issue", "673");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "preflight-contract",
  "patient-room-door",
  "solid-wall-reject",
  "storage-reject",
  "support-access-separation",
  "missing-selection",
  "warning-visible",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported add-door preflight stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: Add Door must preflight patient-room targets and return warnings for invalid targets.\n"
);

const stages = stage === "final"
  ? [
      "preflight-contract",
      "patient-room-door",
      "solid-wall-reject",
      "storage-reject",
      "support-access-separation",
      "missing-selection"
    ]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = await runStage(selectedStage);
}

if (stage === "final" || stage === "warning-visible") {
  stageResults.warningVisible = await captureBlockedAddDoorWarning();
}

const status = statusFromChecks(checks);
if (stage === "final") {
  updateDoorAuthoringManifest(issue, {
    addDoorPreflightStatus: status === "passed" ? "passed" : "failed",
    supportAccessSeparatedFromPatientDoor: status === "passed",
    goNoGoStatus: "not_ready"
  });
}

writeJson(`${dir}/test-output/add-door-preflight.txt`, {
  status,
  issue,
  stage,
  checks,
  stageResults
});
writeEvidenceSlots(issue, "add-door-preflight", status, stage, checks);
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "preflight-contract") {
    const sourcePath = "packages/shared/src/floorplans/doorPreflight.ts";
    const source = readText(sourcePath);
    const addDoorToolSource = readText("apps/web/src/features/layout-editor/addDoorTool.ts");
    const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
    const result = {
      status: "passed",
      sourcePath,
      hasPreflightResultType: source.includes("export type AddDoorPreflightResult"),
      hasPreflightFunction: source.includes("export function preflightAddDoor"),
      addDoorToolUsesPreflight: addDoorToolSource.includes("preflightAddDoor"),
      stageRecordsWarning: stageSource.includes("recordDoorAuthoringWarning"),
      stageBuildsPreflightWarning: stageSource.includes("buildAddDoorBlockedWarning")
    };
    const passed = Object.entries(result)
      .filter(([key]) => key !== "status" && key !== "sourcePath")
      .every(([, value]) => value === true);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "add-door preflight contract is wired through the tool and stage", passed, result);
    writeJson(`${dir}/add-door-preflight-contract-output.json`, result);
    return result;
  }

  if (selectedStage === "patient-room-door") {
    const resultValue = await preflightFor("patient", { offsetFeet: 99, widthFeet: 20 });
    const passed = resultValue.status === "allowed" &&
      resultValue.wall === "south" &&
      resultValue.widthFeet === 12 &&
      resultValue.offsetFeet === 0;
    const output = { status: passed ? "passed" : "failed", preflight: resultValue };
    addCheck(checks, "patient room add-door preflight allows and clamps defaults", passed, output);
    writeJson(`${dir}/patient-room-door-output.json`, output);
    return output;
  }

  if (selectedStage === "solid-wall-reject") {
    const resultValue = await preflightFor("solid");
    const passed = resultValue.status === "blocked" && /solid wall/iu.test(resultValue.reason);
    const output = { status: passed ? "passed" : "failed", preflight: resultValue };
    addCheck(checks, "solid wall add-door target is rejected", passed, output);
    writeJson(`${dir}/solid-wall-reject-output.json`, output);
    return output;
  }

  if (selectedStage === "storage-reject") {
    const resultValue = await preflightFor("storage");
    const passed = resultValue.status === "blocked" && /storage\/support-only/iu.test(resultValue.reason);
    const output = { status: passed ? "passed" : "failed", preflight: resultValue };
    addCheck(checks, "storage/support add-door target is rejected", passed, output);
    writeJson(`${dir}/storage-reject-output.json`, output);
    return output;
  }

  if (selectedStage === "support-access-separation") {
    const providerResult = await preflightFor("provider");
    const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
    const quickEditSource = readText("apps/web/src/features/layout-editor/roomQuickEditViewModel.ts");
    const passed = providerResult.status === "blocked" &&
      /support access point/iu.test(providerResult.reason) &&
      stageSource.includes("addSupportAccessToSelectedZone") &&
      quickEditSource.includes("Provider/pharmacy areas use support access point tooling.");
    const output = {
      status: passed ? "passed" : "failed",
      preflight: providerResult,
      supportAccessToolPresent: stageSource.includes("addSupportAccessToSelectedZone"),
      providerQuickEditReasonPresent: quickEditSource.includes("Provider/pharmacy areas use support access point tooling.")
    };
    addCheck(checks, "provider/pharmacy add-door routes to support-access tooling instead", passed, output);
    writeJson(`${dir}/provider-pharmacy-support-access-output.json`, output);
    return output;
  }

  if (selectedStage === "missing-selection") {
    const { preflightAddDoor } = await loadSharedDist();
    const resultValue = preflightAddDoor({ layout: fixtureLayout(), roomId: null });
    const passed = resultValue.status === "blocked" && /select a patient room/iu.test(resultValue.reason);
    const output = { status: passed ? "passed" : "failed", preflight: resultValue };
    addCheck(checks, "missing selected room is rejected by add-door preflight", passed, output);
    writeJson(`${dir}/missing-selection-output.json`, output);
    return output;
  }

  if (selectedStage === "warning-visible") {
    return { status: "passed", delegatedTo: "captureBlockedAddDoorWarning" };
  }

  throw new Error(`Unsupported stage: ${selectedStage}`);
}

async function preflightFor(roomId, overrides = {}) {
  const { preflightAddDoor } = await loadSharedDist();
  return preflightAddDoor({
    layout: fixtureLayout(),
    roomId,
    wall: "south",
    offsetFeet: 1,
    widthFeet: 4,
    ...overrides
  });
}

async function loadSharedDist() {
  const distPath = "packages/shared/dist/index.js";
  if (!assertFile(distPath)) {
    throw new Error("packages/shared dist must be built before running add-door preflight checks");
  }
  return import(pathToFileURL(abs(distPath)).href);
}

function fixtureLayout() {
  return {
    schemaVersion: "1.0.0",
    layoutId: "add-door-preflight-fixture",
    units: "feet",
    rooms: [
      room("patient", "Patient", "standard", 12, 10),
      room("solid", "Solid", "solid_wall", 12, 10),
      room("storage", "Storage", "storage", 12, 10),
      room("provider", "Provider Pharmacy", "provider_pharmacy", 12, 10)
    ],
    doors: [],
    supportAccessPoints: [],
    stations: [],
    hallways: [],
    zones: [],
    limitations: ["Synthetic operational fixture for add-door preflight verification."]
  };
}

function room(id, label, roomType, widthFeet, heightFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    roomType,
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet: 0,
    yFeet: 0,
    widthFeet,
    heightFeet
  };
}

async function captureBlockedAddDoorWarning() {
  const screenshotPath = `${dir}/screenshots/add-door-blocked-warning.png`;
  const result = await withBrowserRenderedApp({
    port: 6876,
    chromePort: 9876,
    width: 1440,
    height: 1000
  }, async (browser) => {
    await openSavedWorkingEditor(browser);
    await selectRoom(browser, "room-14");
    const addDoorToolbarResult = await clickEnabledButton(browser, "Add door");
    if (!addDoorToolbarResult.clicked) {
      throw new Error(`Add door toolbar command was not available: ${addDoorToolbarResult.reason ?? "unknown reason"}`);
    }
    await waitForExpression(
      browser,
      `Number(document.querySelector('[data-validation-drawer="compact-bottom"]')?.getAttribute('data-warning-count') ?? '0') > 0`,
      15_000
    );
    await browser.evaluate(`document.querySelector('[data-validation-drawer="compact-bottom"] summary')?.click()`);
    await waitForExpression(
      browser,
      `document.body.innerText.includes('add_door_preflight_blocked') && document.body.innerText.includes('Add door blocked')`,
      15_000
    );
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => ({
      addDoorToolbarResult: ${JSON.stringify(addDoorToolbarResult)},
      warningVisible: document.body.innerText.includes('Add door blocked'),
      warningCodeVisible: document.body.innerText.includes('add_door_preflight_blocked'),
      recoveryScreenVisible: document.querySelector('.layout-editor-recovery-screen') != null,
      drawerWarningCount: Number(document.querySelector('[data-validation-drawer="compact-bottom"]')?.getAttribute('data-warning-count') ?? '0'),
      validationDrawerText: document.querySelector('[data-validation-drawer="compact-bottom"]')?.textContent?.trim() ?? null,
      validationText: document.querySelector('.layout-validation-panel')?.textContent?.trim() ?? document.body.innerText
    }))()`);
  });
  const proof = {
    status: result.result.warningVisible && result.result.warningCodeVisible && !result.result.recoveryScreenVisible ? "passed" : "failed",
    screenshot: screenshotPath,
    serverLogBytes: result.serverLog.length,
    ...result.result
  };
  const passed = proof.status === "passed";
  addCheck(checks, "blocked add-door target produces visible warning without recovery", passed, proof);
  writeJson(`${dir}/warning-visible-output.json`, proof);
  return proof;
}

async function openSavedWorkingEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.body != null`);
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
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await clickEnabledButton(browser, "Save working copy");
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

async function clickEnabledButton(browser, label) {
  return browser.evaluate(`(() => {
    const expected = ${JSON.stringify(label.toLowerCase())};
    const button = Array.from(document.querySelectorAll('button'))
      .find((item) =>
        item.textContent.trim().toLowerCase() === expected &&
        !item.disabled &&
        item.closest('[data-room-quick-edit="ready"]') == null
      );
    if (button == null) return { clicked: false, reason: 'missing enabled button', label: ${JSON.stringify(label)} };
    button.click();
    return { clicked: true, label: ${JSON.stringify(label)} };
  })()`);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-add-door-preflight", [
    "preflight-contract",
    "patient-room-door",
    "solid-wall-reject",
    "storage-reject",
    "support-access-separation",
    "missing-selection",
    "warning-visible"
  ], [
    `node scripts/check-add-door-preflight.mjs --stage final --issue ${issue}`
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-add-door-preflight.mjs --stage preflight-contract --allow-partial --issue ${issue}`]: `${dir}/add-door-preflight-contract-output.json`,
    [`node scripts/check-add-door-preflight.mjs --stage patient-room-door --allow-partial --issue ${issue}`]: `${dir}/patient-room-door-output.json`,
    [`node scripts/check-add-door-preflight.mjs --stage solid-wall-reject --allow-partial --issue ${issue}`]: `${dir}/solid-wall-reject-output.json`,
    [`node scripts/check-add-door-preflight.mjs --stage storage-reject --allow-partial --issue ${issue}`]: `${dir}/storage-reject-output.json`,
    [`node scripts/check-add-door-preflight.mjs --stage support-access-separation --allow-partial --issue ${issue}`]: `${dir}/provider-pharmacy-support-access-output.json`,
    [`node scripts/check-add-door-preflight.mjs --stage missing-selection --allow-partial --issue ${issue}`]: `${dir}/missing-selection-output.json`,
    [`node scripts/check-add-door-preflight.mjs --stage warning-visible --allow-partial --issue ${issue}`]: `${dir}/warning-visible-output.json`,
    [`node scripts/check-add-door-preflight.mjs --stage final --issue ${issue}`]: `${dir}/test-output/add-door-preflight.txt`
  });
  writeCloseout(
    issue,
    "Add Door preflight and patient-room door tooling semantics.",
    status,
    commands,
    [
      "Add Door is preflighted for patient-room targets before dispatch.",
      "Storage, support-only, solid-wall, and provider/pharmacy targets produce warnings or disabled controls instead of door mutations.",
      "Full ER floorplan reconstruction remains blocked until Issue 678 reruns the real validators."
    ]
  );
}
