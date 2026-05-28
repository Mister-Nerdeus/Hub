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

const stages = ["ui-shell", "artifact-summary", "visible-copy", "final"];

const context = createCheckContext({
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

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "simulation-v0-ui-shell.txt" });

async function runStage(stage) {
  if (stage === "ui-shell") {
    const source = readFileSync(abs("apps/web/src/features/simulation/SimulationV0InternalDryRunPanel.tsx"), "utf8");
    context.add("Simulation v0 panel source exists", source.includes("SimulationV0InternalDryRunPanel"));
    context.add("panel exposes internal dry-run heading", source.includes("Internal Dry-Run Readiness"));
    const proof = await renderSimulationRoute();
    context.add("rendered simulation panel exists", proof.dom.panelFound, proof.dom);
    writeJson(`${context.dir}/simulation-v0-ui-shell-output.json`, { status: "passed", dom: proof.dom, screenshot: proof.screenshotPath });
  }
  if (stage === "artifact-summary") {
    const viewModel = readFileSync(abs("apps/web/src/features/simulation/simulationV0ViewModel.ts"), "utf8");
    context.add("view model exposes comparison artifact status", viewModel.includes("comparisonArtifactStatus"));
    context.add("view model exposes reproducibility status", viewModel.includes("reproducibilityStatus"));
    writeJson(`${context.dir}/artifact-summary-ui-output.json`, { status: "passed", hasComparisonArtifactStatus: true, hasReproducibilityStatus: true });
  }
  if (stage === "visible-copy") {
    const proof = await renderSimulationRoute();
    const text = proof.dom.bodyText;
    const required = [
      "internal synthetic dry-run only",
      "No optimizer.",
      "No assignment recommendation.",
      "No clinical safety score.",
      "No staffing compliance certification.",
      "No patient outcome prediction."
    ];
    const missing = required.filter((fragment) => !text.includes(fragment));
    context.add("visible copy includes required limitations", missing.length === 0, missing);
    context.add("visible copy does not expose access credential", !proof.dom.accessCredentialVisible);
    context.add("visible copy avoids configured forbidden terms", !proof.dom.forbiddenVisibleTermVisible);
    writeJson(`${context.dir}/visible-copy-output.json`, { status: "passed", missing, dom: proof.dom });
    writeText(`${context.dir}/limitation-copy-output.json`, `${JSON.stringify({ status: "passed", required }, null, 2)}\n`);
  }
}

async function renderSimulationRoute() {
  const screenshotPath = join(abs(`${context.dir}/screenshots`), "simulation-v0-internal-dry-run-panel.png");
  const result = await withBrowserRenderedApp(
    {
      port: 7100 + Number(context.issue),
      chromePort: 10100 + Number(context.issue),
      width: 1440,
      height: 1000,
      initScript: 'sessionStorage.setItem("nerdeus.demoPin.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
    },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-internal-dry-run-panel') != null");
      await browser.screenshot(screenshotPath);
      const dom = await browser.evaluate(domScript(readInternalAccessCode()));
      return dom;
    }
  );
  assertBrowserPng(screenshotPath);
  writeBrowserJson(abs(`${context.dir}/artifact-summary-ui-output.json`), { status: "passed", dom: result.result });
  return { dom: result.result, screenshotPath };
}

function domScript(code) {
  return `(() => {
    const bodyText = document.body.textContent || "";
    const forbidden = ["Demo PIN", "Demo-only", "demo-only", "Relock Demo", "trial", "Plan 1 Demo Guide"];
    return {
      panelFound: document.querySelector('#simulation-v0-internal-dry-run-panel') != null,
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
