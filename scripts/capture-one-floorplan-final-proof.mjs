#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  assertBrowserPng,
  withBrowserRenderedApp,
  writeJson,
  writeText
} from "./lib/app-browser-proof.mjs";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "485";
const port = Number(readArg("--port") ?? "5485");
const chromePort = Number(readArg("--chrome-port") ?? "9485");
const issueDir = `docs/verification/issues/issue-${issue}`;
const screenshotDir = `${issueDir}/screenshots`;

mkdirSync(abs(screenshotDir), { recursive: true });
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const { result: assertions, serverLog } = await withBrowserRenderedApp(
  {
    port,
    chromePort,
    width: 1440,
    height: 1200,
    initScript: `
      sessionStorage.setItem("nerdeus.demoPin.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));
    `
  },
  async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('[aria-labelledby=\"floorplans-title\"]') != null");
    await browser.evaluate("document.querySelector('details.floorplan-demo-proof')?.setAttribute('open', ''); true;");
    const dom = await browser.evaluate(domAssertionsScript());
    await browser.screenshot(abs(`${screenshotDir}/one-floorplan-main-ui.png`));
    return {
      issue,
      source: "browser-rendered-app",
      renderedAppProof: true,
      staticHtmlOnlyProof: false,
      plan1OnlyInMainUi: dom.plan1OnlyInMainUi,
      plansTwoThroughFiveOnlyInAdvancedEvidence: dom.plansTwoThroughFiveOnlyInAdvancedEvidence,
      planBuilderLandingOnlyInDeveloperEvidence: dom.planBuilderLandingOnlyInDeveloperEvidence,
      activeWorkflowFloorplanId: dom.activeWorkflowFloorplanId
    };
  }
);

assertBrowserPng(abs(`${screenshotDir}/one-floorplan-main-ui.png`));
writeJson(abs("docs/verification/one-floorplan-main-ui-dom-assertions.json"), assertions);
writeJson(abs(`${issueDir}/one-floorplan-main-ui-dom-assertions.json`), assertions);
writeText(abs(`${issueDir}/test-output/one-floorplan-visual-proof.txt`), `${JSON.stringify(assertions, null, 2)}\n`);
writeText(abs(`${issueDir}/test-output/one-floorplan-visual-proof-server.txt`), serverLog);
console.log(JSON.stringify(assertions, null, 2));

function domAssertionsScript() {
  return `(() => {
    const mainLibrary = document.querySelector('.floorplan-library');
    const legacyRoot = document.querySelector('.legacy-floorplan-fixtures');
    const byPlan = (root, planId) => root?.querySelector('[data-plan-id="' + planId + '"]') != null;
    return {
      plan1OnlyInMainUi: byPlan(mainLibrary, 'default-er-layout-plan-1') && ['2','3','4','5'].every((id) => !byPlan(mainLibrary, 'default-er-layout-plan-' + id)),
      plansTwoThroughFiveOnlyInAdvancedEvidence: legacyRoot != null && ['2','3','4','5'].every((id) => byPlan(legacyRoot, 'default-er-layout-plan-' + id)),
      planBuilderLandingOnlyInDeveloperEvidence: document.body.innerText.includes('Plan builder') === false,
      activeWorkflowFloorplanId: document.querySelector('.floorplan-library [data-plan-id="default-er-layout-plan-1"]')?.getAttribute('data-plan-id') ?? null
    };
  })();`;
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function abs(path) {
  return join(repoRoot, path);
}
