#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  assertBrowserPng,
  delay,
  enterDemoPin,
  waitForExpression,
  withBrowserRenderedApp,
  writeJson,
  writeText
} from "./lib/app-browser-proof.mjs";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "470";
const port = Number(readArg("--port") ?? "5470");
const chromePort = Number(readArg("--chrome-port") ?? "9470");
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
    initScript: `
      sessionStorage.clear();
      window.__demoPinProofNow = 1000;
      Date.now = () => window.__demoPinProofNow;
    `
  },
  async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('.demo-pin-entry-screen') != null");

    await enterDemoPin(browser, "0000");
    await waitForExpression(browser, "/Cooldown/.test(document.body.innerText)");
    const cooldown = await browser.evaluate(domAssertionsScript());
    await browser.screenshot(abs(`${screenshotDir}/wrong-pin-cooldown.png`));

    await browser.evaluate("window.__demoPinProofNow += 15001; true;");
    await delay(1100);
    await enterDemoPin(browser, "0000");
    await browser.evaluate("window.__demoPinProofNow += 15001; true;");
    await delay(1100);
    await enterDemoPin(browser, "0000");
    await waitForExpression(browser, "/Lockout/.test(document.body.innerText) || /locked\\. Try again/.test(document.body.innerText)");
    const lockout = await browser.evaluate(domAssertionsScript());
    await browser.screenshot(abs(`${screenshotDir}/three-strike-lockout.png`));

    await browser.evaluate("window.__demoPinProofNow += 180001; true;");
    await delay(1100);
    await enterDemoPin(browser, "2026");
    await waitForExpression(browser, "document.querySelector('.app-shell') != null");
    const unlocked = await browser.evaluate(domAssertionsScript());
    await browser.screenshot(abs(`${screenshotDir}/post-lockout-unlock.png`));

    return {
      issue,
      source: "browser-rendered-app",
      renderedAppProof: true,
      staticHtmlOnlyProof: false,
      wrongAttemptCreatesCooldown: cooldown.cooldownVisible,
      cooldownVisible: cooldown.cooldownVisible,
      threeWrongAttemptsCreateLockout: lockout.lockoutVisible,
      lockoutVisible: lockout.lockoutVisible,
      countdownVisible: cooldown.countdownVisible && lockout.countdownVisible,
      postLockoutUnlockVisible: unlocked.appShellVisible && unlocked.canonicalPlan1WorkflowVisible,
      appContentVisibleDuringLockout: lockout.appShellVisible || lockout.navigationVisible || lockout.floorplanContentVisible
    };
  }
);

for (const screenshot of ["wrong-pin-cooldown.png", "three-strike-lockout.png", "post-lockout-unlock.png"]) {
  assertBrowserPng(abs(`${screenshotDir}/${screenshot}`));
}
writeJson(abs("docs/verification/pin-rate-limit-lockout-dom-assertions.json"), assertions);
writeJson(abs(`${issueDir}/pin-rate-limit-lockout-dom-assertions.json`), assertions);
writeText(abs(`${issueDir}/test-output/pin-lockout-visual-proof.txt`), `${JSON.stringify(assertions, null, 2)}\n`);
writeText(abs(`${issueDir}/test-output/pin-lockout-visual-proof-server.txt`), serverLog);
console.log(JSON.stringify(assertions, null, 2));

function domAssertionsScript() {
  return `(() => {
    const bodyText = document.body.innerText;
    return {
      appShellVisible: document.querySelector('.app-shell') != null,
      navigationVisible: document.querySelector('.app-nav') != null || document.querySelector('nav') != null,
      floorplanContentVisible: document.querySelector('.floorplan-library') != null,
      cooldownVisible: /Cooldown\\s+\\d+\\s+seconds remaining/.test(bodyText) || /Wait \\d+ seconds before another demo PIN attempt/.test(bodyText),
      lockoutVisible: /Lockout\\s+\\d+\\s+seconds remaining/.test(bodyText) || /Demo PIN entry is locked/.test(bodyText),
      countdownVisible: /(Cooldown|Lockout)\\s+\\d+\\s+seconds remaining/.test(bodyText),
      canonicalPlan1WorkflowVisible: /Canonical Plan 1 workflow/.test(bodyText) && /default-er-layout-plan-1/.test(bodyText)
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
