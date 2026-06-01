import {
  validateEditableLayoutGeometryContract,
  validatePlanContract,
  type EditableDoorGeometry,
  type EditableHallwayGeometry,
  type EditableLayoutGeometryContract,
  type EditableRoomCapacityType,
  type EditableRoomGeometry,
  type EditableRoomType,
  type EditableStationGeometry,
  type EditableZoneGeometry,
  type PlanContract
} from "@nerdeus/shared";

import type { LayoutViewportTransform } from "./layoutCoordinateSystem";
import type { LayoutEditAuditEntry } from "./layoutEditAuditTrail";
import {
  createLayoutUndoRedoHistory,
  type LayoutUndoRedoHistory
} from "./layoutUndoRedoHistory";
import {
  validateLayoutValidationWarning,
  type LayoutEditorValidationWarning
} from "./layoutValidationWarningContract";
import {
  normalizeBoundsFeet,
  type LayoutBoundsFeet
} from "./layoutMoveValidation";
import { DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET } from "./layoutWorkspaceConfig";
import {
  isLayoutSelectionObjectType,
  LAYOUT_SELECTION_OBJECT_TYPES,
  type LayoutSelectionObjectType
} from "./layoutSelectionModel";

export const LAYOUT_EDITOR_SELECTABLE_OBJECT_TYPES = LAYOUT_SELECTION_OBJECT_TYPES;

export const LAYOUT_EDITOR_SNAP_MODES = ["default", "fine"] as const;

export type LayoutEditorSelectableObjectType = LayoutSelectionObjectType;

export type LayoutEditorSnapMode = (typeof LAYOUT_EDITOR_SNAP_MODES)[number];

export type LayoutEditorViewport = Required<LayoutViewportTransform>;

export type { LayoutEditorValidationWarning } from "./layoutValidationWarningContract";

export type LayoutEditorFloorplanInput = {
  recordId: string;
  planId: string;
  name: string;
  sourceKind: "default-json" | "saved-json" | "review-candidate-json";
  readOnly: boolean;
  parentDefaultPlanId: string | null;
  plan: PlanContract;
};

export type LayoutEditorLoadedFloorplan = {
  recordId: string;
  planId: string;
  name: string;
  sourceKind: "default-json" | "saved-json" | "review-candidate-json";
  readOnly: boolean;
  parentDefaultPlanId: string | null;
};

export type LayoutEditorState = {
  editableLayout: EditableLayoutGeometryContract | null;
  sourcePlan: PlanContract | null;
  loadedFloorplan: LayoutEditorLoadedFloorplan | null;
  readOnly: boolean;
  selectedObjectId: string | null;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  viewport: LayoutEditorViewport;
  layoutBoundsFeet: LayoutBoundsFeet;
  snapMode: LayoutEditorSnapMode;
  validationWarnings: readonly LayoutEditorValidationWarning[];
  editAuditTrail: readonly LayoutEditAuditEntry[];
  isDirty: boolean;
  history: LayoutUndoRedoHistory;
};

export const DEFAULT_LAYOUT_EDITOR_VIEWPORT: LayoutEditorViewport = {
  pixelsPerFoot: 12,
  zoom: 1,
  panXFeet: 0,
  panYFeet: 0
};

export function createLayoutEditorState(
  overrides: Partial<LayoutEditorState> = {}
): LayoutEditorState {
  const selectedObjectId = overrides.selectedObjectId ?? null;
  const selectedObjectType = overrides.selectedObjectType ?? null;
  if ((selectedObjectId == null) !== (selectedObjectType == null)) {
    throw new Error("selectedObjectId and selectedObjectType must both be set or both be null");
  }
  if (selectedObjectType != null && !isLayoutEditorSelectableObjectType(selectedObjectType)) {
    throw new Error("selectedObjectType must be room, door, support_access, station, hallway, zone, perimeter_wall, entry_exit, split_room_parent, bed_position, outer_wall, or split_bay");
  }

  const snapMode = overrides.snapMode ?? "default";
  if (!isLayoutEditorSnapMode(snapMode)) {
    throw new Error("snapMode must be default or fine");
  }

  return {
    editableLayout: overrides.editableLayout ?? null,
    sourcePlan: overrides.sourcePlan == null ? null : clonePlan(overrides.sourcePlan),
    loadedFloorplan: overrides.loadedFloorplan == null ? null : { ...overrides.loadedFloorplan },
    readOnly: overrides.readOnly ?? false,
    selectedObjectId,
    selectedObjectType,
    viewport: normalizeLayoutEditorViewport(overrides.viewport ?? DEFAULT_LAYOUT_EDITOR_VIEWPORT),
    layoutBoundsFeet: normalizeBoundsFeet(
      overrides.layoutBoundsFeet ?? DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET
    ),
    snapMode,
    validationWarnings: (overrides.validationWarnings ?? []).map(validateLayoutValidationWarning),
    editAuditTrail: [...(overrides.editAuditTrail ?? [])],
    isDirty: overrides.isDirty ?? false,
    history: overrides.history ?? createLayoutUndoRedoHistory()
  };
}

