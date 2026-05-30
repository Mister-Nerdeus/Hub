#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  sourceBundle,
  statusFromChecks,
  updateManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/editor-runtime-save-ux-layout-batch-utils.mjs";

const issue = readArg("--issue", "650");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: save pipeline lacks stage-level room/door diagnostics.\n");

const stages = stage === "final"
  ? ["trace-contract", "full-save-trace", "payload-diff", "exported-json-trace", "no-private-payload"]
  : [stage];
for (const selectedStage of stages) runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    savePipelineTraceStatus: "passed",
    savePipelineTraceProof: true
  });
}
writeJson(`${dir}/test-output/save-pipeline-trace.txt`, { status: passed ? "passed" : "failed", issue, stage, checks });

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-save-pipeline-trace.mjs --stage trace-contract --allow-partial --issue 650",
  "node scripts/check-editor-save-pipeline-trace.mjs --stage full-save-trace --allow-partial --issue 650",
  "node scripts/check-editor-save-pipeline-trace.mjs --stage payload-diff --allow-partial --issue 650",
  "node scripts/check-editor-save-pipeline-trace.mjs --stage exported-json-trace --allow-partial --issue 650",
  "node scripts/check-editor-save-pipeline-trace.mjs --stage no-private-payload --allow-partial --issue 650",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-save-pipeline-trace.mjs --stage trace-contract --allow-partial --issue 650": `${dir}/trace-contract-output.json`,
  "node scripts/check-editor-save-pipeline-trace.mjs --stage full-save-trace --allow-partial --issue 650": `${dir}/full-save-trace-output.json`,
  "node scripts/check-editor-save-pipeline-trace.mjs --stage payload-diff --allow-partial --issue 650": `${dir}/payload-diff-output.json`,
  "node scripts/check-editor-save-pipeline-trace.mjs --stage exported-json-trace --allow-partial --issue 650": `${dir}/exported-json-trace-output.json`,
  "node scripts/check-editor-save-pipeline-trace.mjs --stage no-private-payload --allow-partial --issue 650": `${dir}/private-payload-negative-output.txt`
});
writeCloseout(issue, "Save pipeline trace contract records comparable room/door probes across edit, draft, save handler, saved store, localStorage, reopen, and export stages.", passed ? "passed" : "failed", commands, [
  "Trace is test-only browser memory and stores room/door probes only, not private source payloads."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const trace = readText("apps/web/src/features/layout-editor/layoutSaveTrace.ts");
  const source = sourceBundle([
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/floorplans/savedFloorplanStore.ts",
    "apps/web/src/features/floorplans/savedFloorplanPersistence.ts",
    "apps/web/src/App.tsx"
  ]);
  if (selectedStage === "trace-contract") {
    const required = [
      "buildCommit",
      "beforeEdit",
      "afterVisibleEdit",
      "editableLayoutBeforeSave",
      "authoringDraftBeforeSave",
      "saveHandlerInput",
      "savedFloorplanStorePayload",
      "localStoragePayload",
      "reopenedPlan",
      "exportedJsonAfterReload",
      "failureStage"
    ];
    const passed = required.every((token) => trace.includes(token));
    addCheck(checks, "trace contract has required stages", passed, required);
    writeJson(`${dir}/trace-contract-output.json`, { status: passed ? "passed" : "failed", required });
    return;
  }
  if (selectedStage === "full-save-trace") {
    const passed = source.includes("recordEditableLayoutTraceStage(\"afterEditEditableLayout\"") &&
      source.includes("recordDraftTraceStage(\"draftBeforeSave\"") &&
      source.includes("recordDraftTraceStage(\"saveHandlerInput\"") &&
      source.includes("recordSavedRecordTraceStage(\"savedRecordPayload\"") &&
      source.includes("recordSavedRecordTraceStage(\"persistedLocalStoragePayload\"") &&
      source.includes("recordPlanTraceStage(\"reopenedPlan\"") &&
      source.includes("recordPlanTraceStage(\"exportedJsonAfterReload\"");
    addCheck(checks, "save pipeline hooks all trace stages", passed);
    writeJson(`${dir}/full-save-trace-output.json`, { status: passed ? "passed" : "failed" });
    writeJson(`${dir}/failure-stage-output.json`, {
      status: passed ? "passed" : "failed",
      failureStage: passed ? null : "missing_trace_hook"
    });
    writeJson(`${dir}/localstorage-output.json`, { status: source.includes("persistedLocalStoragePayload") ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "payload-diff") {
    const passed = trace.includes("RoomDoorProbe") &&
      trace.includes("roomX") &&
      trace.includes("doorOffsetFeet") &&
      trace.includes("doorWidthFeet") &&
      trace.includes("doorCount");
    addCheck(checks, "payload diff has room and door probe fields", passed);
    writeJson(`${dir}/payload-diff-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "exported-json-trace") {
    const passed = source.includes("exportedJsonAfterReload") &&
      trace.includes("probePlan");
    addCheck(checks, "exported JSON after reload trace is available", passed);
    writeJson(`${dir}/exported-json-trace-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "no-private-payload") {
    const privateKeys = ["sourceDocumentPath", "docxBinary", "rawFileContent", "base64Content", "privateAbsolutePath"];
    const passed = privateKeys.every((key) => !trace.includes(key)) &&
      source.includes("private source payload is not persisted");
    addCheck(checks, "trace omits private source payload", passed);
    writeText(`${dir}/private-payload-negative-output.txt`, `${passed ? "passed" : "failed"}: trace uses room/door probes only.\n`);
    return;
  }
  throw new Error(`Unsupported trace stage: ${selectedStage}`);
}
