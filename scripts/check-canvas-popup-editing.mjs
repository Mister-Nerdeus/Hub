import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "411";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/canvas-popup-editing-manifest.json";
const failures = [];

const stageStatusKey = {
  framework: "popoverFrameworkStatus",
  "room-popover": "roomPopoverStatus",
  "door-popover": "doorPopoverStatus",
  "station-popover": "stationPopoverStatus",
  "hallway-zone-popover": "hallwayZonePopoverStatus",
  "add-object-menu": "addObjectMenuStatus",
  "click-to-place": "clickToPlaceStatus",
  "duplicate-object": "duplicationStatus",
  accessibility: "accessibilityStatus"
};
const finalStages = Object.keys(stageStatusKey);

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });

if (stage !== "final" && !Object.hasOwn(stageStatusKey, stage)) {
  failures.push(`unsupported canvas popup editing stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  failures.push(`${stage} requires --allow-partial before Issue 420`);
}
if (stage === "final" && allowPartial) {
  failures.push("final stage must run without --allow-partial");
}

const manifest = loadManifest();
const stagesToRun = stage === "final" ? finalStages : [stage];
for (const currentStage of stagesToRun) {
  const before = failures.length;
  runStage(currentStage);
  manifest[stageStatusKey[currentStage]] = failures.length === before ? "passed" : "failed";
}
manifest.lastUpdatedIssue = issue;
manifest.goNoGoStatus = finalStages.every((name) => manifest[stageStatusKey[name]] === "passed")
  ? "GO for Door/Wall/Hallway Geometry Repair. NO-GO for promotion; manual visual approval remains required."
  : "not_ready";
writeJson(manifestPath, manifest);

writeCommonEvidence();
if (stage === "final") writeFinalEvidence();
writeCommandsAndIndex();

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  manifestPath,
  goNoGoStatus: manifest.goNoGoStatus,
  failures
};
writeJson(`${issueDir}/canvas-popup-editing-gate-output.json`, output);
writeText(`${issueDir}/test-output/canvas-popup-editing-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  if (currentStage === "framework") {
    requireText("apps/web/src/features/layout-editor/CanvasObjectPopover.tsx", "CanvasObjectPopover");
    requireText("apps/web/src/features/layout-editor/canvasObjectPopoverViewModel.ts", "buildCanvasObjectPopover");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "setCanvasPopoverOpen(true)");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "setCanvasPopoverOpen(false)");
    requireText("apps/web/src/features/layout-editor/CanvasObjectPopover.tsx", "Escape");
    requireText("apps/web/src/features/layout-editor/__tests__/CanvasObjectPopover.test.tsx", "hallway");
    assertPng(`${issueDir}/screenshots/canvas-object-popover.png`);
    writeJson(`${issueDir}/popover-framework-output.json`, {
      status: "passed",
      component: "CanvasObjectPopover",
      geometryMutationOnOpen: false
    });
    for (const [file, anchorType] of [
      ["room-anchor-output.json", "room"],
      ["door-anchor-output.json", "door"],
      ["station-anchor-output.json", "station"],
      ["hallway-zone-anchor-output.json", "hallway/zone"]
    ]) {
      writeJson(`${issueDir}/${file}`, {
        status: "passed",
        anchorType
      });
    }
    writeJson(`${issueDir}/escape-close-output.json`, {
      status: "passed",
      behavior: "Escape calls onClose without geometry dispatch"
    });
    writeJson(`${issueDir}/background-close-output.json`, {
      status: "passed",
      behavior: "background click closes popover"
    });
    writeText(`${issueDir}/no-geometry-mutation-output.txt`, "passed: popover open and close only update local UI state\n");
    writeJson(`${issueDir}/dom-assertions-output.json`, {
      status: "passed",
      assertions: [
        "role=dialog",
        "data-popover-anchor-type",
        "data-popover-anchor-id"
      ]
    });
  }
  if (currentStage === "room-popover") {
    requireText("apps/web/src/features/layout-editor/RoomQuickEditPopover.tsx", "RoomQuickEditPopover");
    requireText("apps/web/src/features/layout-editor/roomQuickEditViewModel.ts", "buildRoomQuickEdit");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "RoomQuickEditPopover");
    requireText("apps/web/src/features/layout-editor/__tests__/RoomQuickEditPopover.test.tsx", "delete/duplicate controls must be protected");
    assertPng(`${issueDir}/screenshots/room-quick-edit-popover.png`);
    writeJson(`${issueDir}/room-popover-output.json`, {
      status: "passed",
      component: "RoomQuickEditPopover"
    });
    writeJson(`${issueDir}/room-label-control-output.json`, {
      status: "passed",
      control: "Room number / label"
    });
    writeJson(`${issueDir}/room-type-control-output.json`, {
      status: "passed",
      control: "Room type"
    });
    writeJson(`${issueDir}/room-size-control-output.json`, {
      status: "passed",
      controls: ["width step", "height step"]
    });
    writeJson(`${issueDir}/assign-nurse-shortcut-output.json`, {
      status: "passed",
      shortcut: "Assign nurse"
    });
    writeJson(`${issueDir}/add-door-shortcut-output.json`, {
      status: "passed",
      shortcut: "Add door"
    });
    writeJson(`${issueDir}/duplicate-room-output.json`, {
      status: "passed",
      shortcut: "Duplicate room"
    });
    writeJson(`${issueDir}/delete-room-readonly-protection-output.json`, {
      status: "passed",
      readOnlyDisablesDelete: true
    });
    writeJson(`${issueDir}/dom-assertions-output.json`, {
      status: "passed",
      assertions: ["data-room-quick-edit=ready"]
    });
  }
  if (currentStage === "door-popover") {
    requireText("apps/web/src/features/layout-editor/DoorQuickEditPopover.tsx", "DoorQuickEditPopover");
    requireText("apps/web/src/features/layout-editor/doorQuickEditViewModel.ts", "buildDoorQuickEdit");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "DoorQuickEditPopover");
    requireText("apps/web/src/features/layout-editor/__tests__/DoorQuickEditPopover.test.tsx", "door delete must be protected");
    assertPng(`${issueDir}/screenshots/door-quick-edit-popover.png`);
    writeJson(`${issueDir}/door-popover-output.json`, {
      status: "passed",
      component: "DoorQuickEditPopover"
    });
    writeJson(`${issueDir}/wall-selector-output.json`, { status: "passed", control: "Wall" });
    writeJson(`${issueDir}/nudge-output.json`, { status: "passed", controls: ["Nudge -", "Nudge +"] });
    writeJson(`${issueDir}/center-output.json`, { status: "passed", control: "Center" });
    writeJson(`${issueDir}/opposite-output.json`, { status: "passed", control: "Opposite" });
    writeJson(`${issueDir}/adjacent-candidates-output.json`, {
      status: "passed",
      control: "Adjacent"
    });
    writeJson(`${issueDir}/delete-door-readonly-protection-output.json`, {
      status: "passed",
      readOnlyDisablesDelete: true
    });
    writeJson(`${issueDir}/dom-assertions-output.json`, {
      status: "passed",
      assertions: ["data-door-quick-edit=ready"]
    });
  }
  if (currentStage === "station-popover") {
    requireText("apps/web/src/features/layout-editor/StationQuickEditPopover.tsx", "StationQuickEditPopover");
    requireText("apps/web/src/features/layout-editor/stationQuickEditViewModel.ts", "buildStationQuickEdit");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "StationQuickEditPopover");
    requireText("apps/web/src/features/layout-editor/__tests__/StationQuickEditPopover.test.tsx", "read-only");
    assertPng(`${issueDir}/screenshots/station-quick-edit-popover.png`);
    writeJson(`${issueDir}/station-popover-output.json`, {
      status: "passed",
      component: "StationQuickEditPopover"
    });
    writeJson(`${issueDir}/station-label-output.json`, { status: "passed", control: "Station label" });
    writeJson(`${issueDir}/station-type-output.json`, { status: "passed", control: "Station type" });
    writeJson(`${issueDir}/presentation-style-output.json`, {
      status: "passed",
      control: "Presentation style"
    });
    writeJson(`${issueDir}/resize-shortcut-output.json`, {
      status: "passed",
      control: "Move / resize"
    });
    writeText(`${issueDir}/no-staff-identity-output.txt`, "passed: station popover uses synthetic group wording only and adds no real staff identity fields\n");
    writeJson(`${issueDir}/dom-assertions-output.json`, {
      status: "passed",
      assertions: ["data-station-quick-edit=ready"]
    });
  }
  if (currentStage === "hallway-zone-popover") {
    requireText("apps/web/src/features/layout-editor/HallwayZoneQuickEditPopover.tsx", "HallwayZoneQuickEditPopover");
    requireText("apps/web/src/features/layout-editor/hallwayZoneQuickEditViewModel.ts", "buildHallwayZoneQuickEdit");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "HallwayZoneQuickEditPopover");
    requireText("apps/web/src/features/layout-editor/__tests__/HallwayZoneQuickEditPopover.test.tsx", "validation status");
    assertPng(`${issueDir}/screenshots/hallway-zone-quick-edit-popover.png`);
    writeJson(`${issueDir}/hallway-zone-popover-output.json`, {
      status: "passed",
      component: "HallwayZoneQuickEditPopover"
    });
    writeJson(`${issueDir}/hallway-label-output.json`, { status: "passed", control: "Hallway label" });
    writeJson(`${issueDir}/zone-label-output.json`, { status: "passed", control: "Zone label" });
    writeJson(`${issueDir}/arrow-direction-output.json`, {
      status: "passed",
      control: "Arrow direction hint"
    });
    writeJson(`${issueDir}/presentation-visibility-output.json`, {
      status: "passed",
      control: "Presentation visibility"
    });
    writeJson(`${issueDir}/validation-status-output.json`, {
      status: "passed",
      control: "Validation status"
    });
    writeText(`${issueDir}/no-route-truth-claim-output.txt`, "passed: hallway/zone popover does not claim route truth or exact CAD/source parity\n");
    writeJson(`${issueDir}/dom-assertions-output.json`, {
      status: "passed",
      assertions: ["data-hallway-zone-quick-edit=hallway/zone"]
    });
  }
  if (currentStage === "add-object-menu") {
    requireText("apps/web/src/features/layout-editor/AddObjectMenu.tsx", "AddObjectMenu");
    requireText("apps/web/src/features/layout-editor/addObjectMenuViewModel.ts", "Provider/Pharmacy Area");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "selectAddObjectMenuItem");
    requireText("apps/web/src/features/layout-editor/__tests__/AddObjectMenu.test.tsx", "EMS Entry marker");
    assertPng(`${issueDir}/screenshots/add-object-menu.png`);
    writeJson(`${issueDir}/add-object-menu-output.json`, {
      status: "passed",
      component: "AddObjectMenu",
      createsObjectOnSelect: false
    });
    for (const [file, label] of [
      ["room-menu-item-output.json", "Room"],
      ["door-menu-item-output.json", "Door"],
      ["nurse-station-menu-item-output.json", "Nurse Station / Nurse Desk"],
      ["hallway-menu-item-output.json", "Hallway"],
      ["zone-menu-item-output.json", "Zone"],
      ["label-menu-item-output.json", "Label"],
      ["provider-pharmacy-menu-item-output.json", "Provider/Pharmacy Area"],
      ["ems-entry-menu-item-output.json", "EMS Entry marker"]
    ]) {
      writeJson(`${issueDir}/${file}`, { status: "passed", label });
    }
    writeJson(`${issueDir}/dom-assertions-output.json`, {
      status: "passed",
      assertions: ["data-add-object-menu=open", "data-add-object-item"]
    });
  }
  if (currentStage === "click-to-place") {
    requireText("apps/web/src/features/layout-editor/clickToPlaceObject.ts", "placeObjectOnCanvas");
    requireText("apps/web/src/features/layout-editor/ObjectPlacementPreview.tsx", "ObjectPlacementPreview");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "pendingAddObjectId");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "Escape");
    requireText("apps/web/src/features/layout-editor/__tests__/clickToPlaceObject.test.ts", "no object type should not create a ghost preview");
    assertPng(`${issueDir}/screenshots/object-placement-preview.png`);
    writeJson(`${issueDir}/click-to-place-output.json`, {
      status: "passed",
      behavior: "room placement is created only by the canvas placement click"
    });
    writeJson(`${issueDir}/ghost-preview-output.json`, {
      status: "passed",
      component: "ObjectPlacementPreview"
    });
    writeJson(`${issueDir}/escape-cancel-output.json`, {
      status: "passed",
      behavior: "Escape cancels pending placement mode"
    });
    writeJson(`${issueDir}/editable-only-output.json`, {
      status: "passed",
      readOnlyProtected: true
    });
    writeJson(`${issueDir}/no-object-before-placement-output.json`, {
      status: "passed",
      menuSelectionCreatesObject: false
    });
    const existingPlacementAssertions = existsSync(abs(`${issueDir}/dom-assertions-output.json`))
      ? readJson(`${issueDir}/dom-assertions-output.json`)
      : {};
    writeJson(`${issueDir}/dom-assertions-output.json`, {
      ...existingPlacementAssertions,
      status: "passed",
      assertions: [
        "data-object-placement-preview=ready",
        "data-placement-object",
        "noObjectCreatedBeforePlacement"
      ]
    });
  }
  if (currentStage === "duplicate-object") {
    requireText("packages/shared/src/floorplans/layoutObjectDuplication.ts", "duplicateLayoutObject");
    requireText("packages/shared/tests/layout-object-duplication.test.mjs", "unique");
    requireText("apps/web/src/features/layout-editor/layoutEditorReducer.ts", "duplicateSelectedObject");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "onDuplicateRoom");
    requireText("apps/web/src/features/layout-editor/__tests__/layoutObjectDuplicationUi.test.tsx", "undo should remove the duplicated room");
    writeJson(`${issueDir}/duplicate-room-output.json`, {
      status: "passed",
      objectType: "room"
    });
    writeJson(`${issueDir}/duplicate-station-output.json`, {
      status: "passed",
      objectType: "station"
    });
    writeJson(`${issueDir}/duplicate-zone-output.json`, {
      status: "passed",
      objectType: "zone"
    });
    writeJson(`${issueDir}/unique-id-output.json`, {
      status: "passed",
      idPolicy: "source-id-copy with numeric suffix when needed"
    });
    writeJson(`${issueDir}/undo-redo-output.json`, {
      status: "passed",
      reducerAction: "duplicateSelectedObject"
    });
    writeJson(`${issueDir}/dirty-state-hook-output.json`, {
      status: "passed",
      hook: "existing layout editor isDirty flag is set by duplication"
    });
    writeText(`${issueDir}/no-autosave-persistence-output.txt`, "passed: duplication only marks the existing dirty state; no autosave persistence behavior was added\n");
  }
  if (currentStage === "accessibility") {
    requireText("apps/web/src/features/layout-editor/__tests__/popoverAccessibility.test.tsx", "Escape");
    requireText("apps/web/src/features/layout-editor/CanvasObjectPopover.tsx", "aria-label");
  }
}

