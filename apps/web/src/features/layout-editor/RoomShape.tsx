import type { PointerEvent } from "react";

import type { RoomShapeViewModel } from "./roomShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";
import { buildRoomPresentationClass } from "./layoutRoomPresentationViewModel";
import { getRoomPresentationStyle } from "./roomPresentationStyles";

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
  const presentationStyle = getRoomPresentationStyle(viewModel.roomType);
  const assignmentStyle =
    viewModel.assignmentColor == null || presentationStyle.muted
      ? undefined
      : { fill: viewModel.assignmentColor };
  const semanticStyle = presentationStyle.muted
    ? {
        fill: presentationStyle.fill,
        stroke: presentationStyle.stroke
      }
    : assignmentStyle;
  return (
    <g
      className={`${selectedClassName("layout-editor-stage__room", isSelected)} ${viewModel.presentationActive ? buildRoomPresentationClass(viewModel) : ""}`}
      data-hit-target-key={viewModel.hitTargetKey}
      data-layout-object-type="room"
      data-layout-object-id={viewModel.objectId}
      data-room-type={viewModel.roomType}
      data-presentation-muted={presentationStyle.muted ? "true" : "false"}
      data-assignment-state={viewModel.assignmentLabel ?? "none"}
      data-burden-level={viewModel.burdenLevel ?? "none"}
      data-warning-state={viewModel.warningState ?? "none"}
      data-unassigned-occupied={viewModel.unassignedOccupied ? "true" : "false"}
      data-resize-handles={isSelected ? "display-only" : undefined}
      role="img"
      aria-label={viewModel.ariaLabel}
      tabIndex={0}
      onClick={() => onSelect?.("room", viewModel.objectId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.("room", viewModel.objectId);
        }
      }}
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
        style={semanticStyle}
      />
      <text x={viewModel.labelX} y={viewModel.labelY} style={presentationStyle.muted ? { fill: presentationStyle.textFill } : undefined}>
        {roomVisibleLabel(viewModel)}
      </text>
    </g>
  );
}

function roomVisibleLabel(viewModel: RoomShapeViewModel): string {
  if (viewModel.roomType === "storage" || viewModel.roomType === "solid_wall") return viewModel.visibleLabel;
  if (viewModel.presentationActive && /trauma|level\s*1/i.test(`${viewModel.label} ${viewModel.roomType}`)) {
    return viewModel.label;
  }
  return viewModel.roomNumber;
}
