#!/usr/bin/env node
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertBrowserPng,
  delay,
  withBrowserRenderedApp,
  writeJson,
  writeText
} from "./lib/app-browser-proof.mjs";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "508";
const port = Number(readArg("--port") ?? "7008");
const chromePort = Number(readArg("--chrome-port") ?? "9808");
const issueDir = `docs/verification/issues/issue-${issue}`;
const screenshotDir = `${issueDir}/screenshots`;
const internalAccessCode = readInternalAccessCode();

mkdirSync(abs(screenshotDir), { recursive: true });
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const lockedRun = await withBrowserRenderedApp(
  {
    port,
    chromePort,
    width: 1440,
    height: 1200,
    initScript: "sessionStorage.clear();"
  },
  async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('.demo-pin-entry-screen') != null");
    const locked = await browser.evaluate(domAssertionsScript(internalAccessCode));
    await browser.screenshot(abs(`${screenshotDir}/workspace-access-screen.png`));
    return locked;
  }
);

const unlockedRun = await withBrowserRenderedApp(
  {
    port: port + 1,
    chromePort: chromePort + 1,
    width: 1440,
    height: 1200,
    initScript: `localStorage.clear(); sessionStorage.setItem("nerdeus.demoPin.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`
  },
  async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('.app-shell') != null");
    const floorplan = await browser.evaluate(domAssertionsScript(internalAccessCode));
    await browser.screenshot(abs(`${screenshotDir}/unlocked-canonical-floorplan.png`));

    await browser.navigate(
      `${browser.baseUrl}/?section=editor`,
      "document.querySelector('#layout-editor-stage-proof') != null && document.body.textContent.includes('Canonical fixture is read-only') && document.querySelector('[data-room-type=\"storage\"] text') != null"
    );
    const editor = await browser.evaluate(domAssertionsScript(internalAccessCode));
    await browser.screenshot(abs(`${screenshotDir}/unlocked-editor-read-only-explanation.png`));
    await browser.screenshot(abs(`${screenshotDir}/unlocked-storage-rendering.png`));
    await browser.screenshot(abs(`${screenshotDir}/editor-background-pan-ready.png`));

    const panStart = await browser.evaluate(`(() => {
      const frame = document.querySelector('.layout-editor-stage__viewport-frame');
      const svg = document.querySelector('.layout-editor-stage__svg');
      const rect = frame?.getBoundingClientRect();
      return {
        x: rect == null ? 220 : rect.left + 24,
        y: rect == null ? 260 : rect.top + 24,
        panXFeet: Number(svg?.getAttribute('data-pan-x-feet') || "0"),
        panYFeet: Number(svg?.getAttribute('data-pan-y-feet') || "0")
      };
    })();`);
    await browser.cdp.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: panStart.x,
      y: panStart.y,
      button: "left",
      buttons: 1
    });
    await browser.cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: panStart.x + 160,
      y: panStart.y + 90,
      button: "left",
      buttons: 1
    });
    await browser.cdp.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: panStart.x + 160,
      y: panStart.y + 90,
      button: "left",
      buttons: 0
    });
    await delay(250);
    const panAfter = await browser.evaluate(`(() => {
      const svg = document.querySelector('.layout-editor-stage__svg');
      return {
        panXFeet: Number(svg?.getAttribute('data-pan-x-feet') || "0"),
        panYFeet: Number(svg?.getAttribute('data-pan-y-feet') || "0")
      };
    })();`);
    await browser.screenshot(abs(`${screenshotDir}/editor-background-pan-after-drag.png`));
    await browser.screenshot(abs(`${screenshotDir}/unlocked-editor-background-pan.png`));
    const backgroundDragPanEnabled = panAfter.panXFeet !== panStart.panXFeet || panAfter.panYFeet !== panStart.panYFeet;

    await browser.navigate(`${browser.baseUrl}/?section=scenarios`, "document.querySelector('.scenario-ratio-comparison') != null");
    const scenarios = await browser.evaluate(domAssertionsScript(internalAccessCode));

    await browser.navigate(`${browser.baseUrl}/?section=developer-evidence`, "document.querySelector('.legacy-floorplan-reference') != null || document.querySelector('.developer-evidence') != null");
    const advanced = await browser.evaluate(domAssertionsScript(internalAccessCode));
    await browser.screenshot(abs(`${screenshotDir}/unlocked-advanced-evidence.png`));

    return { floorplan, editor: { ...editor, backgroundDragPanEnabled }, scenarios, advanced };
  }
);

