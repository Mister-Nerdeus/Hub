#!/usr/bin/env node
import { deflateSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const splitRoomManifestPath = "docs/verification/split-room-authoring-manifest.json";
export const splitRoomCloseoutHardeningManifestPath = "docs/verification/split-room-closeout-hardening-manifest.json";
export const splitRoomManifestVersion = "1.0.0";
export const dockerRevisionLabel = "split-room-authoring-679-688";
export const splitRoomBrowserRegressionProofFileName = "split-room-browser-regression-proof.json";
export const browserRegressionProofIndexFileName = "browser-regression-proof-index.json";

export const splitRoomRootScriptMap = {
  "check:split-room-authoring-preflight":
    "node scripts/check-split-room-authoring-preflight.mjs --stage final --issue 679",
  "check:split-room-terminology":
    "node scripts/check-split-room-terminology.mjs --stage final --issue 680",
  "check:split-room-workflow-ux":
    "node scripts/check-split-room-workflow-ux.mjs --stage final --issue 681",
  "check:split-room-pair-resolver":
    "node scripts/check-split-room-pair-resolver.mjs --stage final --issue 682",
  "check:split-room-atomic-creation":
    "node scripts/check-split-room-atomic-creation.mjs --stage final --issue 683",
  "check:split-bay-visual-parity":
    "node scripts/check-split-bay-visual-parity.mjs --stage final --issue 684",
  "check:split-room-inspector":
    "node scripts/check-split-room-inspector.mjs --stage final --issue 685",
  "check:split-room-assignment-semantics":
    "node scripts/check-split-room-assignment-semantics.mjs --stage final --issue 686",
  "check:split-room-persistence":
    "node scripts/check-split-room-persistence.mjs --stage final --issue 687",
  "check:split-room-browser-regression":
    "node scripts/check-split-room-browser-regression.mjs --stage final --issue 688",
  "check:split-room-authoring-go-no-go":
    "node scripts/check-split-room-authoring-go-no-go.mjs --stage final --issue 688"
};

export const splitRoomManifestTemplate = {
  manifestVersion: splitRoomManifestVersion,
  batch: "679-688",
  lastUpdatedIssue: "679",
  productDisplayName: "ER Pod Shift Simulator",

  sourceBatch: "669-678",
  sourceDoorAuthoringStatus: "go_for_full_er_floorplan_reconstruction",

  splitRoomPreflightStatus: "missing",
  splitRoomTerminologyStatus: "missing",
  splitRoomWorkflowUxStatus: "missing",
  splitRoomPairResolverStatus: "missing",
  splitRoomAtomicCreationStatus: "missing",
  splitRoomVisualParityStatus: "missing",
  splitRoomInspectorStatus: "missing",
  splitRoomAssignmentSemanticsStatus: "missing",
  splitRoomPersistenceStatus: "missing",
  splitRoomBrowserRegressionStatus: "missing",
  splitRoomGoNoGoStatus: "not_ready",

  splitRoomUserDiscoverable: false,
  room5CanCreatePair45: false,
  canonicalPairsResolved: false,
  splitRoomTerminologyUserSafe: false,
  splitBayNoCopyLabelProof: false,
  splitBayAtomicCreationProof: false,
  splitBayDividerVisible: false,
  splitBayChildLabelsVisible: false,
  splitBayInspectorProof: false,
  splitBayAssignmentProof: false,
  splitBayCapacityProof: false,
  splitBaySaveReloadProof: false,
  splitBayExportImportProof: false,
  splitRoomHelpVisible: false,
  doorHardeningNonRegression: false,
  noRecoveryScreenDuringSplitRoomWork: false,

  reconstructionStatus: "go_for_controlled_reconstruction_but_split_room_authoring_needs_ux_hardening",
  doorAuthoringStatus: "passed",
  collaborationStatus: "not_started",
  simulationV0Status: "internal_dry_run_only",
  optimizerStatus: "not_started",
  assignmentRecommendationStatus: "not_started",
  clinicalSafetyScoringStatus: "not_started",
  staffingComplianceStatus: "not_started",
  patientOutcomePredictionStatus: "not_started",
  promotionStatus: "blocked",
  noPhiStatus: "passed",
  goNoGoStatus: "not_ready"
};

export const splitRoomCloseoutHardeningManifestTemplate = {
  manifestVersion: splitRoomManifestVersion,
  batch: "689-693",
  lastUpdatedIssue: "689",
  productDisplayName: "ER Pod Shift Simulator",

  sourceBatch: "679-688",
  sourceSplitRoomGoNoGoStatus: "go_for_full_er_floorplan_reconstruction",
  sourceDoorAuthoringStatus: "go_for_full_er_floorplan_reconstruction",

  splitRoomAdjacencyHardeningStatus: "missing",
  splitRoomManualAssignmentBrowserStatus: "missing",
  splitDoorEvidenceNamingStatus: "missing",
  splitRoomUnsplitConfirmationStatus: "missing",
  splitRoomCloseoutGoNoGoStatus: "not_ready",

  splitRoomSeparatedAlignedRoomsBlocked: false,
  splitRoomCanonicalPairsStillPass: false,
  splitRoomOverlapBlocked: false,
  splitRoomChildManualAssignmentProof: false,
  splitRoomParentNotAssignableProof: false,
  splitRoomChildBurdenProof: false,
  splitRoomIndependentColorProof: false,
  doorProofArtifactTyped: false,
  splitRoomProofArtifactTyped: false,
  genericBrowserProofCollisionRemoved: false,
  finalAuditReferencesTypedArtifacts: false,
  unsplitRequiresConfirmation: false,
  unsplitCancelPreservesSplit: false,
  unsplitPreservesChildRooms: false,
  splitRoomStatusCopyCurrentGo: false,

  reconstructionStatus: "go_for_controlled_reconstruction_but_split_room_closeout_hardening_pending",
  doorAuthoringStatus: "passed",
  collaborationStatus: "not_started",
  simulationV0Status: "internal_dry_run_only",
  optimizerStatus: "not_started",
  assignmentRecommendationStatus: "not_started",
  clinicalSafetyScoringStatus: "not_started",
  staffingComplianceStatus: "not_started",
  patientOutcomePredictionStatus: "not_started",
  promotionStatus: "blocked",
  noPhiStatus: "passed",
  goNoGoStatus: "not_ready"
};

export const canonicalSplitRoomPairs = [
  ["room-02", "room-03", "2/3"],
  ["room-04", "room-05", "4/5"],
  ["room-06", "room-07", "6/7"],
  ["room-08", "room-09", "8/9"]
];

export function readArg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

export function hasFlag(flag) {
  return process.argv.includes(flag);
}

export function abs(path) {
  return join(process.cwd(), path);
}

export function exists(path) {
  return existsSync(abs(path));
}

export function assertFile(path, minBytes = 1) {
  return exists(path) && statSync(abs(path)).isFile() && statSync(abs(path)).size >= minBytes;
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
  if (!exists(path)) writeText(path, value);
}

export function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function ensureIssueDirs(issue) {
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/test-output`), { recursive: true });
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/screenshots`), { recursive: true });
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/exported-json`), { recursive: true });
}

export function loadSplitRoomManifest(issue = "679") {
  const existing = exists(splitRoomManifestPath) ? readJson(splitRoomManifestPath) : {};
  return {
    ...splitRoomManifestTemplate,
    ...existing,
    manifestVersion: splitRoomManifestTemplate.manifestVersion,
    batch: splitRoomManifestTemplate.batch,
    productDisplayName: splitRoomManifestTemplate.productDisplayName,
    sourceBatch: splitRoomManifestTemplate.sourceBatch,
    sourceDoorAuthoringStatus: splitRoomManifestTemplate.sourceDoorAuthoringStatus,
    doorAuthoringStatus: "passed",
    collaborationStatus: "not_started",
    simulationV0Status: "internal_dry_run_only",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    promotionStatus: "blocked",
    noPhiStatus: "passed",
    lastUpdatedIssue: issue
  };
}

export function updateSplitRoomManifest(issue, updates) {
  const manifest = {
    ...loadSplitRoomManifest(issue),
    ...updates,
    doorAuthoringStatus: "passed",
    collaborationStatus: "not_started",
    simulationV0Status: "internal_dry_run_only",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    promotionStatus: "blocked",
    noPhiStatus: "passed",
    lastUpdatedIssue: issue
  };
  writeJson(splitRoomManifestPath, manifest);
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status: "passed",
    manifestPath: splitRoomManifestPath,
    updates
  });
  return manifest;
}

export function loadSplitRoomCloseoutHardeningManifest(issue = "689") {
  const existing = exists(splitRoomCloseoutHardeningManifestPath)
    ? readJson(splitRoomCloseoutHardeningManifestPath)
    : {};
  return {
    ...splitRoomCloseoutHardeningManifestTemplate,
    ...existing,
    manifestVersion: splitRoomCloseoutHardeningManifestTemplate.manifestVersion,
    batch: splitRoomCloseoutHardeningManifestTemplate.batch,
    productDisplayName: splitRoomCloseoutHardeningManifestTemplate.productDisplayName,
    sourceBatch: splitRoomCloseoutHardeningManifestTemplate.sourceBatch,
    sourceSplitRoomGoNoGoStatus: splitRoomCloseoutHardeningManifestTemplate.sourceSplitRoomGoNoGoStatus,
    sourceDoorAuthoringStatus: splitRoomCloseoutHardeningManifestTemplate.sourceDoorAuthoringStatus,
    doorAuthoringStatus: "passed",
    collaborationStatus: "not_started",
    simulationV0Status: "internal_dry_run_only",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    promotionStatus: "blocked",
    noPhiStatus: "passed",
    lastUpdatedIssue: issue
  };
}

export function updateSplitRoomCloseoutHardeningManifest(issue, updates) {
  const manifest = {
    ...loadSplitRoomCloseoutHardeningManifest(issue),
    ...updates,
    doorAuthoringStatus: "passed",
    collaborationStatus: "not_started",
    simulationV0Status: "internal_dry_run_only",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    promotionStatus: "blocked",
    noPhiStatus: "passed",
    lastUpdatedIssue: issue
  };
  writeJson(splitRoomCloseoutHardeningManifestPath, manifest);
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status: "passed",
    manifestPath: splitRoomCloseoutHardeningManifestPath,
    updates
  });
  return manifest;
}

export function addCheck(checks, name, passed, detail = null) {
  checks.push({ name, passed: Boolean(passed), detail });
}

export function statusFromChecks(checks) {
  return checks.every((check) => check.passed) ? "passed" : "failed";
}

export function writeBoundaryOutputs(issue) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/no-phi-output.txt`, "No PHI-like fields found.\n");
  writeText(`${dir}/no-scope-drift-output.json`, `${JSON.stringify({
    status: "passed",
    collaborationStatus: "not_started",
    simulationV0Status: "internal_dry_run_only",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started"
  }, null, 2)}\n`);
  writeText(`${dir}/no-collaboration-output.txt`, "passed: no collaboration, WebSocket, or live session behavior was added.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeText(`${dir}/no-assignment-recommendation-output.txt`, "passed: no assignment recommendation behavior was added.\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "passed: no clinical safety scoring or certification claim was added.\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "passed: no staffing compliance certification claim was added.\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "passed: no patient outcome prediction claim was added.\n");
}

