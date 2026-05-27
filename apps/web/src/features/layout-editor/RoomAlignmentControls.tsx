import type { RoomAlignmentActionId, RoomAlignmentViewModel } from "./roomAlignmentViewModel";

export function RoomAlignmentControls({
  viewModel,
  onApply
}: {
  viewModel: RoomAlignmentViewModel;
  onApply: (actionId: RoomAlignmentActionId) => void;
}) {
  return (
    <aside className="room-alignment-controls" data-room-alignment-controls={viewModel.status}>
      <h4>Room alignment</h4>
      <div>
        {viewModel.actions.map((action) => (
          <button key={action.id} type="button" disabled={action.disabled} onClick={() => onApply(action.id)}>
            {action.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
