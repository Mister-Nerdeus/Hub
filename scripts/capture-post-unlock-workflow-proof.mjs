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
const issue = readArg("--issue") ?? "480";
const port = Number(readArg("--port") ?? "5480");
const chromePort = Number(readArg("--chrome-port") ?? "9480");
const issueDir = `docs/verification/issues/issue-${issue}`;
const screenshotDir = `${issueDir}/screenshots`;

mkdirSync(abs(screenshotDir), { recursive: true });
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const { result: assertions, serverLog } = await withBrowserRenderedApp(
  {
    port,
    chromePort,
    width: 1440,
    height: 1100,
    initScript: `
      sessionStorage.setItem("nerdeus.demoPin.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));
    `
  },
  async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('[aria-labelledby=\"floorplans-title\"]') != null");
    const dom = await browser.evaluate(domAssertionsScript());
    await browser.screenshot(abs(`${screenshotDir}/post-unlock-canonical-workflow.png`));
    return {
      issue,
      source: "browser-rendered-app",
      renderedAppProof: true,
      staticHtmlOnlyProof: false,
      canonicalWorkflowVisible: dom.canonicalWorkflowVisible,
      canonicalFloorplanHeadingVisible: dom.canonicalFloorplanHeadingVisible,
      plan1OnlyInMainWorkflow: dom.plan1OnlyInMainWorkflow,
      demoGuideSecondary: dom.demoGuideSecondary,
      seedPackSecondary: dom.seedPackSecondary,
      simulationOutputVisible: dom.simulationOutputVisible,
      optimizerOutputVisible: dom.optimizerOutputVisible
    };
  }
);

assertBrowserPng(abs(`${screenshotDir}/post-unlock-canonical-workflow.png`));
writeJson(abs("docs/verification/post-unlock-workflow-dom-assertions.json"), assertions);
writeJson(abs(`${issueDir}/post-unlock-workflow-dom-assertions.json`), assertions);
writeText(abs(`${issueDir}/test-output/post-unlock-visual-proof.txt`), `${JSON.stringify(assertions, null, 2)}\n`);
writeText(abs(`${issueDir}/test-output/post-unlock-visual-proof-server.txt`), serverLog);
console.log(JSON.stringify(assertions, null, 2));

function domAssertionsScript() {
  return `(() => {
    const bodyText = document.body.innerText;
    const main = document.querySelector('[aria-labelledby="floorplans-title"]');
    const mainText = main?.innerText ?? "";
    const guide = document.querySelector('details.plan-1-demo-guide-demoted');
    const mainPosition = main?.compareDocumentPosition(guide ?? document.body) ?? 0;
    return {
      canonicalWorkflowVisible: /Canonical Plan 1 workflow/.test(mainText) && /Review Floorplan/.test(mainText) && /Edit Working Copy/.test(mainText) && /Manual Assignment/.test(mainText) && /Scenario Comparison/.test(mainText),
      canonicalFloorplanHeadingVisible: /Canonical ER Pod Floorplan/.test(bodyText),
      plan1OnlyInMainWorkflow: document.querySelector('.floorplan-library [data-plan-id="default-er-layout-plan-1"]') != null && document.querySelector('.floorplan-library [data-plan-id="default-er-layout-plan-2"]') == null,
      demoGuideSecondary: guide != null && main != null && Boolean(mainPosition & Node.DOCUMENT_POSITION_FOLLOWING),
      seedPackSecondary: document.querySelector('details.plan-1-demo-guide-demoted [data-seed-pack-placement="developer-evidence"]') != null,
      simulationOutputVisible: /full-shift simulation output|executed shift timeline|simulation result/i.test(mainText),
      optimizerOutputVisible: /optimizer output|recommended assignment|best assignment/i.test(mainText)
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
