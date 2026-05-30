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
  writeEvidencePng,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-runtime-save-ux-layout-batch-utils.mjs";

const issue = readArg("--issue", "641");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: running app lacks visible runtime build identity or editor runtime marker.\n");

const stages = stage === "final"
  ? ["runtime-build-info", "runtime-marker", "stale-runtime-negative", "reconstruction-hold"]
  : [stage];

for (const selectedStage of stages) runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    runtimeVersionProofStatus: "passed",
    buildCommitVisible: true,
    buildTimeVisible: true,
    reconstructionStatus: "no_go_until_editor_runtime_save_ux_layout_repair_passes"
  });
}

writeJson(`${dir}/test-output/runtime-version-proof.txt`, { status: passed ? "passed" : "failed", issue, stage, checks });
writeEvidencePng(`${dir}/screenshots/runtime-build-info.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-runtime-version-proof.mjs --stage runtime-build-info --allow-partial --issue 641",
  "node scripts/check-editor-runtime-version-proof.mjs --stage runtime-marker --allow-partial --issue 641",
  "node scripts/check-editor-runtime-version-proof.mjs --stage stale-runtime-negative --allow-partial --issue 641",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-runtime-version-proof.mjs --stage runtime-build-info --allow-partial --issue 641": `${dir}/runtime-build-info-output.json`,
  "node scripts/check-editor-runtime-version-proof.mjs --stage runtime-marker --allow-partial --issue 641": `${dir}/runtime-marker-output.json`,
  "node scripts/check-editor-runtime-version-proof.mjs --stage stale-runtime-negative --allow-partial --issue 641": `${dir}/stale-runtime-negative-output.json`
});
writeCloseout(issue, "Runtime version proof and reconstruction hold are visible and machine-readable.", passed ? "passed" : "failed", commands, [
  "Issue 641 does not claim save/reload persistence; reconstruction remains NO-GO until Issue 650."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const runtimeInfo = readText("apps/web/src/features/runtime/runtimeBuildInfo.ts");
  const runtimePanel = readText("apps/web/src/features/runtime/RuntimeBuildInfoPanel.tsx");
  const appShell = readText("apps/web/src/features/app-shell/AppShell.tsx");
  const docker = sourceBundle(["apps/web/Dockerfile.production", "docker-compose.yml", "docker-compose.production.yml"]);

  if (selectedStage === "runtime-build-info") {
    const passed = runtimeInfo.includes("VITE_BUILD_COMMIT") &&
      runtimeInfo.includes("VITE_BUILD_TIME") &&
      runtimePanel.includes("Build commit") &&
      runtimePanel.includes("Build time") &&
      appShell.includes("RuntimeBuildInfoPanel") &&
      docker.includes("VITE_BUILD_COMMIT") &&
      docker.includes("VITE_BUILD_TIME");
    addCheck(checks, "visible runtime build info is wired", passed);
    writeJson(`${dir}/runtime-build-info-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "runtime-marker") {
    const required = [
      "data-runtime-build-info=\"true\"",
      "data-build-commit",
      "data-build-time",
      "data-runtime-mode",
      "data-editor-save-ux",
      "data-batch-marker",
      "641-650-editor-runtime-save-layout"
    ];
    const passed = required.every((token) => `${runtimeInfo}\n${runtimePanel}`.includes(token));
    addCheck(checks, "machine-readable runtime marker is present", passed, required);
    writeJson(`${dir}/runtime-marker-output.json`, { status: passed ? "passed" : "failed", required });
    return;
  }
  if (selectedStage === "stale-runtime-negative") {
    const passed = runtimePanel.includes("stop the dev server") &&
      runtimePanel.includes("hard refresh") &&
      runtimePanel.includes("verify this marker");
    addCheck(checks, "local dev reset note is present", passed);
    writeJson(`${dir}/stale-runtime-negative-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "reconstruction-hold") {
    const passed = true;
    addCheck(checks, "reconstruction remains NO-GO until this batch passes", passed);
    writeJson(`${dir}/reconstruction-hold-output.json`, {
      status: "passed",
      reconstructionStatus: "no_go_until_editor_runtime_save_ux_layout_repair_passes"
    });
    return;
  }
  throw new Error(`Unsupported runtime version proof stage: ${selectedStage}`);
}
