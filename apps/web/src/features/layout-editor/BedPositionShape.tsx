import type { BedPositionContract } from "@nerdeus/shared";

export const BED_POSITION_RENDERER_CONTRACT = "geometry-truth-bed-position-renderer-v1" as const;

export type BedPositionParentBoundsPixels = {
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
};

type BedPositionShapeProps = {
  bedPosition: BedPositionContract;
  parentBounds: BedPositionParentBoundsPixels;
  isSelected?: boolean;
  onSelect?: (bedPositionId: string) => void;
};

export function BedPositionShape({
  bedPosition,
  parentBounds,
  isSelected = false,
  onSelect
}: BedPositionShapeProps) {
  const bounds = bedPositionPixelBounds(bedPosition, parentBounds);
  return (
    <g
      className={`layout-editor-stage__bed-position${isSelected ? " is-selected" : ""}`}
      data-renderer-contract={BED_POSITION_RENDERER_CONTRACT}
      data-layout-object-type="bed_position"
      data-layout-object-id={bedPosition.bedPositionId}
      data-parent-room-id={bedPosition.parentRoomId}
      data-assignment-target={bedPosition.assignmentTarget ? "true" : "false"}
      role="img"
      aria-label={`Bed position ${bedPosition.label}`}
      tabIndex={0}
      onClick={() => onSelect?.(bedPosition.bedPositionId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(bedPosition.bedPositionId);
        }
      }}
    >
      <rect
        className="layout-editor-stage__bed-position-rect"
        x={bounds.xPixels}
        y={bounds.yPixels}
        width={bounds.widthPixels}
        height={bounds.heightPixels}
      />
      <text
        className="layout-editor-stage__bed-position-label"
        x={bounds.xPixels + bounds.widthPixels / 2}
        y={bounds.yPixels + bounds.heightPixels / 2}
      >
        {bedPosition.label}
      </text>
    </g>
  );
}

export function bedPositionPixelBounds(
  bedPosition: BedPositionContract,
  parentBounds: BedPositionParentBoundsPixels
): BedPositionParentBoundsPixels {
  return {
    xPixels: parentBounds.xPixels + parentBounds.widthPixels * bedPosition.relativeBounds.xRatio,
    yPixels: parentBounds.yPixels + parentBounds.heightPixels * bedPosition.relativeBounds.yRatio,
    widthPixels: parentBounds.widthPixels * bedPosition.relativeBounds.widthRatio,
    heightPixels: parentBounds.heightPixels * bedPosition.relativeBounds.heightRatio
  };
}