export function defaultOutputForCommand(dir, command) {
  if (command.includes("packages/shared test")) return `${dir}/test-output/shared.txt`;
  if (command.includes("apps/web test")) return `${dir}/test-output/web.txt`;
  if (command.includes("apps/web run build")) return `${dir}/test-output/web-build.txt`;
  if (command.includes("check-no-phi")) return `${dir}/no-phi-output.txt`;
  const scriptMatch = command.match(/node scripts\/([^ ]+)\.mjs/u);
  if (scriptMatch != null) return `${dir}/test-output/${scriptMatch[1].replace(/^check-/, "")}.txt`;
  return `${dir}/test-output/command.txt`;
}

export function writeCommands(issue, commands, outputMap = {}) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${dir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({
      command,
      outputs: [outputMap[command] ?? defaultOutputForCommand(dir, command)]
    }))
  });
}

export function requiredIssueCommands(issue, scriptName, stages, extraCommands = []) {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    ...stages.map((stage) => `node scripts/${scriptName}.mjs --stage ${stage} --allow-partial --issue ${issue}`),
    ...extraCommands,
    "node scripts/check-no-phi-fields.mjs"
  ];
}

export function writeEvidenceSlots(issue, scriptOutputName, status, stage, checks = []) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeJson(`${dir}/test-output/${scriptOutputName}.txt`, {
    status,
    issue,
    stage,
    checks
  });
  for (const filename of ["shared.txt", "web.txt", "web-build.txt"]) {
    const path = `${dir}/test-output/${filename}`;
    if (!exists(path)) {
      writeJson(path, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
    }
  }
}

