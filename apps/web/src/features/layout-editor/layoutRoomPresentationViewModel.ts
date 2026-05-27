import type { RoomShapeViewModel } from "./roomShapeViewModel";

export function buildRoomPresentationClass(viewModel: RoomShapeViewModel): string {
  const classes = ["layout-editor-stage__room-presentation"];
  if (viewModel.assignmentColor != null) classes.push("layout-editor-stage__room-presentation--assigned");
  if (viewModel.unassignedOccupied) classes.push("layout-editor-stage__room-presentation--unassigned");
  if (viewModel.warningState === "warning" || viewModel.warningState === "blocking") {
    classes.push("layout-editor-stage__room-presentation--warning");
  }
  if (/trauma|level\s*1/i.test(`${viewModel.label} ${viewModel.roomType}`)) {
    classes.push("layout-editor-stage__room-presentation--special");
  }
  return classes.join(" ");
}
