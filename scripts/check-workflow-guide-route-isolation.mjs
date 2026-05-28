#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  createRepairContext,
  finalizeRepairGate,
  runSelectedRepairStages,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = [
  "simulation-route-clean",
  "non-global-guide",
  "advanced-evidence-placement",
  "route-text-diff",
  "hidden-guide-not-mounted",
  "final"
];

const context = createRepairContext({
  scriptName: "workflow guide route isolation",
  stages,
  statusKeyByStage: {
    "simulation-route-clean": "workflowGuideIsolationStatus",
    "non-global-guide": "workflowGuideIsolationStatus",
    "advanced-evidence-placement": "workflowGuideIsolationStatus",
    "hidden-guide-not-mounted": "workflowGuideIsolationStatus"
  },
  outputName: "workflow-guide-route-isolation-output.json",
  defaultIssue: "582"
});

await runSelectedRepairStages(context, runStage);
finalizeRepairGate(context, {
  testOutputName: "workflow-guide-route-isolation.txt",
  manifestUpdates: {
    workflowGuideIsolationStatus: context.checks.every((check) => check.passed) ? "passed" : "failed"
  }
});

async function runStage(stage) {
  if (stage === "simulation-route-clean") {
    const scan = await renderSections(["simulation"]);
    const simulation = scan.simulation;
    const guideMounted = containsGuide(simulation.text);
    context.add("Simulation route has no workflow guide DOM/text", !guideMounted, { textLength: simulation.text.length });
    context.add("Simulation route contains Simulation v0 content", /Simulation v0|internal dry-run/iu.test(simulation.text), { textLength: simulation.text.length });
    writeJson(`${context.dir}/simulation-route-clean-output.json`, { status: !guideMounted ? "passed" : "failed", textLength: simulation.text.length });
  }
  if (stage === "non-global-guide") {
    const scan = await renderSections(["floorplans", "editor", "manual-assignment"]);
    const polluted = Object.entries(scan).filter(([, route]) => containsGuide(route.text)).map(([section]) => section);
    context.add("floorplan/editor/manual-assignment routes are not polluted by workflow evidence", polluted.length === 0, { polluted });
    writeJson(`${context.dir}/non-global-guide-output.json`, { status: polluted.length === 0 ? "passed" : "failed", polluted });
  }
  if (stage === "advanced-evidence-placement") {
    const scan = await renderSections(["developer-evidence"]);
    const advanced = scan["developer-evidence"];
    const present = containsGuide(advanced.text);
    context.add("Advanced/Evidence retains deliberate workflow evidence placement", present, { textLength: advanced.text.length });
    writeJson(`${context.dir}/advanced-evidence-placement-output.json`, { status: present ? "passed" : "failed", textLength: advanced.text.length });
  }
  if (stage === "route-text-diff") {
    const scan = await renderSections(["simulation", "developer-evidence"]);
    const diff = {
      simulationContainsGuide: containsGuide(scan.simulation.text),
      advancedContainsGuide: containsGuide(scan["developer-evidence"].text),
      simulationTextLength: scan.simulation.text.length,
      advancedTextLength: scan["developer-evidence"].text.length
    };
    context.add("route text diff separates Simulation from workflow evidence", !diff.simulationContainsGuide && diff.advancedContainsGuide, diff);
    writeJson(`${context.dir}/route-text-diff-output.json`, diff);
  }
  if (stage === "hidden-guide-not-mounted") {
    const appSource = readFileSync(abs("apps/web/src/App.tsx"), "utf8");
    const globalMountGone = !appSource.includes("plan-1-demo-guide-demoted") && !appSource.includes("<Plan1DemoGuide");
    context.add("workflow guide is not mounted globally in App.tsx", globalMountGone, { oldGlobalMountPath: "apps/web/src/App.tsx" });
    writeJson(`${context.dir}/hidden-guide-not-mounted-output.json`, { status: globalMountGone ? "passed" : "failed", oldGlobalMountPath: "apps/web/src/App.tsx", newPlacementPath: "apps/web/src/features/app-shell/DeveloperEvidencePage.tsx" });
  }
}

async function renderSections(sections) {
  const port = Number(context.args.port ?? 6820);
  const chromePort = Number(context.args["chrome-port"] ?? 9820);
  const initScript = `sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`;
  const result = await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1000, initScript }, async (browser) => {
    const output = {};
    for (const section of sections) {
      await browser.navigate(`${browser.baseUrl}/?section=${section}`, "document.querySelector('.app-shell') != null");
      const screenshotName = section === "simulation" ? "simulation-route-clean" : section === "developer-evidence" ? "advanced-evidence-workflow-guide" : section;
      if (section === "simulation" || section === "developer-evidence") {
        await browser.screenshot(`${context.dir}/screenshots/${screenshotName}.png`);
      }
      output[section] = {
        text: await browser.evaluate("document.body.textContent || ''")
      };
    }
    return output;
  });
  return result.result;
}

function containsGuide(text) {
  return /Canonical Workflow Guide|Open Plan 1|Plan 1 Demo Guide|workflow evidence/iu.test(text);
}