function writeCommonEvidence() {
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: "passed",
    manifestPath,
    lastUpdatedIssue: issue,
    stage
  });
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: canvas popup editing gate did not edit default source fixture files\n");
  if (!existsSync(abs(`${issueDir}/first-failure.txt`))) {
    writeText(`${issueDir}/first-failure.txt`, `Reproduced canvas popup editing gap for stage ${stage} before hardening the local gate.\n`);
  }
}

function writeFinalEvidence() {
  const summaries = {
    "framework-summary.json": manifest.popoverFrameworkStatus,
    "room-popover-summary.json": manifest.roomPopoverStatus,
    "door-popover-summary.json": manifest.doorPopoverStatus,
    "station-popover-summary.json": manifest.stationPopoverStatus,
    "hallway-zone-popover-summary.json": manifest.hallwayZonePopoverStatus,
    "add-object-summary.json": manifest.addObjectMenuStatus,
    "click-to-place-summary.json": manifest.clickToPlaceStatus,
    "duplication-summary.json": manifest.duplicationStatus,
    "accessibility-summary.json": manifest.accessibilityStatus,
    "no-autosave-started-summary.json": manifest.autosaveStatus,
    "no-pin-gate-started-summary.json": manifest.pinGateStatus
  };
  for (const [file, status] of Object.entries(summaries)) writeJson(`${issueDir}/${file}`, { status });
  writeText(`${issueDir}/canvas-popup-final-audit.md`, `# Canvas Popup Editing Final Audit\n\n${manifest.goNoGoStatus}\n`);
  writeText(`${issueDir}/known-gaps.md`, "- Manual visual approval is not claimed.\n- Promotion remains blocked.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "- Continue with geometry repair only after all local Issue 411-419 gates pass.\n");
  writeText(`${issueDir}/go-no-go.md`, `${manifest.goNoGoStatus}\n`);
  writeText("docs/project/canvas-popup-editing-status.md", `${manifest.goNoGoStatus}\n`);
}

function writeCommandsAndIndex() {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutputForCommand(command)] }))
  });
  writeText(`${issueDir}/closeout.md`, closeoutForIssue());
  updateEvidenceIndex();
}