export function createLayoutEditorStateFromFloorplan(
  floorplan: LayoutEditorFloorplanInput,
  overrides: Partial<LayoutEditorState> = {}
): LayoutEditorState {
  const plan = validatePlanContract(floorplan.plan);
  const editableLayout = planContractToEditableLayoutGeometry(plan);
  const firstRoom = editableLayout.rooms[0];

  return createLayoutEditorState({
    ...overrides,
    editableLayout,
    sourcePlan: plan,
    loadedFloorplan: {
      recordId: floorplan.recordId,
      planId: floorplan.planId,
      name: floorplan.name,
      sourceKind: floorplan.sourceKind,
      readOnly: floorplan.readOnly,
      parentDefaultPlanId: floorplan.parentDefaultPlanId
    },
    readOnly: floorplan.readOnly,
    selectedObjectType: firstRoom == null ? null : "room",
    selectedObjectId: firstRoom?.id ?? null,
    validationWarnings: [],
    editAuditTrail: [],
    isDirty: false,
    history: createLayoutUndoRedoHistory(overrides.history?.maxDepth)
  });
}

export function planContractToEditableLayoutGeometry(
  planValue: PlanContract
): EditableLayoutGeometryContract {
  const plan = validatePlanContract(planValue);
  const layout = {
    schemaVersion: "1.0.0" as const,
    layoutId: plan.planId,
    units: "feet" as const,
    rooms: plan.rooms.map(planRoomToEditableRoom),
    doors: plan.doors.flatMap((door) => {
      const room = plan.rooms.find((candidate) => candidate.id === door.roomId);
      return room == null ? [] : [planDoorToEditableDoor(door, room)];
    }),
    supportAccessPoints: plan.supportAccessPoints ?? [],
    stations: plan.nurseStations.map(planStationToEditableStation),
    hallways: plan.hallways.map(planHallwayToEditableHallway),
    zones: plan.zones.map(planZoneToEditableZone),
    perimeterWalls: plan.perimeterWalls != null && plan.perimeterWalls.length > 0
      ? plan.perimeterWalls
      : deriveDefaultPerimeterWalls(plan),
    entryExits: plan.entryExits != null && plan.entryExits.length > 0
      ? plan.entryExits
      : deriveDefaultEntryExits(plan),
    doorDestinations: plan.doorDestinations != null && plan.doorDestinations.length > 0
      ? plan.doorDestinations
      : [
      ...plan.doors.map((door) => ({
        doorId: door.id,
        ownerKind: "room" as const,
        ownerId: door.roomId,
        leadsToKind: plan.hallways[0] == null ? "unknown" as const : "hallway" as const,
        ...(plan.hallways[0] == null ? {} : { leadsToId: plan.hallways[0].id }),
        leadsToLabel: plan.hallways[0]?.label ?? "Unknown destination",
        travelRole: "patient_flow" as const
      })),
      ...(plan.supportAccessPoints ?? []).map((accessPoint) => ({
        doorId: accessPoint.id,
        ownerKind: "zone" as const,
        ownerId: accessPoint.ownerId,
        leadsToKind: plan.hallways[0] == null ? "unknown" as const : "hallway" as const,
        ...(plan.hallways[0] == null ? {} : { leadsToId: plan.hallways[0].id }),
        leadsToLabel: plan.hallways[0]?.label ?? "Unknown destination",
        travelRole: "supply_flow" as const
      }))
    ].filter((destination) =>
        plan.rooms.some((room) => room.id === destination.ownerId) ||
        plan.zones.some((zone) => zone.id === destination.ownerId)
      ),
    splitRooms: plan.splitRooms ?? [],
    splitBays: plan.splitBays ?? [],
    limitations: [
      "Editable geometry is derived from validated JSON floorplan data; source plan metadata and path graph remain attached to editor state."
    ]
  };
  return validateEditableLayoutGeometryContract(layout);
}

export function normalizeLayoutEditorViewport(
  viewport: LayoutViewportTransform
): LayoutEditorViewport {
  return {
    pixelsPerFoot: requirePositive(viewport.pixelsPerFoot, "viewport.pixelsPerFoot"),
    zoom: requirePositive(viewport.zoom, "viewport.zoom"),
    panXFeet: requireFinite(viewport.panXFeet ?? 0, "viewport.panXFeet"),
    panYFeet: requireFinite(viewport.panYFeet ?? 0, "viewport.panYFeet")
  };
}

