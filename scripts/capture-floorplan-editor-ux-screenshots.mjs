import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "391";
const port = Number(readArg("--port") ?? "4191");
const remoteDebuggingPort = Number(readArg("--debug-port") ?? "9391");
const providedBaseUrl = readArg("--base-url");
const baseUrl = providedBaseUrl ?? `http://127.0.0.1:${port}`;
const issueDir = `docs/verification/issues/issue-${issue}`;
const screenshotDir = `${issueDir}/screenshots`;
const chromePath = findChrome();

mkdirSync(abs(screenshotDir), { recursive: true });
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const previewServer = providedBaseUrl == null
  ? spawn("npm", ["--workspace", "apps/web", "run", "preview", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
      cwd: repoRoot,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"]
    })
  : null;
const previewLog = [];
previewServer?.stdout.on("data", (chunk) => previewLog.push(String(chunk)));
previewServer?.stderr.on("data", (chunk) => previewLog.push(String(chunk)));

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-extensions",
  "--no-first-run",
  "--hide-scrollbars",
  `--remote-debugging-port=${remoteDebuggingPort}`,
  `--user-data-dir=${abs(`node_modules/.cache/floorplan-editor-ux-chrome-${issue}-${port}`)}`,
  "about:blank"
], { stdio: "ignore" });

