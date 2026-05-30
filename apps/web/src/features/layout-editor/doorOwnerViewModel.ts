import {
  isPatientCareRoomType,
  type EditableDoorGeometry,
  type EditableHallwayGeometry,
  type EditableRoomGeometry,
  type EditableRoomType,
  type EditableSupportAccessPointGeometry,
  type EditableZoneGeometry
} from "@nerdeus/shared";

export type DoorOwnerViewModel =
  | {
      status: "room";
      roomId: string;
      roomLabel: string;
      roomType: EditableRoomType;
      doorEligible: boolean;
    }
  | {
      status: "hallway";
      hallwayId: string;
      hallwayLabel: string;
    }
  | {
      status: "support_access";
      zoneId: string;
      zoneLabel: string;
    }
  | {
      status: "missing";
      ownerId: string;
      warning: string;
    }
  | {
      status: "invalid";
      ownerId: string;
      warning: string;
    };

export function buildDoorOwnerViewModel(input: {
  door?: EditableDoorGeometry | null;
  accessPoint?: EditableSupportAccessPointGeometry | null;
  rooms?: readonly EditableRoomGeometry[];
  hallways?: readonly EditableHallwayGeometry[];
  zones?: readonly EditableZoneGeometry[];
}): DoorOwnerViewModel | null {
  if (input.accessPoint != null) {
    return supportAccessOwnerViewModel(input.accessPoint, input.zones ?? []);
  }
  if (input.door == null) {
    return null;
  }
  const ownerKind = (input.door as { ownerKind?: string }).ownerKind;
  if (ownerKind === "room") {
    return roomOwnerViewModel(input.door, input.rooms ?? []);
  }
  if (ownerKind === "hallway") {
    return hallwayOwnerViewModel(input.door, input.hallways ?? []);
  }
  return {
    status: "invalid",
    ownerId: input.door.ownerId,
    warning: "Door owner kind is not supported by the layout editor."
  };
}

export function doorOwnerDisplayLabel(owner: DoorOwnerViewModel | null): string {
  if (owner == null) {
    return "No owner";
  }
  switch (owner.status) {
    case "room":
      return owner.roomLabel;
    case "hallway":
      return owner.hallwayLabel;
    case "support_access":
      return owner.zoneLabel;
    case "missing":
    case "invalid":
      return owner.ownerId;
  }
}

export function doorOwnerKindLabel(owner: DoorOwnerViewModel | null): string {
  if (owner == null) {
    return "Owner";
  }
  switch (owner.status) {
    case "room":
      return "Owner room";
    case "hallway":
      return "Owner hallway";
    case "support_access":
      return "Support access zone";
    case "missing":
      return "Missing owner";
    case "invalid":
      return "Invalid owner";
  }
}

export function doorOwnerWarning(owner: DoorOwnerViewModel | null): string | null {
  return owner?.status === "missing" || owner?.status === "invalid" ? owner.warning : null;
}

function roomOwnerViewModel(
  door: EditableDoorGeometry,
  rooms: readonly EditableRoomGeometry[]
): DoorOwnerViewModel {
  const room = rooms.find((candidate) => candidate.id === door.ownerId) ?? null;
  if (room == null) {
    return {
      status: "missing",
      ownerId: door.ownerId,
      warning: "Door owner room is missing from the editable layout."
    };
  }
  const doorEligible = isPatientCareRoomType(room.roomType);
  if (!doorEligible) {
    return {
      status: "invalid",
      ownerId: door.ownerId,
      warning: invalidRoomOwnerWarning(room.roomType)
    };
  }
  return {
    status: "room",
    roomId: room.id,
    roomLabel: room.label,
    roomType: room.roomType,
    doorEligible
  };
}

function invalidRoomOwnerWarning(roomType: EditableRoomType): string {
  switch (roomType) {
    case "solid_wall":
      return "Solid wall / blocked area cannot accept doors.";
    case "storage":
      return "Storage/support-only rooms use non-patient access workflows.";
    case "provider_pharmacy":
      return "Provider/pharmacy areas use support access point tooling.";
    default:
      return "Selected owner cannot use patient-room door controls.";
  }
}

function hallwayOwnerViewModel(
  door: EditableDoorGeometry,
  hallways: readonly EditableHallwayGeometry[]
): DoorOwnerViewModel {
  const hallway = hallways.find((candidate) => candidate.id === door.ownerId) ?? null;
  if (hallway == null) {
    return {
      status: "missing",
      ownerId: door.ownerId,
      warning: "Door owner hallway is missing from the editable layout."
    };
  }
  return {
    status: "hallway",
    hallwayId: hallway.id,
    hallwayLabel: hallway.label
  };
}

function supportAccessOwnerViewModel(
  accessPoint: EditableSupportAccessPointGeometry,
  zones: readonly EditableZoneGeometry[]
): DoorOwnerViewModel {
  const ownerKind = (accessPoint as { ownerKind?: string }).ownerKind;
  if (ownerKind !== "zone") {
    return {
      status: "invalid",
      ownerId: accessPoint.ownerId,
      warning: "Support access owner kind must reference a zone."
    };
  }
  const zone = zones.find((candidate) => candidate.id === accessPoint.ownerId) ?? null;
  if (zone == null) {
    return {
      status: "missing",
      ownerId: accessPoint.ownerId,
      warning: "Support access owner zone is missing from the editable layout."
    };
  }
  return {
    status: "support_access",
    zoneId: zone.id,
    zoneLabel: zone.label
  };
}
