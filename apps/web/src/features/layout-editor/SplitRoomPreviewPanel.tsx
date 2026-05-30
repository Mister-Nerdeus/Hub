import type { SplitRoomWorkflowViewModel } from "./splitRoomWorkflowViewModel";
import { splitRoomDisplayName } from "./splitRoomTerminology";

export function SplitRoomPreviewPanel({
  viewModel,
  onClose
}: {
  viewModel: SplitRoomWorkflowViewModel | null;
  onClose: () => void;
}) {
  if (viewModel == null || viewModel.pairLabel == null) {
    return null;
  }
  return (
    <aside className="split-room-preview-panel" data-split-room-preview="visible">
      <header>
        <h4>{splitRoomDisplayName(viewModel.pairLabel)} preview</h4>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      <div className="split-room-preview-panel__diagram" aria-label={`${splitRoomDisplayName(viewModel.pairLabel)} preview diagram`}>
        <span>{viewModel.pairLabel.split("/")[0]}</span>
        <i aria-hidden="true" />
        <span>{viewModel.pairLabel.split("/")[1]}</span>
      </div>
      <p>{viewModel.description}</p>
    </aside>
  );
}