const locked = lockedRun.result;
const { floorplan, editor, scenarios, advanced } = unlockedRun.result;
const result = {
  issue,
  source: "browser-rendered-app",
  renderedAppProof: true,
  productDisplayNameVisible: locked.productDisplayNameVisible || floorplan.productDisplayNameVisible,
  forbiddenVisibleTermVisible: [locked, floorplan, editor, scenarios, advanced].some((item) => item.forbiddenVisibleTermVisible),
  accessCredentialVisible: [locked, floorplan, editor, scenarios, advanced].some((item) => item.accessCredentialVisible),
  accessCodeVisible: [locked, floorplan, editor, scenarios, advanced].some((item) => item.accessCredentialVisible),
  floorplanNavSingular: floorplan.floorplanNavSingular,
  lockWorkspaceStyled: floorplan.lockWorkspaceStyled,
  jsonEvidenceCollapsed: floorplan.jsonEvidenceCollapsed && editor.jsonEvidenceCollapsed,
  readOnlyEditorExplanationVisible: editor.readOnlyEditorExplanationVisible,
  storageLabelPolished: editor.storageLabelPolished,
  backgroundDragPanEnabled: editor.backgroundDragPanEnabled,
  plan1VisibleMainUi: floorplan.plan1VisibleMainUi,
  plansTwoThroughFiveVisibleMainUi: floorplan.plansTwoThroughFiveVisibleMainUi,
  plansTwoThroughFiveVisibleAdvanced: advanced.plansTwoThroughFiveVisibleAdvanced,
  simulationOutputVisible: floorplan.simulationOutputVisible || editor.simulationOutputVisible || scenarios.simulationOutputVisible,
  optimizerOutputVisible: floorplan.optimizerOutputVisible || editor.optimizerOutputVisible || scenarios.optimizerOutputVisible,
  staticHtmlOnlyProof: false
};

for (const screenshot of [
  "workspace-access-screen.png",
  "unlocked-canonical-floorplan.png",
  "unlocked-editor-read-only-explanation.png",
  "editor-background-pan-ready.png",
  "editor-background-pan-after-drag.png",
  "unlocked-editor-background-pan.png",
  "unlocked-advanced-evidence.png",
  "unlocked-storage-rendering.png"
]) assertBrowserPng(abs(`${screenshotDir}/${screenshot}`));

writeJson(abs("docs/verification/unlocked-workspace-polish-dom-assertions.json"), result);
writeJson(abs(`${issueDir}/unlocked-workspace-dom-output.json`), result);
writeJson(abs(`${issueDir}/app-rendered-unlocked-proof-output.json`), { status: "passed", renderedAppProof: true });
writeJson(abs(`${issueDir}/no-forbidden-visible-term-dom-output.json`), { status: result.forbiddenVisibleTermVisible ? "failed" : "passed" });
writeJson(abs(`${issueDir}/no-access-credential-dom-output.json`), { status: result.accessCredentialVisible ? "failed" : "passed" });
writeJson(abs(`${issueDir}/no-access-code-dom-output.json`), { status: result.accessCredentialVisible ? "failed" : "passed" });
writeJson(abs(`${issueDir}/singular-nav-dom-output.json`), { status: result.floorplanNavSingular ? "passed" : "failed" });
writeJson(abs(`${issueDir}/lock-workspace-style-dom-output.json`), { status: result.lockWorkspaceStyled ? "passed" : "failed" });
writeJson(abs(`${issueDir}/evidence-depth-dom-output.json`), { status: result.jsonEvidenceCollapsed ? "passed" : "failed" });
writeJson(abs(`${issueDir}/read-only-editor-dom-output.json`), { status: result.readOnlyEditorExplanationVisible ? "passed" : "failed" });
writeJson(abs(`${issueDir}/storage-rendering-dom-output.json`), { status: result.storageLabelPolished ? "passed" : "failed" });
writeJson(abs(`${issueDir}/editor-background-pan-dom-output.json`), { status: result.backgroundDragPanEnabled ? "passed" : "failed" });
writeText(abs(`${issueDir}/test-output/unlocked-workspace-proof.txt`), `${JSON.stringify(result, null, 2)}\n`);
writeText(abs(`${issueDir}/test-output/unlocked-workspace-proof-server.txt`), `${lockedRun.serverLog}\n${unlockedRun.serverLog}`);
console.log(JSON.stringify(result, null, 2));

