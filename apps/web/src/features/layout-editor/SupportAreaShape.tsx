import type { ZoneShapeViewModel } from "./hallwayZoneShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type SupportAreaShapeProps = {
  viewModel: ZoneShapeViewModel;
  isSelected?: boolean;
  onSelect?: (objectType: "zone", objectId: string) => void;
};

export function SupportAreaShape({
  viewModel,
  isSelected = false,
  onSelect
}: SupportAreaShapeProps) {
  return (
    <g
      className={`${selectedClassName("layout-editor-stage__support-area", isSelected)} layout-editor-stage__support-area--${viewModel.zoneType}`}
      data-hit-target-key={viewModel.hitTargetKey}
      data-layout-object-type="zone"
      data-layout-object-id={viewModel.objectId}
      data-geometry-kind="support_area"
      data-geometry-layer="editable_geometry"
      data-geometry-source-id={viewModel.objectId}
      data-render-source-kind="editable"
      data-support-area-kind={viewModel.zoneType}
      data-patient-assignable="false"
      data-assignment-target="false"
      role="img"
      aria-label={viewModel.ariaLabel}
      tabIndex={0}
      onClick={() => onSelect?.("zone", viewModel.objectId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.("zone", viewModel.objectId);
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
