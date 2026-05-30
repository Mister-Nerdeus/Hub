import {
  authoringRoomTypeToPlanRoomType,
  editableRoomTypeToAuthoringRoomType
} from "./roomTypeContract.js";
import { auditPathSyncStatus, type PathSyncAuditResult } from "./pathSyncAudit.js";
import {
  assertNoForbiddenSourcePayload,
  validateAuthoringDraftContract,
  type AuthoringDraftContract
} from "./authoringDraftContract.js";
import { validatePlanContract, type PlanContract } from "../contracts.js";
import {
  validateEditableLayoutGeometryContract,
  type EditableDoorGeometry,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";

export const SIMULATION_READY_EXPORT_STATUSES = [
  "simulation_ready",
  "blocked_path_sync",
  "blocked_invalid_geometry",
  "blocked_private_source_payload",
  "draft_has_warnings"
] as const;

export type SimulationReadyExportStatus = (typeof SIMULATION_READY_EXPORT_STATUSES)[number];

export type SimulationReadyExportResult = {
  status: SimulationReadyExportStatus;
  planId: string;
  sourceDraftId: string;
  simulationReadyPlan: PlanContract | null;
  blockingIssues: string[];
  warningIssues: string[];
  pathSyncStatus: AuthoringDraftContract["pathSyncStatus"];
  routeAccessSummary: PathSyncAuditResult;
  privateSourcePayloadStored: false;
  limitations: string[];
};

export function buildPlanContractFromEditableLayout(input: {
  sourcePlan: PlanContract;
  editableLayout: EditableLayoutGeometryContract;
  planId?: string;
}): PlanContract {
  const source = validatePlanContract(input.sourcePlan);
  const editableLayout = validateEditableLayoutGeometryContract(input.editableLayout);
  const sourceRoomsById = new Map(source.rooms.map((room) => [room.id, room]));
  const sourceDoorsById = new Map(source.doors.map((door) => [door.id, door]));
  const stationGeometryById = new Map(editableLayout.stations.map((station) => [station.id, station]));
  const zoneGeometryById = new Map(editableLayout.zones.map((zone) => [zone.id, zone]));
  const sourceHallwayById = new Map(source.hallways.map((hallway) => [hallway.id, hallway]));

  const rooms = editableLayout.rooms.map((geometry) => {
    const existing = sourceRoomsById.get(geometry.id);
    const roomType = authoringRoomTypeToPlanRoomType(editableRoomTypeToAuthoringRoomType(geometry.roomType));
    return existing == null
      ? editableRoomToPlanRoom(geometry)
      : {
          ...existing,
          label: geometry.label,
          roomType,
          x: geometry.xFeet,
          y: geometry.yFeet,
          widthFeet: geometry.widthFeet,
          lengthFeet: geometry.heightFeet,
          traumaCapable: roomType === "trauma",
          isolationCapable: roomType === "isolation",
          roomOperationalMetadata:
            existing.roomOperationalMetadata == null
              ? existing.roomOperationalMetadata
              : {
                  ...existing.roomOperationalMetadata,
                  roomNumber: geometry.roomNumber
                }
        };
  });
  const doors = editableLayout.doors.map((door) => {
    const projected = editableDoorToPlanDoor(door, editableLayout);
    const existing = sourceDoorsById.get(door.id);
    return existing == null ? projected : { ...existing, ...projected };
  });
  const doorIds = new Set(doors.map((door) => door.id));
  const pathNodes = source.pathNodes.filter(
    (node) => node.nodeType !== "room_door" || node.linkedObjectId == null || doorIds.has(node.linkedObjectId)
  );
  const pathNodeIds = new Set(pathNodes.map((node) => node.id));

  return validatePlanContract({
    ...source,
    planId: input.planId ?? source.planId,
    name: source.name,
    rooms: rooms.map((room) => ({
      ...room,
      pathNodeId: room.pathNodeId != null && pathNodeIds.has(room.pathNodeId) ? room.pathNodeId : null
    })),
    doors: doors.map((door) => ({
      ...door,
      pathNodeId: door.pathNodeId != null && pathNodeIds.has(door.pathNodeId) ? door.pathNodeId : null
    })),
    supportAccessPoints: editableLayout.supportAccessPoints ?? [],
    hallways: editableLayout.hallways.map((hallway) => {
      const existing = sourceHallwayById.get(hallway.id);
      const points = [
        { x: hallway.xFeet, y: hallway.yFeet },
        { x: hallway.xFeet + hallway.widthFeet, y: hallway.yFeet },
        { x: hallway.xFeet + hallway.widthFeet, y: hallway.yFeet + hallway.heightFeet },
        { x: hallway.xFeet, y: hallway.yFeet + hallway.heightFeet }
      ];
      return existing == null
        ? {
            id: hallway.id,
            label: hallway.label,
            widthFeet: Math.min(hallway.widthFeet, hallway.heightFeet),
            points,
            hallwayOperationalMetadata: hallway.id.startsWith("generated-hallway-")
              ? generatedHallwayOperationalMetadata()
              : null
          }
        : { ...existing, label: hallway.label, widthFeet: Math.min(hallway.widthFeet, hallway.heightFeet), points };
    }),
    nurseStations: source.nurseStations.map((station) => {
      const geometry = stationGeometryById.get(station.id);
      return geometry == null
        ? station
        : { ...station, label: geometry.label, x: geometry.xFeet, y: geometry.yFeet, widthFeet: geometry.widthFeet, lengthFeet: geometry.heightFeet };
    }),
    zones: source.zones.map((zone) => {
      const geometry = zoneGeometryById.get(zone.id);
      return geometry == null
        ? zone
        : { ...zone, label: geometry.label, x: geometry.xFeet, y: geometry.yFeet, widthFeet: geometry.widthFeet, lengthFeet: geometry.heightFeet };
    }),
    splitBays: editableLayout.splitBays ?? [],
    pathNodes,
    pathEdges: source.pathEdges.filter((edge) => pathNodeIds.has(edge.fromNodeId) && pathNodeIds.has(edge.toNodeId))
  });
}

export function validateSimulationReadyExport(input: {
  authoringDraft: AuthoringDraftContract;
  reviewedPathPlan?: PlanContract;
}): SimulationReadyExportResult {
  try {
    assertNoForbiddenSourcePayload(input, "simulationReadyExport");
  } catch {
    const draftId = typeof input.authoringDraft?.draftId === "string" ? input.authoringDraft.draftId : "unknown-draft";
    return blockedResult("blocked_private_source_payload", draftId, "unknown-plan", "blocked", null, [
      "Private source payload is not allowed in simulation-ready export."
    ]);
  }

  let draft: AuthoringDraftContract;
  let exportedPlan: PlanContract;
  try {
    draft = validateAuthoringDraftContract(input.authoringDraft);
    exportedPlan = input.reviewedPathPlan == null
      ? buildPlanContractFromEditableLayout({
          sourcePlan: draft.sourcePlan,
          editableLayout: draft.editableLayout,
          planId: draft.planId
        })
      : validatePlanContract(input.reviewedPathPlan);
  } catch (error) {
    const draftId = typeof input.authoringDraft?.draftId === "string" ? input.authoringDraft.draftId : "unknown-draft";
    const planId = typeof input.authoringDraft?.planId === "string" ? input.authoringDraft.planId : "unknown-plan";
    return blockedResult("blocked_invalid_geometry", draftId, planId, "blocked", null, [
      error instanceof Error ? error.message : String(error)
    ]);
  }

  const routeAccessSummary = auditPathSyncStatus({ authoringDraft: draft, plan: exportedPlan });
  if (draft.pathSyncStatus !== "fresh") {
    return {
      status: "blocked_path_sync",
      planId: draft.planId,
      sourceDraftId: draft.draftId,
      simulationReadyPlan: null,
      blockingIssues: routeAccessSummary.blockingIssues,
      warningIssues: routeAccessSummary.warningIssues,
      pathSyncStatus: draft.pathSyncStatus,
      routeAccessSummary,
      privateSourcePayloadStored: false,
      limitations: ["Simulation-ready export requires fresh or explicitly reviewed path sync."]
    };
  }
  if (!routeAccessSummary.simulationReady) {
    return {
      status: "draft_has_warnings",
      planId: draft.planId,
      sourceDraftId: draft.draftId,
      simulationReadyPlan: null,
      blockingIssues: routeAccessSummary.blockingIssues,
      warningIssues: routeAccessSummary.warningIssues,
      pathSyncStatus: draft.pathSyncStatus,
      routeAccessSummary,
      privateSourcePayloadStored: false,
      limitations: ["Draft can be saved with warnings, but simulation-ready export is blocked until route access passes."]
    };
  }
  return {
    status: "simulation_ready",
    planId: draft.planId,
    sourceDraftId: draft.draftId,
    simulationReadyPlan: exportedPlan,
    blockingIssues: [],
    warningIssues: routeAccessSummary.warningIssues,
    pathSyncStatus: draft.pathSyncStatus,
    routeAccessSummary,
    privateSourcePayloadStored: false,
    limitations: ["Simulation-ready validation confirms contract shape and route access only; no clinical safety claim is made."]
  };
}

function blockedResult(
  status: SimulationReadyExportStatus,
  sourceDraftId: string,
  planId: string,
  pathSyncStatus: AuthoringDraftContract["pathSyncStatus"],
  routeAccessSummary: PathSyncAuditResult | null,
  blockingIssues: string[]
): SimulationReadyExportResult {
  const fallbackSummary = routeAccessSummary ?? {
    pathSyncStatus,
    roomCount: 0,
    roomsWithDoorCount: 0,
    roomsWithPathNodeCount: 0,
    roomsMissingDoor: [],
    roomsMissingPathNode: [],
    unreachableRoomIds: [],
    blockingIssues: [],
    warningIssues: [],
    simulationReady: false,
    limitations: []
  };
  return {
    status,
    planId,
    sourceDraftId,
    simulationReadyPlan: null,
    blockingIssues,
    warningIssues: [],
    pathSyncStatus,
    routeAccessSummary: fallbackSummary,
    privateSourcePayloadStored: false,
    limitations: ["Simulation-ready export blocked by validation."]
  };
}

function generatedHallwayOperationalMetadata(): NonNullable<PlanContract["hallways"][number]["hallwayOperationalMetadata"]> {
  return {
    hallwayClass: "side",
    allowsBedMovement: false,
    allowsPublicTraffic: true,
    staffOnly: false,
    congestionLevel: "moderate",
    bottleneck: false,
    throughRoute: true
  };
}

function editableRoomToPlanRoom(room: EditableRoomGeometry): PlanContract["rooms"][number] {
  const roomType = authoringRoomTypeToPlanRoomType(editableRoomTypeToAuthoringRoomType(room.roomType));
  return {
    id: room.id,
    label: room.label,
    roomType,
    x: room.xFeet,
    y: room.yFeet,
    widthFeet: room.widthFeet,
    lengthFeet: room.heightFeet,
    maxPatients: room.capacityType === "double" ? 2 : 1,
    traumaCapable: roomType === "trauma",
    isolationCapable: roomType === "isolation",
    doorPoint: null,
    zoneId: null,
    nearestStationId: null,
    pathNodeId: null,
    roomOperationalMetadata: null,
    overflowOperationalMetadata: null,
    adjacencyOperationalMetadata: null
  };
}

function editableDoorToPlanDoor(
  door: EditableDoorGeometry,
  layout: EditableLayoutGeometryContract
): PlanContract["doors"][number] {
  const room = layout.rooms.find((candidate) => candidate.id === door.ownerId);
  if (room == null) {
    throw new Error(`door ${door.id} owner must reference an exported room`);
  }
  const position = doorPositionFeet(door, room);
  return {
    id: door.id,
    label: door.label,
    roomId: door.ownerId,
    x: position.x,
    y: position.y,
    widthFeet: door.widthFeet,
    pathNodeId: null,
    doorOperationalMetadata: null
  };
}

function doorPositionFeet(
  door: EditableDoorGeometry,
  room: EditableRoomGeometry
): { x: number; y: number } {
  switch (door.wall) {
    case "north":
      return { x: room.xFeet + door.offsetFeet + door.widthFeet / 2, y: room.yFeet };
    case "south":
      return { x: room.xFeet + door.offsetFeet + door.widthFeet / 2, y: room.yFeet + room.heightFeet };
    case "east":
      return { x: room.xFeet + room.widthFeet, y: room.yFeet + door.offsetFeet + door.widthFeet / 2 };
    case "west":
      return { x: room.xFeet, y: room.yFeet + door.offsetFeet + door.widthFeet / 2 };
  }
}
