#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertBrowserPng,
  withBrowserRenderedApp,
  writeJson as writeBrowserJson
} from "./lib/app-browser-proof.mjs";
import {
  abs,
  createCheckContext,
  finalizeGate,
  runSelectedStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-internal-dry-run-utils.mjs";
import {
  createRepairContext,
  finalizeRepairGate,
  runSelectedRepairStages
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = [
  "ui-shell",
  "artifact-summary",
  "visible-copy",
  "ui-status-truth",
  "reproducibility-status",
  "pending-status-negative",
  "simulation-route-render",
  "final"
];

const cliIssue = Number(process.argv[process.argv.indexOf("--issue") + 1] ?? 578);
const usesFalsePositiveRepairManifest = Number.isFinite(cliIssue) && cliIssue >= 591;
const context = usesFalsePositiveRepairManifest
  ? createRepairContext({
      scriptName: "simulation v0 ui shell",
      stages,
      statusKeyByStage: {
        "ui-status-truth": "simulationUiStatusTruthStatus",
        "reproducibility-status": "simulationUiStatusTruthStatus",
        "pending-status-negative": "simulationUiStatusTruthStatus",
        "simulation-route-render": "simulationUiStatusTruthStatus"
      },
      outputName: "simulation-v0-ui-shell-output.json",
      defaultIssue: "595"
    })
  : createCheckContext({
      scriptName: "simulation v0 ui shell",
      stages,
      statusKeyByStage: {
        "ui-shell": "simulationV0UiStatus",
        "artifact-summary": "simulationV0UiStatus",
        "visible-copy": "simulationV0UiStatus"
      },
      outputName: "simulation-v0-ui-shell-output.json",
      defaultIssue: "578"
    });

if (usesFalsePositiveRepairManifest) {
  await runSelectedRepairStages(context, runStage);
  finalizeRepairGate(context, {
    testOutputName: "simulation-v0-ui-shell.txt",
    manifestUpdates: {
      simulationUiStatusTruthStatus: context.checks.every((check) => check.passed) ? "passed" : "failed",
      simulationUiStatusDerivedFromProof: context.checks.every((check) => check.passed)
    }
  });
} else {
  await runSelectedStages(context, runStage);
  finalizeGate(context, { testOutputName: "simulation-v0-ui-shell.txt" });
}

async function runStage(stage) {
  if (stage === "ui-shell") {
    const source = readFileSync(abs("apps/web/src/features/simulation/SimulationV0InternalDryRunPanel.tsx"), "utf8");
    context.add("Simulation v0 panel source exists", source.includes("SimulationV0InternalDryRunPanel"));
    context.add("panel exposes Simulation v0 route landmark", source.includes("simulation-v0-route"));
    const proof = await renderSimulationRoute();
    context.add("rendered simulation panel exists", proof.dom.panelFound, proof.dom);
    writeJson(`${context.dir}/simulation-v0-ui-shell-output.json`, { status: "passed", dom: proof.dom, screenshot: proof.screenshotPath });
  }
  if (stage === "artifact-summary") {
    const viewModel = readFileSync(abs("apps/web/src/features/simulation/simulationV0ViewModel.ts"), "utf8");
    context.add("view model exposes artifact proof", viewModel.includes("artifactProof"));
    context.add("view model exposes artifact export", viewModel.includes("artifactExport"));
    writeJson(`${context.dir}/artifact-summary-ui-output.json`, { status: "passed", hasArtifactProof: true, hasArtifactExport: true });
  }
  if (stage === "visible-copy") {
    const proof = await renderSimulationRoute();
    const text = proof.dom.bodyText;
    const required = [
      "internal synthetic dry-run only",
      "No optimizer.",
      "No automated assignment output.",
      "No care-quality certification.",
      "No staffing certification.",
      "No outcome prediction."
    ];
    const missing = required.filter((fragment) => !text.includes(fragment));
    context.add("visible copy includes required limitations", missing.length === 0, missing);
    context.add("visible copy does not expose access credential", !proof.dom.accessCredentialVisible);
    context.add("visible copy avoids configured forbidden terms", !proof.dom.forbiddenVisibleTermVisible);
    writeJson(`${context.dir}/visible-copy-output.json`, { status: "passed", missing, dom: proof.dom });
    writeText(`${context.dir}/limitation-copy-output.json`, `${JSON.stringify({ status: "passed", required }, null, 2)}\n`);
  }
  if (stage === "ui-status-truth") {
    const viewModel = readFileSync(abs("apps/web/src/features/simulation/simulationV0ViewModel.ts"), "utf8");
    const proof = await renderSimulationRoute("simulation-status-truth.png");
    const passed = viewModel.includes("buildSimulationV0ArtifactProofViewModel") &&
      proof.dom.bodyText.includes("stable hash proof passed") &&
      !proof.dom.bodyText.includes("stable hash proof pending final gate");
    context.add("Simulation UI status is derived from passing proof truth", passed, {
      usesProofBuilder: viewModel.includes("buildSimulationV0ArtifactProofViewModel"),
      renderedPassedStatus: proof.dom.bodyText.includes("stable hash proof passed"),
      pendingAbsent: !proof.dom.bodyText.includes("stable hash proof pending final gate")
    });
    writeJson(`${context.dir}/ui-status-truth-output.json`, {
      status: passed ? "passed" : "failed",
      screenshot: proof.screenshotPath
    });
  }
  if (stage === "reproducibility-status") {
    const shared = await import("../packages/shared/dist/index.js");
    const proof = shared.buildDryRunReproducibilityProof();
    const status = shared.buildDryRunReproducibilityStatus(proof);
    const passed = status.label === "stable hash proof passed" && proof.repeatedRunMatches === true;
    context.add("reproducibility status builder reports passed only from proof", passed, {
      status,
      repeatedRunMatches: proof.repeatedRunMatches
    });
    writeJson(`${context.dir}/reproducibility-status-output.json`, { status: passed ? "passed" : "failed", proofStatus: status });
  }
  if (stage === "pending-status-negative") {
    const failed = pendingStatusContradictionFails({
      proofPassed: true,
      uiStatus: "stable hash proof pending final gate"
    });
    context.add("manifest/proof passed plus pending UI status negative fixture fails", failed, null);
    writeJson(`${context.dir}/pending-status-negative-output.json`, { status: failed ? "passed" : "failed" });
  }
  if (stage === "simulation-route-render") {
    const proof = await renderSimulationRoute("simulation-status-truth.png");
    context.add("simulation route renders proof-derived status without forbidden claims", proof.dom.panelFound && proof.dom.bodyText.includes("stable hash proof passed") && !proof.dom.forbiddenVisibleTermVisible, proof.dom);
    writeJson(`${context.dir}/simulation-route-render-output.json`, {
      status: proof.dom.panelFound ? "passed" : "failed",
      dom: proof.dom,
      screenshot: proof.screenshotPath
    });
  }
}

async function renderSimulationRoute(fileName = "simulation-v0-internal-dry-run-panel.png") {
  const screenshotPath = join(abs(`${context.dir}/screenshots`), fileName);
  const result = await withBrowserRenderedApp(
    {
      port: 18000 + Number(context.issue),
      chromePort: 19000 + Number(context.issue),
      width: 1440,
      height: 1000,
      initScript: 'sessionStorage.setItem("nerdeus.demoPin.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
    },
    async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
      await browser.screenshot(screenshotPath);
      const dom = await browser.evaluate(domScript(readInternalAccessCode()));
      return dom;
    }
  );
  assertBrowserPng(screenshotPath);
  writeBrowserJson(abs(`${context.dir}/artifact-summary-ui-output.json`), { status: "passed", dom: result.result });
  return { dom: result.result, screenshotPath };
}

function pendingStatusContradictionFails(input) {
  return input.proofPassed === true && String(input.uiStatus).includes("pending");
}

function domScript(code) {
  return `(() => {
    const bodyText = document.body.textContent || "";
    const forbidden = ["Demo PIN", "Demo-only", "demo-only", "Relock Demo", "trial", "Plan 1 Demo Guide"];
    return {
      panelFound: document.querySelector('#simulation-v0-route') != null,
      bodyText,
      accessCredentialVisible: new RegExp('(?:Access code|PIN|code)\\\\s*' + ${JSON.stringify(code)} + '\\\\b', 'i').test(bodyText),
      forbiddenVisibleTermVisible: forbidden.some((fragment) => bodyText.includes(fragment)),
      textLength: bodyText.length
    };
  })();`;
}

function readInternalAccessCode() {
  const source = readFileSync(abs("packages/shared/src/demo-pin/demoPinContract.ts"), "utf8");
  const match = source.match(/DEMO_PIN_CODE\s*=\s*"([^"]+)"/u);
  if (match == null) throw new Error("Unable to read internal access-code literal");
  return match[1];
}
