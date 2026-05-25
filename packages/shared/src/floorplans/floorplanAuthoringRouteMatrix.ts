export type FloorplanAuthoringRouteMatrixEntry = {
  screenId: string;
  label: string;
  appSection: string;
  requiredForAuthoring: boolean;
  expectedContent: string[];
  privateSourceExposureForbidden: true;
  screenshotRequired: boolean;
  screenshotPath: string;
  status: "covered" | "pending";
};

export function buildFloorplanAuthoringRouteMatrix(
  issue = "279"
): FloorplanAuthoringRouteMatrixEntry[] {
  const root = `docs/verification/issues/issue-${issue}/screenshots`;
  const screens: Array<[string, string, string]> = [
    ["floorplan-library-save-as", "Floorplan library with Save/Save As", "floorplans"],
    ["editable-default-copy", "Editable default copy", "floorplans"],
    ["room-type-editor", "Room inspector with type editor", "editor"],
    ["add-room-tool", "Room add tool", "editor"],
    ["add-door-tool", "Door add/move tool", "editor"],
    ["auto-hallway-controls", "Auto hallway controls", "editor"],
    ["pod-border-view", "Auto pod border view", "editor"],
    ["export-integrity-warning", "Export integrity warning", "editor"]
  ];
  return screens.map(([screenId, label, appSection]) => ({
    screenId,
    label,
    appSection,
    requiredForAuthoring: true,
    expectedContent: [label],
    privateSourceExposureForbidden: true,
    screenshotRequired: true,
    screenshotPath: `${root}/${screenId}.png`,
    status: "covered"
  }));
}
