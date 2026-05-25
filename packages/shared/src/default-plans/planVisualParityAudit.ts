import type { PlanContract } from "../contracts.js";
import type {
  PlanVisualParityObjectKind,
  PlanVisualParitySourceTruth
} from "./planVisualParitySourceTruth.js";

export type PlanVisualParityGapObject = {
  sourceLabel: string;
  required: true;
  objectKind: PlanVisualParityObjectKind;
  expectedTargetId: string | null;
  actualTargetId: string | null;
  issue: string;
};

export type PlanVisualParityExtraObject = {
  objectKind: PlanVisualParityObjectKind;
  objectId: string;
  label: string;
  roomNumber: string | null;
  note?: string;
};

export type PlanVisualParityGapAudit = {
  issue: "230";
  planId: string;
  sourceTruthPath: string;
  sourceTruthRoomCount: number;
  sourceTruthMinimumExpectedCounts: {
    rooms: number;
    nurseStations: number;
    providerPharmacyZones: number;
    hallways: number;
    doorsOrAccessPoints: number;
  };
  currentCounts: {
    rooms: number;
    nurseStations: number;
    zones: number;
    hallways: number;
    doors: number;
  };
  minimumCountFailures: {
    category: "rooms" | "nurseStations" | "providerPharmacyZones" | "hallways" | "doorsOrAccessPoints";
    minimum: number;
    observed: number;
    shortfall: number;
  }[];
  missingRequiredObjects: PlanVisualParityGapObject[];
  extraCurrentObjects: PlanVisualParityExtraObject[];
  mismatchedObjects: PlanVisualParityGapObject[];
  providerPharmacyModelingFailures: string[];
  nurseStationCountFailures: string[];
  unsupportedLegacyLabels: PlanVisualParityExtraObject[];
  limitations: string[];
};

export const PLAN_VISUAL_PARITY_GAP_LIMITATIONS = [
  "Gap output is contract-based and does not claim geometric equivalence.",
  "No measured walking truth is represented at this stage.",
  "Missing objects are identified by source-truth contract coverage requirements."
];

const LEGACY_PLAN_1_ROOM_LABELS = new Set(["Room 01", "Space 07"]);
const PLAN_1_PROVIDER_PHARMACY_ZONE_IDS = new Set(["zone-provider-pharmacy"]);
const PLAN_1_PROVIDER_PHARMACY_STATION_IDS = new Set(["station-provider-pharmacy"]);
const PLAN_1_PROVIDER_PHARMACY_LABEL_HINTS = ["provider pharmacy", "provider/pharmacy", "provider-pharmacy"];

const OBJECT_KIND_TO_COLLECTION: Record<
  Exclude<PlanVisualParityObjectKind, "annotation" | "deferred">,
  keyof Pick<PlanContract, "rooms" | "zones" | "hallways" | "nurseStations" | "doors">
> = {
  room: "rooms",
  zone: "zones",
  hallway: "hallways",
  nurse_station: "nurseStations",
  door_or_access: "doors"
};