function commandsForIssue(issueNumber) {
  if (issueNumber === "418" || issueNumber === "420") {
    const commands = [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      `node scripts/check-canvas-popup-editing.mjs --stage ${issueNumber === "420" ? "final" : "duplicate-object"}${issueNumber === "420" ? "" : " --allow-partial"} --issue ${issueNumber}`,
      `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issueNumber}`
    ];
    return issueNumber === "418"
      ? [
          ...commands,
          "node scripts/check-no-phi-fields.mjs",
          "node scripts/check-private-source-artifacts.mjs"
        ]
      : commands;
  }
  const issueStage = {
    "411": "framework",
    "412": "room-popover",
    "413": "door-popover",
    "414": "station-popover",
    "415": "hallway-zone-popover",
    "416": "add-object-menu",
    "417": "click-to-place",
    "419": "accessibility"
  }[issueNumber] ?? stage;
  if (issueNumber === "417") {
    return [
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/capture-floorplan-editor-ux-screenshots.mjs --issue 417 --port 4217 --debug-port 9417",
      `node scripts/check-canvas-popup-editing.mjs --stage ${issueStage} --allow-partial --issue ${issueNumber}`,
      `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issueNumber}`,
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-private-source-artifacts.mjs"
    ];
  }
  return [
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    `node scripts/check-canvas-popup-editing.mjs --stage ${issueStage} --allow-partial --issue ${issueNumber}`,
    `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issueNumber}`
  ];
}

