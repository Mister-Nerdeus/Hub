import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPlanContractFromEditableLayout,
  generateAutoHallways,
  generateGridSubtractionHallways,
  validateAuthoringDraftContract
} from "../dist/index.js";
import { testAuthoringDraft, testEditableLayout, testPlan } from "./authoring-test-helpers.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../..");
const sharedRoot = resolve(testDir, "..");
const issueDir = resolve(repoRoot, "docs/verification/issues/issue-285");
const fixturePath = resolve(
  sharedRoot,
  "fixtures/authoring-proof/plan-1-hallway-v2-fixture.json"
);

const layoutWithInteriorPublicSpace = {
  ...testEditableLayout,
  rooms: [
    { ...testEditableLayout.rooms[0], id: "room-left", xFeet: 0, yFeet: 0, widthFeet: 8, heightFeet: 8 },
    { ...testEditableLayout.rooms[0], id: "room-right", xFeet: 16, yFeet: 0, widthFeet: 8, heightFeet: 8 }
  ],
  doors: [],
  stations: [],
  zones: []
};

const result = generateGridSubtractionHallways({
  layout: layoutWithInteriorPublicSpace,
  sourcePlanId: "grid-proof",
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 24, heightFeet: 8 },
  gridCellSizeFeet: 4
});

if (result.generationMethod !== "grid_subtraction") {
  throw new Error("grid subtraction method must be explicit");
}
if (result.publicCellCount === 0 || result.occupiedCellCount === 0) {
  throw new Error("grid subtraction must separate occupied and public cells");
}
const interiorHallway = result.generatedHallwayZones.find(
  (hallway) => hallway.xFeet === 8 && hallway.widthFeet === 8
);
if (interiorHallway == null) {
  throw new Error("interior public space between rooms must be generated");
}
if (result.generatedHallwayZones.some((hallway) => rectsOverlapAnyRoom(hallway, layoutWithInteriorPublicSpace.rooms))) {
  throw new Error("generated hallway rectangles must not overlap occupied room cells");
}
if (!result.preservedManualHallwayIds.includes("hall-manual")) {
  throw new Error("manual hallways must be preserved");
}
if (!result.generatedHallwayZones.every((hallway) => hallway.id.startsWith("generated-hallway-grid-proof-grid-"))) {
  throw new Error("generated hallway zones must be tagged by id");
}

const deterministic = generateGridSubtractionHallways({
  layout: layoutWithInteriorPublicSpace,
  sourcePlanId: "grid-proof",
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 24, heightFeet: 8 },
  gridCellSizeFeet: 4
});
if (JSON.stringify(result) !== JSON.stringify(deterministic)) {
  throw new Error("same input must produce deterministic grid hallway output");
}

const small = generateGridSubtractionHallways({
  layout: testEditableLayout,
  sourcePlanId: "grid-proof",
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 2, heightFeet: 2 },
  gridCellSizeFeet: 4
});
if (!small.warnings.includes("BOUNDS_TOO_SMALL_FOR_GRID_SUBTRACTION")) {
  throw new Error("small bounds must return a warning");
}

const stationSupportBlockedLayout = {
  ...testEditableLayout,
  rooms: [],
  doors: [],
  stations: [
    {
      objectType: "station",
      id: "station-support-proof",
      label: "Support Station",
      stationType: "nurse_station",
      xFeet: 0,
      yFeet: 0,
      widthFeet: 4,
      heightFeet: 4
    }
  ],
  zones: [
    {
      objectType: "zone",
      id: "zone-blocked-proof",
      label: "Blocked Operational Zone",
      zoneType: "provider_pharmacy",
      xFeet: 4,
      yFeet: 0,
      widthFeet: 4,
      heightFeet: 4
    }
  ],
  hallways: []
};
const stationSupportBlocked = generateGridSubtractionHallways({
  layout: stationSupportBlockedLayout,
  sourcePlanId: "grid-proof-zones",
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 12, heightFeet: 4 },
  gridCellSizeFeet: 4
});
if (stationSupportBlocked.occupiedCellCount !== 2 || stationSupportBlocked.publicCellCount !== 1) {
  throw new Error("station/support and blocked-zone cells must be excluded from generated public space");
}
if (stationSupportBlocked.generatedHallwayZones.some((hallway) =>
  rectsOverlap(hallway, stationSupportBlockedLayout.stations[0]) ||
  rectsOverlap(hallway, stationSupportBlockedLayout.zones[0])
)) {
  throw new Error("generated hallway rectangles must not overlap station/support or blocked zones");
}

