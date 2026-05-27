import type { PointerEvent } from "react";

import type { RoomShapeViewModel } from "./roomShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";
import { buildRoomPresentationClass } from "./layoutRoomPresentationViewModel";

type RoomShapeProps = {
  viewModel: RoomShapeViewModel;
  isSelected?: boolean;
  onSelect?: (objectType: "room", objectId: string) => void;
  onMoveStart?: (objectId: string, event: PointerEvent<SVGGElement>) => void;
  onMove?: (objectId: string, event: PointerEvent<SVGGElement>) => void;
  onMoveEnd?: (objectId: string, event: PointerEvent<SVGGElement>) => void;
};

export function RoomShape({
  viewModel,
  isSelected = false,
  onSelect,
  onMoveStart,
  onMove,
  onMoveEnd
}: RoomShapeProps) {
  return (
    <g
      className={`${selectedClassName("layout-editor-stage__room", isSelected)} ${viewModel.presentationActive ? buildRoomPresentationClass(viewModel) : ""}`}
      data-hit-target-key={viewModel.hitTargetKey}
      data-room-type={viewModel.roomType}
      data-assignment-state={viewModel.assignmentLabel ?? "none"}
      data-burden-level={viewModel.burdenLevel ?? "none"}
      data-warning-state={viewModel.warningState ?? "none"}
      data-unassigned-occupied={viewModel.unassignedOccupied ? "true" : "false"}
      data-resize-handles={isSelected ? "display-only" : undefined}
      role="img"
      aria-label={viewModel.ariaLabel}
      onClick={() => onSelect?.("room", viewModel.objectId)}
      onPointerDown={(event) => onMoveStart?.(viewModel.objectId, event)}
      onPointerMove={(event) => onMove?.(viewModel.objectId, event)}
      onPointerUp={(event) => onMoveEnd?.(viewModel.objectId, event)}
      onPointerCancel={(event) => onMoveEnd?.(viewModel.objectId, event)}
    >
      <rect
        x={viewModel.xPixels}
        y={viewModel.yPixels}
        width={viewModel.widthPixels}
        height={viewModel.heightPixels}
        style={viewModel.assignmentColor == null ? undefined : { fill: viewModel.assignmentColor }}
      />
      <text x={viewModel.labelX} y={viewModel.labelY}>
        {viewModel.presentationActive && /trauma|level\s*1/i.test(`${viewModel.label} ${viewModel.roomType}`)
          ? viewModel.label
          : viewModel.roomNumber}
      </text>
    </g>
  );
}
