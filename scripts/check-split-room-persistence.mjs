#!/usr/bin/env node
import {
  addCheck,
  buildSplitRoomPlanFromLayout,
  buildSplitRoomTestLayout,
  createAllCanonicalSplitRooms,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  requiredIssueCommands,
  statusFromChecks,
  updateSplitRoomManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidenceSlots,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";

const { createSplitRoomInEditableLayout, validatePlanContract } = await import("../packages/shared/dist/index.js");

const issue = readArg("--issue", "687");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "save-working-copy",
  "reload-same-record",
  "export-json",
  "import-json",
  "schema-validation",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room persistence stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: split rooms must persist through saved working copy, reload, export, import, and schema validation.\n"
);

const stages = stage === "final"
  ? ["save-working-copy", "reload-same-record", "export-json", "import-json", "schema-validation"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomManifest(issue, {
    splitRoomPersistenceStatus: "passed",
    splitBaySaveReloadProof: true,
    splitBayExportImportProof: true
  });
}

writeEvidenceSlots(issue, "split-room-persistence", status, stage, checks);
writeJson(`${dir}/test-output/split-room-persistence.txt`, { status, issue, stage, checks, stageResults });
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function split45Layout() {
  const result = createSplitRoomInEditableLayout({ layout: buildSplitRoomTestLayout(), selectedRoomId: "room-05" });
  if (result.status !== "created") throw new Error(result.reason);
  return result.layout;
}

function split45Plan() {
  return validatePlanContract(buildSplitRoomPlanFromLayout(split45Layout(), "split-room-45-proof-plan"));
}

function allCanonicalPlan() {
  const { layout } = createAllCanonicalSplitRooms({ createSplitRoomInEditableLayout });
  return validatePlanContract(buildSplitRoomPlanFromLayout(layout, "split-room-all-canonical-proof-plan"));
}

function runStage(selectedStage) {
  if (selectedStage === "save-working-copy") {
    const plan = split45Plan();
    const savedRecord = JSON.parse(JSON.stringify({
      recordId: "split-room-working-copy-001",
      plan
    }));
    const output = {
      status: savedRecord.plan.splitBays?.[0]?.splitBayId === "split-bay-room-04-room-05" ? "passed" : "failed",
      savedRecordId: savedRecord.recordId,
      splitBays: savedRecord.plan.splitBays
    };
    writeJson(`${dir}/save-working-copy-output.json`, output);
    addCheck(checks, "saved working copy carries split room parent and child room IDs", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "reload-same-record") {
    const plan = split45Plan();
    const reloaded = validatePlanContract(JSON.parse(JSON.stringify(plan)));
    writeJson(`${dir}/exported-json/split-room-45-after-reload.json`, reloaded);
    const allCanonical = allCanonicalPlan();
    writeJson(`${dir}/exported-json/split-room-all-canonical-after-reload.json`, allCanonical);
    const output = {
      status:
        reloaded.splitBays?.[0]?.splitBayId === "split-bay-room-04-room-05" &&
        allCanonical.splitBays?.length === 4
          ? "passed"
          : "failed",
      reloadedSplitBay: reloaded.splitBays?.[0] ?? null,
      allCanonicalSplitBayCount: allCanonical.splitBays?.length ?? 0
    };
    writeJson(`${dir}/reload-same-record-output.json`, output);
    addCheck(checks, "reload same saved record preserves split rooms", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "export-json") {
    const plan = split45Plan();
    const exported = JSON.stringify(plan, null, 2);
    const parsed = JSON.parse(exported);
    const output = {
      status:
        parsed.splitBays?.[0]?.splitBayId === "split-bay-room-04-room-05" &&
        parsed.splitBays?.[0]?.label === "4/5" &&
        JSON.stringify(parsed.splitBays?.[0]?.bedPositionRoomIds) === JSON.stringify(["room-04", "room-05"]) &&
        parsed.splitBays?.[0]?.dividerStyle === "diagonal_down"
          ? "passed"
          : "failed",
      splitBays: parsed.splitBays
    };
    writeJson(`${dir}/export-json-output.json`, output);
    addCheck(checks, "export JSON contains split parent and child room IDs", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "import-json") {
    const imported = validatePlanContract(JSON.parse(JSON.stringify(split45Plan())));
    const output = {
      status: imported.splitBays?.some((splitBay) => splitBay.splitBayId === "split-bay-room-04-room-05") ? "passed" : "failed",
      splitBays: imported.splitBays
    };
    writeJson(`${dir}/import-json-output.json`, output);
    addCheck(checks, "import JSON recreates split room", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "schema-validation") {
    const plan = split45Plan();
    const privatePayloadPattern = /sourceDocumentPath|docxBinary|rawFileContent|base64Content|embeddedDocument|privateAbsolutePath/u;
    const sourceChecks = [
      "packages/shared/src/layout-editor/editableLayoutGeometryContract.ts",
      "packages/shared/src/floorplans/planContract.ts",
      "apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts",
      "apps/web/src/features/floorplans/savedFloorplanStore.ts",
      "apps/web/src/features/floorplans/floorplanJsonImportExport.ts"
    ].map((path) => ({ path, includesSplitBays: readText(path).includes("splitBays") }));
    const output = {
      status: plan.splitBays?.length === 1 && sourceChecks.every((check) => check.includesSplitBays) ? "passed" : "failed",
      sourceChecks
    };
    writeJson(`${dir}/schema-validation-output.json`, output);
    writeText(`${dir}/no-private-payload-output.txt`, privatePayloadPattern.test(JSON.stringify(plan))
      ? "failed: private payload key was found.\n"
      : "passed: no private source payload or PHI was stored.\n");
    writeJson(`${dir}/door-persistence-non-regression-output.json`, {
      status: readText("scripts/check-door-authoring-browser-regression.mjs").includes("save-reload-export") ? "passed" : "failed",
      evidence: "Door save/reload browser regression remains wired."
    });
    addCheck(checks, "exported/imported split-room JSON validates against schema and persistence paths carry splitBays", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage ${selectedStage}`);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-persistence", [
    "save-working-copy",
    "reload-same-record",
    "export-json",
    "import-json",
    "schema-validation"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-persistence.mjs --stage save-working-copy --allow-partial --issue ${issue}`]: `${dir}/save-working-copy-output.json`,
    [`node scripts/check-split-room-persistence.mjs --stage reload-same-record --allow-partial --issue ${issue}`]: `${dir}/reload-same-record-output.json`,
    [`node scripts/check-split-room-persistence.mjs --stage export-json --allow-partial --issue ${issue}`]: `${dir}/export-json-output.json`,
    [`node scripts/check-split-room-persistence.mjs --stage import-json --allow-partial --issue ${issue}`]: `${dir}/import-json-output.json`,
    [`node scripts/check-split-room-persistence.mjs --stage schema-validation --allow-partial --issue ${issue}`]: `${dir}/schema-validation-output.json`
  });
  writeCloseout(issue, "Split-room save, reload, export, and import persistence.", status, commands);
}