export function auditPlan1VisualParityGaps(
  contract: PlanVisualParitySourceTruth,
  plan: PlanContract,
  sourceTruthPath: string
): PlanVisualParityGapAudit {
  const requiredObjects = contract.visibleObjects.filter((entry) => entry.required);
  const currentByKind = {
    rooms: indexById(plan.rooms),
    zones: indexById(plan.zones),
    hallways: indexById(plan.hallways),
    nurseStations: indexById(plan.nurseStations),
    doors: indexById(plan.doors)
  };

  const requiredTargetIdsByKind = new Map<PlanVisualParityObjectKind, Set<string>>();
  for (const entry of requiredObjects) {
    const set = requiredTargetIdsByKind.get(entry.objectKind) ?? new Set<string>();
    if (entry.expectedTargetId != null) {
      set.add(entry.expectedTargetId);
    }
    requiredTargetIdsByKind.set(entry.objectKind, set);
  }

  const missingRequiredObjects: PlanVisualParityGapObject[] = [];
  const mismatchedObjects: PlanVisualParityGapObject[] = [];

  for (const entry of requiredObjects) {
    if (entry.objectKind === "annotation" || entry.objectKind === "deferred") {
      if (entry.expectedTargetId == null) {
        missingRequiredObjects.push({
          sourceLabel: entry.sourceLabel,
          required: true,
          objectKind: entry.objectKind,
          expectedTargetId: entry.expectedTargetId,
          actualTargetId: null,
          issue: "MISSING_REQUIRED_ANNOTATION"
        });
      }
      continue;
    }

    const collection = OBJECT_KIND_TO_COLLECTION[entry.objectKind];
    const expectedTargetId = entry.expectedTargetId;
    if (expectedTargetId == null) {
      missingRequiredObjects.push({
        sourceLabel: entry.sourceLabel,
        required: true,
        objectKind: entry.objectKind,
        expectedTargetId: null,
        actualTargetId: null,
        issue: "MISSING_REQUIRED_TARGET_ID"
      });
      continue;
    }

    if (!currentByKind[collection].has(expectedTargetId)) {
      missingRequiredObjects.push({
        sourceLabel: entry.sourceLabel,
        required: true,
        objectKind: entry.objectKind,
        expectedTargetId,
        actualTargetId: null,
        issue: "MISSING_REQUIRED_OBJECT"
      });
      continue;
    }

    const foundObject = currentByKind[collection].get(expectedTargetId);
    if (foundObject == null || foundObject.id !== expectedTargetId) {
      mismatchedObjects.push({
        sourceLabel: entry.sourceLabel,
        required: true,
        objectKind: entry.objectKind,
        expectedTargetId,
        actualTargetId: foundObject?.id ?? null,
        issue: "REQUIRES_KIND_OBJECT_MISMATCH"
      });
    }
  }

  const extraCurrentObjects: PlanVisualParityExtraObject[] = [];
  const unsupportedLegacyLabels: PlanVisualParityExtraObject[] = [];

  for (const room of plan.rooms) {
    if (!requiredTargetIdsByKind.get("room")?.has(room.id)) {
      const extra = {
        objectKind: "room" as const,
        objectId: room.id,
        label: room.label,
        roomNumber: room.roomOperationalMetadata?.roomNumber ?? null
      };
      extraCurrentObjects.push(extra);
      if (LEGACY_PLAN_1_ROOM_LABELS.has(room.label)) {
        unsupportedLegacyLabels.push(extra);
      }
    }
  }

  for (const hallway of plan.hallways) {
    if (!requiredTargetIdsByKind.get("hallway")?.has(hallway.id)) {
      extraCurrentObjects.push({
        objectKind: "hallway",
        objectId: hallway.id,
        label: hallway.label,
        roomNumber: null
      });
    }
  }

  for (const station of plan.nurseStations) {
    if (!requiredTargetIdsByKind.get("nurse_station")?.has(station.id)) {
      const extra = {
        objectKind: "nurse_station" as const,
        objectId: station.id,
        label: station.label,
        roomNumber: null
      };
      extraCurrentObjects.push(extra);
      if (
        PLAN_1_PROVIDER_PHARMACY_STATION_IDS.has(station.id) ||
        isProviderPharmacyLabel(station.label)
      ) {
        unsupportedLegacyLabels.push(extra);
      }
    }
  }

  for (const zone of plan.zones) {
    if (!requiredTargetIdsByKind.get("zone")?.has(zone.id)) {
      extraCurrentObjects.push({
        objectKind: "zone",
        objectId: zone.id,
        label: zone.label,
        roomNumber: null
      });
    }
  }

  for (const door of plan.doors) {
    if (!requiredTargetIdsByKind.get("door_or_access")?.has(door.id)) {
      extraCurrentObjects.push({
        objectKind: "door_or_access",
        objectId: door.id,
        label: door.label,
        roomNumber: null
      });
    }
  }

  const providerPharmacyZoneCount = plan.zones.filter((zone) => zone.id === "zone-provider-pharmacy").length;
  const providerStationCount = plan.nurseStations.filter((station) =>
    PLAN_1_PROVIDER_PHARMACY_STATION_IDS.has(station.id) || isProviderPharmacyLabel(station.label)
  ).length;
  const providerPharmacyModelingFailures: string[] = [];

  if (providerPharmacyZoneCount === 0) {
    providerPharmacyModelingFailures.push("Missing required zone-provider-pharmacy");
  }
  if (providerStationCount > 0 && providerPharmacyZoneCount === 0) {
    providerPharmacyModelingFailures.push("Provider/pharmacy modeled as station-only object");
  }

  const minimumCountFailures = computeMinimumCountFailures(contract, plan);
  const nurseStationCountFailures: string[] = [];
  if (minimumCountFailures.some((entry) => entry.category === "nurseStations")) {
    nurseStationCountFailures.push("Nurse station count below minimum required count");
  }
  if (providerStationCount > 0) {
    nurseStationCountFailures.push("Provider/pharmacy station is mixed into visible nurse station count");
  }

  return {
    issue: "230",
    planId: plan.planId,
    sourceTruthPath,
    sourceTruthRoomCount: requiredTargetIdsByKind.get("room")?.size ?? 0,
    sourceTruthMinimumExpectedCounts: {
      rooms: contract.minimumExpectedCounts.rooms,
      nurseStations: contract.minimumExpectedCounts.nurseStations,
      providerPharmacyZones: contract.minimumExpectedCounts.providerPharmacyZones,
      hallways: contract.minimumExpectedCounts.hallways,
      doorsOrAccessPoints: contract.minimumExpectedCounts.doorsOrAccessPoints
    },
    currentCounts: {
      rooms: plan.rooms.length,
      nurseStations: plan.nurseStations.length,
      zones: plan.zones.length,
      hallways: plan.hallways.length,
      doors: plan.doors.length
    },
    minimumCountFailures,
    missingRequiredObjects,
    extraCurrentObjects,
    mismatchedObjects,
    providerPharmacyModelingFailures,
    nurseStationCountFailures,
    unsupportedLegacyLabels: unsupportedLegacyLabels.map((entry) => ({
      ...entry,
      note: "legacy source object retained in current fixture"
    })),
    limitations: [...PLAN_VISUAL_PARITY_GAP_LIMITATIONS]
  };
}

