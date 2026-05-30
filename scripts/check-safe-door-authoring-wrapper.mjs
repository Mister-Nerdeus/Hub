#!/usr/bin/env node
import { pathToFileURL } from "node:url";
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

const issue = readArg("--issue", "671");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "wrapper-contract",
  "invalid-add-door",
  "invalid-assign-door",
  "invalid-width",
  "reducer-non-throw",
  "warning-output",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported safe door authoring wrapper stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: door mutations must return blocked results and editor warnings instead of throwing through the reducer.\n"
);

const stages = stage === "final"
  ? ["wrapper-contract", "invalid-add-door", "invalid-assign-door", "invalid-width", "reducer-non-throw", "warning-output"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = await runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (stage === "final") {
  updateDoorAuthoringManifest(issue, {
    safeDoorAuthoringWrapperStatus: status === "passed" ? "passed" : "failed",
    doorActionsNonThrowing: status === "passed",
    invalidDoorActionsBecomeWarnings: status === "passed",
    goNoGoStatus: "not_ready"
  });
}

writeJson(`${dir}/test-output/safe-door-authoring-wrapper.txt`, {
  status,
  issue,
  stage,
  checks,
  stageResults
});
writeEvidenceSlots(issue, "safe-door-authoring-wrapper", status, stage, checks);
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "wrapper-contract") {
    const sourcePath = "packages/shared/src/floorplans/safeDoorAuthoring.ts";
    const indexSource = readText("packages/shared/src/index.ts");
    const source = readText(sourcePath);
    const result = {
      status: "passed",
      sourcePath,
      hasSafeResultType: source.includes("export type SafeDoorAuthoringResult"),
      hasAppliedStatus: source.includes('status: "applied"'),
      hasBlockedStatus: source.includes('status: "blocked"'),
      exportsSafeAdd: source.includes("export function safeAddDoorToRoom"),
      exportsSafeAssign: source.includes("export function safeAssignDoorToRoom"),
      exportsSafeDelete: source.includes("export function safeDeleteDoor"),
      indexExportsWrapper: indexSource.includes("./floorplans/safeDoorAuthoring.js")
    };
    const passed = Object.entries(result)
      .filter(([key]) => key !== "status" && key !== "sourcePath")
      .every(([, value]) => value === true);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "safe door authoring result contract is exported", passed, result);
    writeJson(`${dir}/safe-wrapper-contract-output.json`, result);
    return result;
  }

  if (selectedStage === "invalid-add-door") {
    const { safeAddDoorToRoom } = await loadSharedDist();
    const layout = fixtureLayout();
    const missingRoomResult = safeAddDoorToRoom({
      layout,
      readOnly: false,
      doorId: "door-invalid-add",
      roomId: "missing-room",
      wall: "north",
      offsetFeet: 1,
      widthFeet: 3
    });
    const storageResult = safeAddDoorToRoom({
      layout,
      readOnly: false,
      doorId: "door-storage-add",
      roomId: "storage-room",
      wall: "north",
      offsetFeet: 1,
      widthFeet: 3
    });
    const providerResult = safeAddDoorToRoom({
      layout,
      readOnly: false,
      doorId: "door-provider-add",
      roomId: "provider-room",
      wall: "north",
      offsetFeet: 1,
      widthFeet: 3
    });
    const passed = [missingRoomResult, storageResult, providerResult]
      .every((resultValue) => blockedResultPreservesLayout(resultValue, layout));
    const result = {
      status: passed ? "passed" : "failed",
      missingRoom: summarizeBlockedResult(missingRoomResult, layout),
      storageRoom: summarizeBlockedResult(storageResult, layout),
      providerRoom: summarizeBlockedResult(providerResult, layout)
    };
    addCheck(checks, "invalid add door returns blocked result", passed, result);
    writeJson(`${dir}/invalid-add-door-output.json`, result);
    return result;
  }

  if (selectedStage === "invalid-assign-door") {
    const { safeAssignDoorToRoom } = await loadSharedDist();
    const layout = fixtureLayout();
    const missingRoomResult = safeAssignDoorToRoom({
      layout,
      readOnly: false,
      doorId: "door-01",
      roomId: "missing-room",
      wall: "north",
      offsetFeet: 1
    });
    const storageResult = safeAssignDoorToRoom({
      layout,
      readOnly: false,
      doorId: "door-01",
      roomId: "storage-room",
      wall: "north",
      offsetFeet: 1
    });
    const providerResult = safeAssignDoorToRoom({
      layout,
      readOnly: false,
      doorId: "door-01",
      roomId: "provider-room",
      wall: "north",
      offsetFeet: 1
    });
    const passed = [missingRoomResult, storageResult, providerResult]
      .every((resultValue) => blockedResultPreservesLayout(resultValue, layout));
    const result = {
      status: passed ? "passed" : "failed",
      missingRoom: summarizeBlockedResult(missingRoomResult, layout),
      storageRoom: summarizeBlockedResult(storageResult, layout),
      providerRoom: summarizeBlockedResult(providerResult, layout)
    };
    addCheck(checks, "invalid assignment returns blocked result", passed, result);
    writeJson(`${dir}/invalid-assign-door-output.json`, result);
    return result;
  }

  if (selectedStage === "invalid-width") {
    const { safeUpdateDoorWidth } = await loadSharedDist();
    const layout = fixtureLayout();
    const resultValue = safeUpdateDoorWidth({
      layout,
      readOnly: false,
      doorId: "door-01",
      wall: "north",
      offsetFeet: 1,
      widthFeet: Number.NaN
    });
    const passed = blockedResultPreservesLayout(resultValue, layout);
    const result = {
      status: passed ? "passed" : "failed",
      resultStatus: resultValue.status,
      layoutReferencePreserved: resultValue.layout === layout,
      warning: resultValue.warning ?? null
    };
    addCheck(checks, "invalid width returns blocked result", passed, result);
    writeJson(`${dir}/invalid-width-output.json`, result);
    return result;
  }

  if (selectedStage === "reducer-non-throw") {
    const reducerSource = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");
    const e2eSource = readText("apps/web/src/features/layout-editor/doorAuthoringE2E.test.ts");
    const result = {
      status: "passed",
      importsSafeWrappers: [
        "safeAddDoorToRoom",
        "safeMoveDoor",
        "safeUpdateDoorWidth",
        "safeAssignDoorToRoom",
        "safeDeleteDoor"
      ].every((token) => reducerSource.includes(token)),
      usesReducerBoundaryWrapper: reducerSource.includes("function applyDoorAuthoringMutation("),
      catchesReducerBoundaryErrors: reducerSource.includes("unexpectedDoorAuthoringWarning"),
      noThrowingRequireEditableDoorPath: !reducerSource.includes("requireEditableLayout(state)"),
      e2eNegativeCasesExpectWarnings: e2eSource.includes("blocksWithWarning")
    };
    const passed = Object.entries(result)
      .filter(([key]) => key !== "status")
      .every(([, value]) => value === true);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "reducer door mutations use non-throwing wrapper boundary", passed, result);
    writeJson(`${dir}/reducer-non-throw-output.json`, result);
    return result;
  }

  if (selectedStage === "warning-output") {
    const warningPath = "apps/web/src/features/layout-editor/layoutDoorAuthoringWarnings.ts";
    const warningSource = readText(warningPath);
    const reducerSource = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");
    const result = {
      status: "passed",
      warningPath,
      warningFileExists: assertFile(warningPath),
      buildsValidationWarning: warningSource.includes("buildDoorAuthoringValidationWarning"),
      usesDoorSyncSource: warningSource.includes('source: "door_sync"'),
      reducerAppendsWarning: reducerSource.includes("appendDoorAuthoringWarning")
    };
    const passed = Object.entries(result)
      .filter(([key]) => key !== "status" && key !== "warningPath")
      .every(([, value]) => value === true);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "blocked door actions produce layout validation warnings", passed, result);
    writeJson(`${dir}/warning-output.json`, result);
    return result;
  }

  throw new Error(`Unsupported stage: ${selectedStage}`);
}

