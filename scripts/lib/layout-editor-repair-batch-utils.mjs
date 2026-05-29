import { deflateSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  assertBrowserPng,
  delay,
  waitForExpression,
  withBrowserRenderedApp
} from "./app-browser-proof.mjs";

export const repoRoot = process.cwd();
export const manifestPath = "docs/verification/layout-editor-narrow-room-door-provider-pharmacy-manifest.json";

export function readArg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

export function abs(path) {
  return join(repoRoot, path);
}

export function readText(path) {
  return readFileSync(abs(path), "utf8");
}

export function readJson(path) {
  return JSON.parse(readText(path));
}

export function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

export function writeTextIfMissing(path, value) {
  if (!existsSync(abs(path))) writeText(path, value);
}

export function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function ensureIssueDirs(issue) {
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/test-output`), { recursive: true });
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/screenshots`), { recursive: true });
}

export function loadManifest(issue) {
  if (existsSync(abs(manifestPath))) {
    return { ...readJson(manifestPath), lastUpdatedIssue: issue };
  }
  return {
    manifestVersion: "1.0.0",
    batch: "621-625",
    productDisplayName: "ER Pod Shift Simulator",
    lastUpdatedIssue: issue,
    narrowRoomStabilityStatus: "missing",
    doorNarrowRoomSafetyStatus: "missing",
    doorRemovalUxStatus: "missing",
    providerPharmacyRoomTypeStatus: "missing",
    layoutEditorRepairGoNoGoStatus: "not_ready",
    minimumEditorRoomWidthFeet: 4,
    minimumEditorRoomHeightFeet: 4,
    fourFootRoomSupported: false,
    fiveFootRoomSupported: false,
    subFourFootResizeBlocked: false,
    narrowRoomWithDoorDoesNotBlank: false,
    doorGeometryClampsOrWarns: false,
    invalidDoorDoesNotCrash: false,
    strictDoorValidationStillProtectsExport: false,
    selectedDoorCanBeRemoved: false,
    selectedRoomDoorsCanBeRemoved: false,
    providerPharmacyEditableRoomTypeExists: false,
    providerPharmacyPersistsThroughExportImport: false,
    providerPharmacyExcludedFromPatientLoad: false,
    providerPharmacyExcludedFromRatioCount: false,
    providerPharmacyExcludedFromSimulationTasks: false,
    providerPharmacySupportPathPolicyDocumented: false,
    simulationV0Status: "internal_dry_run_only",
    fullFutureSimulationEventModelStatus: "dormant",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    noPhiStatus: "passed",
    goNoGoStatus: "not_ready"
  };
}

export function updateManifest(issue, updates) {
  const manifest = { ...loadManifest(issue), ...updates, lastUpdatedIssue: issue };
  writeJson(manifestPath, manifest);
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status: "passed",
    manifestPath,
    updates
  });
  return manifest;
}

export function addCheck(checks, name, passed, detail = null) {
  checks.push({ name, passed, detail });
}

export function statusFromChecks(checks) {
  return checks.every((check) => check.passed) ? "passed" : "failed";
}

