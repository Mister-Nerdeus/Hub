import assert from "node:assert/strict";
import {
  authoringRoomTypeToEditableRoomType,
  authoringRoomTypeToPlanRoomType,
  dryRunTaskTemplates,
  editableRoomTypeToAuthoringRoomType,
  filterEligibleRoomLoads,
  generateDryRunTaskInstances,
  getRoomTypeRule,
  isDoorEligibleRoomType,
  isNurseAssignableRoomType,
  isRatioCountEligibleRoomType,
  isRoomLoadEligibleRoomType,
  isTravelBlockingRoomType,
  neutralWorkloadSeedContract,
  typicalActivityProfile,
  validatePlanContract
} from "../dist/index.js";

const providerPlan = validatePlanContract({
  schemaVersion: "1.0.0",
  planId: "provider-pharmacy-room-type-proof",
  name: "Provider pharmacy room type proof",
  description: null,
  createdAt: "2026-05-29T00:00:00.000Z",
  updatedAt: "2026-05-29T00:00:00.000Z",
  scale: {
    unit: "feet",
    pixelsPerUnit: 12,
    gridSizeFeet: 2,
    snapToGrid: true,
    origin: "top-left"
  },
  rooms: [
    {
      id: "room-care",
      label: "Room Care",
      roomType: "standard",
      x: 0,
      y: 0,
      widthFeet: 10,
      lengthFeet: 10,
      maxPatients: 1,
      traumaCapable: false,
      isolationCapable: false,
      doorPoint: null,
      zoneId: null,
      nearestStationId: null,
      pathNodeId: "node-care",
      roomOperationalMetadata: null,
      overflowOperationalMetadata: null,
      adjacencyOperationalMetadata: null
    },
    {
      id: "room-provider-pharmacy",
      label: "Provider Pharmacy",
      roomType: "provider_pharmacy",
      x: 12,
      y: 0,
      widthFeet: 8,
      lengthFeet: 8,
      maxPatients: 1,
      traumaCapable: false,
      isolationCapable: false,
      doorPoint: null,
      zoneId: null,
      nearestStationId: null,
      pathNodeId: null,
      roomOperationalMetadata: null,
      overflowOperationalMetadata: null,
      adjacencyOperationalMetadata: null
    }
  ],
  hallways: [],
  doors: [
    {
      id: "door-care",
      label: "Door Care",
      roomId: "room-care",
      x: 5,
      y: 0,
      widthFeet: 4,
      pathNodeId: "node-care",
      doorOperationalMetadata: null
    }
  ],
  nurseStations: [],
  zones: [],
  pathNodes: [
    {
      id: "node-care",
      nodeType: "room_door",
      x: 5,
      y: 0,
      linkedObjectId: "door-care",
      entryOperationalMetadata: null,
      pathRepairMetadata: null
    }
  ],
  pathEdges: []
});

assert.equal(authoringRoomTypeToEditableRoomType("provider_pharmacy"), "provider_pharmacy");
assert.equal(editableRoomTypeToAuthoringRoomType("provider_pharmacy"), "provider_pharmacy");
assert.equal(authoringRoomTypeToPlanRoomType("provider_pharmacy"), "provider_pharmacy");

const rule = getRoomTypeRule("provider_pharmacy");
assert.equal(rule.patientCareEligible, false);
assert.equal(rule.nurseAssignable, false);
assert.equal(rule.roomLoadEligible, false);
assert.equal(rule.ratioCountEligible, false);
assert.equal(rule.burdenScoreEligible, false);
assert.equal(rule.doorEligible, true);
assert.equal(rule.travelBlocking, false);
assert.equal(isRoomLoadEligibleRoomType("provider_pharmacy"), false);
assert.equal(isNurseAssignableRoomType("provider_pharmacy"), false);
assert.equal(isRatioCountEligibleRoomType("provider_pharmacy"), false);
assert.equal(isDoorEligibleRoomType("provider_pharmacy"), true);
assert.equal(isTravelBlockingRoomType("provider_pharmacy"), false);

const eligibleLoads = filterEligibleRoomLoads(
  [
    { roomId: "room-care" },
    { roomId: "room-provider-pharmacy" }
  ],
  providerPlan
);
assert.deepEqual(eligibleLoads, [{ roomId: "room-care" }]);

const generated = generateDryRunTaskInstances({
  roomLoad: {
    schemaVersion: "1.0.0",
    contractId: "room-load-starter-canonical-plan-1",
    canonicalScenarioSeedId: "canonical-scenario-seed-plan-1",
    entries: [
      {
        loadableBedPositionId: "room-care",
        occupancyState: "occupied",
        acuityBandPlaceholder: "placeholder_medium",
        complexityBandPlaceholder: "placeholder_medium",
        supportNeedPlaceholder: "placeholder_low",
        source: "synthetic planning input",
        fullShiftSimulationStatus: "not_started",
        syntheticDataOnly: true
      }
    ],
    source: "synthetic planning input",
    fullShiftSimulationStatus: "not_started",
    patientOutcomeStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    syntheticDataOnly: true
  },
  activityProfile: typicalActivityProfile,
  seedContract: neutralWorkloadSeedContract,
  templates: dryRunTaskTemplates,
  capacity: {
    schemaVersion: "1.0.0",
    canonicalScenarioSeedId: "canonical-scenario-seed-plan-1",
    canonicalFloorplanId: "default-er-layout-plan-1",
    source: "semantic_selectors",
    physicalRoomCount: 1,
    bedPositionCount: 1,
    splitBayCount: 0,
    assignmentEligibleCount: 1,
    ratioEligibleCount: 1,
    excludedCount: 1,
    excludedByType: {
      storage: 0,
      supportArea: 1,
      hallway: 0,
      solidWall: 0
    },
    assignmentEligibleBedPositionIds: ["room-care"],
    ratioEligibleBedPositionIds: ["room-care"],
    excludedObjectIds: ["room-provider-pharmacy"],
    rawFixtureRoomIterationUsed: false,
    usesCanonicalCapacityReport: true,
    usesSplitBayFixtureBridge: true
  }
});
assert.equal(generated.instances.some((instance) => instance.loadableBedPositionId === "room-provider-pharmacy"), false);
