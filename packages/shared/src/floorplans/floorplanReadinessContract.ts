export type FloorplanReadinessItemStatus = "passed" | "needs_work";

export type FloorplanReadinessItemId =
  | "rooms_labeled"
  | "patient_care_rooms_identified"
  | "doors_access_points_reviewed"
  | "nurse_stations_placed"
  | "provider_pharmacy_area_placed"
  | "split_rooms_reviewed"
  | "hallways_routes_reviewed"
  | "floorplan_saved"
  | "active_for_assignment"
  | "active_for_simulation"
  | "assignment_set_ready"
  | "scenario_context_ready"
  | "scenario_assumptions_ready";

export type FloorplanReadinessItemContract = {
  itemId: FloorplanReadinessItemId;
  label: string;
  status: FloorplanReadinessItemStatus;
  reason: string;
};

export type FloorplanReadinessContract = {
  schemaVersion: "1.0.0";
  floorplanId: string;
  versionId: string;
  displayName: string;
  assignmentStatus: "needs_work" | "ready_for_assignment";
  simulationStatus: "needs_work" | "ready_for_simulation";
  items: FloorplanReadinessItemContract[];
};
