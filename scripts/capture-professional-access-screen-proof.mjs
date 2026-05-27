#!/usr/bin/env node
import { mkdirSync, readFileSync } from "node:fs";
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
const issue = readArg("--issue") ?? "498";
const port = Number(readArg("--port") ?? "5498");
const chromePort = Number(readArg("--chrome-port") ?? "9498");
const issueDir = `docs/verification/issues/issue-${issue}`;
const screenshotDir = `${issueDir}/screenshots`;
const internalAccessCode = readInternalAccessCode();

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
      window.__workspaceAccessProofNow = 1000;
      Date.now = () => window.__workspaceAccessProofNow;
    `
  },
  async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('.demo-pin-entry-screen') != null");
    const locked = await browser.evaluate(domAssertionsScript(internalAccessCode));
    await browser.screenshot(abs(`${screenshotDir}/professional-access-locked.png`));

    await enterDemoPin(browser, "0000");
    await waitForExpression(browser, "/Access code not accepted|Please wait/.test(document.body.innerText)");
    const wrongAttempt = await browser.evaluate(domAssertionsScript(internalAccessCode));
    await browser.screenshot(abs(`${screenshotDir}/professional-access-wrong-attempt.png`));

    await browser.evaluate("window.__workspaceAccessProofNow += 2000; true;");
    await delay(1100);
    const cooldown = await browser.evaluate(domAssertionsScript(internalAccessCode));
    await browser.screenshot(abs(`${screenshotDir}/professional-access-cooldown.png`));

    await browser.evaluate("window.__workspaceAccessProofNow += 13001; true;");
    await delay(1100);
    await enterDemoPin(browser, "0000");
    await browser.evaluate("window.__workspaceAccessProofNow += 15001; true;");
    await delay(1100);
    await enterDemoPin(browser, "0000");
    await waitForExpression(browser, "/Too many attempts/.test(document.body.innerText)");
    const lockout = await browser.evaluate(domAssertionsScript(internalAccessCode));
    await browser.screenshot(abs(`${screenshotDir}/professional-access-lockout.png`));

    await browser.evaluate("window.__workspaceAccessProofNow += 180001; true;");
    await delay(1100);
    await enterDemoPin(browser, internalAccessCode);
    await waitForExpression(browser, "document.querySelector('.app-shell') != null");
    const unlocked = await browser.evaluate(domAssertionsScript(internalAccessCode));
    await browser.screenshot(abs(`${screenshotDir}/professional-access-unlocked-workspace.png`));

    return {
      productDisplayNameVisible: locked.productDisplayNameVisible,
      workspaceAccessVisible: locked.workspaceAccessVisible,
      accessRequiredVisible: locked.accessRequiredVisible,
      accessCodeVisible: locked.internalAccessCodeVisible,
      forbiddenInternalTermVisible: locked.forbiddenInternalTermVisible,
      professionalCopyVisible: locked.professionalCopyVisible,
      productionAuthClaimVisible: locked.productionAuthClaimVisible,
      realSecurityClaimVisible: locked.realSecurityClaimVisible,
      phiProtectionClaimVisible: locked.phiProtectionClaimVisible,
      mainNavVisibleBeforeUnlock: locked.mainNavVisibleBeforeUnlock,
      floorplanContentVisibleBeforeUnlock: locked.floorplanContentVisibleBeforeUnlock,
      scenarioContentVisibleBeforeUnlock: locked.scenarioContentVisibleBeforeUnlock,
      simulationOutputVisible: locked.simulationOutputVisible,
      optimizerOutputVisible: locked.optimizerOutputVisible,
      staticHtmlOnlyProof: false,
      renderedAppProof: true,
      wrongAttemptVisible: wrongAttempt.wrongAttemptVisible,
      cooldownVisible: cooldown.cooldownVisible,
      lockoutVisible: lockout.lockoutVisible,
      unlockedWorkspaceVisible: unlocked.unlockedWorkspaceVisible
    };
  }
);

for (const screenshot of [
  "professional-access-locked.png",
  "professional-access-wrong-attempt.png",
  "professional-access-cooldown.png",
  "professional-access-lockout.png",
  "professional-access-unlocked-workspace.png"
]) {
  assertBrowserPng(abs(`${screenshotDir}/${screenshot}`));
}

if (issue === "494") {
  await captureMobileLayout();
}

writeJson(abs("docs/verification/professional-access-screen-dom-assertions.json"), assertions);
writeJson(abs(`${issueDir}/professional-access-dom-output.json`), assertions);
writeJson(abs(`${issueDir}/app-rendered-proof-output.json`), { status: "passed", renderedAppProof: true });
writeJson(abs(`${issueDir}/no-access-code-dom-output.json`), { status: assertions.accessCodeVisible ? "failed" : "passed" });
writeJson(abs(`${issueDir}/no-forbidden-visible-term-dom-output.json`), { status: assertions.forbiddenInternalTermVisible ? "failed" : "passed" });
writeJson(abs(`${issueDir}/no-main-nav-before-unlock-output.json`), { status: assertions.mainNavVisibleBeforeUnlock ? "failed" : "passed" });
writeJson(abs(`${issueDir}/no-floorplan-before-unlock-output.json`), { status: assertions.floorplanContentVisibleBeforeUnlock ? "failed" : "passed" });
writeText(abs(`${issueDir}/test-output/professional-access-proof.txt`), `${JSON.stringify(assertions, null, 2)}\n`);
writeText(abs(`${issueDir}/test-output/professional-access-proof-server.txt`), serverLog);
console.log(JSON.stringify(assertions, null, 2));

async function captureMobileLayout() {
  const mobile = await withBrowserRenderedApp(
    {
      port: port + 1,
      chromePort: chromePort + 1,
      width: 390,
      height: 844,
      initScript: "sessionStorage.clear();"
    },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('.demo-pin-entry-screen') != null");
      await browser.screenshot(abs(`${screenshotDir}/professional-access-locked-mobile.png`));
      return true;
    }
  );
  writeText(abs(`${issueDir}/test-output/professional-access-mobile-server.txt`), mobile.serverLog);
  await withBrowserRenderedApp(
    {
      port: port + 2,
      chromePort: chromePort + 2,
      width: 1440,
      height: 1000,
      initScript: "sessionStorage.clear();"
    },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('.demo-pin-entry-screen') != null");
      await browser.screenshot(abs(`${screenshotDir}/professional-access-locked-desktop.png`));
      return true;
    }
  );
  assertBrowserPng(abs(`${screenshotDir}/professional-access-locked-mobile.png`));
  assertBrowserPng(abs(`${screenshotDir}/professional-access-locked-desktop.png`));
}

function domAssertionsScript(code) {
  return `(() => {
    const bodyText = document.body.textContent || "";
    const internalCode = ${JSON.stringify(code)};
    return {
      productDisplayNameVisible: /ER Pod Shift Simulator/.test(bodyText),
      workspaceAccessVisible: /Workspace Access/.test(bodyText),
      accessRequiredVisible: /Access Required/.test(bodyText),
      internalAccessCodeVisible: bodyText.includes(internalCode),
      forbiddenInternalTermVisible: /Demo PIN|Demo-only|PIN\\s+[0-9]{4}|trial/i.test(bodyText),
      professionalCopyVisible: /Private operational workspace/.test(bodyText) && /Controlled review flow only/.test(bodyText),
      productionAuthClaimVisible: /production auth enabled|production authentication enabled/i.test(bodyText),
      realSecurityClaimVisible: /secure access|real security enabled|security protection enabled|protects real data/i.test(bodyText),
      phiProtectionClaimVisible: /PHI protection enabled|protects PHI/i.test(bodyText),
      mainNavVisibleBeforeUnlock: document.querySelector('.app-nav') != null,
      floorplanContentVisibleBeforeUnlock: document.querySelector('.floorplan-library') != null || /Canonical ER Pod Floorplan/.test(bodyText),
      scenarioContentVisibleBeforeUnlock: /Scenario|Ratio Comparison/.test(bodyText),
      simulationOutputVisible: /Simulation execution|simulation output/i.test(bodyText),
      optimizerOutputVisible: /optimizer output|optimized assignment/i.test(bodyText),
      wrongAttemptVisible: /Access code not accepted/.test(bodyText),
      cooldownVisible: /Please wait \\d+ seconds before trying again/.test(bodyText) || /Try again in \\d+ seconds/.test(bodyText),
      lockoutVisible: /Too many attempts/.test(bodyText),
      unlockedWorkspaceVisible: document.querySelector('.app-shell') != null && /Canonical ER Pod Floorplan/.test(bodyText)
    };
  })();`;
}

function readInternalAccessCode() {
  const source = readFileSync(abs("packages/shared/src/demo-pin/demoPinContract.ts"), "utf8");
  const match = source.match(/DEMO_PIN_CODE\s*=\s*"([^"]+)"/u);
  if (match == null) throw new Error("Unable to read internal access-code literal");
  return match[1];
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function abs(path) {
  return join(repoRoot, path);
}