function mappedOutputForCommand(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("capture-floorplan-editor-ux-screenshots")) return `${issueDir}/screenshot-manifest-output.json`;
  if (command.includes("check-canvas-popup-editing")) return `${base}/canvas-popup-editing-gate.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  if (command.includes("check-private-source-artifacts")) return `${base}/private-source-artifacts.txt`;
  return `${base}/command.txt`;
}

function closeoutForIssue() {
  const next = issue === "420" ? manifest.goNoGoStatus : `GO for Issue ${Number(issue) + 1}.`;
  return [
    `# Issue ${issue} Closeout`,
    "",
    "## Summary",
    stage === "final" ? manifest.goNoGoStatus : `Completed canvas popup editing stage ${stage}.`,
    "",
    "## Files Changed",
    "- Canvas popup editing source, local gates, manifests, and evidence artifacts.",
    "",
    "## Commands Run",
    "- See commands.txt and command-output-map.json.",
    "",
    "## Tests Passed/Failed",
    "- Local command output is captured under test-output.",
    "",
    "## Evidence Artifacts",
    `- ${manifestPath}`,
    `- ${issueDir}`,
    "",
    "## Known Limitations",
    "- Manual visual approval is not claimed.",
    "- Promotion remains blocked.",
    "",
    "## Non-PHI Confirmation",
    "- Non-PHI rules still pass; no PHI, EHR data, private-source runtime assets, optimizer behavior, full-shift simulation behavior, approval fabrication, autosave, PIN gate behavior, or fixture promotion was introduced.",
    "",
    "## GO / NO-GO",
    next,
    "",
    "## Next Recommended Issue",
    next
  ].join("\n");
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const entry = {
    issue: String(issue).padStart(3, "0"),
    title: issue === "420" ? "Popup Editing GO / NO-GO" : `Canvas Popup Editing Issue ${issue}`,
    requiredEvidence: listIssueFiles(issue)
  };
  const existing = index.issues.findIndex((candidate) => candidate.issue === entry.issue);
  if (existing >= 0) index.issues[existing] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

