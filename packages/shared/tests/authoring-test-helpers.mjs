export const testEditableLayout = {
  schemaVersion: "1.0.0",
  layoutId: "editable-authoring-plan",
  units: "feet",
  rooms: [
    {
      objectType: "room",
      id: "room-01",
      label: "Room 01",
      roomNumber: "01",
      roomType: "standard",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 10,
      yFeet: 10,
      widthFeet: 12,
      heightFeet: 10
    }
  ],
  doors: [
    {
      objectType: "door",
      id: "door-room-01",
      label: "Door Room 01",
      ownerKind: "room",
      ownerId: "room-01",
      wall: "south",
      offsetFeet: 4,
      widthFeet: 4
    }
  ],
  stations: [
    {
      objectType: "station",
      id: "station-01",
      label: "Station 01",
      stationType: "nurse_station",
      xFeet: 30,
      yFeet: 10,
      widthFeet: 8,
      heightFeet: 6
    }
  ],
  hallways: [
    {
      objectType: "hallway",
      id: "hall-manual",
      label: "Manual hallway",
      xFeet: 10,
      yFeet: 24,
      widthFeet: 40,
      heightFeet: 8
    }
  ],
  zones: [],
  limitations: ["Test operational geometry only."]
};

export const testPlan = {
  schemaVersion: "1.0.0",
  planId: "editable-authoring-plan",
  name: "Editable Authoring Plan",
  description: "Synthetic operational test plan.",
  createdAt: "2026-05-25T00:00:00Z",
  updatedAt: "2026-05-25T00:00:00Z",
  scale: {
    unit: "feet",
    pixelsPerUnit: 12,
    gridSizeFeet: 1,
    snapToGrid: true,
    origin: "top-left"
  },
  rooms: [
    {
      id: "room-01",
      label: "Room 01",
      roomType: "standard",
      x: 10,
      y: 10,
      widthFeet: 12,
      lengthFeet: 10,
      maxPatients: 1,
      traumaCapable: false,
      isolationCapable: false,
      doorPoint: null,
      zoneId: null,
      nearestStationId: "station-01",
      pathNodeId: null,
      roomOperationalMetadata: null,
      overflowOperationalMetadata: null,
      adjacencyOperationalMetadata: null
    }
  ],
  hallways: [
    {
      id: "hall-manual",
      label: "Manual hallway",
      widthFeet: 8,
      points: [
        { x: 10, y: 24 },
        { x: 50, y: 24 }
      ],
      hallwayOperationalMetadata: null
    }
  ],
  doors: [
    {
      id: "door-room-01",
      label: "Door Room 01",
      roomId: "room-01",
      x: 16,
      y: 20,
      widthFeet: 4,
      pathNodeId: null,
      doorOperationalMetadata: null
    }
  ],
  nurseStations: [
    {
      id: "station-01",
      label: "Station 01",
      stationType: "primary",
      x: 30,
      y: 10,
      widthFeet: 8,
      lengthFeet: 6,
      pathNodeId: "node-station-01",
      stationOperationalMetadata: null
    }
  ],
  zones: [],
  pathNodes: [
    {
      id: "node-station-01",
      nodeType: "station",
      x: 34,
      y: 13,
      linkedObjectId: "station-01",
      entryOperationalMetadata: null
    }
  ],
  pathEdges: []
};

export function testSourceProvenance() {
  return {
    sourceReferenceId: "default-er-layout-plan-1",
    sourceKind: "private_docx_reference",
    sourceVisibility: "private-reference-only",
    publicExposureAllowed: false,
    runtimeServedByWeb: false,
    runtimeServedByApi: false,
    notes: ["Safe provenance only."]
  };
}

export function testAuthoringDraft(overrides = {}) {
  return {
    draftId: "draft-authoring-test",
    sourceDefaultPlanId: "default-er-layout-plan-1",
    planId: "editable-authoring-plan",
    displayName: "Editable Authoring Plan",
    versionLabel: "v1",
    editableLayout: testEditableLayout,
    sourcePlan: testPlan,
    authoringStatus: "draft_has_warnings",
    pathSyncStatus: "stale_warning",
    authoringWarnings: ["Path sync is stale after authoring."],
    sourceProvenance: testSourceProvenance(),
    createdAt: "2026-05-25T00:00:00Z",
    updatedAt: "2026-05-25T00:00:00Z",
    syntheticDataOnly: true,
    ...overrides
  };
}

export function throws(fn, pattern) {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error && pattern.test(error.message)) {
      return true;
    }
    throw error;
  }
  throw new Error(`Expected throw matching ${pattern}`);
}
