import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const issue = readArg("--issue");
if (issue == null) {
  throw new Error("--issue is required");
}

const port = Number(readArg("--port") ?? String(4423 + (Number(issue) - 423)));
const remoteDebuggingPort = Number(readArg("--debug-port") ?? String(9623 + (Number(issue) - 423)));
const providedBaseUrl = readArg("--base-url");
const baseUrl = providedBaseUrl ?? `http://127.0.0.1:${port}`;
const issueDir = `docs/verification/issues/issue-${issue}`;
const screenshotDir = `${issueDir}/screenshots`;
const chromePath = findChrome();
const previewLog = [];

mkdirSync(abs(screenshotDir), { recursive: true });
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const previewServer = providedBaseUrl == null
  ? spawn("npm", ["--workspace", "apps/web", "run", "preview", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
      cwd: repoRoot,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"]
    })
  : null;
previewServer?.stdout.on("data", (chunk) => previewLog.push(String(chunk)));
previewServer?.stderr.on("data", (chunk) => previewLog.push(String(chunk)));

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-extensions",
  "--no-first-run",
  "--hide-scrollbars",
  `--remote-debugging-port=${remoteDebuggingPort}`,
  `--user-data-dir=${abs(`node_modules/.cache/geometry-repair-chrome-${issue}-${port}`)}`,
  "about:blank"
], { stdio: "ignore" });

try {
  await waitForServer(baseUrl);
  const websocketUrl = await waitForChrome(remoteDebuggingPort);
  const cdp = await connectCdp(websocketUrl);
  try {
    await openEditor(cdp);
    const screenshots = await captureIssueScreenshots(cdp, issue);
    const manifest = {
      manifestVersion: "1.0.0",
      issue,
      productDisplayName: "ER Pod Shift Simulator",
      browserName: "chrome-headless",
      source: "browser-rendered-app",
      privateSourceScreenshotIncluded: false,
      exactParityClaimed: false,
      exactRouteTruthClaimed: false,
      manualVisualApprovalClaimed: false,
      screenshots
    };
    writeJson(`${issueDir}/screenshot-manifest-output.json`, manifest);
    console.log(JSON.stringify({ status: "passed", issue, screenshotCount: screenshots.length }, null, 2));
  } finally {
    cdp.close();
  }
} finally {
  killProcessTree(chrome);
  if (previewServer != null) killProcessTree(previewServer);
}

async function captureIssueScreenshots(cdp, currentIssue) {
  switch (currentIssue) {
    case "423":
      await selectDoorIfPresent(cdp);
      await clickIfPresent(cdp, "Door");
      await assertElementState(cdp, "[data-adjacent-door-candidate-selector='ready']", "adjacent candidate ready state");
      const adjacentCandidateScreenshot = await captureCase(cdp, "adjacent-door-candidate-selector.png", "selected-door-candidate-selector", 1440, 1200);
      await forceDoorNoCandidateState(cdp);
      return [
        adjacentCandidateScreenshot,
        await captureCase(cdp, "adjacent-door-no-candidates.png", "selected-door-candidate-selector-no-candidate-state", 1440, 1200)
      ];
    case "424":
      await selectDoorIfPresent(cdp);
      await clickIfPresent(cdp, "Door");
      await assertElementState(cdp, "[data-door-placement-validity='valid']", "valid door placement preview");
      const validPlacementScreenshot = await captureCase(cdp, "valid-door-placement-preview.png", "selected-door-validity-preview", 1440, 1200);
      await forceDoorInvalidPlacementState(cdp);
      return [
        validPlacementScreenshot,
        await captureCase(cdp, "invalid-door-placement-preview.png", "selected-door-validity-preview-invalid-style", 1440, 1200)
      ];
    case "425":
      await selectDoorIfPresent(cdp);
      return [await captureCase(cdp, "door-width-controls.png", "selected-door-width-controls", 1440, 1200)];
    case "426":
      await selectDoorIfPresent(cdp);
      return [await captureCase(cdp, "wall-snap-guides.png", "selected-door-wall-snap-guides", 1440, 1200)];
    case "427":
      await selectRoomIfPresent(cdp);
      await clickIfPresent(cdp, "Room");
      return [await captureCase(cdp, "room-alignment-tools.png", "selected-room-alignment-controls", 1440, 1200)];
    case "428":
      await selectZoneIfPresent(cdp);
      await clickIfPresent(cdp, "Validation");
      return [await captureCase(cdp, "hallway-support-marker-controls.png", "hallway-support-marker-controls", 1440, 1200)];
    case "429":
      await clickIfPresent(cdp, "Validation");
      await openValidationDrawer(cdp);
      return [await captureCase(cdp, "grouped-validation-drawer.png", "grouped-validation-drawer", 1440, 1200)];
    default:
      throw new Error(`unsupported geometry screenshot issue: ${currentIssue}`);
  }
}

