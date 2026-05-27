import type { DeleteSavedFloorplanDialogViewModel } from "./deleteSavedFloorplanViewModel";

type DeleteSavedFloorplanDialogProps = {
  viewModel: DeleteSavedFloorplanDialogViewModel;
  onCancel: () => void;
  onConfirm: (recordId: string) => void;
};

export function DeleteSavedFloorplanDialog({
  viewModel,
  onCancel,
  onConfirm
}: DeleteSavedFloorplanDialogProps) {
  return (
    <div className="delete-saved-floorplan-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-saved-floorplan-title">
      <div className="delete-saved-floorplan-dialog__panel">
        <h3 id="delete-saved-floorplan-title">{viewModel.title}</h3>
        <p>{viewModel.irreversibleCopy}</p>
        <p>{viewModel.canonicalUnaffectedCopy}</p>
        <div className="delete-saved-floorplan-dialog__actions">
          <button type="button" onClick={onCancel}>{viewModel.cancelLabel}</button>
          <button type="button" onClick={() => onConfirm(viewModel.recordId)}>
            {viewModel.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