export function isLayoutEditorSnapMode(value: unknown): value is LayoutEditorSnapMode {
  return typeof value === "string" && LAYOUT_EDITOR_SNAP_MODES.includes(value as LayoutEditorSnapMode);
}

export function isLayoutEditorSelectableObjectType(
  value: unknown
): value is LayoutEditorSelectableObjectType {
  return isLayoutSelectionObjectType(value);
}

function requirePositive(value: number, label: string): number {
  const finite = requireFinite(value, label);
  if (finite <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return finite;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function planRoomToEditableRoom(room: PlanContract["rooms"][number]): EditableRoomGeometry {
  return {
    objectType: "room",
    id: room.id,
    label: room.label,
    roomNumber: room.roomOperationalMetadata?.roomNumber ?? room.label,
    roomType: mapEditableRoomType(room.roomType),
    capacityType: mapEditableCapacityType(room),
    isHallBed: room.roomType === "hall_bed",
    isTraumaAdjacent: room.roomOperationalMetadata?.traumaAdjacent ?? room.traumaCapable,
    xFeet: room.x,
    yFeet: room.y,
    widthFeet: room.widthFeet,
    heightFeet: room.lengthFeet
  };
}

function planDoorToEditableDoor(
  door: PlanContract["doors"][number],
  room: PlanContract["rooms"][number]
): EditableDoorGeometry {
  const wall = deriveDoorWall(door, room);
  const wallStart = wall === "north" || wall === "south" ? room.x : room.y;
  const wallLength = wall === "north" || wall === "south" ? room.widthFeet : room.lengthFeet;
  const coordinate = wall === "north" || wall === "south" ? door.x : door.y;
  const offsetFeet = clamp(coordinate - wallStart - door.widthFeet / 2, 0, wallLength - door.widthFeet);
  return {
    objectType: "door",
    id: door.id,
    label: door.label,
    ownerKind: "room",
    ownerId: room.id,
    wall,
    offsetFeet,
    widthFeet: door.widthFeet
  };
}

function planStationToEditableStation(
  station: PlanContract["nurseStations"][number]
): EditableStationGeometry {
  return {
    objectType: "station",
    id: station.id,
    label: station.label,
    stationType: "nurse_station",
    xFeet: station.x,
    yFeet: station.y,
    widthFeet: station.widthFeet,
    heightFeet: station.lengthFeet
  };
}

function planHallwayToEditableHallway(
  hallway: PlanContract["hallways"][number]
): EditableHallwayGeometry {
  const xs = hallway.points.map((point) => point.x);
  const ys = hallway.points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    objectType: "hallway",
    id: hallway.id,
    label: hallway.label,
    xFeet: minX,
    yFeet: minY,
    widthFeet: Math.max(maxX - minX, hallway.widthFeet),
    heightFeet: Math.max(maxY - minY, hallway.widthFeet)
  };
}

function planZoneToEditableZone(zone: PlanContract["zones"][number]): EditableZoneGeometry {
  return {
    objectType: "zone",
    id: zone.id,
    label: mapEditableZoneLabel(zone),
    zoneType: mapEditableZoneType(zone.zoneType),
    xFeet: zone.x,
    yFeet: zone.y,
    widthFeet: zone.widthFeet,
    heightFeet: zone.lengthFeet
  };
}

function deriveDefaultPerimeterWalls(plan: PlanContract): NonNullable<PlanContract["perimeterWalls"]> {
  const rects = [
    ...plan.rooms.map((room) => ({
      x: room.x,
      y: room.y,
      widthFeet: room.widthFeet,
      lengthFeet: room.lengthFeet
    })),
    ...plan.nurseStations.map((station) => ({
      x: station.x,
      y: station.y,
      widthFeet: station.widthFeet,
      lengthFeet: station.lengthFeet
    })),
    ...plan.zones.map((zone) => ({
      x: zone.x,
      y: zone.y,
      widthFeet: zone.widthFeet,
      lengthFeet: zone.lengthFeet
    })),
    ...plan.hallways.map((hallway) => {
      const xs = hallway.points.map((point) => point.x);
      const ys = hallway.points.map((point) => point.y);
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        widthFeet: Math.max(Math.max(...xs) - Math.min(...xs), hallway.widthFeet),
        lengthFeet: Math.max(Math.max(...ys) - Math.min(...ys), hallway.widthFeet)
      };
    })
  ];
  if (rects.length === 0) {
    return [];
  }
  const minX = Math.min(...rects.map((rect) => rect.x)) - 2;
  const minY = Math.min(...rects.map((rect) => rect.y)) - 2;
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.widthFeet)) + 2;
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.lengthFeet)) + 2;
  const thickness = 0.5;
  return [
    {
      perimeterWallId: `${plan.planId}-perimeter-wall`,
      label: "ER pod boundary",
      segments: [
        {
          segmentId: `${plan.planId}-perimeter-wall-north`,
          label: "North boundary",
          xFeet: minX,
          yFeet: minY,
          widthFeet: maxX - minX,
          heightFeet: thickness,
          orientation: "horizontal",
          blocksTravel: true,
          locked: true
        },
        {
          segmentId: `${plan.planId}-perimeter-wall-east`,
          label: "East boundary",
          xFeet: maxX,
          yFeet: minY,
          widthFeet: thickness,
          heightFeet: maxY - minY,
          orientation: "vertical",
          blocksTravel: true,
          locked: true
        },
        {
          segmentId: `${plan.planId}-perimeter-wall-south`,
          label: "South boundary",
          xFeet: minX,
          yFeet: maxY,
          widthFeet: maxX - minX,
          heightFeet: thickness,
          orientation: "horizontal",
          blocksTravel: true,
          locked: true
        },
        {
          segmentId: `${plan.planId}-perimeter-wall-west`,
          label: "West boundary",
          xFeet: minX,
          yFeet: minY,
          widthFeet: thickness,
          heightFeet: maxY - minY,
          orientation: "vertical",
          blocksTravel: true,
          locked: true
        }
      ]
    }
  ];
}

