import { SPLIT_ROOM_HELP_COPY } from "./splitRoomTerminology";

export function SplitRoomHelpPanel() {
  return (
    <aside className="split-room-help-panel" data-split-room-help="visible">
      <h4>What is a split room?</h4>
      <p>{SPLIT_ROOM_HELP_COPY}</p>
    </aside>
  );
}