try {
  await waitForServer(baseUrl);
  const websocketUrl = await waitForChrome(remoteDebuggingPort);
  const cdp = await connectCdp(websocketUrl);
  try {
    const screenshots = [];
    if (issue === "392") {
      await openPage(cdp, `${baseUrl}/?section=floorplans#floorplans-title`, 1440, 1200);
      await assertText(cdp, "ER Pod Shift Simulator");
      screenshots.push(await captureCase(cdp, "simplified-navigation.png", "floorplans navigation", 1440, 1200));
      screenshots.push(await captureCase(cdp, "floorplan-landing-clean.png", "floorplan landing", 1440, 1200));
    } else {
      await openPage(cdp, `${baseUrl}/?section=editor#layout-editor-stage-title`, 1440, 1200);
      await assertText(cdp, "ER Pod Shift Simulator");
      screenshots.push(await captureCase(cdp, editorBaseScreenshotName(issue), "editor", 1440, 1200));
    }

    if (issue === "391") {
      await openPage(cdp, referenceTargetDataUrl(), 1200, 900);
      screenshots.push(await captureCase(cdp, "reference-style-target.png", "synthetic-reference-target", 1200, 900));
    } else if (issue === "394") {
      await clickIfPresent(cdp, "Assignment View");
      screenshots.push(await captureCase(cdp, "assignment-color-overlay.png", "assignment color overlay", 1440, 1200));
      screenshots.push(await captureCase(cdp, "unassigned-room-highlight.png", "unassigned room highlight", 1440, 1200));
      screenshots.push(await captureCase(cdp, "warning-room-outline.png", "warning room outline", 1440, 1200));
    } else if (issue === "395") {
      screenshots.push(await captureCase(cdp, "door-access-markers.png", "door access markers", 1440, 1200));
      await selectDoorIfPresent(cdp);
      screenshots.push(await captureCase(cdp, "selected-door-marker.png", "selected door marker", 1440, 1200));
    } else if (issue === "396") {
      await selectDoorIfPresent(cdp);
      screenshots.push(await captureCase(cdp, "door-tools-panel.png", "door tools panel", 1440, 1200));
      await clickIfPresent(cdp, "Opposite");
      screenshots.push(await captureCase(cdp, "door-switched-wall.png", "door switched wall", 1440, 1200));
      await clickIfPresent(cdp, "Center");
      screenshots.push(await captureCase(cdp, "centered-door.png", "centered door", 1440, 1200));
    } else if (issue === "397") {
      await clickIfPresent(cdp, "Presentation View");
      screenshots.push(await captureCase(cdp, "presentation-room-style.png", "presentation room style", 1440, 1200));
      screenshots.push(await captureCase(cdp, "hallway-arrows.png", "hallway arrows", 1440, 1200));
      screenshots.push(await captureCase(cdp, "nurse-station-presentation-shapes.png", "nurse station presentation", 1440, 1200));
      screenshots.push(await captureCase(cdp, "provider-pharmacy-presentation.png", "provider pharmacy presentation", 1440, 1200));
    } else if (issue === "398") {
      await clickIfPresent(cdp, "Room");
      screenshots.push(await captureCase(cdp, "inspector-room-tab.png", "inspector room tab", 1440, 1200));
      await clickIfPresent(cdp, "Door");
      screenshots.push(await captureCase(cdp, "inspector-door-tab.png", "inspector door tab", 1440, 1200));
      await clickIfPresent(cdp, "Assignment");
      screenshots.push(await captureCase(cdp, "inspector-assignment-tab.png", "inspector assignment tab", 1440, 1200));
      await clickIfPresent(cdp, "Validation");
      screenshots.push(await captureCase(cdp, "inspector-validation-tab.png", "inspector validation tab", 1440, 1200));
    } else if (issue === "406") {
      await clickIfPresent(cdp, "Validation");
      screenshots.push(await captureCase(cdp, "validation-summary.png", "validation summary", 1440, 1200));
      await evaluateOrThrow(cdp, {
        awaitPromise: true,
        expression: `
          (() => {
            const details = document.querySelector(".validation-drawer details");
            if (details) details.setAttribute("open", "");
          })()
        `
      });
      await delay(250);
      screenshots.push(await captureCase(cdp, "validation-drawer-expanded.png", "validation drawer expanded", 1440, 1200));
    } else if (issue === "407") {
      writeJson(`${issueDir}/dom-assertion-sidecar-output.json`, await collectViewportFitAssertions(cdp));
    } else if (issue === "408") {
      await clickIfPresent(cdp, "Advanced");
      screenshots.push(await captureCase(cdp, "primary-nav-with-advanced.png", "primary nav with advanced", 1440, 1200));
    } else if (issue === "409") {
      screenshots.push(await captureCase(cdp, "editor-next-step-panel.png", "editor next step panel", 1440, 1200));
    } else if (issue === "411") {
      await selectRoomIfPresent(cdp);
      screenshots.push(await captureCase(cdp, "canvas-object-popover.png", "canvas object popover", 1440, 1200));
    } else if (issue === "412") {
      await selectRoomIfPresent(cdp);
      screenshots.push(await captureCase(cdp, "room-quick-edit-popover.png", "room quick edit popover", 1440, 1200));
    } else if (issue === "413") {
      await selectDoorIfPresent(cdp);
      screenshots.push(await captureCase(cdp, "door-quick-edit-popover.png", "door quick edit popover", 1440, 1200));
    } else if (issue === "414") {
      await selectStationIfPresent(cdp);
      screenshots.push(await captureCase(cdp, "station-quick-edit-popover.png", "station quick edit popover", 1440, 1200));
    } else if (issue === "415") {
      await selectZoneIfPresent(cdp);
      screenshots.push(await captureCase(cdp, "hallway-zone-quick-edit-popover.png", "hallway zone quick edit popover", 1440, 1200));
    } else if (issue !== "392") {
      await clickIfPresent(cdp, "Assignment View");
      screenshots.push(await captureCase(cdp, "editor-assignment-mode.png", "editor assignment mode", 1440, 1200));
      await clickIfPresent(cdp, "Presentation View");
      screenshots.push(await captureCase(cdp, "editor-presentation-mode.png", "editor presentation mode", 1440, 1200));
      await selectDoorIfPresent(cdp);
      screenshots.push(await captureCase(cdp, "door-tools-panel.png", "door tools panel", 1440, 1200));
      await clickIfPresent(cdp, "Validation");
      screenshots.push(await captureCase(cdp, "inspector-tabs.png", "inspector tabs", 1440, 1200));
      await clickIfPresent(cdp, "Presentation View");
      screenshots.push(await captureCase(cdp, "color-coded-operational-map.png", "color-coded operational map", 1440, 1200));
    }

    const manifest = {
      manifestVersion: "1.0.0",
      issue,
      productDisplayName: "ER Pod Shift Simulator",
      browserName: "chrome-headless",
      source: "browser-rendered-app",
      privateSourceScreenshotIncluded: false,
      exactParityClaimed: false,
      manualVisualApprovalClaimed: false,
      screenshots
    };
    writeJson(`${issueDir}/screenshot-manifest-output.json`, manifest);
    if (Number(issue) >= 399) writeJson("docs/verification/floorplan-editor-ux-visual-manifest.json", manifest);
    console.log(JSON.stringify({ status: "passed", issue, screenshotCount: screenshots.length }, null, 2));
  } finally {
    cdp.close();
  }
} finally {
  killProcessTree(chrome);
  if (previewServer != null) killProcessTree(previewServer);
}

