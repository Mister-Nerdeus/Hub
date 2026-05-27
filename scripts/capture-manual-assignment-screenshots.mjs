import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "390";
const port = Number(readArg("--port") ?? "4190");
const remoteDebuggingPort = Number(readArg("--debug-port") ?? "9320");
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
  `--user-data-dir=${abs(`node_modules/.cache/manual-assignment-chrome-${issue}-${port}`)}`,
  "about:blank"
], { stdio: "ignore" });

try {
  await waitForServer(baseUrl);
  const websocketUrl = await waitForChrome(remoteDebuggingPort);
  const cdp = await connectCdp(websocketUrl);
  try {
    const cases = [];

    await openPage(cdp, `${baseUrl}/?section=developer-evidence#manual-assignment-title`, 1440, 1400);
    await assertText(cdp, "ER Pod Shift Simulator");
    await scrollTo(cdp, "manual-nurse-profile-title");
    cases.push(await captureCase(cdp, "nurse-profile-panel.png", "developer-evidence#manual-nurse-profile-title", 1440, 1400));
    await scrollTo(cdp, "room-load-editor-title");
    cases.push(await captureCase(cdp, "room-load-editor-panel.png", "developer-evidence#room-load-editor-title", 1440, 1400));

    await openPage(cdp, `${baseUrl}/?section=manual-assignment#manual-assignment-section-title`, 1440, 1400);
    await assignRoom(cdp, "Room 101", "Nurse Blue");
    await assignRoom(cdp, "Room 102", "Nurse Green");
    await scrollTo(cdp, "manual-assignment-workspace-title");
    cases.push(await captureCase(cdp, "manual-assignment-workspace.png", "manual-assignment#manual-assignment-workspace-title", 1440, 1400));
    cases.push(await captureCase(cdp, "color-coded-assignment.png", "manual-assignment#manual-assignment-workspace-title", 1440, 1400));
    await scrollTo(cdp, "manual-rooms-title");
    cases.push(await captureCase(cdp, "unassigned-rooms.png", "manual-assignment#manual-rooms-title", 1440, 1400));
    await scrollTo(cdp, "manual-burden-title");
    cases.push(await captureCase(cdp, "nurse-burden-table.png", "manual-assignment#manual-burden-title", 1440, 1400));
    await scrollTo(cdp, "manual-warnings-title");
    cases.push(await captureCase(cdp, "assignment-warnings-panel.png", "manual-assignment#manual-warnings-title", 1440, 1400));
    await scrollTo(cdp, "four-patient-comparison-title");
    cases.push(await captureCase(cdp, "four-patient-comparison-panel.png", "manual-assignment#four-patient-comparison-title", 1440, 1400));

    const manifest = {
      manifestVersion: "1.0.0",
      issue,
      productDisplayName: "ER Pod Shift Simulator",
      browserName: "chrome-headless",
      source: "browser-rendered-app",
      manualVisualApprovalClaimed: false,
      screenshots: cases
    };
    writeJson(`${issueDir}/manual-assignment-screenshot-manifest-output.json`, manifest);
    console.log(JSON.stringify({ status: "passed", issue, screenshotCount: cases.length }, null, 2));
  } finally {
    cdp.close();
  }
} finally {
  killProcessTree(chrome);
  if (previewServer != null) killProcessTree(previewServer);
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
}

async function captureCase(cdp, fileName, route, width, height) {
  const outputPath = `${screenshotDir}/${fileName}`;
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true
  });
  writeBuffer(outputPath, Buffer.from(result.data, "base64"));
  const png = readPngInfo(outputPath);
  if (png.width < 300 || png.height < 300 || png.byteLength < 5000) {
    throw new Error(`manual assignment screenshot is placeholder-like: ${outputPath}`);
  }
  return {
    fileName,
    path: outputPath,
    route,
    viewport: { width, height },
    capturedAt: "2026-05-26T00:00:00Z",
    source: "browser-rendered-app",
    manualVisualApprovalClaimed: false,
    png
  };
}

async function assignRoom(cdp, roomLabel, nurseLabel) {
  await evaluateOrThrow(cdp, {
    awaitPromise: true,
    expression: `
      (() => {
        const nurseButton = [...document.querySelectorAll(".manual-nurse-selector__button")]
          .find((button) => button.textContent.includes(${JSON.stringify(nurseLabel)}));
        if (!nurseButton) throw new Error("missing nurse button ${nurseLabel}");
        nurseButton.click();
        const roomButton = [...document.querySelectorAll(".manual-room-card__assign-button")]
          .find((button) => button.textContent.includes(${JSON.stringify(roomLabel)}));
        if (!roomButton) throw new Error("missing room button ${roomLabel}");
        roomButton.click();
      })()
    `
  });
  await delay(250);
}

async function scrollTo(cdp, elementId) {
  await evaluateOrThrow(cdp, {
    awaitPromise: true,
    expression: `
      (() => {
        const element = document.getElementById(${JSON.stringify(elementId)});
        if (!element) throw new Error("missing element ${elementId}");
        element.scrollIntoView({ block: "start" });
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
  throw new Error("manual assignment page did not finish loading");
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