async function loadSharedDist() {
  const distPath = "packages/shared/dist/index.js";
  if (!assertFile(distPath)) {
    throw new Error("packages/shared dist must be built before running dynamic wrapper checks");
  }
  return import(pathToFileURL(abs(distPath)).href);
}

function blockedResultPreservesLayout(result, layout) {
  return result.status === "blocked" &&
    result.layout === layout &&
    result.warning != null &&
    typeof result.warning.message === "string" &&
    result.warning.message.length > 0;
}

function summarizeBlockedResult(result, layout) {
  return {
    resultStatus: result.status,
    layoutReferencePreserved: result.layout === layout,
    warning: result.warning ?? null
  };
}

function fixtureLayout() {
  return {
    schemaVersion: "1.0.0",
    layoutId: "safe-door-authoring-wrapper-fixture",
    units: "feet",
    rooms: [
      {
        objectType: "room",
        id: "room-01",
        label: "Room 01",
        roomNumber: "01",
        roomType: "standard",
        capacityType: "single",
        isHallBed: false,
        isTraumaAdjacent: false,
        xFeet: 0,
        yFeet: 0,
        widthFeet: 12,
        heightFeet: 10
      },
      {
        objectType: "room",
        id: "storage-room",
        label: "Storage",
        roomNumber: "Storage",
        roomType: "storage",
        capacityType: "single",
        isHallBed: false,
        isTraumaAdjacent: false,
        xFeet: 14,
        yFeet: 0,
        widthFeet: 12,
        heightFeet: 10
      },
      {
        objectType: "room",
        id: "provider-room",
        label: "Provider Pharmacy",
        roomNumber: "Provider",
        roomType: "provider_pharmacy",
        capacityType: "single",
        isHallBed: false,
        isTraumaAdjacent: false,
        xFeet: 28,
        yFeet: 0,
        widthFeet: 12,
        heightFeet: 10
      }
    ],
    doors: [
      {
        objectType: "door",
        id: "door-01",
        label: "Room 01 Door",
        ownerKind: "room",
        ownerId: "room-01",
        wall: "north",
        offsetFeet: 1,
        widthFeet: 3
      }
    ],
    supportAccessPoints: [],
    stations: [],
    hallways: [],
    zones: [],
    limitations: ["Synthetic operational fixture for door authoring wrapper verification."]
  };
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-safe-door-authoring-wrapper", [
    "wrapper-contract",
    "invalid-add-door",
    "invalid-assign-door",
    "reducer-non-throw"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-safe-door-authoring-wrapper.mjs --stage wrapper-contract --allow-partial --issue ${issue}`]: `${dir}/safe-wrapper-contract-output.json`,
    [`node scripts/check-safe-door-authoring-wrapper.mjs --stage invalid-add-door --allow-partial --issue ${issue}`]: `${dir}/invalid-add-door-output.json`,
    [`node scripts/check-safe-door-authoring-wrapper.mjs --stage invalid-assign-door --allow-partial --issue ${issue}`]: `${dir}/invalid-assign-door-output.json`,
    [`node scripts/check-safe-door-authoring-wrapper.mjs --stage reducer-non-throw --allow-partial --issue ${issue}`]: `${dir}/reducer-non-throw-output.json`
  });
  writeCloseout(
    issue,
    "Safe door authoring result wrapper and reducer boundary handling.",
    status,
    commands,
    [
      "Invalid door actions now become validation warnings at the reducer boundary while preserving the previous layout.",
      "Full ER floorplan reconstruction remains blocked until Issue 678 reruns the real validators."
    ]
  );
}