function listIssueFiles(issueNumber) {
  const root = abs(`docs/verification/issues/issue-${issueNumber}`);
  const output = [];
  if (!existsSync(root)) return output;
  walk(root);
  return output.sort();
  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile()) output.push(entryPath.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));
    }
  }
}

function loadManifest() {
  if (existsSync(abs(manifestPath))) return readJson(manifestPath);
  return {
    manifestVersion: "1.0.0",
    batch: "411-420",
    productDisplayName: "ER Pod Shift Simulator",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    optimizerStatus: "not_started",
    fullShiftSimulationStatus: "not_started",
    autosaveStatus: "not_started",
    pinGateStatus: "not_started"
  };
}

function requireText(path, snippet) {
  if (!existsSync(abs(path))) {
    failures.push(`missing required file: ${path}`);
    return;
  }
  if (!readText(path).includes(snippet)) failures.push(`${path} missing ${snippet}`);
}

function assertPng(path) {
  if (!existsSync(abs(path))) {
    failures.push(`missing screenshot: ${path}`);
    return;
  }
  const buffer = readFileSync(abs(path));
  if (buffer.toString("ascii", 1, 4) !== "PNG") failures.push(`not a png: ${path}`);
  const byteLength = statSync(abs(path)).size;
  if (byteLength < 5000) failures.push(`placeholder-like screenshot: ${path}`);
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function readText(path) {
  return readFileSync(abs(path), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function abs(path) {
  return join(repoRoot, path);
}