function deriveDefaultEntryExits(plan: PlanContract): NonNullable<PlanContract["entryExits"]> {
  const hallway = plan.hallways[0];
  if (hallway == null) {
    return [];
  }
  const xs = hallway.points.map((point) => point.x);
  const ys = hallway.points.map((point) => point.y);
  return [
    {
      entryExitId: `${plan.planId}-main-entry`,
      label: "Main entry",
      kind: "main_entry",
      xFeet: Math.min(...xs),
      yFeet: Math.min(...ys),
      widthFeet: Math.max(4, hallway.widthFeet),
      heightFeet: Math.max(2, hallway.widthFeet / 2),
      connectsFromId: hallway.id,
      connectsTo: {
        destinationKind: "hallway",
        destinationId: hallway.id,
        displayLabel: hallway.label
      },
      blocksTravel: false
    },
    {
      entryExitId: `${plan.planId}-external-exit`,
      label: "External exit",
      kind: "external_exit",
      xFeet: Math.max(...xs),
      yFeet: Math.max(...ys),
      widthFeet: Math.max(2, hallway.widthFeet / 2),
      heightFeet: Math.max(4, hallway.widthFeet),
      connectsTo: {
        destinationKind: "external",
        displayLabel: "External exit"
      },
      blocksTravel: false
    }
  ];
}

function mapEditableZoneLabel(zone: PlanContract["zones"][number]): string {
  if (zone.id === "zone-provider-pharmacy") {
    return "Provider Pharmacy";
  }
  return zone.label;
}

function mapEditableRoomType(roomType: PlanContract["rooms"][number]["roomType"]): EditableRoomType {
  switch (roomType) {
    case "psych":
      return "behavioral";
    default:
      return roomType;
  }
}

function mapEditableCapacityType(room: PlanContract["rooms"][number]): EditableRoomCapacityType {
  if (room.roomType === "hall_bed") {
    return "hall";
  }
  if (room.maxPatients > 1) {
    return "double";
  }
  if (room.roomType === "overflow") {
    return "flex";
  }
  return "single";
}

function mapEditableZoneType(zoneType: PlanContract["zones"][number]["zoneType"]): EditableZoneGeometry["zoneType"] {
  switch (zoneType) {
    case "ems_entry":
    case "ambulance_entry":
      return "ems_entry";
    case "trauma_zone":
      return "trauma";
    case "pharmacy":
    case "medication_room":
      return "provider_pharmacy";
    default:
      return "operational";
  }
}

function deriveDoorWall(
  door: PlanContract["doors"][number],
  room: PlanContract["rooms"][number]
): EditableDoorGeometry["wall"] {
  const distances = [
    { wall: "north" as const, distance: Math.abs(door.y - room.y) },
    { wall: "south" as const, distance: Math.abs(door.y - (room.y + room.lengthFeet)) },
    { wall: "west" as const, distance: Math.abs(door.x - room.x) },
    { wall: "east" as const, distance: Math.abs(door.x - (room.x + room.widthFeet)) }
  ];
  const nearestWall = distances.sort((left, right) => left.distance - right.distance)[0];
  if (nearestWall == null) {
    throw new Error(`door ${door.id} could not be mapped to a room wall`);
  }
  return nearestWall.wall;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function clonePlan(plan: PlanContract): PlanContract {
  return JSON.parse(JSON.stringify(plan)) as PlanContract;
}
