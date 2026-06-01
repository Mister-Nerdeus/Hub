export const ENTRY_EXIT_KINDS = [
  "main_entry",
  "ems_entry",
  "staff_entry",
  "hallway_connection",
  "external_exit"
] as const;

export const ENTRY_EXIT_DESTINATION_KINDS = [
  "hallway",
  "external",
  "ems",
  "provider_pharmacy",
  "staff_only",
  "pod"
] as const;

export type EntryExitKind = (typeof ENTRY_EXIT_KINDS)[number];
export type EntryExitDestinationKind = (typeof ENTRY_EXIT_DESTINATION_KINDS)[number];

export type EntryExitDestinationContract = {
  destinationKind: EntryExitDestinationKind;
  destinationId?: string;
  displayLabel: string;
};

export type EntryExitContract = {
  entryExitId: string;
  label: string;
  kind: EntryExitKind;
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
  connectsFromId?: string;
  connectsTo: EntryExitDestinationContract;
  blocksTravel: false;
};

export function validateEntryExitContract(value: unknown): EntryExitContract {
  const entryExit = requireRecord(value, "entryExit");
  requireExactKeys(entryExit, "entryExit", [
    "entryExitId",
    "label",
    "kind",
    "xFeet",
    "yFeet",
    "widthFeet",
    "heightFeet",
    "connectsFromId",
    "connectsTo",
    "blocksTravel"
  ]);
  return {
    entryExitId: requireString(entryExit.entryExitId, "entryExit.entryExitId"),
    label: requireString(entryExit.label, "entryExit.label"),
    kind: requireEnum(entryExit.kind, ENTRY_EXIT_KINDS, "entryExit.kind"),
    xFeet: requireNumber(entryExit.xFeet, "entryExit.xFeet"),
    yFeet: requireNumber(entryExit.yFeet, "entryExit.yFeet"),
    widthFeet: requirePositiveNumber(entryExit.widthFeet, "entryExit.widthFeet"),
    heightFeet: requirePositiveNumber(entryExit.heightFeet, "entryExit.heightFeet"),
    ...(entryExit.connectsFromId === undefined
      ? {}
      : { connectsFromId: requireString(entryExit.connectsFromId, "entryExit.connectsFromId") }),
    connectsTo: validateEntryExitDestination(entryExit.connectsTo),
    blocksTravel: requireLiteral(entryExit.blocksTravel, false, "entryExit.blocksTravel")
  };
}

function validateEntryExitDestination(value: unknown): EntryExitDestinationContract {
  const destination = requireRecord(value, "entryExit.connectsTo");
  requireExactKeys(destination, "entryExit.connectsTo", [
    "destinationKind",
    "destinationId",
    "displayLabel"
  ]);
  return {
    destinationKind: requireEnum(
      destination.destinationKind,
      ENTRY_EXIT_DESTINATION_KINDS,
      "entryExit.connectsTo.destinationKind"
    ),
    ...(destination.destinationId === undefined
      ? {}
      : { destinationId: requireString(destination.destinationId, "entryExit.connectsTo.destinationId") }),
    displayLabel: requireString(destination.displayLabel, "entryExit.connectsTo.displayLabel")
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

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requirePositiveNumber(value: unknown, label: string): number {
  const numberValue = requireNumber(value, label);
  if (numberValue <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return numberValue;
}

function requireLiteral<T extends boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${String(expected)}`);
  }
  return expected;
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