const autoResult = generateAutoHallways({
  layout: layoutWithInteriorPublicSpace,
  sourcePlanId: "grid-proof",
  readOnly: false,
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 24, heightFeet: 8 },
  gridCellSizeFeet: 4
});
const savedDraft = validateAuthoringDraftContract(testAuthoringDraft({
  editableLayout: {
    ...layoutWithInteriorPublicSpace,
    hallways: [
      ...layoutWithInteriorPublicSpace.hallways.filter((hallway) =>
        autoResult.preservedManualHallwayIds.includes(hallway.id)
      ),
      ...autoResult.generatedHallwayZones
    ]
  },
  authoringWarnings: ["Generated hallway/public-space geometry requires route review."]
}));
const exported = buildPlanContractFromEditableLayout({
  sourcePlan: testPlan,
  editableLayout: savedDraft.editableLayout,
  planId: "grid-proof-export"
});
const exportedGeneratedHallway = exported.hallways.find((hallway) =>
  hallway.id.startsWith("generated-hallway-grid-proof-grid-")
);
if (exportedGeneratedHallway?.hallwayOperationalMetadata?.hallwayClass !== "side") {
  throw new Error("exported generated hallway must retain operational metadata");
}

const requiredOutput = {
  generationMethod: result.generationMethod,
  gridCellSizeFeet: result.gridCellSizeFeet,
  occupiedCellCount: result.occupiedCellCount,
  publicCellCount: result.publicCellCount,
  mergedPublicRegionCount: result.mergedPublicRegionCount,
  generatedHallwayZones: result.generatedHallwayZones,
  preservedManualHallwayIds: result.preservedManualHallwayIds,
  limitations: result.limitations,
  nonClaims: result.nonClaims,
  warnings: result.warnings
};

writeJson("grid-subtraction-output.json", {
  issue: "285",
  status: "passed",
  ...requiredOutput
});
writeJson("interior-hallway-output.json", {
  issue: "285",
  status: "passed",
  interiorHallway
});
writeJson("occupied-cell-exclusion-output.json", {
  issue: "285",
  status: "passed",
  occupiedCellCount: result.occupiedCellCount,
  generatedHallwaysOverlapRooms: false
});
writeJson("station-support-exclusion-output.json", {
  issue: "285",
  status: "passed",
  occupiedCellCount: stationSupportBlocked.occupiedCellCount,
  publicCellCount: stationSupportBlocked.publicCellCount,
  stationSupportCellsExcluded: true,
  generatedHallwaysOverlapStationOrSupportZone: false
});
writeJson("blocked-zone-exclusion-output.json", {
  issue: "285",
  status: "passed",
  blockedZoneId: "zone-blocked-proof",
  blockedZoneCellsExcluded: true,
  generatedHallwaysOverlapBlockedZones: false
});
writeJson("manual-hallway-preservation-output.json", {
  issue: "285",
  status: "passed",
  preservedManualHallwayIds: result.preservedManualHallwayIds
});
writeJson("generated-tag-output.json", {
  issue: "285",
  status: "passed",
  generatedHallwayIds: result.generatedHallwayZones.map((hallway) => hallway.id),
  allGeneratedIdsTagged: true
});
writeJson("deterministic-generation-output.json", {
  issue: "285",
  status: "passed",
  deterministic: true
});
writeJson("saved-draft-grid-hallway-output.json", {
  issue: "285",
  status: "passed",
  draftId: savedDraft.draftId,
  savedGeneratedHallwayCount: savedDraft.editableLayout.hallways.filter((hallway) =>
    hallway.id.startsWith("generated-hallway-")
  ).length
});
writeJson("export-grid-hallway-output.json", {
  issue: "285",
  status: "passed",
  exportedPlanId: exported.planId,
  exportedGeneratedHallwayId: exportedGeneratedHallway?.id,
  exportedGeneratedHallwayMetadata: exportedGeneratedHallway?.hallwayOperationalMetadata
});
writeText("limitations-output.md", [
  "# Issue 285 Auto-Hallway V2 Limitations",
  "",
  "- Grid subtraction is approximate operational geometry only.",
  "- Cell size controls precision; it is not exact CAD geometry.",
  "- Generated public-space hallways require manual review before route/path sync can be considered fresh."
].join("\n") + "\n");
writeJsonToAbsolute(fixturePath, {
  issue: "285",
  status: "passed",
  ...requiredOutput
});

function rectsOverlapAnyRoom(hallway, rooms) {
  return rooms.some((room) => (
    rectsOverlap(hallway, room)
  ));
}

function rectsOverlap(left, right) {
  return (
    left.xFeet < right.xFeet + right.widthFeet &&
    left.xFeet + left.widthFeet > right.xFeet &&
    left.yFeet < right.yFeet + right.heightFeet &&
    left.yFeet + left.heightFeet > right.yFeet
  );
}

function writeJson(name, payload) {
  writeJsonToAbsolute(resolve(issueDir, name), payload);
}

function writeJsonToAbsolute(target, payload) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}

function writeText(name, text) {
  const target = resolve(issueDir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
}
