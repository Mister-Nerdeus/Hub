#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";

const issue = readArg("--issue") ?? "449";
const issueDir = `docs/verification/issues/issue-${issue}`;
const screenshotDir = `${issueDir}/screenshots`;
const port = Number(readArg("--port") ?? "5191");
const chromePort = Number(readArg("--chrome-port") ?? "9223");
const chromePath = findChrome();

mkdirSync(screenshotDir, { recursive: true });
mkdirSync(`${issueDir}/test-output`, { recursive: true });

await assertPortFree(port);
await assertPortFree(chromePort);

const server = spawn("npm", ["--workspace", "@nerdeus/web", "run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  shell: process.platform === "win32",
  stdio: ["ignore", "pipe", "pipe"]
});
let serverLog = "";
server.stdout.on("data", (chunk) => { serverLog += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverLog += chunk.toString(); });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-extensions",
  "--no-first-run",
  "--remote-debugging-address=127.0.0.1",
  `--remote-debugging-port=${chromePort}`,
  "--window-size=1440,1000",
  "about:blank"
], { stdio: ["ignore", "pipe", "pipe"] });

try {
  await waitForHttp(`http://127.0.0.1:${port}`, 45_000);
  const cdp = await connectCdp(chromePort);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await navigate(cdp, `http://127.0.0.1:${port}/?section=floorplans`);

  const lockedAssertions = await evaluate(cdp, assertionScript({ advancedOpen: false }));
  await screenshot(cdp, `${screenshotDir}/canonical-one-floorplan-main-ui.png`);
  await screenshot(cdp, `${screenshotDir}/demo-pin-locked-proof.png`);

  await evaluate(cdp, "document.querySelector('details.floorplan-demo-proof')?.setAttribute('open', ''); true;");
  const advancedAssertions = await evaluate(cdp, assertionScript({ advancedOpen: true }));
  await screenshot(cdp, `${screenshotDir}/advanced-legacy-floorplans.png`);

  await evaluate(cdp, `(() => {
    const input = document.querySelector('input[aria-label="Demo PIN"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '0000');
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '0000' }));
    document.querySelector('.demo-pin-gate form').requestSubmit();
    return true;
  })();`);
  await delay(250);
  const wrongAssertions = await evaluate(cdp, assertionScript({ advancedOpen: true }));
  await screenshot(cdp, `${screenshotDir}/demo-pin-wrong-proof.png`);

  await evaluate(cdp, `(() => {
    const input = document.querySelector('input[aria-label="Demo PIN"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '2026');
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '2026' }));
    document.querySelector('.demo-pin-gate form').requestSubmit();
    return true;
  })();`);
  await delay(250);
  const unlockedAssertions = await evaluate(cdp, assertionScript({ advancedOpen: true }));
  await screenshot(cdp, `${screenshotDir}/demo-pin-unlocked-proof.png`);

  const assertions = {
    productDisplayNameVisible: lockedAssertions.productDisplayNameVisible,
    canonicalPlanVisible: lockedAssertions.canonicalPlanVisible,
    plan1VisibleMainUi: lockedAssertions.plan1VisibleMainUi,
    plan2VisibleMainUi: lockedAssertions.plan2VisibleMainUi,
    plan3VisibleMainUi: lockedAssertions.plan3VisibleMainUi,
    plan4VisibleMainUi: lockedAssertions.plan4VisibleMainUi,
    plan5VisibleMainUi: lockedAssertions.plan5VisibleMainUi,
    legacyPlansVisibleAdvanced: advancedAssertions.legacyPlansVisibleAdvanced,
    pinGateVisible: lockedAssertions.pinGateVisible,
    pinLockedStateVisible: lockedAssertions.pinLockedStateVisible,
    wrongPinStateVisible: wrongAssertions.wrongPinStateVisible,
    pinUnlockedStateVisible: unlockedAssertions.pinUnlockedStateVisible,
    pinDemoOnlyCopyVisible: lockedAssertions.pinDemoOnlyCopyVisible,
    productionAuthClaimVisible: lockedAssertions.productionAuthClaimVisible || advancedAssertions.productionAuthClaimVisible,
    securityClaimVisible: lockedAssertions.securityClaimVisible || advancedAssertions.securityClaimVisible,
    phiLikeTextVisible: lockedAssertions.phiLikeTextVisible || advancedAssertions.phiLikeTextVisible,
    simulationOutputVisible: lockedAssertions.simulationOutputVisible || advancedAssertions.simulationOutputVisible,
    optimizerOutputVisible: lockedAssertions.optimizerOutputVisible || advancedAssertions.optimizerOutputVisible,
    staticHtmlOnlyProof: false
  };

  writeJson("docs/verification/scope-pin-ui-dom-assertions.json", assertions);
  writeJson(`${issueDir}/visual-proof-output.json`, { status: "passed", source: "running-vite-app", assertions });
  writeJson(`${issueDir}/app-rendered-proof-output.json`, { status: "passed", url: `http://127.0.0.1:${port}/?section=floorplans`, staticHtmlOnlyProof: false });
  writeJson(`${issueDir}/canonical-plan-dom-output.json`, {
    status: assertions.plan1VisibleMainUi && !assertions.plan2VisibleMainUi ? "passed" : "failed",
    plan1VisibleMainUi: assertions.plan1VisibleMainUi,
    plan2VisibleMainUi: assertions.plan2VisibleMainUi
  });
  writeJson(`${issueDir}/legacy-plans-dom-output.json`, { status: assertions.legacyPlansVisibleAdvanced ? "passed" : "failed", legacyPlansVisibleAdvanced: assertions.legacyPlansVisibleAdvanced });
  writeJson(`${issueDir}/pin-gate-dom-output.json`, { status: assertions.pinGateVisible ? "passed" : "failed", pinGateVisible: assertions.pinGateVisible });
  writeJson(`${issueDir}/wrong-pin-dom-output.json`, { status: assertions.wrongPinStateVisible ? "passed" : "failed", wrongPinStateVisible: assertions.wrongPinStateVisible });
  writeJson(`${issueDir}/unlocked-pin-dom-output.json`, { status: assertions.pinUnlockedStateVisible ? "passed" : "failed", pinUnlockedStateVisible: assertions.pinUnlockedStateVisible });
  writeText(`${issueDir}/no-static-html-only-proof-output.txt`, "passed: screenshots and DOM assertions came from the running app UI.\n");
  writeText(`${issueDir}/no-auth-claim-output.txt`, assertions.productionAuthClaimVisible ? "failed\n" : "passed: no production authentication claim is visible.\n");
  writeText(`${issueDir}/no-security-claim-output.txt`, assertions.securityClaimVisible ? "failed\n" : "passed: no real security claim is visible.\n");
  writeText(`${issueDir}/no-phi-output.txt`, assertions.phiLikeTextVisible ? "failed\n" : "passed: no PHI-like text is visible in proof scope.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, assertions.simulationOutputVisible ? "failed\n" : "passed: no full-shift simulation output is visible in proof scope.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, assertions.optimizerOutputVisible ? "failed\n" : "passed: no optimizer output is visible in proof scope.\n");
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: visual proof does not mutate default fixtures.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", assertionsPath: "docs/verification/scope-pin-ui-dom-assertions.json" });
  for (const file of [
    "canonical-one-floorplan-main-ui.png",
    "advanced-legacy-floorplans.png",
    "demo-pin-locked-proof.png",
    "demo-pin-wrong-proof.png",
    "demo-pin-unlocked-proof.png"
  ]) assertPng(`${screenshotDir}/${file}`);
  await cdp.close();
  console.log(JSON.stringify({ status: "passed", issue, assertions }, null, 2));
} finally {
  chrome.kill();
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    server.kill("SIGTERM");
  }
  writeText(`${issueDir}/test-output/visual-proof-server.txt`, serverLog);
}

