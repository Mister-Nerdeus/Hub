export const DOOR_DESTINATION_OWNER_KINDS = ["room", "hallway", "zone", "entry_exit"] as const;
export const DOOR_DESTINATION_LEADS_TO_KINDS = [
  "hallway",
  "room",
  "zone",
  "entry_exit",
  "external",
  "unknown"
] as const;
export const DOOR_DESTINATION_TRAVEL_ROLES = [
  "patient_flow",
  "staff_flow",
  "ems_flow",
  "supply_flow",
  "unknown"
] as const;

export type DoorDestinationOwnerKind = (typeof DOOR_DESTINATION_OWNER_KINDS)[number];
export type DoorDestinationLeadsToKind = (typeof DOOR_DESTINATION_LEADS_TO_KINDS)[number];
export type DoorDestinationTravelRole = (typeof DOOR_DESTINATION_TRAVEL_ROLES)[number];

export type DoorDestinationContract = {
  doorId: string;
  ownerKind: DoorDestinationOwnerKind;
  ownerId: string;
  leadsToKind: DoorDestinationLeadsToKind;
  leadsToId?: string;
  leadsToLabel: string;
  travelRole: DoorDestinationTravelRole;
};

export function createUnknownDoorDestination(input: {
  doorId: string;
  ownerKind: DoorDestinationOwnerKind;
  ownerId: string;
  leadsToLabel?: string;
}): DoorDestinationContract {
  return validateDoorDestinationContract({
    doorId: input.doorId,
    ownerKind: input.ownerKind,
    ownerId: input.ownerId,
    leadsToKind: "unknown",
    leadsToLabel: input.leadsToLabel ?? "Unknown destination",
    travelRole: "unknown"
  });
}

export function validateDoorDestinationContract(value: unknown): DoorDestinationContract {
  const destination = requireRecord(value, "doorDestination");
  requireExactKeys(destination, "doorDestination", [
    "doorId",
    "ownerKind",
    "ownerId",
    "leadsToKind",
    "leadsToId",
    "leadsToLabel",
    "travelRole"
  ]);
  const leadsToKind = requireEnum(
    destination.leadsToKind,
    DOOR_DESTINATION_LEADS_TO_KINDS,
    "doorDestination.leadsToKind"
  );
  const leadsToId = destination.leadsToId === undefined
    ? undefined
    : requireString(destination.leadsToId, "doorDestination.leadsToId");
  if (leadsToKind !== "external" && leadsToKind !== "unknown" && leadsToId == null) {
    throw new Error("doorDestination.leadsToId is required unless destination is external or unknown");
  }
  return {
    doorId: requireString(destination.doorId, "doorDestination.doorId"),
    ownerKind: requireEnum(destination.ownerKind, DOOR_DESTINATION_OWNER_KINDS, "doorDestination.ownerKind"),
    ownerId: requireString(destination.ownerId, "doorDestination.ownerId"),
    leadsToKind,
    ...(leadsToId == null ? {} : { leadsToId }),
    leadsToLabel: requireString(destination.leadsToLabel, "doorDestination.leadsToLabel"),
    travelRole: requireEnum(
      destination.travelRole,
      DOOR_DESTINATION_TRAVEL_ROLES,
      "doorDestination.travelRole"
    )
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
