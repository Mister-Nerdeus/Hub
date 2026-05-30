import type { ActiveFloorplanBannerViewModel } from "./activeFloorplanBannerViewModel";

type FloorplanChangeConfirmationDialogProps = {
  currentFloorplan: ActiveFloorplanBannerViewModel;
  targetVersionLabel: string;
  missingRoomIds: readonly string[];
  onCancel: () => void;
  onConfirm: () => void;
};

export function FloorplanChangeConfirmationDialog({
  currentFloorplan,
  targetVersionLabel,
  missingRoomIds,
  onCancel,
  onConfirm
}: FloorplanChangeConfirmationDialogProps) {
  return (
    <div className="floorplan-change-dialog" role="dialog" aria-modal="true" aria-labelledby="floorplan-change-title">
      <div className="floorplan-change-dialog__panel">
        <h3 id="floorplan-change-title">Change active floorplan?</h3>
        <p>
          Your current assignment set was built for {currentFloorplan.displayName} {currentFloorplan.versionLabel}.
        </p>
        <p>Changing floorplans may make some room assignments incompatible.</p>
        <p>New selection: {targetVersionLabel}</p>
        {missingRoomIds.length === 0 ? null : (
          <p>Missing room IDs: {missingRoomIds.join(", ")}</p>
        )}
        <div>
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" onClick={onConfirm}>Change Floorplan</button>
        </div>
      </div>
    </div>
  );
}
