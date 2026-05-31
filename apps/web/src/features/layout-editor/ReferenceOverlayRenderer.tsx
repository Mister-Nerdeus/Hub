import type { ReactNode } from "react";
import type { ReferenceOverlayViewModel } from "./referenceOverlayViewModel";

type ReferenceOverlayRendererProps = {
  viewModel: ReferenceOverlayViewModel;
  children: ReactNode;
};

export function ReferenceOverlayRenderer({
  viewModel,
  children
}: ReferenceOverlayRendererProps) {
  if (!viewModel.visible) {
    return null;
  }
  return (
    <g
      className={`layout-editor-stage__reference-overlay ${viewModel.className}`}
      data-reference-overlay="true"
      data-reference-overlay-id={viewModel.overlayId}
      data-reference-overlay-locked="true"
      data-reference-overlay-editable-geometry="false"
      data-reference-overlay-no-edit-handles="true"
      data-reference-overlay-reason={viewModel.reasonLocked}
      opacity={viewModel.opacity}
      aria-label={`${viewModel.label}: ${viewModel.reasonLocked}`}
    >
      {children}
    </g>
  );
}
