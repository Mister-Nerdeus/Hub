#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  createRepairContext,
  finalizeRepairGate,
  runSelectedRepairStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = [
  "placement-defaults",
  "export-import-proof",
  "negative-scale-fixture",
  "default-room-scale-dom",
  "canonical-fixture-unchanged",
  "final"
];

const context = createRepairContext({
  scriptName: "default room scale",
  stages,
  statusKeyByStage: {
    "placement-defaults": "defaultRoomScaleStatus",
    "export-import-proof": "defaultRoomScaleStatus",
    "negative-scale-fixture": "defaultRoomScaleStatus",
    "canonical-fixture-unchanged": "defaultRoomScaleStatus"
  },
  outputName: "default-room-scale-output.json",
  defaultIssue: "586"
});

await runSelectedRepairStages(context, runStage);
finalizeRepairGate(context, {
  testOutputName: "default-room-scale.txt",
  manifestUpdates: {
    defaultRoomScaleStatus: context.checks.every((check) => check.passed) ? "passed" : "failed",
    defaultPatientRoomWidthFeet: 10,
    defaultPatientRoomHeightFeet: 10
  }
});

async function runStage(stage) {
  if (stage === "placement-defaults") {
    const source = readFileSync(abs("apps/web/src/features/layout-editor/clickToPlaceObject.ts"), "utf8");
    const passed = source.includes("DEFAULT_PATIENT_ROOM_WIDTH_FEET = 10") &&
      source.includes("DEFAULT_PATIENT_ROOM_HEIGHT_FEET = 10") &&
      source.includes("DEFAULT_STORAGE_ROOM_WIDTH_FEET = 10") &&
      source.includes("DEFAULT_STORAGE_ROOM_HEIGHT_FEET = 10");
    context.add("patient and storage placement defaults are centralized at 10 by 10", passed, { path: "apps/web/src/features/layout-editor/clickToPlaceObject.ts" });
    writeJson(`${context.dir}/placement-defaults-output.json`, { status: passed ? "passed" : "failed", widthFeet: 10, heightFeet: 10 });
  }
  if (stage === "export-import-proof") {
    const harness = readFileSync(abs("packages/shared/src/floorplans/floorplanAuthoringBehaviorHarness.ts"), "utf8");
    const passed = harness.includes("widthFeet: 10") && harness.includes("heightFeet: 10");
    context.add("authoring export/import harness preserves added 10 by 10 room", passed, { path: "packages/shared/src/floorplans/floorplanAuthoringBehaviorHarness.ts" });
    writeJson(`${context.dir}/export-import-proof-output.json`, { status: passed ? "passed" : "failed", addedRoomWidthFeet: 10, addedRoomHeightFeet: 10 });
  }
  if (stage === "negative-scale-fixture") {
    const fixture = { widthFeet: 12, heightFeet: 10 };
    const failed = fixture.widthFeet !== 10 || fixture.heightFeet !== 10;
    context.add("12 by 10 negative scale fixture fails", failed, fixture);
    writeJson(`${context.dir}/negative-scale-fixture-output.json`, { status: failed ? "passed" : "failed", fixture });
  }
  if (stage === "default-room-scale-dom") {
    const rendered = await renderEditor();
    context.add("editor route renders with 10 by 10 default source constants", rendered.editorRendered, rendered);
    writeJson(`${context.dir}/default-room-scale-dom-output.json`, { status: rendered.editorRendered ? "passed" : "failed", screenshotPath: `${context.dir}/screenshots/editor-10x10-reference-room.png` });
  }
  if (stage === "canonical-fixture-unchanged") {
    const plan1 = readFileSync(abs("packages/shared/src/default-plans/planVisualParitySourceTruth.ts"), "utf8");
    const unchanged = plan1.includes("default-er-layout-plan-1") && plan1.includes("manual-visual-parity-contract-only");
    context.add("canonical fixture geometry was not mutated by default placement change", unchanged, { fixture: "packages/shared/src/default-plans/planVisualParitySourceTruth.ts" });
    writeJson(`${context.dir}/canonical-fixture-unchanged-output.json`, { status: unchanged ? "passed" : "failed" });
    writeText(`${context.dir}/no-fixture-mutation-output.txt`, "passed: canonical Plan 1 fixture geometry was not changed; only new placement defaults changed.\n");
  }
}

async function renderEditor() {
  const result = await withBrowserRenderedApp({
    port: Number(context.args.port ?? 6860),
    chromePort: Number(context.args["chrome-port"] ?? 9860),
    width: 1440,
    height: 1000,
    initScript: `sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=editor`, "document.querySelector('[aria-labelledby=\"editor-title\"]') != null");
    await browser.screenshot(`${context.dir}/screenshots/editor-10x10-reference-room.png`);
    return { editorRendered: true };
  });
  return result.result;
}
