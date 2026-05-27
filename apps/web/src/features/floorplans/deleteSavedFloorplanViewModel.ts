import type { FloorplanLibraryCardViewModel } from "./floorplanLibraryViewModel";

export type DeleteSavedFloorplanDialogViewModel = {
  recordId: string;
  title: "Delete this saved floorplan copy?";
  irreversibleCopy: "This cannot be undone.";
  canonicalUnaffectedCopy: "The canonical floorplan will not be changed.";
  confirmLabel: "Delete saved copy";
  cancelLabel: "Cancel";
};

export function createDeleteSavedFloorplanDialogViewModel(
  floorplan: FloorplanLibraryCardViewModel
): DeleteSavedFloorplanDialogViewModel {
  if (!canDeleteSavedFloorplan(floorplan)) {
    throw new Error(`Only editable saved floorplan copies can be deleted: ${floorplan.recordId}`);
  }
  return {
    recordId: floorplan.recordId,
    title: "Delete this saved floorplan copy?",
    irreversibleCopy: "This cannot be undone.",
    canonicalUnaffectedCopy: "The canonical floorplan will not be changed.",
    confirmLabel: "Delete saved copy",
    cancelLabel: "Cancel"
  };
}

export function canDeleteSavedFloorplan(floorplan: Pick<FloorplanLibraryCardViewModel, "accessMode">): boolean {
  return floorplan.accessMode === "editable-saved";
}