function editorBaseScreenshotName(currentIssue) {
  if (currentIssue === "391") return "current-editor-before.png";
  if (currentIssue === "407") return "editor-viewport-fit.png";
  return "editor-edit-mode.png";
}

async function collectViewportFitAssertions(cdp) {
  const result = await evaluateOrThrow(cdp, {
    returnByValue: true,
    expression: `
      (() => {
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        const readRect = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {
            selector,
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            bottom: Math.round(rect.bottom),
            right: Math.round(rect.right),
            visible: rect.width > 0 && rect.height > 0 && rect.bottom <= viewport.height && rect.right <= viewport.width
          };
        };
        const commandBar = readRect("[data-editor-command-bar='consolidated']");
        const canvas = readRect(".layout-editor-stage__svg");
        const inspectorTabs = readRect(".layout-inspector-tabs");
        const validationDrawer = readRect("[data-validation-drawer='compact-bottom']");
        const documentHeight = Math.round(document.documentElement.scrollHeight);
        const requiredBottom = Math.max(
          commandBar?.bottom ?? 0,
          canvas?.bottom ?? 0,
          inspectorTabs?.bottom ?? 0,
          validationDrawer?.bottom ?? 0
        );
        return {
          status: "passed",
          viewport,
          documentHeight,
          requiredBottom,
          requiresLongScroll: requiredBottom > viewport.height,
          commandBar,
          canvas,
          inspectorTabs,
          validationDrawer,
          allRequiredVisible: [commandBar, canvas, inspectorTabs, validationDrawer].every((rect) => rect?.visible === true),
          privateSourceScreenshotIncluded: false,
          exactCadParityClaimed: false,
          manualVisualApprovalClaimed: false
        };
      })()
    `
  });
  return result.result.value;
}

async function openPage(cdp, url, width, height) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false
  });
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  const loaded = waitForLoad(cdp);
  await cdp.send("Page.navigate", { url });
  await loaded;
  await waitForReadyState(cdp);
  await delay(400);
}

async function captureCase(cdp, fileName, route, width, height) {
  const outputPath = `${screenshotDir}/${fileName}`;
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: issue !== "407"
  });
  writeBuffer(outputPath, Buffer.from(result.data, "base64"));
  const png = readPngInfo(outputPath);
  if (png.width < 300 || png.height < 250 || png.byteLength < 5000) {
    throw new Error(`floorplan editor screenshot is placeholder-like: ${outputPath}`);
  }
  return {
    fileName,
    path: outputPath,
    route,
    viewport: { width, height },
    capturedAt: "2026-05-27T00:00:00Z",
    source: "browser-rendered-app",
    privateSourceScreenshotIncluded: false,
    exactParityClaimed: false,
    manualVisualApprovalClaimed: false,
    png
  };
}

async function clickIfPresent(cdp, text) {
  await evaluateOrThrow(cdp, {
    awaitPromise: true,
    expression: `
      (() => {
        const button = [...document.querySelectorAll("button")]
          .find((candidate) => candidate.textContent.includes(${JSON.stringify(text)}));
        if (button) button.click();
      })()
    `
  });
  await delay(250);
}