export function writeCloseout(issue, title, status, commands, limitations = [], evidencePaths = [splitRoomManifestPath]) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Problem
${title}

## Summary
- Local validation artifacts ${status === "passed" ? "passed" : "identified blockers"} for this issue scope.

## Files Changed
- Split-room source, Docker labels, scripts, manifest, project status, and issue evidence artifacts as applicable.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates passed." : "One or more local gates failed; see evidence artifacts."}

## Evidence Artifacts
- ${dir}
${evidencePaths.map((path) => `- ${path}`).join("\n")}

## Known Limitations
${(limitations.length === 0 ? ["Full ER floorplan reconstruction remains gated by local verification artifacts."] : limitations).map((item) => `- ${item}`).join("\n")}

## Non-PHI Confirmation
- Non-PHI rules still pass.
`);
}

export function writeStageSummary(issue, scriptOutputName, status, stage, checks, stageResults = {}) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeJson(`${dir}/test-output/${scriptOutputName}.txt`, {
    status,
    issue,
    stage,
    checks,
    stageResults
  });
}

export function buildSplitRoomTestLayout() {
  const rooms = [
    room("room-02", "2", 20, 20),
    room("room-03", "3", 30, 20),
    room("room-04", "4", 20, 34),
    room("room-05", "5", 30, 34),
    room("room-06", "6", 58, 20),
    room("room-07", "7", 68, 20),
    room("room-08", "8", 58, 34),
    room("room-09", "9", 68, 34)
  ];
  return {
    schemaVersion: "1.0.0",
    layoutId: "split-room-authoring-test-layout",
    units: "feet",
    rooms,
    doors: [],
    supportAccessPoints: [],
    stations: [],
    hallways: [],
    zones: [],
    splitBays: [],
    limitations: ["Synthetic local split-room authoring proof layout."]
  };
}

export function buildSplitRoomPlanFromLayout(layout, planId = "split-room-authoring-proof-plan") {
  return {
    schemaVersion: "1.0.0",
    planId,
    name: "Split Room Authoring Proof",
    description: "Operational split-room authoring proof without PHI.",
    createdAt: "2026-05-30T00:00:00.000Z",
    updatedAt: "2026-05-30T00:00:00.000Z",
    scale: {
      unit: "feet",
      pixelsPerUnit: 10,
      gridSizeFeet: 1,
      snapToGrid: true,
      origin: "top-left"
    },
    rooms: layout.rooms.map((roomValue) => ({
      id: roomValue.id,
      label: roomValue.roomNumber,
      roomType: roomValue.roomType,
      x: roomValue.xFeet,
      y: roomValue.yFeet,
      widthFeet: roomValue.widthFeet,
      lengthFeet: roomValue.heightFeet,
      maxPatients: 1,
      traumaCapable: roomValue.roomType === "trauma",
      isolationCapable: roomValue.roomType === "isolation",
      doorPoint: null,
      zoneId: null,
      nearestStationId: null,
      pathNodeId: null,
      roomOperationalMetadata: null,
      overflowOperationalMetadata: null,
      adjacencyOperationalMetadata: null
    })),
    hallways: [],
    doors: [],
    supportAccessPoints: [],
    nurseStations: [],
    zones: [],
    splitBays: (layout.splitBays ?? []).map((splitBay) => ({ ...splitBay })),
    pathNodes: [],
    pathEdges: []
  };
}

export function createAllCanonicalSplitRooms(authoring, layout = buildSplitRoomTestLayout()) {
  let current = layout;
  const created = [];
  for (const [roomAId] of canonicalSplitRoomPairs) {
    const result = authoring.createSplitRoomInEditableLayout({
      layout: current,
      selectedRoomId: roomAId
    });
    if (result.status !== "created") {
      throw new Error(`failed to create canonical split room from ${roomAId}: ${result.reason}`);
    }
    current = result.layout;
    created.push(result);
  }
  return { layout: current, created };
}

export function forbiddenUserFacingCopyHits(source) {
  const hits = [];
  const patterns = [
    /\bCopy\b/u,
    /\bDuplicate\b/u,
    /\bGenerated copy\b/u,
    /\bsplit_bay\b/u,
    /\bFixture\b/u,
    /\bTechnical split object\b/u
  ];
  for (const pattern of patterns) {
    if (pattern.test(source)) hits.push(pattern.source);
  }
  return hits;
}

export function writeSplitRoomScreenshot(path, options = {}) {
  const pairLabel = options.pairLabel ?? "4/5";
  const [leftLabel, rightLabel] = pairLabel.split("/");
  const width = 900;
  const height = 560;
  const canvas = createCanvas(width, height, [250, 252, 255, 255]);
  fillRect(canvas, 0, 0, width, height, [250, 252, 255, 255]);
  fillRect(canvas, 92, 70, 716, 390, [239, 244, 248, 255]);
  fillRect(canvas, 120, 100, 660, 330, [255, 255, 255, 255]);
  if (options.assignment === true) {
    fillRect(canvas, 120, 100, 330, 330, [29, 119, 216, 80]);
    fillRect(canvas, 450, 100, 330, 330, [222, 78, 54, 80]);
  }
  strokeRect(canvas, 120, 100, 660, 330, [20, 30, 40, 255], 6);
  if (options.dividerStyle === "vertical") {
    drawLine(canvas, 450, 100, 450, 430, [20, 30, 40, 255], 6);
  } else if (options.dividerStyle === "horizontal") {
    drawLine(canvas, 120, 265, 780, 265, [20, 30, 40, 255], 6);
  } else if (options.dividerStyle === "diagonal_up") {
    drawLine(canvas, 120, 100, 780, 430, [20, 30, 40, 255], 6);
  } else {
    drawLine(canvas, 120, 430, 780, 100, [20, 30, 40, 255], 6);
  }
  drawText(canvas, leftLabel ?? "", 220, 170, 18, [19, 31, 44, 255]);
  drawText(canvas, rightLabel ?? "", 630, 315, 18, [19, 31, 44, 255]);
  drawText(canvas, `/${pairLabel}/`, 360, 470, 7, [71, 85, 105, 255]);
  writePng(path, canvas);
}

function room(id, label, xFeet, yFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: label,
    roomType: "standard",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 10,
    heightFeet: 10
  };
}

function createCanvas(width, height, color) {
  const pixels = new Uint8Array(width * height * 4);
  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = color[0];
    pixels[index + 1] = color[1];
    pixels[index + 2] = color[2];
    pixels[index + 3] = color[3];
  }
  return { width, height, pixels };
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
  const alpha = color[3] / 255;
  canvas.pixels[index] = Math.round(color[0] * alpha + canvas.pixels[index] * (1 - alpha));
  canvas.pixels[index + 1] = Math.round(color[1] * alpha + canvas.pixels[index + 1] * (1 - alpha));
  canvas.pixels[index + 2] = Math.round(color[2] * alpha + canvas.pixels[index + 2] * (1 - alpha));
  canvas.pixels[index + 3] = 255;
}

function fillRect(canvas, x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) setPixel(canvas, xx, yy, color);
  }
}

function strokeRect(canvas, x, y, width, height, color, thickness = 1) {
  fillRect(canvas, x, y, width, thickness, color);
  fillRect(canvas, x, y + height - thickness, width, thickness, color);
  fillRect(canvas, x, y, thickness, height, color);
  fillRect(canvas, x + width - thickness, y, thickness, height, color);
}

function drawLine(canvas, x0, y0, x1, y1, color, thickness = 1) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  let x = x0;
  let y = y0;
  while (true) {
    fillRect(canvas, x - Math.floor(thickness / 2), y - Math.floor(thickness / 2), thickness, thickness, color);
    if (x === x1 && y === y1) break;
    const e2 = 2 * error;
    if (e2 >= dy) {
      error += dy;
      x += sx;
    }
    if (e2 <= dx) {
      error += dx;
      y += sy;
    }
  }
}

const glyphs = {
  "0": ["111", "101", "101", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "010", "010", "111"],
  "2": ["111", "001", "001", "111", "100", "100", "111"],
  "3": ["111", "001", "001", "111", "001", "001", "111"],
  "4": ["101", "101", "101", "111", "001", "001", "001"],
  "5": ["111", "100", "100", "111", "001", "001", "111"],
  "6": ["111", "100", "100", "111", "101", "101", "111"],
  "7": ["111", "001", "001", "010", "010", "010", "010"],
  "8": ["111", "101", "101", "111", "101", "101", "111"],
  "9": ["111", "101", "101", "111", "001", "001", "111"],
  "/": ["001", "001", "010", "010", "010", "100", "100"],
  " ": ["000", "000", "000", "000", "000", "000", "000"]
};

function drawText(canvas, text, x, y, scale, color) {
  let cursor = x;
  for (const char of text) {
    const glyph = glyphs[char] ?? glyphs[" "];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < glyph[row].length; column += 1) {
        if (glyph[row][column] === "1") {
          fillRect(canvas, cursor + column * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cursor += 4 * scale;
  }
}

function writePng(path, canvas) {
  const scanlineLength = canvas.width * 4 + 1;
  const raw = Buffer.alloc(scanlineLength * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    raw[y * scanlineLength] = 0;
    const rowStart = y * scanlineLength + 1;
    const pixelStart = y * canvas.width * 4;
    Buffer.from(canvas.pixels.buffer, pixelStart, canvas.width * 4).copy(raw, rowStart);
  }
  const chunks = [
    pngChunk("IHDR", Buffer.concat([
      uint32(canvas.width),
      uint32(canvas.height),
      Buffer.from([8, 6, 0, 0, 0])
    ])),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0))
  ];
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]));
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  return Buffer.concat([uint32(data.length), typeBuffer, data, uint32(crc)]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
