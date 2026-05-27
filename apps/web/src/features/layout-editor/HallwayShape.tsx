import type { HallwayShapeViewModel } from "./hallwayZoneShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type HallwayShapeProps = {
  viewModel: HallwayShapeViewModel;
  isSelected?: boolean;
  onSelect?: (objectType: "hallway", objectId: string) => void;
};

export function HallwayShape({ viewModel, isSelected = false, onSelect }: HallwayShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__hallway", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-layout-object-type="hallway"
      data-layout-object-id={viewModel.objectId}
      role="img"
      aria-label={viewModel.ariaLabel}
      tabIndex={0}
      onClick={() => onSelect?.("hallway", viewModel.objectId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.("hallway", viewModel.objectId);
        }
      }}
    >
      <rect
        x={viewModel.xPixels}
        y={viewModel.yPixels}
        width={viewModel.widthPixels}
        height={viewModel.heightPixels}
      />
      <text x={viewModel.labelX} y={viewModel.labelY}>{viewModel.label}</text>
    </g>
  );
}