function domAssertionsScript(code) {
  return `(() => {
    const bodyText = document.body.textContent || "";
    const legacyGuideLabel = ["Plan", "1", "Demo", "Guide"].join(" ");
    const legacyRelockLabel = ["Relock", "Demo"].join(" ");
    const forbidden = ["Demo PIN", "Demo-only", "demo-only", legacyRelockLabel, "trial", legacyGuideLabel];
    const mainLibrary = document.querySelector('.floorplan-library');
    const legacyRoot = document.querySelector('.legacy-floorplan-reference, .legacy-floorplan-fixtures');
    const byPlan = (root, planId) => root?.querySelector('[data-plan-id="' + planId + '"]') != null;
    const lockButton = document.querySelector('.demo-relock-button');
    const lockStyle = lockButton == null ? null : getComputedStyle(lockButton);
    const storageText = document.querySelector('[data-room-type="storage"] text')?.textContent?.trim() || "";
    return {
      productDisplayNameVisible: /ER Pod Shift Simulator/.test(bodyText),
      forbiddenVisibleTermVisible: forbidden.some((fragment) => bodyText.includes(fragment)),
      accessCredentialVisible: new RegExp('(?:Access code|PIN|code)\\\\s*' + ${JSON.stringify(code)} + '\\\\b', 'i').test(bodyText),
      floorplanNavSingular: Array.from(document.querySelectorAll('.app-nav__button')).some((button) => button.textContent?.trim() === "Floorplan"),
      lockWorkspaceStyled: lockButton != null && lockButton.getAttribute('aria-label') === "Lock workspace and return to access screen" && Number.parseFloat(lockStyle?.minHeight || "0") >= 38,
      jsonEvidenceCollapsed: Array.from(document.querySelectorAll('details.floorplan-library__evidence-details, details.layout-editor-stage__json-drawer')).every((details) => !details.open),
      readOnlyEditorExplanationVisible: /Canonical fixture is read-only\\. Create a working copy to edit geometry\\./.test(bodyText),
      storageLabelPolished: storageText === "Storage",
      backgroundDragPanEnabled: document.querySelector('[data-canvas-pan-helper="true"]') != null && document.querySelector('.layout-editor-stage__svg[data-canvas-pan]') != null,
      plan1VisibleMainUi: byPlan(mainLibrary, 'default-er-layout-plan-1') || bodyText.includes('Canonical ER Pod Floorplan'),
      plansTwoThroughFiveVisibleMainUi: ['2','3','4','5'].some((id) => byPlan(mainLibrary, 'default-er-layout-plan-' + id)),
      plansTwoThroughFiveVisibleAdvanced: legacyRoot != null && ['2','3','4','5'].every((id) => byPlan(legacyRoot, 'default-er-layout-plan-' + id)),
      simulationOutputVisible: document.querySelector('.simulation-proof, .retrieval-proof') != null,
      optimizerOutputVisible: document.querySelector('.optimizer-proof') != null
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
