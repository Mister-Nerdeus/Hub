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
      (layout.splitBays?.length ?? 0) >= 0,
      "Split rooms are reviewed for this workflow step."
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
      "Active for simulation",
      activeFloorplan.selectedForSimulation,
      "Use this floorplan for simulation."
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
  const simulationReady = assignmentReady
    && items.every((entry) => entry.status === "passed")
    && activeFloorplan.selectedForSimulation;

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

export type CompactReadinessSummaryItem = {
  label: "Floorplan" | "Assignment" | "Scenario" | "Simulation";
  status: "Ready" | "Needs assignment set" | "Not ready" | "Blocked" | "Needs work";
};

export function createCompactReadinessSummary(
  viewModel: FloorplanReadinessContract
): CompactReadinessSummaryItem[] {
  const floorplanItemIds = new Set([
    "rooms_labeled",
    "patient_care_rooms_identified",
    "doors_access_points_reviewed",
    "nurse_stations_placed",
    "provider_pharmacy_area_placed",
    "split_rooms_reviewed",
    "hallways_routes_reviewed",
    "floorplan_saved"
  ]);
  const floorplanReady = viewModel.items
    .filter((entry) => floorplanItemIds.has(entry.itemId))
    .every((entry) => entry.status === "passed");

  return [
    { label: "Floorplan", status: floorplanReady ? "Ready" : "Needs work" },
    { label: "Assignment", status: "Needs assignment set" },
    { label: "Scenario", status: "Not ready" },
    { label: "Simulation", status: "Blocked" }
  ];
}

function item(
  itemId: FloorplanReadinessItemContract["itemId"],
  label: string,
  passed: boolean,
  reason: string
): FloorplanReadinessItemContract {
  return {
    itemId,
    label,
    status: passed ? "passed" : "needs_work",
    reason: passed ? "Ready." : reason
  };
}
