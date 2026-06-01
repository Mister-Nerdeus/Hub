import type { ReactNode } from "react";
import { ReferenceOverlayToggle } from "./ReferenceOverlayToggle";

export type EditorNormalToolbarProps = {
  saveDisabled: boolean;
  addDisabled: boolean;
  onSaveFloorplan: () => void;
  onDoneEditing: () => void;
  onAddRoom: () => void;
  onAddDoor: () => void;
  onAddSplitRoom: () => void;
  onAddNurseStation: () => void;
  referenceOverlayVisible: boolean;
  onToggleReferenceOverlay: () => void;
  routeGraphVisible: boolean;
  onToggleRouteGraph: () => void;
  advancedContent: ReactNode;
};

export function EditorNormalToolbar({
  saveDisabled,
  addDisabled,
  onSaveFloorplan,
  onDoneEditing,
  onAddRoom,
  onAddDoor,
  onAddSplitRoom,
  onAddNurseStation,
  referenceOverlayVisible,
  onToggleReferenceOverlay,
  routeGraphVisible,
  onToggleRouteGraph,
  advancedContent
}: EditorNormalToolbarProps) {
  return (
    <section
      className="editor-normal-toolbar"
      aria-label="Floorplan editor toolbar"
      data-editor-normal-toolbar="true"
      data-normal-toolbar-actions="save done add-room add-door add-split-room add-nurse-station advanced"
    >
      <div className="editor-normal-toolbar__actions">
        <button
          type="button"
          className="editor-normal-toolbar__primary"
          data-editor-normal-action="save-floorplan"
          disabled={saveDisabled}
          onClick={onSaveFloorplan}
        >
          Save Floorplan
        </button>
        <button type="button" data-editor-normal-action="done-editing" onClick={onDoneEditing}>
          Done Editing
        </button>
        <button type="button" data-editor-normal-action="add-room" disabled={addDisabled} onClick={onAddRoom}>
          Add Room
        </button>
        <button type="button" data-editor-normal-action="add-door" disabled={addDisabled} onClick={onAddDoor}>
          Add Door
        </button>
        <button
          type="button"
          data-editor-normal-action="add-split-room"
          disabled={addDisabled}
          onClick={onAddSplitRoom}
        >
          Add Split Room
        </button>
        <button
          type="button"
          data-editor-normal-action="add-nurse-station"
          disabled={addDisabled}
          onClick={onAddNurseStation}
        >
          Add Nurse Station
        </button>
        <ReferenceOverlayToggle
          visible={referenceOverlayVisible}
          onToggle={onToggleReferenceOverlay}
        />
        <button
          type="button"
          data-editor-normal-action="toggle-route-graph"
          aria-pressed={routeGraphVisible ? "true" : "false"}
          onClick={onToggleRouteGraph}
        >
          {routeGraphVisible ? "Hide Routes" : "Show Routes"}
        </button>
      </div>
      <details className="editor-normal-toolbar__advanced" data-editor-normal-action="advanced">
        <summary>Advanced</summary>
        <div className="editor-normal-toolbar__advanced-body">
          {advancedContent}
        </div>
      </details>
    </section>
  );
}
