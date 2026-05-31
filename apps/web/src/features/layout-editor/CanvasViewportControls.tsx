import type { LayoutEditorViewport } from "./layoutEditorState";
import type { EditorPopupMode } from "./EditorPopupModeControl";

export type CanvasViewportControlsProps = {
  viewport: LayoutEditorViewport;
  popupMode: EditorPopupMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanNorth: () => void;
  onPanSouth: () => void;
  onPanWest: () => void;
  onPanEast: () => void;
  onReset: () => void;
  onFit: () => void;
  onPopupModeChange: (mode: EditorPopupMode) => void;
};

export function CanvasViewportControls({
  viewport,
  popupMode,
  onZoomIn,
  onZoomOut,
  onPanNorth,
  onPanSouth,
  onPanWest,
  onPanEast,
  onReset,
  onFit,
  onPopupModeChange
}: CanvasViewportControlsProps) {
  return (
    <aside
      className="canvas-viewport-controls"
      aria-label="Canvas controls"
      data-canvas-viewport-controls="compact"
      data-controls-do-not-crowd-toolbar="true"
    >
      <div className="canvas-viewport-controls__group" aria-label="Zoom controls">
        <button type="button" aria-label="Zoom out" title="Zoom out" onClick={onZoomOut}>
          -
        </button>
        <output aria-label="Current zoom">{Math.round(viewport.zoom * 100)}%</output>
        <button type="button" aria-label="Zoom in" title="Zoom in" onClick={onZoomIn}>
          +
        </button>
      </div>
      <div className="canvas-viewport-controls__group canvas-viewport-controls__pan" aria-label="Pan controls">
        <button type="button" aria-label="Pan north" title="Pan north" onClick={onPanNorth}>
          N
        </button>
        <button type="button" aria-label="Pan west" title="Pan west" onClick={onPanWest}>
          W
        </button>
        <button type="button" aria-label="Pan south" title="Pan south" onClick={onPanSouth}>
          S
        </button>
        <button type="button" aria-label="Pan east" title="Pan east" onClick={onPanEast}>
          E
        </button>
      </div>
      <div className="canvas-viewport-controls__group" aria-label="Viewport actions">
        <button type="button" aria-label="Fit to floorplan" title="Fit to floorplan" onClick={onFit}>
          Fit
        </button>
        <button type="button" aria-label="Reset viewport" title="Reset viewport" onClick={onReset}>
          Reset
        </button>
      </div>
      <div className="canvas-viewport-controls__group" aria-label="Popup mode">
        <button
          type="button"
          aria-pressed={popupMode === "auto"}
          title="Automatic object controls"
          onClick={() => onPopupModeChange("auto")}
        >
          Auto
        </button>
        <button
          type="button"
          aria-pressed={popupMode === "canvas"}
          title="Canvas object controls"
          onClick={() => onPopupModeChange("canvas")}
        >
          Canvas
        </button>
        <button
          type="button"
          aria-pressed={popupMode === "docked"}
          title="Dock object controls"
          onClick={() => onPopupModeChange("docked")}
        >
          Dock
        </button>
      </div>
    </aside>
  );
}
