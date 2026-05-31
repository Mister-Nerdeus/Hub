export type EditorNormalToolbarProps = {
  saveWorkingCopyDisabled: boolean;
  addObjectDisabled: boolean;
  onSaveWorkingCopy: () => void;
  onDoneEditing: () => void;
  onAddRoom: () => void;
  onAddDoor: () => void;
  onAddSplitRoom: () => void;
  onAddNurseStation: () => void;
};

export function EditorNormalToolbar({
  saveWorkingCopyDisabled,
  addObjectDisabled,
  onSaveWorkingCopy,
  onDoneEditing,
  onAddRoom,
  onAddDoor,
  onAddSplitRoom,
  onAddNurseStation
}: EditorNormalToolbarProps) {
  return (
    <div
      className="editor-normal-toolbar"
      data-editor-normal-toolbar="save-done-add-room-add-door-add-split-room-add-nurse-station"
      data-normal-toolbar-matches-mockup="true"
    >
      <button
        type="button"
        className="editor-command-bar__save-primary"
        data-editor-control="save-working-copy"
        disabled={saveWorkingCopyDisabled}
        onClick={onSaveWorkingCopy}
      >
        Save Floorplan
      </button>
      <button type="button" onClick={onDoneEditing}>
        Done Editing
      </button>
      <button type="button" disabled={addObjectDisabled} onClick={onAddRoom}>
        Add Room
      </button>
      <button type="button" disabled={addObjectDisabled} onClick={onAddDoor}>
        Add Door
      </button>
      <button type="button" disabled={addObjectDisabled} onClick={onAddSplitRoom}>
        Add Split Room
      </button>
      <button type="button" disabled={addObjectDisabled} onClick={onAddNurseStation}>
        Add Nurse Station
      </button>
    </div>
  );
}
