export const HALLWAY_CORRIDOR_TYPES = [
  "main_hallway",
  "side_hallway",
  "ems_entry_corridor",
  "top_corridor",
  "bottom_corridor",
  "right_corridor"
] as const;

export type HallwayCorridorType = (typeof HALLWAY_CORRIDOR_TYPES)[number];

export type HallwayCorridorContract = {
  hallwayId: string;
  corridorType: HallwayCorridorType;
  patientCareEligible: false;
  assignmentEligible: false;
  pannableBackgroundEligible: true;
  routeReadinessOnly: true;
};

export const CANONICAL_HALLWAY_CORRIDORS: readonly HallwayCorridorContract[] = [
  { hallwayId: "hallway-main", corridorType: "main_hallway", patientCareEligible: false, assignmentEligible: false, pannableBackgroundEligible: true, routeReadinessOnly: true },
  { hallwayId: "hallway-ems-entry", corridorType: "ems_entry_corridor", patientCareEligible: false, assignmentEligible: false, pannableBackgroundEligible: true, routeReadinessOnly: true },
  { hallwayId: "hallway-top-horizontal", corridorType: "top_corridor", patientCareEligible: false, assignmentEligible: false, pannableBackgroundEligible: true, routeReadinessOnly: true },
  { hallwayId: "hallway-left-vertical", corridorType: "side_hallway", patientCareEligible: false, assignmentEligible: false, pannableBackgroundEligible: true, routeReadinessOnly: true },
  { hallwayId: "hallway-bottom-horizontal", corridorType: "bottom_corridor", patientCareEligible: false, assignmentEligible: false, pannableBackgroundEligible: true, routeReadinessOnly: true },
  { hallwayId: "hallway-right-vertical", corridorType: "right_corridor", patientCareEligible: false, assignmentEligible: false, pannableBackgroundEligible: true, routeReadinessOnly: true },
  { hallwayId: "hallway-right-upper", corridorType: "right_corridor", patientCareEligible: false, assignmentEligible: false, pannableBackgroundEligible: true, routeReadinessOnly: true }
];
