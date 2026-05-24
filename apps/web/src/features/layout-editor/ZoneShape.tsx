import type { ZoneShapeViewModel } from "./hallwayZoneShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type ZoneShapeProps = {
  viewModel: ZoneShapeViewModel;
  isSelected?: boolean;
  onSelect?: (objectType: "zone", objectId: string) => void;
};

export function ZoneShape({ viewModel, isSelected = false, onSelect }: ZoneShapeProps) {
  return (
    <g
      className={`${selectedClassName("layout-editor-stage__zone", isSelected)} layout-editor-stage__zone--${viewModel.zoneType}`}
      data-hit-target-key={viewModel.hitTargetKey}
      data-zone-type={viewModel.zoneType}
      role="img"
      aria-label={viewModel.ariaLabel}
      onClick={() => onSelect?.("zone", viewModel.objectId)}
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
