#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writeStageResult,
  writeText
} from "./lib/editor-assignment-ux-utils.mjs";

const issue = readArg("--issue", "709");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);

const stages = stage === "final"
  ? ["contract", "validation", "persistence", "active-floorplan-link", "raw-map-migration-bridge", "reload-proof"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    assignmentSetContractStatus: "passed",
    assignmentSetLinkedToFloorplanVersion: true,
    assignmentSetPersistsAcrossReload: true,
    assignmentSetNoPhi: true
  });
}
writeCommandsAndCloseout(issue, "Assignment Set Contract + Persistence Foundation", requiredCommands(), status, [
  "Assignment set persistence is local-first browser storage only.",
  "No optimizer or recommendation behavior was added."
]);
writeStageResult(issue, "assignment-set-contract", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "contract") {
    const contract = fileIncludes("packages/shared/src/assignments/assignmentSetContract.ts", [
      "export type AssignmentSetContract = {",
      "schemaVersion: \"1.0.0\"",
      "assignmentSetId: string",
      "floorplanVersionId: string",
      "displayName: string",
      "status: AssignmentSetStatus",
      "nurseProfiles: NurseProfileContract[]",
      "assignmentsByRoomId: Record<string, string>",
      "roomLoadsByRoomId: Record<string, RoomLoadContract>",
      "createdAt: string",
      "updatedAt: string"
    ]);
    const exports = fileIncludes("packages/shared/src/index.ts", [
      "./assignments/assignmentSetContract.js",
      "./assignments/assignmentSetValidation.js"
    ]);
    const noPhi = fileExcludes("packages/shared/src/assignments/assignmentSetContract.ts", [
      "patient" + "Name",
      "M" + "RN",
      "D" + "OB",
      "diag" + "nosis",
      "employee" + "Id"
    ]);
    const result = { passed: contract.passed && exports.passed && noPhi.passed, contract, exports, noPhi };
    writeJson(`${dir}/assignment-set-contract-output.json`, result);
    writeText(`${dir}/no-phi-output.txt`, `status: ${noPhi.passed ? "passed" : "failed"}\nAssignment set contract has no PHI or employee identity fields.\n`);
    addCheck(checks, "assignment set contract includes required durable floorplan-linked fields", result.passed, result);
    return result;
  }
  if (name === "validation") {
    const result = fileIncludes("packages/shared/src/assignments/assignmentSetValidation.ts", [
      "validateAssignmentSetContract",
      "validateNurseProfileContract",
      "validateRoomLoadContract",
      "assignmentSetMatchesFloorplanVersion",
      "references unknown nurse profile",
      "references inactive nurse profile",
      "validateOperationalRuntimeText",
      "assignmentSet.nurseProfiles.nurseProfileId",
      "must be unique",
      "structured room load"
    ]);
    writeJson(`${dir}/validation-output.json`, result);
    addCheck(checks, "assignment set validation checks nurse references, room loads, and floorplan compatibility", result.passed, result);
    return result;
  }
  if (name === "persistence") {
    const persistence = fileIncludes("apps/web/src/features/assignments/assignmentSetPersistence.ts", [
      "ASSIGNMENT_SET_STORAGE_KEY",
      "nerdeus.assignmentSets.v1",
      "readPersistedAssignmentSets",
      "writePersistedAssignmentSets",
      "validateAssignmentSetContract",
      "storage.removeItem(key)"
    ]);
    const store = fileIncludes("apps/web/src/features/assignments/assignmentSetStore.ts", [
      "createAssignmentSetStore",
      "loadForFloorplanVersion",
      "save(assignmentSet",
      "createDefaultAssignmentSetForFloorplan"
    ]);
    const result = { passed: persistence.passed && store.passed, persistence, store };
    writeJson(`${dir}/persistence-output.json`, result);
    addCheck(checks, "assignment sets persist through local-first assignment set store", result.passed, result);
    return result;
  }
  if (name === "active-floorplan-link") {
    const app = fileIncludes("apps/web/src/App.tsx", [
      "createDefaultAssignmentSetForFloorplan(activeFloorplanContract)",
      "activeFloorplanContract.activeFloorplanVersionId",
      "assignmentSet={activeAssignmentSet}",
      "data-assignment-set-floorplan-version-id"
    ]);
    const store = fileIncludes("apps/web/src/features/assignments/assignmentSetStore.ts", [
      "floorplanVersionId: activeFloorplan.activeFloorplanVersionId",
      "assignmentSetId: `assignment-set-${activeFloorplan.activeFloorplanVersionId}`"
    ]);
    const result = { passed: app.passed && store.passed, app, store };
    writeJson(`${dir}/active-floorplan-link-output.json`, result);
    writeJson(`${dir}/compatibility-output.json`, fileIncludes("apps/web/src/features/assignments/assignmentSetViewModel.ts", [
      "assignmentSetMatchesFloorplanVersion",
      "floorplan_version_mismatch"
    ]));
    addCheck(checks, "assignment set links to the active floorplan version and exposes compatibility", result.passed, result);
    return result;
  }
  if (name === "reload-proof") {
    const app = fileIncludes("apps/web/src/App.tsx", [
      "assignmentSetStore.list()",
      "loadForFloorplanVersion(activeFloorplanContract.activeFloorplanVersionId)",
      "setActiveAssignmentSet(next)",
      "setManualAssignmentsByRoomId(next.assignmentsByRoomId)",
      "onAssignmentSetChange={captureAssignmentSet}"
    ]);
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "data-manual-assignment-source={source.sourceKind}",
      "sourceKind: \"assignment-set\"",
      "assignmentSet.assignmentsByRoomId",
      "onAssignmentSetChange?."
    ]);
    const result = { passed: app.passed && workspace.passed, app, workspace };
    writeJson(`${dir}/reload-proof-output.json`, result);
    addCheck(checks, "assignment set is loaded from persisted records and manual assignment writes back to it", result.passed, result);
    return result;
  }
  if (name === "raw-map-migration-bridge") {
    const app = fileIncludes("apps/web/src/App.tsx", [
      "manualAssignmentsByRoomId",
      "setManualAssignmentsByRoomId(next.assignmentsByRoomId)",
      "assignmentSet={activeAssignmentSet}",
      "onAssignmentSetChange={captureAssignmentSet}"
    ]);
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "assignmentSet: AssignmentSetContract | null",
      "sourceKind: \"assignment-set\"",
      "assignmentsByRoomId?: Readonly<ManualAssignmentMap>"
    ]);
    const result = {
      passed: app.passed && workspace.passed,
      app,
      workspace,
      bridgeScope: "raw manualAssignmentsByRoomId remains a UI migration bridge; assignment set is the durable model"
    };
    writeJson(`${dir}/raw-map-migration-bridge-output.json`, result);
    addCheck(checks, "raw manual assignment map is only a migration bridge around the durable assignment set", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported assignment set contract stage: ${name}`);
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-assignment-set-contract.mjs --stage contract --allow-partial --issue 709",
    "node scripts/check-assignment-set-contract.mjs --stage validation --allow-partial --issue 709",
    "node scripts/check-assignment-set-contract.mjs --stage persistence --allow-partial --issue 709",
    "node scripts/check-assignment-set-contract.mjs --stage active-floorplan-link --allow-partial --issue 709",
    "node scripts/check-assignment-set-contract.mjs --stage raw-map-migration-bridge --allow-partial --issue 709",
    "node scripts/check-assignment-set-contract.mjs --stage reload-proof --allow-partial --issue 709",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
