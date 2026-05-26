import { syntheticManualAssignmentNurseProfiles } from "@nerdeus/shared";

export const manualAssignmentDemoNurses = syntheticManualAssignmentNurseProfiles.map((nurse) => ({
  ...nurse
}));

export const manualAssignmentPlaceholderCounts: Record<string, number> = {
  "nurse-blue": 0,
  "nurse-green": 0,
  "nurse-purple": 0,
  "nurse-orange": 0
};