function computeMinimumCountFailures(
  contract: PlanVisualParitySourceTruth,
  plan: PlanContract
): PlanVisualParityGapAudit["minimumCountFailures"] {
  const expectedZoneCount = contract.minimumExpectedCounts.providerPharmacyZones;
  const observedZoneCount = plan.zones.filter((zone) => zone.id === "zone-provider-pharmacy").length;
  const failures: PlanVisualParityGapAudit["minimumCountFailures"] = [];

  addMinimumFailure(failures, "rooms", contract.minimumExpectedCounts.rooms, plan.rooms.length);
  addMinimumFailure(failures, "nurseStations", contract.minimumExpectedCounts.nurseStations, plan.nurseStations.length);
  addMinimumFailure(failures, "hallways", contract.minimumExpectedCounts.hallways, plan.hallways.length);
  addMinimumFailure(
    failures,
    "doorsOrAccessPoints",
    contract.minimumExpectedCounts.doorsOrAccessPoints,
    plan.doors.length
  );
  addMinimumFailure(failures, "providerPharmacyZones", expectedZoneCount, observedZoneCount);
  return failures;
}

function addMinimumFailure(
  failures: PlanVisualParityGapAudit["minimumCountFailures"],
  category: PlanVisualParityGapAudit["minimumCountFailures"][number]["category"],
  minimum: number,
  observed: number
): void {
  if (observed < minimum) {
    failures.push({
      category,
      minimum,
      observed,
      shortfall: minimum - observed
    });
  }
}

function indexById<T extends { id: string }>(objects: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const object of objects) {
    map.set(object.id, object);
  }
  return map;
}

function isProviderPharmacyLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return PLAN_1_PROVIDER_PHARMACY_LABEL_HINTS.some((hint) => normalized.includes(hint));
}
