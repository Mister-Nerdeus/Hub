export type LayoutAssignmentBurdenLevel = "none" | "low" | "medium" | "high";
export type LayoutAssignmentWarningState = "none" | "warning" | "blocking";

export type LayoutAssignmentOverlayRoom = {
  roomId: string;
  assignmentColor: string | null;
  assignmentLabel: string;
  burdenLevel: LayoutAssignmentBurdenLevel;
  warningState: LayoutAssignmentWarningState;
  unassignedOccupied: boolean;
};

export type LayoutAssignmentOverlay = {
  syntheticDataOnly: true;
  roomsById: Record<string, LayoutAssignmentOverlayRoom>;
  legend: LayoutAssignmentOverlayLegendItem[];
};

export type LayoutAssignmentOverlayLegendItem = {
  label: string;
  color: string;
};
