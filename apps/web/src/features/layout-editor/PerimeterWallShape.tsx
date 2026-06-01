import type { PerimeterWallViewModel } from "./perimeterWallViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type PerimeterWallShapeProps = {
  viewModel: PerimeterWallViewModel;
  isSelected?: boolean;
  onSelect?: (objectType: "perimeter_wall", objectId: string) => void;
};

export function PerimeterWallShape({
  viewModel,
  isSelected = false,
  onSelect
}: PerimeterWallShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__perimeter-wall", isSelected)}
      data-layout-object-type="perimeter_wall"
      data-layout-object-id={viewModel.objectId}
      data-perimeter-wall-id={viewModel.objectId}
      data-blocks-travel="true"
      data-selectable="true"
      data-locked={viewModel.locked ? "true" : "false"}
      role="img"
      aria-label={viewModel.ariaLabel}
      tabIndex={0}
      onClick={() => onSelect?.("perimeter_wall", viewModel.objectId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.("perimeter_wall", viewModel.objectId);
        }
      }}
    >
      {viewModel.segments.map((segment) => (
        <rect
          key={segment.segmentId}
          className="layout-editor-stage__perimeter-wall-segment"
          data-perimeter-wall-segment-id={segment.segmentId}
          data-perimeter-wall-segment-label={segment.label}
          data-perimeter-wall-orientation={segment.orientation}
          data-locked={segment.locked ? "true" : "false"}
          x={segment.xPixels}
          y={segment.yPixels}
          width={segment.widthPixels}
          height={segment.heightPixels}
          rx="0"
        />
      ))}
      {isSelected ? (
        <text
          className="layout-editor-stage__perimeter-wall-label"
          x={viewModel.segments[0]?.xPixels ?? 0}
          y={(viewModel.segments[0]?.yPixels ?? 0) - 6}
        >
          {viewModel.label}
        </text>
      ) : null}
    </g>
  );
}