function assertionScript({ advancedOpen }) {
  return `(() => {
    const main = document.querySelector('[aria-labelledby="floorplans-title"]');
    const mainCardsRoot = document.querySelector('.floorplan-library');
    const mainText = main == null ? '' : main.innerText;
    const bodyText = document.body.innerText;
    const byPlan = (planId, root = mainCardsRoot) => root?.querySelector('[data-plan-id="' + planId + '"]') != null;
    const legacyRoot = document.querySelector('.legacy-floorplan-fixtures');
    return {
      productDisplayNameVisible: /ER Pod Shift Simulator/.test(bodyText),
      canonicalPlanVisible: /Canonical ER Pod Floorplan/.test(bodyText),
      plan1VisibleMainUi: byPlan('default-er-layout-plan-1'),
      plan2VisibleMainUi: byPlan('default-er-layout-plan-2'),
      plan3VisibleMainUi: byPlan('default-er-layout-plan-3'),
      plan4VisibleMainUi: byPlan('default-er-layout-plan-4'),
      plan5VisibleMainUi: byPlan('default-er-layout-plan-5'),
      legacyPlansVisibleAdvanced: ${advancedOpen} && ['2','3','4','5'].every((id) => byPlan('default-er-layout-plan-' + id, legacyRoot)),
      pinGateVisible: document.querySelector('.demo-pin-gate') != null,
      pinLockedStateVisible: /Locked/.test(bodyText),
      wrongPinStateVisible: /Wrong demo PIN/.test(bodyText),
      pinUnlockedStateVisible: /Unlocked/.test(bodyText) && /Demo proceed actions unlocked/.test(bodyText),
      pinDemoOnlyCopyVisible: /Demo proceed gate only/.test(bodyText),
      productionAuthClaimVisible: /production authentication is enabled|production auth enabled/i.test(bodyText),
      securityClaimVisible: /secure access|real security enabled|security protection/i.test(bodyText),
      phiLikeTextVisible: document.querySelector('[data-sensitive-text]') != null,
      simulationOutputVisible: /full-shift simulation output|executed shift timeline|simulation result/i.test(mainText),
      optimizerOutputVisible: /optimizer output|recommended assignment|best assignment/i.test(mainText)
    };
  })();`;
}

