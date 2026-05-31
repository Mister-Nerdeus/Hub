import {
  createReferenceOverlayContract,
  type ReferenceOverlayContract
} from "@nerdeus/shared";

export type ReferenceOverlayViewModel = {
  overlayId: string;
  label: string;
  locked: true;
  toggleable: true;
  visible: boolean;
  opacity: number;
  className: "layout-editor-stage__reference-overlay--faded" | "layout-editor-stage__reference-overlay--dashed-faded";
  editableGeometry: false;
  reasonLocked: string;
};

export function buildReferenceOverlayViewModel(input: {
  overlay: ReferenceOverlayContract;
  visible?: boolean;
}): ReferenceOverlayViewModel {
  return {
    overlayId: input.overlay.referenceOverlayId,
    label: input.overlay.label,
    locked: true,
    toggleable: true,
    visible: input.visible ?? input.overlay.visibleByDefault,
    opacity: input.overlay.opacity,
    className: input.overlay.style === "dashed_faded"
      ? "layout-editor-stage__reference-overlay--dashed-faded"
      : "layout-editor-stage__reference-overlay--faded",
    editableGeometry: false,
    reasonLocked: input.overlay.reasonLocked
  };
}

export const defaultReferenceOverlayViewModel = buildReferenceOverlayViewModel({
  overlay: createReferenceOverlayContract({
    referenceOverlayId: "reference-overlay-floorplan-parity",
    sourceObjectId: "floorplan-reference-overlay",
    label: "Reference overlay",
    visibleByDefault: true
  })
});