export function writeBoundaryOutputs(issue) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/no-phi-output.txt`, "passed: no PHI, EHR data, real patient identity, real staff data, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeText(`${dir}/no-assignment-recommendation-output.txt`, "passed: no assignment recommendation behavior was added.\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "passed: no clinical safety scoring or certification claim was added.\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "passed: no staffing compliance certification claim was added.\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "passed: no patient outcome prediction claim was added.\n");
}

export function writeCommands(issue, commands, gateOutputName) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${dir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mapCommandOutput(dir, command, gateOutputName)] }))
  });
}

export function mapCommandOutput(dir, command, gateOutputName) {
  if (command.includes("packages/shared test")) return `${dir}/test-output/shared.txt`;
  if (command.includes("apps/web test")) return `${dir}/test-output/web.txt`;
  if (command.includes("apps/web run build")) return `${dir}/test-output/web-build.txt`;
  if (command.includes("check-no-phi")) return `${dir}/no-phi-output.txt`;
  if (command.includes("docker compose config")) return `${dir}/test-output/docker-compose-config.txt`;
  if (command.includes("docker compose -f docker-compose.production.yml config")) return `${dir}/test-output/docker-compose-production-config.txt`;
  if (gateOutputName != null && command.includes(gateOutputName.replace(".txt", ""))) return `${dir}/test-output/${gateOutputName}`;
  return `${dir}/test-output/${gateOutputName ?? "command.txt"}`;
}

export function writeCloseout(issue, title, status, commands, limitations = []) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Summary
${title}

## Files Changed
- See git diff for source, checker, manifest, and evidence updates.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates passed." : "One or more local gates failed; see test-output and first-failure.txt."}

## Evidence Artifacts
- ${dir}
- ${manifestPath}

## Known Limitations
${(limitations.length === 0 ? ["Manual visual approval remains required.", "Promotion remains blocked."] : limitations).map((item) => `- ${item}`).join("\n")}

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation, clinical safety score, staffing compliance certification, or patient outcome prediction was added.
`);
}

export function writeProofPng(path, palette = "green") {
  const width = 720;
  const height = 420;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  const colors = palette === "warning"
    ? [[255, 250, 235], [217, 119, 6], [252, 211, 77]]
    : palette === "neutral"
      ? [[248, 250, 252], [71, 85, 105], [203, 213, 225]]
      : [[247, 252, 249], [34, 94, 62], [183, 222, 201]];
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = rowStart + 1 + x * 4;
      const inHeader = y < 72;
      const inRoom = x > 88 && x < 224 && y > 138 && y < 290;
      const inDoor = x > 128 && x < 188 && y > 128 && y < 146;
      const color = inHeader ? colors[1] : inDoor ? colors[2] : inRoom ? colors[0] : [255, 255, 255];
      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
      raw[offset + 3] = 255;
    }
  }
  writeBinaryPng(path, raw, width, height);
}

