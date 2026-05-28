export const SUPPORT_AREA_TYPES = ["nurse_station", "provider_pharmacy", "storage", "ems_entry"] as const;

export type SupportAreaType = (typeof SUPPORT_AREA_TYPES)[number];

export type CanonicalSupportArea = {
  objectId: string;
  supportAreaType: SupportAreaType;
  patientCareEligible: false;
  ratioEligible: false;
  assignmentEligible: false;
  routeReadinessEligible: boolean;
};

export const CANONICAL_SUPPORT_AREAS: readonly CanonicalSupportArea[] = [
  { objectId: "station-left", supportAreaType: "nurse_station", patientCareEligible: false, ratioEligible: false, assignmentEligible: false, routeReadinessEligible: true },
  { objectId: "station-right", supportAreaType: "nurse_station", patientCareEligible: false, ratioEligible: false, assignmentEligible: false, routeReadinessEligible: true },
  { objectId: "zone-provider-pharmacy", supportAreaType: "provider_pharmacy", patientCareEligible: false, ratioEligible: false, assignmentEligible: false, routeReadinessEligible: true },
  { objectId: "room-14", supportAreaType: "storage", patientCareEligible: false, ratioEligible: false, assignmentEligible: false, routeReadinessEligible: false },
  { objectId: "zone-ems-entry", supportAreaType: "ems_entry", patientCareEligible: false, ratioEligible: false, assignmentEligible: false, routeReadinessEligible: true }
];

export function canonicalSupportArea(objectId: string): CanonicalSupportArea | null {
  return CANONICAL_SUPPORT_AREAS.find((area) => area.objectId === objectId) ?? null;
}
