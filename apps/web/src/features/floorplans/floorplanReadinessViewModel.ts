import {
  isRoomLoadEligibleRoomType,
  type ActiveFloorplanContract,
  type FloorplanReadinessContract,
  type FloorplanReadinessItemContract
} from "@nerdeus/shared";

export function createFloorplanReadinessViewModel(
  activeFloorplan: ActiveFloorplanContract
): FloorplanReadinessContract {
  const layout = activeFloorplan.editableLayout;
  const patientCareRooms = layout.rooms.filter((room) => isRoomLoadEligibleRoomType(room.roomType));
  const splitRoomReadiness = hasValidSplitRoomReadiness(activeFloorplan);
  const items: FloorplanReadinessItemContract[] = [
    item(
      "rooms_labeled",
      "Rooms labeled",
      layout.rooms.every((room) => room.roomNumber.trim().length > 0),
      "Every room needs a visible operational room label."
    ),
    item(
      "patient_care_rooms_identified",
      "Patient-care rooms identified",
      patientCareRooms.length > 0,
      "At least one assignment-eligible room is required."
    ),
    item(
      "doors_access_points_reviewed",
      "Doors/access points reviewed",
      layout.doors.length + (layout.supportAccessPoints?.length ?? 0) > 0,
      "Review room doors and support access points before using the layout."
    ),
    item(
      "nurse_stations_placed",
      "Nurse stations placed",
      layout.stations.length > 0,
      "Place at least one nurse station or desk."
    ),
    item(
      "provider_pharmacy_area_placed",
      "Provider/pharmacy area placed",
      layout.rooms.some((room) => room.roomType === "provider_pharmacy")
        || layout.zones.some((zone) => zone.zoneType === "provider_pharmacy"),
      "Add or confirm the provider/pharmacy area."
    ),
    item(
      "split_rooms_reviewed",
      "Split rooms reviewed",
      splitRoomReadiness.passed,
      splitRoomReadiness.reason,
      splitRoomReadiness.passedReason
    ),
    item(
      "hallways_routes_reviewed",
      "Hallways/routes reviewed",
      layout.hallways.length > 0,
      "Review hallways and route context before simulation."
    ),
    item(
      "floorplan_saved",
      "Floorplan saved",
      activeFloorplan.workflowStatus !== "draft" && activeFloorplan.workflowStatus !== "no_floorplan_selected",
      "Save the active floorplan before using assignments or simulation."
    ),
    item(
      "active_for_assignment",
      "Active for assignment",
      activeFloorplan.selectedForAssignment,
      "Use this floorplan for assignment."
    ),
    item(
      "active_for_simulation",
      "Prepared for scenario setup",
      activeFloorplan.selectedForSimulation,
      "Prepare this floorplan for scenario setup after assignments are saved.",
      "Floorplan is selected for scenario setup. Assignment set, scenario, and assumptions are still required."
    ),
    item(
      "assignment_set_ready",
      "Assignment set ready",
      false,
      "A durable assignment set linked to this floorplan version is required before simulation readiness."
    ),
    item(
      "scenario_context_ready",
      "Scenario context ready",
      false,
      "Scenario setup is foundation-only until assignment context is selected."
    ),
    item(
      "scenario_assumptions_ready",
      "Scenario assumptions ready",
      false,
      "Scenario assumptions are not ready in the floorplan-only workflow."
    )
  ];
  const assignmentIds = new Set([
    "rooms_labeled",
    "patient_care_rooms_identified",
    "doors_access_points_reviewed",
    "nurse_stations_placed",
    "floorplan_saved",
    "active_for_assignment"
  ]);
  const assignmentReady = items
    .filter((entry) => assignmentIds.has(entry.itemId))
    .every((entry) => entry.status === "passed");
  const simulationReadinessIds = new Set<FloorplanReadinessItemContract["itemId"]>([
    "floorplan_saved",
    "active_for_assignment",
    "active_for_simulation",
    "assignment_set_ready",
    "scenario_context_ready",
    "scenario_assumptions_ready"
  ]);
  const simulationReady = items
    .filter((entry) => simulationReadinessIds.has(entry.itemId))
    .every((entry) => entry.status === "passed");

  return {
    schemaVersion: "1.0.0",
    floorplanId: activeFloorplan.activeFloorplanId,
    versionId: activeFloorplan.activeFloorplanVersionId,
    displayName: activeFloorplan.displayName,
    assignmentStatus: assignmentReady ? "ready_for_assignment" : "needs_work",
    simulationStatus: simulationReady ? "ready_for_simulation" : "needs_work",
    items
  };
}

function item(
  itemId: FloorplanReadinessItemContract["itemId"],
  label: string,
  passed: boolean,
  reason: string,
  passedReason = "Ready."
): FloorplanReadinessItemContract {
  return {
    itemId,
    label,
    status: passed ? "passed" : "needs_work",
    reason: passed ? passedReason : reason
  };
}

function hasValidSplitRoomReadiness(activeFloorplan: ActiveFloorplanContract): {
  passed: boolean;
  reason: string;
  passedReason?: string;
} {
  const layout = activeFloorplan.editableLayout;
  const splitBays = layout.splitBays ?? [];
  if (splitBays.length === 0) {
    return {
      passed: true,
      reason: "Split rooms are reviewed for this workflow step.",
      passedReason: "No split rooms present."
    };
  }

  const roomIds = new Set(layout.rooms.map((room) => room.id));
  const invalidSplitBay = splitBays.find((splitBay) => {
    if (splitBay.objectType !== "split_bay") return true;
    if (splitBay.splitBayId.trim().length === 0) return true;
    if (splitBay.label.trim().length === 0) return true;
    if (splitBay.bedPositionRoomIds.length !== 2) return true;
    return splitBay.bedPositionRoomIds.some((roomId) => !roomIds.has(roomId));
  });

  if (invalidSplitBay != null) {
    return {
      passed: false,
      reason: `Review split room ${invalidSplitBay.splitBayId || invalidSplitBay.id}: child room references must be valid and independently assignable.`
    };
  }

  return {
    passed: true,
    reason: "Split rooms are reviewed for this workflow step.",
    passedReason: "Split rooms have valid child room references."
  };
}