async function openEditor(cdp) {
  await openPage(cdp, `${baseUrl}/`, 1440, 1200);
  await seedGeometryRepairDraft(cdp);
  await openPage(cdp, `${baseUrl}/?section=editor#layout-editor-stage-title`, 1440, 1200);
  await assertText(cdp, "ER Pod Shift Simulator");
}

async function seedGeometryRepairDraft(cdp) {
  const draft = {
    schemaVersion: "1.0.0",
    editableLayout: {
      schemaVersion: "1.0.0",
      layoutId: "geometry-repair-browser-proof",
      units: "feet",
      rooms: [
        room("room-owner", "Room Owner", 0, 10),
        room("room-target", "Room Target", 0, 0),
        room("room-offset", "Room Offset", 24, 0)
      ],
      doors: [
        {
          objectType: "door",
          id: "door-owner-north",
          label: "Owner north door",
          ownerKind: "room",
          ownerId: "room-owner",
          wall: "north",
          offsetFeet: 3,
          widthFeet: 4
        }
      ],
      stations: [
        {
          objectType: "station",
          id: "station-primary",
          label: "Station Alpha",
          stationType: "nurse_station",
          xFeet: 18,
          yFeet: 10,
          widthFeet: 10,
          heightFeet: 6
        }
      ],
      hallways: [
        {
          objectType: "hallway",
          id: "hall-main",
          label: "Main hallway",
          xFeet: 0,
          yFeet: 22,
          widthFeet: 48,
          heightFeet: 6
        }
      ],
      zones: [
        {
          objectType: "zone",
          id: "zone-entry",
          label: "EMS Entry",
          zoneType: "ems_entry",
          xFeet: 34,
          yFeet: 10,
          widthFeet: 10,
          heightFeet: 8
        }
      ],
      limitations: ["Synthetic browser screenshot proof layout; not a default fixture."]
    },
    snapMode: "default",
    viewport: {
      pixelsPerFoot: 12,
      zoom: 1,
      panXFeet: 0,
      panYFeet: 0
    },
    auditTrail: [],
    dirtyState: { isDirty: false }
  };
  await evaluateOrThrow(cdp, {
    awaitPromise: true,
    expression: `
      (() => {
        localStorage.setItem("nerdeus.layoutEditor.localDraft.v1", ${JSON.stringify(JSON.stringify(draft))});
      })()
    `
  });
}

function room(id, label, xFeet, yFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    roomType: "standard",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 12,
    heightFeet: 10
  };
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
  await delay(500);
}

async function captureCase(cdp, fileName, route, width, height) {
  const outputPath = `${screenshotDir}/${fileName}`;
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true
  });
  writeBuffer(outputPath, Buffer.from(result.data, "base64"));
  const png = readPngInfo(outputPath);
  if (png.width < 300 || png.height < 250 || png.byteLength < 5000) {
    throw new Error(`geometry repair screenshot is placeholder-like: ${outputPath}`);
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
    exactRouteTruthClaimed: false,
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

async function setDoorWall(cdp, wall) {
  await evaluateOrThrow(cdp, {
    awaitPromise: true,
    expression: `
      (() => {
        const select = document.querySelector('select[aria-label="Door wall"]');
        if (!select) throw new Error("Door wall selector is missing");
        select.value = ${JSON.stringify(wall)};
        select.dispatchEvent(new Event("change", { bubbles: true }));
      })()
    `
  });
  await delay(350);
}

async function forceDoorNoCandidateState(cdp) {
  for (const wall of ["west", "east", "south", "north"]) {
    await setDoorWall(cdp, wall);
    if (await elementExists(cdp, "[data-adjacent-door-candidate-selector='no-candidates']")) return;
  }
  throw new Error("unable to create no-candidate adjacent room state");
}

async function forceDoorInvalidPlacementState(cdp) {
  for (const wall of ["west", "east", "south", "north"]) {
    await setDoorWall(cdp, wall);
    if (await elementExists(cdp, "[data-door-placement-validity='invalid']")) return;
  }
  throw new Error("unable to create invalid door placement state");
}

async function assertElementState(cdp, selector, label) {
  if (!(await elementExists(cdp, selector))) {
    throw new Error(`missing ${label}`);
  }
}

async function elementExists(cdp, selector) {
  const result = await evaluateOrThrow(cdp, {
    returnByValue: true,
    expression: `document.querySelector(${JSON.stringify(selector)}) != null`
  });
  return result.result.value === true;
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
  await delay(300);
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
  await delay(300);
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
  await delay(300);
}

async function openValidationDrawer(cdp) {
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
  throw new Error("geometry repair page did not finish loading");
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