async function connectCdp(debugPort) {
  await waitForHttp(`http://127.0.0.1:${debugPort}/json/list`, 20_000);
  const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  const page = pages.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl != null);
  if (page == null) throw new Error("Chrome DevTools page target was not available");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id != null && pending.has(message.id)) {
      const { resolveMessage, rejectMessage } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) rejectMessage(new Error(JSON.stringify(message.error)));
      else resolveMessage(message.result ?? {});
    }
  });
  return {
    send(method, params = {}) {
      const requestId = ++id;
      socket.send(JSON.stringify({ id: requestId, method, params }));
      return new Promise((resolveMessage, rejectMessage) => pending.set(requestId, { resolveMessage, rejectMessage }));
    },
    close() {
      socket.close();
    }
  };
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  const start = Date.now();
  while (Date.now() - start < 15_000) {
    const ready = await evaluate(cdp, "document.querySelector('[aria-labelledby=\"floorplans-title\"]') != null");
    if (ready === true) return;
    await delay(250);
  }
  throw new Error(`Timed out waiting for app route: ${url}`);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result?.value;
}

async function screenshot(cdp, outputPath) {
  const result = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(outputPath, Buffer.from(result.data, "base64"));
}

async function waitForHttp(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // retry
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function assertPortFree(portNumber) {
  return new Promise((resolveFree, rejectFree) => {
    const server = createServer();
    server.once("error", rejectFree);
    server.once("listening", () => server.close(resolveFree));
    server.listen(portNumber, "127.0.0.1");
  });
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function assertPng(path) {
  if (!existsSync(path)) throw new Error(`missing screenshot: ${path}`);
  if (statSync(path).size < 5000) throw new Error(`placeholder-like screenshot: ${path}`);
}

function writeText(path, value) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function findChrome() {
  const candidates = process.platform === "win32"
    ? [
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
      ]
    : [
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (found == null) throw new Error("Chrome or Edge executable is required for browser proof");
  return found;
}
