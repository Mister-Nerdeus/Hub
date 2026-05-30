import type {
  EditableDoorWall,
  EditableSupportAccessPointGeometry,
  EditableZoneGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";

export type SupportAccessPointContractResult = {
  status: "passed" | "blocked";
  supportAccessPointCount: number;
  providerPharmacyAccessPointCount: number;
  patientRoomDoorCount: number;
  supportAccessPointsArePatientRoomDoors: false;
  providerPharmacyPatientCareExcluded: true;
  blockers: string[];
};

export function createEditableSupportAccessPoint(input: {
  id: string;
  label: string;
  ownerId: string;
  wall?: EditableDoorWall;
  offsetFeet?: number;
  widthFeet?: number;
}): EditableSupportAccessPointGeometry {
  return {
    objectType: "support_access",
    id: input.id,
    label: input.label,
    ownerKind: "zone",
    ownerId: input.ownerId,
    wall: input.wall ?? "south",
    offsetFeet: input.offsetFeet ?? 1,
    widthFeet: input.widthFeet ?? 4
  };
}

export function isProviderPharmacySupportZone(zone: EditableZoneGeometry | null | undefined): boolean {
  return zone?.zoneType === "provider_pharmacy";
}

export function summarizeSupportAccessPointContract(input: {
  supportAccessPoints: readonly EditableSupportAccessPointGeometry[];
  zones: readonly EditableZoneGeometry[];
  patientRoomDoorCount?: number;
}): SupportAccessPointContractResult {
  const providerZoneIds = new Set(
    input.zones.filter(isProviderPharmacySupportZone).map((zone) => zone.id)
  );
  const blockers = input.supportAccessPoints.flatMap((accessPoint) => {
    if (accessPoint.objectType !== "support_access") {
      return [`${accessPoint.id} is not a support_access point`];
    }
    if (accessPoint.ownerKind !== "zone") {
      return [`${accessPoint.id} ownerKind must be zone`];
    }
    if (!input.zones.some((zone) => zone.id === accessPoint.ownerId)) {
      return [`${accessPoint.id} ownerId must reference a zone`];
    }
    return [];
  });
  const providerPharmacyAccessPointCount = input.supportAccessPoints.filter((accessPoint) =>
    providerZoneIds.has(accessPoint.ownerId)
  ).length;
  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    supportAccessPointCount: input.supportAccessPoints.length,
    providerPharmacyAccessPointCount,
    patientRoomDoorCount: input.patientRoomDoorCount ?? 0,
    supportAccessPointsArePatientRoomDoors: false,
    providerPharmacyPatientCareExcluded: true,
    blockers
  };
}
