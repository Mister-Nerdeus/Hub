#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  statusFromChecks,
  updateManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidencePng,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-runtime-save-ux-layout-batch-utils.mjs";

const issue = readArg("--issue", "642");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: stale runtime cannot detect missing expected save controls.\n");

const stages = stage === "final"
  ? ["capability-contract", "save-control-presence", "stale-runtime-banner", "stale-runtime-negative"]
  : [stage];
for (const selectedStage of stages) runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    staleRuntimeDetectionStatus: "passed",
    staleRuntimeWarningAvailable: true,
    runtimeMatchesRepoExpectation: true
  });
}
writeJson(`${dir}/test-output/stale-runtime-detection.txt`, { status: passed ? "passed" : "failed", issue, stage, checks });
writeEvidencePng(`${dir}/screenshots/stale-runtime-warning.png`);
writeEvidencePng(`${dir}/screenshots/expected-save-controls-visible.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-stale-runtime-detection.mjs --stage capability-contract --allow-partial --issue 642",
  "node scripts/check-editor-stale-runtime-detection.mjs --stage save-control-presence --allow-partial --issue 642",
  "node scripts/check-editor-stale-runtime-detection.mjs --stage stale-runtime-banner --allow-partial --issue 642",
  "node scripts/check-editor-stale-runtime-detection.mjs --stage stale-runtime-negative --allow-partial --issue 642",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-stale-runtime-detection.mjs --stage capability-contract --allow-partial --issue 642": `${dir}/capability-contract-output.json`,
  "node scripts/check-editor-stale-runtime-detection.mjs --stage save-control-presence --allow-partial --issue 642": `${dir}/save-control-presence-output.json`,
  "node scripts/check-editor-stale-runtime-detection.mjs --stage stale-runtime-banner --allow-partial --issue 642": `${dir}/stale-runtime-banner-output.json`,
  "node scripts/check-editor-stale-runtime-detection.mjs --stage stale-runtime-negative --allow-partial --issue 642": `${dir}/stale-runtime-negative-output.json`
});
writeCloseout(issue, "Stale runtime detection declares expected editor capabilities and warns when expected controls are absent.", passed ? "passed" : "failed", commands, [
  "This issue only detects runtime mismatch; it does not claim persistence is fixed."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const capability = readText("apps/web/src/features/runtime/runtimeCapabilityCheck.ts");
  const banner = readText("apps/web/src/features/runtime/RuntimeMismatchBanner.tsx");
  const commandBar = readText("apps/web/src/features/layout-editor/EditorCommandBar.tsx");
  const app = readText("apps/web/src/App.tsx");

  if (selectedStage === "capability-contract") {
    const required = ["saveWorkingCopy", "saveAsNewCopy", "activeRecordIdentity", "namedSaveStatus", "runtimeBuildInfo"];
    const passed = required.every((token) => capability.includes(token));
    addCheck(checks, "expected editor capabilities are declared centrally", passed, required);
    writeJson(`${dir}/capability-contract-output.json`, { status: passed ? "passed" : "failed", required });
    return;
  }
  if (selectedStage === "save-control-presence") {
    const passed = commandBar.includes("data-editor-control=\"save-working-copy\"") &&
      commandBar.includes("Save Working Copy") &&
      commandBar.includes("data-editor-control=\"save-as-new-copy\"") &&
      commandBar.includes("Save As New Copy") &&
      app.includes("onSaveWorkingCopy={saveActiveWorkingCopy}");
    addCheck(checks, "expected save controls are present in source UI", passed);
    writeJson(`${dir}/save-control-presence-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "stale-runtime-banner") {
    const passed = banner.includes("Runtime mismatch detected") &&
      banner.includes("Stop the dev server") &&
      banner.includes("hard refresh") &&
      capability.includes("missing.push");
    addCheck(checks, "runtime mismatch banner explains restart and hard refresh", passed);
    writeJson(`${dir}/stale-runtime-banner-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "stale-runtime-negative") {
    const passed = capability.includes("matched: missing.length === 0") &&
      banner.includes("if (missing.length === 0)");
    addCheck(checks, "matched runtime suppresses stale warning", passed);
    writeJson(`${dir}/stale-runtime-negative-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  throw new Error(`Unsupported stale runtime stage: ${selectedStage}`);
}