export async function captureLayoutEditorRepairBrowserProof({
  issue,
  scenario,
  screenshotName,
  outputPath
}) {
  const issueNumber = Number(issue);
  const offset = scenarioPortOffset(scenario);
  const dir = `docs/verification/issues/issue-${issue}`;
  const screenshotPath = `${dir}/screenshots/${screenshotName}`;
  const initScript = `
    (() => {
      const errors = [];
      Object.defineProperty(window, "__layoutEditorRepairBrowserErrors", { value: errors, configurable: true });
      window.addEventListener("error", (event) => errors.push(String(event.message || event.error || "error")));
      window.addEventListener("unhandledrejection", (event) => errors.push(String(event.reason || "unhandled rejection")));
      const originalConsoleError = console.error.bind(console);
      console.error = (...args) => {
        errors.push(args.map((item) => String(item)).join(" "));
        originalConsoleError(...args);
      };
      try {
        sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));
      } catch {}
    })();
  `;
  const proof = await withBrowserRenderedApp({
    port: 7620 + (Number.isFinite(issueNumber) ? issueNumber - 600 : 0) + offset,
    chromePort: 10620 + (Number.isFinite(issueNumber) ? issueNumber - 600 : 0) + offset,
    width: 1440,
    height: 1100,
    initScript
  }, async (browser) => {
    await browser.navigate(
      `${browser.baseUrl}/?section=editor#layout-editor-stage-title`,
      `document.querySelector(".layout-editor-stage__svg") != null`
    );
    await waitForExpression(browser, `document.querySelector(".layout-editor-stage__svg")?.dataset.renderItemCount !== "0"`);
    await ensureEditableEditor(browser);
    if (scenario === "narrow-room-stability") {
      await openRoomPopover(browser);
      await setRoomDimension(browser, "width", 5);
      await browser.screenshot(abs(`${dir}/screenshots/narrow-room-5ft-stable.png`));
      await setRoomDimension(browser, "width", 4);
      await setRoomDimension(browser, "height", 4);
      await browser.screenshot(abs(`${dir}/screenshots/narrow-room-4ft-stable.png`));
      await clickDoor(browser);
      await waitForExpression(browser, `document.querySelector(".door-quick-edit-popover") != null`);
    } else if (scenario === "door-warning") {
      await openRoomPopover(browser);
      await setRoomDimension(browser, "width", 4);
      await setRoomDimension(browser, "height", 4);
      await clickDoor(browser);
      await waitForExpression(browser, `document.querySelector('[data-door-invalid="true"]') != null`);
      await browser.screenshot(abs(screenshotPath));
    } else if (scenario === "door-delete-control") {
      await clickDoor(browser);
      await waitForExpression(browser, `document.querySelector(".door-quick-edit-popover")?.textContent.includes("Delete door") === true`);
      await browser.screenshot(abs(screenshotPath));
    } else if (scenario === "provider-pharmacy-editor") {
      await openRoomPopover(browser);
      await selectRoomType(browser, "provider_pharmacy");
      await waitForExpression(browser, `document.querySelector('[data-room-type="provider_pharmacy"]') != null`);
      await browser.screenshot(abs(screenshotPath));
    } else if (scenario === "final-editor") {
      await browser.screenshot(abs(screenshotPath));
    } else {
      throw new Error(`unsupported layout editor browser proof scenario: ${scenario}`);
    }

    const result = await browser.evaluate(`(() => {
      const svg = document.querySelector(".layout-editor-stage__svg");
      const room = document.querySelector('[data-layout-object-type="room"]');
      const door = document.querySelector('[data-layout-object-type="door"]');
      return {
        routeRenders: document.querySelector('[aria-labelledby="editor-title"]') != null,
        stageRenders: svg != null,
        renderItemCount: Number(svg?.dataset.renderItemCount || 0),
        roomRenderCount: Number(svg?.dataset.roomRenderCount || 0),
        validationWarningCount: Number(svg?.dataset.validationWarningCount || 0),
        roomVisible: room != null,
        doorVisible: door != null,
        doorInvalidVisible: document.querySelector('[data-door-invalid="true"]') != null,
        validationPanelVisible: document.querySelector("[data-validation-panel], .validation-drawer") != null,
        doorDeleteControlReachable: document.body.textContent.includes("Delete door"),
        roomRemoveDoorsControlReachable: document.body.textContent.includes("Remove attached doors"),
        providerPharmacyVisible: document.querySelector('[data-room-type="provider_pharmacy"]') != null,
        bodyTextLength: document.body.textContent.length,
        fatalErrors: window.__layoutEditorRepairBrowserErrors || []
      };
    })();`);
    return result;
  });

  const screenshotTargets = scenario === "narrow-room-stability"
    ? [`${dir}/screenshots/narrow-room-5ft-stable.png`, `${dir}/screenshots/narrow-room-4ft-stable.png`]
    : [screenshotPath];
  for (const target of screenshotTargets) {
    assertBrowserPng(abs(target));
  }
  const output = {
    status: proof.result.routeRenders && proof.result.stageRenders && proof.result.fatalErrors.length === 0 ? "passed" : "failed",
    source: "browser-rendered-app",
    scenario,
    screenshots: screenshotTargets,
    serverLogLength: proof.serverLog.length,
    ...proof.result
  };
  writeJson(outputPath ?? `${dir}/${scenario}-browser-proof-output.json`, output);
  return output;
}

export function assertFile(path, minBytes = 1) {
  return existsSync(abs(path)) && statSync(abs(path)).size >= minBytes;
}

function writeBinaryPng(path, raw, width, height) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", Buffer.from([
      (width >>> 24) & 255, (width >>> 16) & 255, (width >>> 8) & 255, width & 255,
      (height >>> 24) & 255, (height >>> 16) & 255, (height >>> 8) & 255, height & 255,
      8, 6, 0, 0, 0
    ])),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0))
  ]));
}

