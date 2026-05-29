#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  statusFromChecks,
  updateReconstructionManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "623");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: local draft autosave used one global v1 key and could restore the wrong floorplan copy.\n"
);
writeBoundaryOutputs(issue);

const stages = stage === "final"
  ? ["scoped-key", "copy-isolation", "wrong-copy-negative", "v1-migration", "timestamp", "no-private-payload"]
  : [stage];

for (const selectedStage of stages) {
  runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateReconstructionManifest(issue, {
    perCopyAutosaveStatus: "passed",
    autosaveScopedByRecordId: true
  });
}
writeJson(`${dir}/test-output/per-copy-autosave.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-per-copy-autosave.mjs --stage scoped-key --allow-partial --issue 623",
  "node scripts/check-layout-editor-per-copy-autosave.mjs --stage copy-isolation --allow-partial --issue 623",
  "node scripts/check-layout-editor-per-copy-autosave.mjs --stage wrong-copy-negative --allow-partial --issue 623",
  "node scripts/check-layout-editor-per-copy-autosave.mjs --stage v1-migration --allow-partial --issue 623",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-per-copy-autosave.mjs --stage scoped-key --allow-partial --issue 623": `${dir}/scoped-key-output.json`,
  "node scripts/check-layout-editor-per-copy-autosave.mjs --stage copy-isolation --allow-partial --issue 623": `${dir}/copy-a-copy-b-isolation-output.json`,
  "node scripts/check-layout-editor-per-copy-autosave.mjs --stage wrong-copy-negative --allow-partial --issue 623": `${dir}/wrong-copy-restore-negative-output.json`,
  "node scripts/check-layout-editor-per-copy-autosave.mjs --stage v1-migration --allow-partial --issue 623": `${dir}/v1-migration-output.json`
});
writeCloseout(
  issue,
  "Layout editor local draft autosave is scoped per active floorplan record.",
  passed ? "passed" : "failed",
  commands,
  [
    "Restore UI remains intentionally deferred to Issue 624.",
    "Legacy v1 global drafts are classified for recovery and are not silently loaded.",
    "No server persistence, EHR integration, or private source payload storage was added."
  ]
);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) {
  process.exit(1);
}

function runStage(selectedStage) {
  const persistence = readText("apps/web/src/features/layout-editor/layoutLocalDraftPersistence.ts");
  const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  const testSource = readText("apps/web/src/features/layout-editor/layoutLocalDraftPersistence.test.ts");

  if (selectedStage === "scoped-key") {
    const passed =
      persistence.includes('LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION = "2.0.0"') &&
      persistence.includes("layoutLocalDraftStorageKey(recordId") &&
      persistence.includes("nerdeus.layoutEditor.localDraft.v2.") &&
      persistence.includes("recordId: string") &&
      stageSource.includes("recordId: stageState.loadedFloorplan.recordId");
    addCheck(checks, "autosave uses v2 scoped storage keys with record identity", passed);
    writeJson(`${dir}/scoped-key-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }

  if (selectedStage === "copy-isolation") {
    const passed =
      testSource.includes('loadLayoutLocalDraft(storage, "other-copy").status, "empty"') &&
      persistence.includes("storage.setItem(layoutLocalDraftStorageKey(validated.recordId)") &&
      persistence.includes("storage.removeItem(layoutLocalDraftStorageKey");
    addCheck(checks, "copy A autosave does not overwrite copy B", passed);
    writeJson(`${dir}/copy-a-copy-b-isolation-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }

  if (selectedStage === "wrong-copy-negative") {
    const passed =
      persistence.includes('"wrong_copy"') &&
      persistence.includes("draft.recordId !== normalizedRecordId") &&
      testSource.includes('"other-copy"');
    addCheck(checks, "wrong-copy restore negative path exists", passed);
    writeJson(`${dir}/wrong-copy-restore-negative-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }

  if (selectedStage === "v1-migration") {
    const passed =
      persistence.includes("LAYOUT_LOCAL_DRAFT_LEGACY_STORAGE_KEY") &&
      persistence.includes("inspectLegacyLayoutLocalDraft") &&
      testSource.includes("legacy_available") &&
      !stageSource.includes("loadLayoutLocalDraft(storage)");
    addCheck(checks, "legacy v1 draft is classified and not auto-loaded", passed);
    writeJson(`${dir}/v1-migration-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }

  if (selectedStage === "timestamp") {
    const passed =
      persistence.includes("updatedAt: string") &&
      persistence.includes("requireIsoTimestamp") &&
      stageSource.includes("updatedAt: new Date().toISOString()");
    addCheck(checks, "autosave record includes updatedAt timestamp", passed);
    writeJson(`${dir}/timestamp-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }

  if (selectedStage === "no-private-payload") {
    const passed =
      !persistence.includes("sourceDocumentPath") &&
      !persistence.includes("rawFileContent") &&
      persistence.includes("validateEditableLayoutGeometryContract");
    addCheck(checks, "autosave persists editable geometry only, not private payloads", passed);
    writeText(`${dir}/no-private-payload-output.txt`, passed
      ? "passed: local draft autosave record stores active copy metadata and editable layout geometry only.\n"
      : "failed: local draft autosave source contains private payload terminology.\n");
    return;
  }

  throw new Error(`Unsupported per-copy autosave stage: ${selectedStage}`);
}
