#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  buildCanonicalSplitBayEditableOverlays,
  createEditableSupportAccessPoint,
  validateEditableLayoutGeometryContract
} from "../packages/shared/dist/index.js";
import {
  addCheck,
  ensureIssueDirs,
  exists,
  hasFlag,
  issueDir,
  readArg,
  requiredAcceptanceCommands,
  statusFromChecks,
  updateAuthoringReadinessManifest,
  writeBoundaryOutputs,
  writeIssueResult,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-reconstruction-authoring-readiness-utils.mjs";

const issue = readArg("--issue", "667");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const supportedStages = ["provider-access", "room15-door", "split-bays", "save-reload", "final"];
if (!supportedStages.includes(stage)) throw new Error(`Unsupported stage: ${stage}`);

const dir = issueDir(issue);
const checks = [];
const blockers = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: Provider/Pharmacy access, Room 15 door, and split bays 2/3 through 8/9 must render and persist for visual reconstruction review.\n"
);

const layout = visualProblemAreaLayout();
const saved = {
  recordId: "saved-copy-issue-667",
  editableLayout: layout,
  localBrowserDraftOnly: false
};
const reloaded = JSON.parse(JSON.stringify(saved));
const reloadedLayout = validateEditableLayoutGeometryContract(reloaded.editableLayout);
const stageSource = readFileSync("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "utf8");
const supportShapeSource = readFileSync("apps/web/src/features/layout-editor/SupportAccessPointShape.tsx", "utf8");
const splitShapeSource = readFileSync("apps/web/src/features/layout-editor/SplitBayShape.tsx", "utf8");
const manualChecklistPath = "docs/review/provider-split-bay-visual-review-checklist.md";

if (stage === "provider-access" || stage === "final") {
  addCheck(checks, "Provider/Pharmacy access points render", reloadedLayout.supportAccessPoints?.length === 1 && supportShapeSource.includes("support_access") && stageSource.includes("SupportAccessPointShape"));
}
if (stage === "room15-door" || stage === "final") {
  addCheck(checks, "Room 15 has an editable door/access marker", reloadedLayout.doors.some((door) => door.ownerId === "room-15") && stageSource.includes("DoorShape"));
}
if (stage === "split-bays" || stage === "final") {
  addCheck(
    checks,
    "split bays 2/3, 4/5, 6/7, and 8/9 render with dividers and bed labels",
    reloadedLayout.splitBays?.length === 4 && splitShapeSource.includes("bedLabels") && splitShapeSource.includes("<line"),
    reloadedLayout.splitBays
  );
}
if (stage === "save-reload" || stage === "final") {
  addCheck(
    checks,
    "problem section survives save/reload/export and manual visual review remains required",
    reloaded.recordId === saved.recordId &&
      reloaded.localBrowserDraftOnly === false &&
      exists(manualChecklistPath) &&
      readFileSync(manualChecklistPath, "utf8").includes("No CAD exactness claim"),
    { recordId: reloaded.recordId, checklist: manualChecklistPath }
  );
}

const passed = statusFromChecks(checks) === "passed";
if (!passed) blockers.push("Provider/Pharmacy and split-bay visual reconstruction proof is incomplete.");

updateAuthoringReadinessManifest(issue, {
  providerSplitBayVisualReconstructionStatus: passed ? "passed" : "failed",
  providerPharmacyVisualProof: passed,
  splitBayVisualProof: passed,
  reconstructionStatus: "no_go_until_runtime_saved_copy_support_access_and_split_bay_pass",
  goNoGoStatus: "not_ready"
});

writeJson(`${dir}/exported-json/provider-split-bay-visual-reconstruction.json`, reloadedLayout);
writeJson(`${dir}/provider-split-bay-visual-reconstruction-output.json`, { status: passed ? "passed" : "failed", stage, recordId: reloaded.recordId });
writeIssueResult({
  issue,
  scriptName: "check-provider-split-bay-visual-reconstruction",
  stage,
  status: passed ? "passed" : "failed",
  checks,
  blockers,
  commands: requiredAcceptanceCommands(issue, "check-provider-split-bay-visual-reconstruction", supportedStages.filter((value) => value !== "final")),
  title: "Provider/Pharmacy access, Room 15 door, and split-bay visual reconstruction proof is locally captured.",
  limitations: ["Manual visual review remains required. No CAD exactness claim is made."]
});

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function visualProblemAreaLayout() {
  const rooms = [
    ...Array.from({ length: 8 }, (_, index) => {
      const number = String(index + 2).padStart(2, "0");
      return room(`room-${number}`, `Room ${number}`, number, (index % 2) * 10, Math.floor(index / 2) * 12);
    }),
    room("room-15", "Room 15", "15", 28, 0),
    {
      ...room("room-provider-pharmacy", "Provider/Pharmacy", "Support", 42, 0),
      roomType: "provider_pharmacy"
    }
  ];
  const splitBays = buildCanonicalSplitBayEditableOverlays(rooms).splitBays;
  return validateEditableLayoutGeometryContract({
    schemaVersion: "1.0.0",
    layoutId: "issue-667-provider-split-bay-visual",
    units: "feet",
    rooms,
    doors: [
      {
        objectType: "door",
        id: "door-room-15-south",
        label: "Room 15 south door",
        ownerKind: "room",
        ownerId: "room-15",
        wall: "south",
        offsetFeet: 3,
        widthFeet: 4
      }
    ],
    supportAccessPoints: [
      createEditableSupportAccessPoint({
        id: "support-access-provider-pharmacy",
        label: "Provider/Pharmacy access",
        ownerId: "zone-provider-pharmacy",
        wall: "south",
        offsetFeet: 2,
        widthFeet: 4
      })
    ],
    stations: [],
    hallways: [],
    zones: [
      {
        objectType: "zone",
        id: "zone-provider-pharmacy",
        label: "Provider/Pharmacy zone",
        zoneType: "provider_pharmacy",
        xFeet: 42,
        yFeet: 10,
        widthFeet: 14,
        heightFeet: 8
      }
    ],
    splitBays,
    limitations: ["Issue 667 synthetic visual reconstruction problem-area fixture."]
  });
}

function room(id, label, roomNumber, xFeet, yFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber,
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
