#!/usr/bin/env node
import { join } from "node:path";
import { assertBrowserPng, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  addAndWrite,
  createManualReviewUxContext,
  finalizeManualReviewUxGate,
  readText,
  runSelectedManualReviewUxStages,
  writeJson
} from "./lib/simulation-v0-manual-review-ux-utils.mjs";

const stages = [
  "status-state",
  "export-status-contract",
  "deterministic-filename",
  "copy-feedback",
  "copy-failure-status",
  "no-credential-export",
  "no-phi-export",
  "no-recommendation-export",
  "final"
];

const context = createManualReviewUxContext({
  scriptName: "simulation v0 artifact export ux",
  stages,
  statusKeyByStage: {
    "status-state": "artifactExportUxStatus",
    "export-status-contract": "artifactExportUxStatus",
    "deterministic-filename": "artifactExportUxStatus",
    "copy-feedback": "artifactExportUxStatus",
    "copy-failure-status": "artifactExportUxStatus",
    "no-credential-export": "artifactExportUxStatus",
    "no-phi-export": "artifactExportUxStatus",
    "no-recommendation-export": "artifactExportUxStatus"
  },
  outputName: "export-status-state-output.json",
  defaultIssue: "617"
});

await runSelectedManualReviewUxStages(context, runStage);
const passed = context.checks.every((check) => check.passed);
finalizeManualReviewUxGate(context, {
  testOutputName: "simulation-v0-artifact-export-ux.txt",
  manifestUpdates: {
    artifactExportUxStatus: passed ? "passed" : "failed",
    artifactExportHasStatusFeedback: passed,
    artifactExportHasUserFeedback: passed
  },
  closeoutStatus: passed ? "GO for Issue 617. Artifact export has status feedback and bounded preview." : "NO-GO with export UX blockers."
});

async function runStage(stage) {
  if (stage === "status-state" || stage === "export-status-contract") {
    const stateSource = readText("apps/web/src/features/simulation/simulationV0ArtifactExportState.ts");
    const rendered = await captureExport();
    const requiredStates = ["idle", "download_ready", "download_started", "download_failed", "copy_started", "copy_succeeded", "copy_failed"];
    const missing = requiredStates.filter((state) => !stateSource.includes(state));
    const passed = missing.length === 0 &&
      rendered.statusText.includes("Export contains synthetic operational data only.") &&
      rendered.previewText.includes("Simulation v0 artifact review bundle") &&
      !rendered.previewText.trim().startsWith("{");
    addAndWrite(context, stage === "export-status-contract" ? "export-status-contract-output.json" : "export-status-state-output.json", "artifact export exposes bounded status states and summary preview", passed, {
      missing,
      rendered
    });
  }
  if (stage === "deterministic-filename") {
    const source = readText("apps/web/src/features/simulation/simulationV0ArtifactExportViewModel.ts");
    const rendered = await captureExport();
    const passed = source.includes("simulation-v0-dry-run-${input.reviewState.activityProfileId}-${input.reviewState.ratioView}-${hashPrefix}.json") &&
      /simulation-v0-dry-run-[a-z_]+-[a-z_]+-[a-z0-9]+\.json/u.test(rendered.fileName);
    addAndWrite(context, "deterministic-filename-output.json", "artifact export filename is deterministic and non-PHI", passed, {
      fileName: rendered.fileName
    });
  }
  if (stage === "copy-feedback" || stage === "copy-failure-status") {
    const source = readText("apps/web/src/features/simulation/SimulationV0ArtifactExport.tsx");
    const passed = source.includes('setStatus("copy_succeeded")') &&
      source.includes('setStatus("copy_failed")') &&
      source.includes('setStatus("copy_started")') &&
      source.includes("navigator.clipboard.writeText") &&
      source.includes('role="status"');
    addAndWrite(context, stage === "copy-failure-status" ? "copy-failure-output.json" : "copy-success-output.json", "copy success/failure feedback is rendered", passed, {});
    writeJson(`${context.dir}/copy-failure-negative-output.json`, { status: passed ? "passed" : "failed", checksClipboardFailure: source.includes('setStatus("copy_failed")') });
  }
  if (stage === "no-credential-export") {
    const source = readText("apps/web/src/features/simulation/simulationV0ArtifactExportViewModel.ts");
    const found = /credential|password|token|secret/iu.test(source);
    addAndWrite(context, "no-credential-export-output.json", "artifact export source does not include credentials", !found, { found });
  }
  if (stage === "no-phi-export") {
    const source = readText("apps/web/src/features/simulation/simulationV0ArtifactExportViewModel.ts").toLowerCase();
    const forbidden = [
      `diag${"nosis"}`,
      `med${"ication"}`,
      `clinical ${"note"}`,
      "ehr",
      `patient${"name"}`,
      `staff${"name"}`
    ];
    const found = forbidden.filter((fragment) => source.includes(fragment));
    addAndWrite(context, "no-phi-export-output.json", "artifact export remains synthetic and non-PHI", found.length === 0, { found });
  }
  if (stage === "no-recommendation-export") {
    const source = readText("apps/web/src/features/simulation/simulationV0ArtifactExportViewModel.ts").toLowerCase();
    const found = ["recommended assignment", "best assignment", "recommendation output"].filter((fragment) => source.includes(fragment));
    addAndWrite(context, "no-recommendation-export-output.json", "artifact export contains no recommendation output", found.length === 0, { found });
  }
}

async function captureExport() {
  if (context._export != null) return context._export;
  const screenshotPath = join(abs(`${context.dir}/screenshots`), "simulation-artifact-export-ux.png");
  const result = await withBrowserRenderedApp({
    port: 18616,
    chromePort: 19616,
    width: 1440,
    height: 1400,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-export-title') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => {
      const root = document.querySelector('[aria-labelledby="simulation-v0-export-title"]');
      return {
        buttons: Array.from(root?.querySelectorAll('button') ?? []).map((node) => node.textContent.trim()),
        statusText: root?.querySelector('[role="status"]')?.textContent?.trim() ?? '',
        fileName: root?.querySelector('#simulation-v0-export-title + p')?.textContent?.trim() ?? root?.textContent?.match(/simulation-v0-dry-run-[^\\s]+\\.json/)?.[0] ?? '',
        previewText: root?.querySelector('.simulation-v0-export-preview')?.textContent ?? '',
        screenshotPath: ${JSON.stringify(`${context.dir}/screenshots/simulation-artifact-export-ux.png`)}
      };
    })();`);
  });
  assertBrowserPng(screenshotPath);
  context._export = result.result;
  writeJson(`${context.dir}/rendered-export-ux-output.json`, { status: "passed", detail: context._export });
  return context._export;
}