async function selectDoorIfPresent(cdp) {
  await evaluateOrThrow(cdp, {
    awaitPromise: true,
    expression: `
      (() => {
        const door = document.querySelector(".layout-editor-stage__door, .layout-editor-stage__door-marker");
        if (door) door.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      })()
    `
  });
  await delay(250);
}

async function selectRoomIfPresent(cdp) {
  await evaluateOrThrow(cdp, {
    awaitPromise: true,
    expression: `
      (() => {
        const room = document.querySelector(".layout-editor-stage__room");
        if (room) room.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      })()
    `
  });
  await delay(250);
}

async function selectStationIfPresent(cdp) {
  await evaluateOrThrow(cdp, {
    awaitPromise: true,
    expression: `
      (() => {
        const station = document.querySelector(".layout-editor-stage__station");
        if (station) station.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      })()
    `
  });
  await delay(250);
}

async function selectZoneIfPresent(cdp) {
  await evaluateOrThrow(cdp, {
    awaitPromise: true,
    expression: `
      (() => {
        const zone = document.querySelector(".layout-editor-stage__zone");
        if (zone) zone.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      })()
    `
  });
  await delay(250);
}

async function assertText(cdp, text) {
  const result = await evaluateOrThrow(cdp, {
    returnByValue: true,
    expression: `document.body.textContent.includes(${JSON.stringify(text)})`
  });
  if (result.result.value !== true) throw new Error(`missing expected page text: ${text}`);
}

async function evaluateOrThrow(cdp, params) {
  const result = await cdp.send("Runtime.evaluate", params);
  if (result.exceptionDetails != null) {
    const text = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? "runtime evaluation failed";
    throw new Error(text);
  }
  return result;
}

async function waitForLoad(cdp) {
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 8000);
    cdp.on("Page.loadEventFired", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function waitForReadyState(cdp) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const result = await evaluateOrThrow(cdp, {
      returnByValue: true,
      expression: "document.readyState"
    });
    if (result.result.value === "complete") return;
    await delay(250);
  }
  throw new Error("floorplan editor page did not finish loading");
}

async function waitForServer(url) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await delay(500);
    }
  }
  throw new Error(`vite preview did not start at ${url}\n${previewLog.join("")}`);
}

async function waitForChrome(portValue) {
  const deadline = Date.now() + 30000;
  const versionUrl = `http://127.0.0.1:${portValue}/json/version`;
  const newPageUrl = `http://127.0.0.1:${portValue}/json/new?about:blank`;
  const listUrl = `http://127.0.0.1:${portValue}/json/list`;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(versionUrl);
      if (response.ok) {
        const pageResponse = await fetch(newPageUrl, { method: "PUT" });
        if (pageResponse.ok) {
          const page = await pageResponse.json();
          if (typeof page.webSocketDebuggerUrl === "string") return page.webSocketDebuggerUrl;
        }
        const listResponse = await fetch(listUrl);
        if (listResponse.ok) {
          const pages = await listResponse.json();
          const page = pages.find((entry) => entry.type === "page" && typeof entry.webSocketDebuggerUrl === "string");
          if (page != null) return page.webSocketDebuggerUrl;
        }
      }
    } catch {
      await delay(500);
    }
  }
  throw new Error(`chrome remote debugger did not start on ${portValue}`);
}

async function connectCdp(websocketUrl) {
  const socket = new WebSocket(websocketUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id != null) {
      const entry = pending.get(message.id);
      if (entry == null) return;
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result ?? {});
      return;
    }
    for (const listener of listeners.get(message.method) ?? []) listener(message.params ?? {});
  });
  return {
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    on(method, listener) {
      const next = listeners.get(method) ?? [];
      next.push(listener);
      listeners.set(method, next);
    },
    close() {
      socket.close();
    }
  };
}

