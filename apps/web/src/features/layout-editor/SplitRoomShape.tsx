import type { SplitRoomContract } from "@nerdeus/shared";

import {
  BedPositionShape,
  type BedPositionParentBoundsPixels
} from "./BedPositionShape";

export const SPLIT_ROOM_RENDERER_CONTRACT = "geometry-truth-split-room-renderer-v1" as const;

type SplitRoomShapeProps = {
  splitRoom: SplitRoomContract;
  parentBounds: BedPositionParentBoundsPixels;
  isSelected?: boolean;
  selectedBedPositionId?: string | null;
  onSelectParent?: (splitRoomId: string) => void;
  onSelectBedPosition?: (objectType: "bed_position", objectId: string) => void;
};

export function SplitRoomShape({
  splitRoom,
  parentBounds,
  isSelected = false,
  selectedBedPositionId = null,
  onSelectParent,
  onSelectBedPosition
}: SplitRoomShapeProps) {
  const divider = dividerLine(splitRoom, parentBounds);
  return (
    <g
      className={`layout-editor-stage__split-room-parent${isSelected ? " is-selected" : ""}`}
      data-renderer-contract={SPLIT_ROOM_RENDERER_CONTRACT}
      data-layout-object-type="split_room_parent"
      data-layout-object-id={splitRoom.splitRoomId}
      data-geometry-kind="split_room_parent"
      data-geometry-source-id={splitRoom.splitRoomId}
      data-selectable="true"
      data-editable="true"
      data-removable="true"
      data-selection-scope="split-room-parent"
      data-parent-room-id={splitRoom.parentRoomId}
      data-bed-position-count={splitRoom.bedPositions.length}
      data-divider-orientation={splitRoom.dividerOrientation}
      data-divider-ratio={splitRoom.dividerRatio}
      role="img"
      aria-label={`Split room parent ${splitRoom.parentRoomId}`}
      tabIndex={0}
      onClick={() => onSelectParent?.(splitRoom.splitRoomId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectParent?.(splitRoom.splitRoomId);
        }
      }}
    >
      <rect
        className="layout-editor-stage__split-room-parent-outline"
        x={parentBounds.xPixels}
        y={parentBounds.yPixels}
        width={parentBounds.widthPixels}
        height={parentBounds.heightPixels}
      />
      <line
        className="layout-editor-stage__split-room-divider"
        x1={divider.x1}
        y1={divider.y1}
        x2={divider.x2}
        y2={divider.y2}
      />
      {splitRoom.bedPositions.map((bedPosition) => (
        <BedPositionShape
          key={bedPosition.bedPositionId}
          bedPosition={bedPosition}
          parentBounds={parentBounds}
          isSelected={selectedBedPositionId === bedPosition.bedPositionId}
          onSelect={onSelectBedPosition}
        />
      ))}
    </g>
  );
}

function dividerLine(
  splitRoom: SplitRoomContract,
  parentBounds: BedPositionParentBoundsPixels
) {
  if (splitRoom.dividerOrientation === "horizontal") {
    const y = parentBounds.yPixels + parentBounds.heightPixels * splitRoom.dividerRatio;
    return {
      x1: parentBounds.xPixels,
      y1: y,
      x2: parentBounds.xPixels + parentBounds.widthPixels,
      y2: y
    };
  }
  const x = parentBounds.xPixels + parentBounds.widthPixels * splitRoom.dividerRatio;
  return {
    x1: x,
    y1: parentBounds.yPixels,
    x2: x,
    y2: parentBounds.yPixels + parentBounds.heightPixels
  };
}