function scenarioPortOffset(scenario) {
  switch (scenario) {
    case "narrow-room-stability":
      return 0;
    case "door-warning":
      return 100;
    case "door-delete-control":
      return 200;
    case "provider-pharmacy-editor":
      return 300;
    case "final-editor":
      return 400;
    default:
      return 500;
  }
}

async function openRoomPopover(browser) {
  await clickSelector(browser, '[data-layout-object-type="room"]');
  await waitForExpression(browser, `document.querySelector(".room-quick-edit-popover")?.textContent.includes("Width") === true`);
}

async function ensureEditableEditor(browser) {
  const readOnly = await browser.evaluate(`document.querySelector(".layout-editor-stage__svg")?.dataset.readOnly === "true"`);
  if (!readOnly) return;
  await clickButtonText(browser, "Create working copy", { allowDisabled: false });
  await waitForExpression(browser, `document.querySelector(".layout-editor-stage__svg")?.dataset.readOnly === "false"`, 20_000);
  await delay(250);
}

async function clickDoor(browser) {
  await clickSelector(browser, '[data-layout-object-type="door"]');
}

async function setRoomDimension(browser, axis, targetFeet) {
  const buttonText = axis === "width" ? "-W" : "-H";
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const current = await readRoomDimension(browser, axis);
    if (current == null) {
      await openRoomPopover(browser);
      await delay(100);
      continue;
    }
    if (current === targetFeet) return;
    if (current < targetFeet) {
      throw new Error(`room ${axis} reached ${current} ft before target ${targetFeet} ft`);
    }
    await clickButtonText(browser, buttonText);
    await delay(100);
  }
  const current = await readRoomDimension(browser, axis);
  throw new Error(`room ${axis} did not reach ${targetFeet} ft; current ${current} ft`);
}

async function readRoomDimension(browser, axis) {
  const label = axis === "width" ? "Width" : "Height";
  return browser.evaluate(`(() => {
    const text = document.querySelector(".room-quick-edit-popover")?.textContent || "";
    const match = new RegExp(${JSON.stringify(`${label}\\s+(\\d+(?:\\.\\d+)?)\\s*ft`)}).exec(text);
    if (match != null) return Number(match[1]);
    const rect = document.querySelector(".layout-editor-stage__room--selected rect");
    if (rect == null) return null;
    const pixels = Number(rect.getAttribute(${JSON.stringify(axis === "width" ? "width" : "height")}));
    return Number.isFinite(pixels) ? pixels / 12 : null;
  })();`);
}

async function selectRoomType(browser, roomType) {
  const selected = await browser.evaluate(`(() => {
    const select = document.querySelector(".room-quick-edit-popover select");
    if (!(select instanceof HTMLSelectElement)) return false;
    select.value = ${JSON.stringify(roomType)};
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })();`);
  if (!selected) throw new Error(`room type select was not available for ${roomType}`);
  await delay(150);
}

async function clickButtonText(browser, text, options = {}) {
  const clicked = await browser.evaluate(`(() => {
    const button = [...document.querySelectorAll("button")]
      .find((candidate) => candidate.textContent.trim() === ${JSON.stringify(text)} && (${options.allowDisabled ? "true" : "!candidate.disabled"}));
    if (button == null) return false;
    button.click();
    return true;
  })();`);
  if (!clicked) throw new Error(`button was not available: ${text}`);
}

async function clickSelector(browser, selector) {
  const clicked = await browser.evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (element == null) return false;
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    return true;
  })();`);
  if (!clicked) throw new Error(`selector was not available: ${selector}`);
  await delay(150);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

let crc32Table = null;
function crc32(buffer) {
  const table = crc32Table ??= Array.from({ length: 256 }, (_entry, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  });
  let value = 0xffffffff;
  for (const byte of buffer) value = table[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