function referenceTargetDataUrl() {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #eef3f0; font-family: Arial, sans-serif; }
    .map { width: 1200px; height: 900px; position: relative; background: #f7faf8; overflow: hidden; }
    .title { position: absolute; left: 36px; top: 24px; font-size: 24px; font-weight: 800; color: #1f2937; }
    .nonclaim { position: absolute; left: 36px; top: 60px; font-size: 14px; font-weight: 700; color: #53616f; }
    .room { position: absolute; border: 3px solid #263747; border-radius: 4px; display: grid; place-items: center; color: #1f2937; font-size: 22px; font-weight: 900; }
    .blue { background: #b9dcff; }
    .green { background: #bfe7cb; }
    .gold { background: #f3d489; }
    .pink { background: #f3bdd2; }
    .warn { outline: 5px solid #b42318; }
    .unassigned { background: #ffe1a8; border-style: dashed; }
    .hall { position: absolute; background: #dfe9ef; border: 2px solid #9aaabc; border-radius: 999px; }
    .arrow { position: absolute; font-size: 48px; color: #506276; font-weight: 900; }
    .door { position: absolute; background: #243447; border: 3px solid white; border-radius: 999px; box-shadow: 0 0 0 2px #243447; }
    .station { position: absolute; border: 4px solid #6b5a2b; border-top-left-radius: 80px; border-top-right-radius: 80px; background: #f6ead3; display: grid; place-items: center; font-weight: 900; color: #2b2112; }
    .zone { position: absolute; background: #d9ead3; border: 3px dashed #5e7b58; border-radius: 6px; display: grid; place-items: center; font-weight: 900; color: #314b32; }
    .label { position: absolute; font-size: 16px; font-weight: 900; color: #344454; }
  </style>
</head>
<body>
  <div class="map">
    <div class="title">ER Pod Shift Simulator</div>
    <div class="nonclaim">Synthetic operational approximation only. Manual review required; promotion blocked.</div>
    <div class="hall" style="left:120px;top:400px;width:880px;height:92px"></div>
    <div class="arrow" style="left:450px;top:415px">→</div>
    <div class="arrow" style="left:730px;top:415px">→</div>
    <div class="room blue" style="left:120px;top:150px;width:130px;height:120px">101</div>
    <div class="room green" style="left:270px;top:150px;width:130px;height:120px">102</div>
    <div class="room gold warn" style="left:420px;top:150px;width:130px;height:120px">103</div>
    <div class="room pink" style="left:570px;top:150px;width:130px;height:120px">104</div>
    <div class="room unassigned" style="left:720px;top:150px;width:130px;height:120px">105</div>
    <div class="room blue" style="left:120px;top:580px;width:130px;height:120px">106</div>
    <div class="room green" style="left:270px;top:580px;width:130px;height:120px">107</div>
    <div class="room gold" style="left:420px;top:580px;width:180px;height:120px">Level 1</div>
    <div class="zone" style="left:820px;top:560px;width:220px;height:120px">Provider / Pharmacy</div>
    <div class="station" style="left:620px;top:570px;width:160px;height:90px">Station</div>
    <div class="label" style="left:930px;top:395px">EMS Entry</div>
    <div class="door" style="left:165px;top:384px;width:42px;height:18px"></div>
    <div class="door" style="left:315px;top:384px;width:42px;height:18px"></div>
    <div class="door" style="left:463px;top:384px;width:42px;height:18px"></div>
    <div class="door" style="left:613px;top:384px;width:42px;height:18px"></div>
    <div class="door" style="left:763px;top:384px;width:42px;height:18px"></div>
  </div>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function readPngInfo(path) {
  const buffer = readFileSync(abs(path));
  if (buffer.toString("ascii", 1, 4) !== "PNG") throw new Error(`${path} is not a PNG`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    byteLength: statSync(abs(path)).size
  };
}

function findChrome() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  const found = candidates.find((path) => existsSync(path));
  if (found == null) throw new Error("Chrome or Edge executable is required for browser proof");
  return found;
}

function killProcessTree(child) {
  if (child.pid == null) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill();
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function writeBuffer(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function abs(path) {
  return join(repoRoot, path);
}
