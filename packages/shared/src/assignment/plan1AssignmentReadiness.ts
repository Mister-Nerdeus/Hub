import type { PlanContract } from "../contracts.js";
import {
  isPlan1AssignmentZone,
  isPlan1ScaffoldZoneId,
  makeStalePathSyncWarning,
  plan1PatientCareRoomIds,
  validatePlan1Plan
} from "./plan1AssignmentCommon.js";

export type Plan1AssignmentReadinessAudit = {
  status: "passed" | "failed";
  planId: string;
  roomCount: number;
  nurseStationCount: number;
  pathGraphConnected: boolean;
  walkingBaselineUnreachableRouteCount: number;
  room17AssignmentClass: "assignment_patient_care" | "not_assignment_patient_care";
  providerPharmacySupportClassified: boolean;
  scaffoldZonesNonAssignment: boolean;
  stalePathSyncWarning: ReturnType<typeof makeStalePathSyncWarning>;
  oldSimplifiedPlanLabelsRemaining: string[];
  failures: string[];
};

export function auditPlan1AssignmentReadiness(input: {
  plan: PlanContract;
  walkingBaseline: { unreachableRouteCount?: number };
}): Plan1AssignmentReadinessAudit {
  const plan = validatePlan1Plan(input.plan);
  const room17 = plan.rooms.find((room) => room.id === "room-17");
  const providerPharmacy = plan.zones.find((zone) => zone.id === "zone-provider-pharmacy");
  const scaffoldZones = plan.zones.filter((zone) => isPlan1ScaffoldZoneId(zone.id));
  const patientCareRoomIds = plan1PatientCareRoomIds(plan);
  const connected = pathGraphConnected(plan);
  const oldSimplifiedPlanLabelsRemaining = plan.rooms
    .map((room) => room.label)
    .filter((label) => /^Room\s+\d+$/u.test(label));
  const failures = [
    plan.rooms.length !== 23 ? `PLAN_1_ROOM_COUNT: expected 23, observed ${plan.rooms.length}` : null,
    plan.nurseStations.length !== 2 ? `PLAN_1_NURSE_STATION_COUNT: expected 2, observed ${plan.nurseStations.length}` : null,
    !connected ? "PLAN_1_PATH_GRAPH_DISCONNECTED" : null,
    (input.walkingBaseline.unreachableRouteCount ?? 0) !== 0
      ? `PLAN_1_WALKING_BASELINE_UNREACHABLE: ${input.walkingBaseline.unreachableRouteCount ?? 0}`
      : null,
    !patientCareRoomIds.has("room-17") ? "ROOM_17_ASSIGNMENT_PATIENT_CARE_CLASS_MISSING" : null,
    providerPharmacy?.zoneOperationalMetadata?.zoneClass !== "support" ? "PROVIDER_PHARMACY_SUPPORT_CLASS_MISSING" : null,
    scaffoldZones.some((zone) => isPlan1AssignmentZone(zone.id)) ? "SCAFFOLD_ZONE_ASSIGNMENT_ELIGIBLE" : null,
    oldSimplifiedPlanLabelsRemaining.length > 0 ? "OLD_SIMPLIFIED_PLAN_LABELS_REMAIN" : null
  ].filter((failure): failure is string => failure != null);

  return {
    status: failures.length === 0 ? "passed" : "failed",
    planId: plan.planId,
    roomCount: plan.rooms.length,
    nurseStationCount: plan.nurseStations.length,
    pathGraphConnected: connected,
    walkingBaselineUnreachableRouteCount: input.walkingBaseline.unreachableRouteCount ?? 0,
    room17AssignmentClass:
      patientCareRoomIds.has("room-17") ? "assignment_patient_care" : "not_assignment_patient_care",
    providerPharmacySupportClassified: providerPharmacy?.zoneOperationalMetadata?.zoneClass === "support",
    scaffoldZonesNonAssignment: scaffoldZones.every((zone) => !isPlan1AssignmentZone(zone.id)),
    stalePathSyncWarning: makeStalePathSyncWarning(),
    oldSimplifiedPlanLabelsRemaining,
    failures
  };
}

function pathGraphConnected(plan: PlanContract): boolean {
  if (plan.pathNodes.length === 0) {
    return false;
  }
  const requiredNodeIds = new Set(
    [
      ...plan.rooms.map((room) => room.pathNodeId).filter((nodeId): nodeId is string => nodeId != null),
      ...plan.nurseStations.map((station) => station.pathNodeId)
    ]
  );
  const adjacency = new Map<string, string[]>();
  for (const edge of plan.pathEdges) {
    if (edge.blocked) {
      continue;
    }
    addEdge(adjacency, edge.fromNodeId, edge.toNodeId);
    addEdge(adjacency, edge.toNodeId, edge.fromNodeId);
  }
  const start = [...requiredNodeIds][0];
  if (start == null) {
    return false;
  }
  const visited = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current == null || visited.has(current)) {
      continue;
    }
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) {
        stack.push(next);
      }
    }
  }
  return [...requiredNodeIds].every((nodeId) => visited.has(nodeId));
}

function addEdge(adjacency: Map<string, string[]>, from: string, to: string): void {
  const current = adjacency.get(from) ?? [];
  current.push(to);
  adjacency.set(from, current);
}
