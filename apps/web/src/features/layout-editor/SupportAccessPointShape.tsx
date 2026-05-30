import type { SupportAccessPointViewModel } from "./supportAccessPointViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type SupportAccessPointShapeProps = {
  viewModel: SupportAccessPointViewModel;
  isSelected?: boolean;
  onSelect?: (objectType: "support_access", objectId: string) => void;
};

export function SupportAccessPointShape({
  viewModel,
  isSelected = false,
  onSelect
}: SupportAccessPointShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__support-access", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-layout-object-type="support_access"
      data-layout-object-id={viewModel.objectId}
      data-support-access-owner-id={viewModel.ownerId}
      data-support-access-wall={viewModel.wall}
      data-support-access-orientation={viewModel.orientation}
      role="img"
      aria-label={viewModel.ariaLabel}
      tabIndex={0}
      onClick={() => onSelect?.("support_access", viewModel.objectId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.("support_access", viewModel.objectId);
        }
      }}
    >
      <rect
        className="layout-editor-stage__support-access-hit-target"
        x={viewModel.markerX - 7}
        y={viewModel.markerY - 7}
        width={viewModel.markerWidthPixels + 14}
        height={viewModel.markerHeightPixels + 14}
        rx="2"
      />
      <rect
        className="layout-editor-stage__support-access-marker"
        x={viewModel.markerX}
        y={viewModel.markerY}
        width={viewModel.markerWidthPixels}
        height={viewModel.markerHeightPixels}
        rx="2"
      />
    </g>
  );
}
