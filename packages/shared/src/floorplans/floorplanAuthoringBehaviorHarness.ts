import { validateDefaultSavedPlanFixtureContract, type DefaultSavedPlanFixtureContract } from "../default-plans/defaultSavedPlanFixtureContract.js";
import {
  validateEditableLayoutGeometryContract,
  type EditableDoorGeometry,
  type EditableDoorWall,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry,
  type EditableRoomType,
  type EditableZoneGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import { validatePlanContract, type PlanContract } from "../contracts.js";
import { createDefaultPlanEditableCopy } from "./defaultPlanEditableCopy.js";
import {
  assertNoForbiddenSourcePayload,
  validateAuthoringDraftContract,
  type AuthoringDraftContract
} from "./authoringDraftContract.js";
import { validateSavedPlanRecordContract, type SavedPlanRecordContract } from "./savedPlanRecordContract.js";
import { addRoomToEditableLayout } from "./addRoomContract.js";
import { addDoorToRoom, moveDoor } from "./doorAuthoringContract.js";
import { generateAutoHallways } from "./autoHallwayGenerator.js";
import { generateAutoPodBorder } from "./autoPodBorder.js";
import { buildPlanContractFromEditableLayout, validateSimulationReadyExport } from "./simulationReadyExportContract.js";
import { auditPathSyncStatus } from "./pathSyncAudit.js";
import { generateDoorPathNodes } from "./doorPathNodeGenerator.js";

export type FloorplanAuthoringBehaviorHarnessOutput = {
  sourceDefaultPlanId: string;
  editableCopyId: string;
  savedPlanId: string;
  saveAsPlanId: string;
  reloadMatchedEditableLayout: boolean;
  roomTypeChanged: boolean;
  roomAdded: boolean;
  doorAdded: boolean;
  doorMoved: boolean;
  hallwayGenerated: boolean;
  podBorderGenerated: boolean;
  exportValidated: boolean;
  pathSyncStatus: AuthoringDraftContract["pathSyncStatus"];
  sourceDefaultUnchanged: boolean;
  privateSourcePayloadStored: boolean;
  details: {
    roomIdEdited: string;
    addedRoomId: string;
    addedDoorId: string;
    generatedHallwayCount: number;
    generatedPathNodeCount: number;
    generatedPathEdgeCount: number;
    simulationReadyExportStatus: string;
  };
};

const HARNESS_TIMESTAMP = "2026-05-25T00:00:00Z";

export function runFloorplanAuthoringBehaviorHarness(input: {
  defaultFixture: DefaultSavedPlanFixtureContract;
  editablePlanId?: string;
  displayName?: string;
  versionLabel?: string;
}): FloorplanAuthoringBehaviorHarnessOutput {
  const fixture = validateDefaultSavedPlanFixtureContract(input.defaultFixture);
  const beforeDefault = stableJson(fixture);
  const editableLayout = planContractToEditableLayoutGeometry(fixture.plan);
  const editableCopyId = input.editablePlanId ?? `${fixture.plan.planId}-authoring-copy`;
  const copy = createDefaultPlanEditableCopy({
    defaultFixture: fixture,
    editablePlanId: editableCopyId,
    displayName: input.displayName ?? `${fixture.plan.name} Authoring Copy`,
    versionLabel: input.versionLabel ?? "v1-authoring-proof",
    createdAt: HARNESS_TIMESTAMP,
    editableLayout
  });

  const saved = saveDraftRecord({
    savedPlanId: `saved-${editableCopyId}-001`,
    saveKind: "default_duplicate",
    draft: copy.authoringDraft
  });
  const initialReload = reloadDraft(saved);

  const firstRoom = requireFirstRoom(initialReload.editableLayout);
  const changedType = firstRoom.roomType === "trauma" ? "procedure" : "trauma";
  const roomTypeLayout = validateEditableLayoutGeometryContract({
    ...initialReload.editableLayout,
    rooms: initialReload.editableLayout.rooms.map((room) =>
      room.id === firstRoom.id
        ? { ...room, roomType: changedType, isTraumaAdjacent: changedType === "trauma" }
        : room
    )
  });
  const boundsFeet = boundsForLayout(roomTypeLayout, 48);
  const addRoomResult = addRoomToEditableLayout({
    layout: roomTypeLayout,
    readOnly: false,
    roomId: "room-authoring-proof-added",
    label: "Room Authoring Proof Added",
    roomType: "patient_room",
    xFeet: boundsFeet.xFeet + boundsFeet.widthFeet - 28,
    yFeet: boundsFeet.yFeet + boundsFeet.heightFeet - 24,
    widthFeet: 12,
    heightFeet: 10,
    boundsFeet
  });
  const addedDoor = addDoorToRoom({
    layout: addRoomResult.layout,
    readOnly: false,
    doorId: "door-authoring-proof-added",
    roomId: addRoomResult.selectedRoomId,
    wall: "north",
    offsetFeet: 2,
    widthFeet: 3
  });
  const movedDoor = moveDoor({
    layout: addedDoor.layout,
    readOnly: false,
    doorId: "door-authoring-proof-added",
    wall: "north",
    offsetFeet: 4
  });
  const hallway = generateAutoHallways({
    layout: movedDoor.layout,
    sourcePlanId: editableCopyId,
    readOnly: false,
    boundsFeet,
    generationMethod: "grid_subtraction",
    gridCellSizeFeet: 4
  });
  const manualHallways = movedDoor.layout.hallways.filter((candidate) =>
    hallway.preservedManualHallwayIds.includes(candidate.id)
  );
  const hallwayLayout = validateEditableLayoutGeometryContract({
    ...movedDoor.layout,
    hallways: [...manualHallways, ...hallway.generatedHallwayZones]
  });
  const podBorder = generateAutoPodBorder({
    layout: hallwayLayout,
    sourcePlanId: editableCopyId,
    paddingFeet: 4
  });
  const editedDraft = updateDraft(copy.authoringDraft, {
    editableLayout: hallwayLayout,
    pathSyncStatus: movedDoor.pathSyncStatus,
    authoringStatus: "draft_has_warnings",
    authoringWarnings: [
      ...addRoomResult.warnings,
      movedDoor.warning,
      "Generated hallway/public space and pod border require manual route review."
    ]
  });
  const manualSave = saveDraftRecord({
    savedPlanId: saved.savedPlanId,
    saveKind: "manual_save",
    draft: editedDraft,
    createdAt: saved.createdAt
  });
  const reloadedEdited = reloadDraft(manualSave);
  const saveAs = saveDraftRecord({
    savedPlanId: `saved-${editableCopyId}-002`,
    saveKind: "save_as",
    draft: updateDraft(reloadedEdited, {
      displayName: `${reloadedEdited.displayName} Save As`,
      versionLabel: "v2-authoring-proof"
    })
  });
  const exportedPlan = buildPlanContractFromEditableLayout({
    sourcePlan: reloadedEdited.sourcePlan,
    editableLayout: reloadedEdited.editableLayout,
    planId: reloadedEdited.planId
  });
  const pathGeneration = generateDoorPathNodes({
    sourcePlan: exportedPlan,
    editableLayout: reloadedEdited.editableLayout,
    replaceGenerated: true
  });
  const audit = auditPathSyncStatus({ authoringDraft: reloadedEdited, plan: exportedPlan });
  const simulationReadyExport = validateSimulationReadyExport({ authoringDraft: reloadedEdited });
  const sourceDefaultUnchanged = stableJson(fixture) === beforeDefault;
  const privateSourcePayloadStored = hasPrivateSourcePayload([saved, manualSave, saveAs, reloadedEdited]);

  return {
    sourceDefaultPlanId: fixture.plan.planId,
    editableCopyId,
    savedPlanId: manualSave.savedPlanId,
    saveAsPlanId: saveAs.savedPlanId,
    reloadMatchedEditableLayout: stableJson(reloadedEdited.editableLayout) === stableJson(editedDraft.editableLayout),
    roomTypeChanged: reloadedEdited.editableLayout.rooms.some(
      (room) => room.id === firstRoom.id && room.roomType === changedType
    ),
    roomAdded: reloadedEdited.editableLayout.rooms.some((room) => room.id === addRoomResult.selectedRoomId),
    doorAdded: reloadedEdited.editableLayout.doors.some((door) => door.id === "door-authoring-proof-added"),
    doorMoved: reloadedEdited.editableLayout.doors.some(
      (door) => door.id === "door-authoring-proof-added" && door.offsetFeet === 4
    ),
    hallwayGenerated: hallway.generatedHallwayZones.length > 0,
    podBorderGenerated: podBorder.generatedFromObjectIds.length > 0,
    exportValidated: validatePlanContract(exportedPlan).planId === reloadedEdited.planId,
    pathSyncStatus: audit.pathSyncStatus,
    sourceDefaultUnchanged,
    privateSourcePayloadStored,
    details: {
      roomIdEdited: firstRoom.id,
      addedRoomId: addRoomResult.selectedRoomId,
      addedDoorId: "door-authoring-proof-added",
      generatedHallwayCount: hallway.generatedHallwayZones.length,
      generatedPathNodeCount: pathGeneration.generatedNodes.length,
      generatedPathEdgeCount: pathGeneration.generatedEdgeIds.length,
      simulationReadyExportStatus: simulationReadyExport.status
    }
  };
}

export function planContractToEditableLayoutGeometry(planValue: PlanContract): EditableLayoutGeometryContract {
  const plan = validatePlanContract(planValue);
  return validateEditableLayoutGeometryContract({
    schemaVersion: "1.0.0",
    layoutId: plan.planId,
    units: "feet",
    rooms: plan.rooms.map(planRoomToEditableRoom),
    doors: plan.doors.flatMap((door) => {
      const room = plan.rooms.find((candidate) => candidate.id === door.roomId);
      return room == null ? [] : [planDoorToEditableDoor(door, room)];
    }),
    stations: plan.nurseStations.map((station) => ({
      objectType: "station",
      id: station.id,
      label: station.label,
      stationType: "nurse_station",
      xFeet: station.x,
      yFeet: station.y,
      widthFeet: station.widthFeet,
      heightFeet: station.lengthFeet
    })),
    hallways: plan.hallways.map((hallway) => {
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
    }),
    zones: plan.zones.map(planZoneToEditableZone),
    limitations: [
      "Editable geometry is derived from validated JSON floorplan data; source plan metadata and path graph remain attached to editor state."
    ]
  });
}

function saveDraftRecord(input: {
  savedPlanId: string;
  saveKind: SavedPlanRecordContract["saveKind"];
  draft: AuthoringDraftContract;
  createdAt?: string;
}): SavedPlanRecordContract {
  const draft = validateAuthoringDraftContract(input.draft);
  return validateSavedPlanRecordContract({
    savedPlanId: input.savedPlanId,
    sourceDefaultPlanId: draft.sourceDefaultPlanId,
    planId: draft.planId,
    displayName: draft.displayName,
    versionLabel: draft.versionLabel,
    createdAt: input.createdAt ?? draft.createdAt,
    updatedAt: draft.updatedAt,
    saveKind: input.saveKind,
    authoringDraft: draft,
    sourceProvenance: draft.sourceProvenance,
    syntheticDataOnly: true
  });
}

function reloadDraft(record: SavedPlanRecordContract): AuthoringDraftContract {
  return validateAuthoringDraftContract(JSON.parse(JSON.stringify(record.authoringDraft)));
}

function updateDraft(
  draft: AuthoringDraftContract,
  patch: Partial<Omit<AuthoringDraftContract, "sourceProvenance" | "sourcePlan" | "syntheticDataOnly" | "createdAt">>
): AuthoringDraftContract {
  return validateAuthoringDraftContract({
    ...draft,
    ...patch,
    updatedAt: HARNESS_TIMESTAMP
  });
}

function planRoomToEditableRoom(room: PlanContract["rooms"][number]): EditableRoomGeometry {
  const roomType = mapEditableRoomType(room.roomType);
  return {
    objectType: "room",
    id: room.id,
    label: room.label,
    roomNumber: room.roomOperationalMetadata?.roomNumber ?? room.label,
    roomType,
    capacityType: room.roomType === "hall_bed" ? "hall" : room.maxPatients > 1 ? "double" : room.roomType === "overflow" ? "flex" : "single",
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
  const offsetFeet = Math.min(Math.max(coordinate - wallStart - door.widthFeet / 2, 0), Math.max(0, wallLength - door.widthFeet));
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

function planZoneToEditableZone(zone: PlanContract["zones"][number]): EditableZoneGeometry {
  return {
    objectType: "zone",
    id: zone.id,
    label: zone.label,
    zoneType: zone.zoneType === "ems_entry" || zone.zoneType === "ambulance_entry"
      ? "ems_entry"
      : zone.zoneType === "trauma_zone"
        ? "trauma"
        : "provider_pharmacy",
    xFeet: zone.x,
    yFeet: zone.y,
    widthFeet: zone.widthFeet,
    heightFeet: zone.lengthFeet
  };
}

function deriveDoorWall(
  door: PlanContract["doors"][number],
  room: PlanContract["rooms"][number]
): EditableDoorWall {
  const nearest = [
    { wall: "north" as const, distance: Math.abs(door.y - room.y) },
    { wall: "south" as const, distance: Math.abs(door.y - (room.y + room.lengthFeet)) },
    { wall: "west" as const, distance: Math.abs(door.x - room.x) },
    { wall: "east" as const, distance: Math.abs(door.x - (room.x + room.widthFeet)) }
  ].sort((left, right) => left.distance - right.distance)[0];
  if (nearest == null) {
    throw new Error(`door ${door.id} could not be mapped to a room wall`);
  }
  return nearest.wall;
}

function mapEditableRoomType(roomType: PlanContract["rooms"][number]["roomType"]): EditableRoomType {
  return roomType === "psych" ? "behavioral" : roomType;
}

function requireFirstRoom(layout: EditableLayoutGeometryContract): EditableRoomGeometry {
  const room = layout.rooms[0];
  if (room == null) {
    throw new Error("authoring harness requires at least one room");
  }
  return room;
}

function boundsForLayout(layout: EditableLayoutGeometryContract, paddingFeet: number) {
  const objects = [...layout.rooms, ...layout.stations, ...layout.hallways, ...layout.zones];
  const minX = 0;
  const minY = 0;
  const maxX = Math.max(...objects.map((object) => object.xFeet + object.widthFeet)) + paddingFeet;
  const maxY = Math.max(...objects.map((object) => object.yFeet + object.heightFeet)) + paddingFeet;
  return {
    xFeet: minX,
    yFeet: minY,
    widthFeet: maxX - minX,
    heightFeet: maxY - minY
  };
}

function hasPrivateSourcePayload(values: unknown[]): boolean {
  try {
    for (const value of values) {
      assertNoForbiddenSourcePayload(value, "authoringHarness");
    }
    return false;
  } catch {
    return true;
  }
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}
