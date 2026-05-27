#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  assertBrowserPng,
  enterDemoPin,
  waitForExpression,
  withBrowserRenderedApp,
  writeJson,
  writeText
} from "./lib/app-browser-proof.mjs";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "465";
const port = Number(readArg("--port") ?? "5465");
const chromePort = Number(readArg("--chrome-port") ?? "9465");
const issueDir = `docs/verification/issues/issue-${issue}`;
const screenshotDir = `${issueDir}/screenshots`;

mkdirSync(abs(screenshotDir), { recursive: true });
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const { result: assertions, serverLog } = await withBrowserRenderedApp(
  {
    port,
    chromePort,
    width: 1440,
    height: 1000,
    initScript: "sessionStorage.clear();"
  },
  async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('.demo-pin-entry-screen') != null");
    const locked = await browser.evaluate(domAssertionsScript());
    await browser.screenshot(abs(`${screenshotDir}/locked-pin-only.png`));

    await enterDemoPin(browser, "2026");
    await waitForExpression(browser, "document.querySelector('.app-shell') != null && document.querySelector('[aria-labelledby=\"floorplans-title\"]') != null");
    const unlocked = await browser.evaluate(domAssertionsScript());
    await browser.screenshot(abs(`${screenshotDir}/unlocked-canonical-workflow.png`));

    return {
      issue,
      source: "browser-rendered-app",
      renderedAppProof: true,
      staticHtmlOnlyProof: false,
      locked: {
        pinOnly: locked.pinGateVisible && locked.pinEntryVisible && !locked.appShellVisible && !locked.navigationVisible && !locked.forbiddenLockedContentVisible,
        appShellVisible: locked.appShellVisible,
        navigationVisible: locked.navigationVisible,
        demoGuideVisible: locked.demoGuideVisible,
        seedPackVisible: locked.seedPackVisible,
        floorplanContentVisible: locked.floorplanContentVisible,
        protectedActionsVisible: locked.protectedActionsVisible,
        forbiddenLockedContentVisible: locked.forbiddenLockedContentVisible
      },
      unlocked: {
        appShellVisible: unlocked.appShellVisible,
        canonicalPlan1WorkflowVisible: unlocked.canonicalPlan1WorkflowVisible,
        navigationVisible: unlocked.navigationVisible,
        demoGuideDemoted: unlocked.demoGuideDemoted
      }
    };
  }
);

assertBrowserPng(abs(`${screenshotDir}/locked-pin-only.png`));
assertBrowserPng(abs(`${screenshotDir}/unlocked-canonical-workflow.png`));
writeJson(abs("docs/verification/pin-first-entry-dom-assertions.json"), assertions);
writeJson(abs(`${issueDir}/pin-first-entry-dom-assertions.json`), assertions);
writeText(abs(`${issueDir}/test-output/pin-first-visual-proof.txt`), `${JSON.stringify(assertions, null, 2)}\n`);
writeText(abs(`${issueDir}/test-output/pin-first-visual-proof-server.txt`), serverLog);
console.log(JSON.stringify(assertions, null, 2));

function domAssertionsScript() {
  return `(() => {
    const bodyText = document.body.innerText;
    const forbiddenLockedPattern = /\\b(Floorplans|Editor|Manual Assignment|Review \\/ Reports|Advanced|Future Tools|Plan 1 Demo Guide|Scenario Comparison|Ratio Comparison|Developer\\/Evidence|Protected demo actions)\\b/;
    return {
      pinEntryVisible: document.querySelector('.demo-pin-entry-screen') != null,
      pinGateVisible: document.querySelector('.demo-pin-gate') != null,
      appShellVisible: document.querySelector('.app-shell') != null,
      navigationVisible: document.querySelector('.app-nav') != null || document.querySelector('nav') != null,
      demoGuideVisible: /Plan 1 Demo Guide/.test(bodyText),
      seedPackVisible: /seed pack/i.test(bodyText),
      floorplanContentVisible: document.querySelector('.floorplan-library') != null,
      protectedActionsVisible: document.querySelector('[data-protected-action-id]') != null || /Protected demo actions/.test(bodyText),
      forbiddenLockedContentVisible: forbiddenLockedPattern.test(bodyText),
      canonicalPlan1WorkflowVisible: /Canonical Plan 1 workflow/.test(bodyText) && /default-er-layout-plan-1/.test(bodyText),
      demoGuideDemoted: document.querySelector('details.plan-1-demo-guide-demoted') != null
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
