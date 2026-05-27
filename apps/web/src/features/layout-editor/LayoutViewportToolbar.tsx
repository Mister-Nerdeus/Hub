import type { LayoutEditorViewport } from "./layoutEditorState";

export type LayoutViewportToolbarProps = {
  viewport: LayoutEditorViewport;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanNorth: () => void;
  onPanSouth: () => void;
  onPanWest: () => void;
  onPanEast: () => void;
  onReset?: () => void;
};

export function LayoutViewportToolbar({
  viewport,
  onZoomIn,
  onZoomOut,
  onPanNorth,
  onPanSouth,
  onPanWest,
  onPanEast,
  onReset
}: LayoutViewportToolbarProps) {
  return (
    <div className="layout-viewport-toolbar" aria-label="Layout viewport controls">
      <div className="layout-viewport-toolbar__group">
        <button type="button" aria-label="Zoom out" title="Zoom out" onClick={onZoomOut}>
          -
        </button>
        <output aria-label="Current zoom">{Math.round(viewport.zoom * 100)}%</output>
        <button type="button" aria-label="Zoom in" title="Zoom in" onClick={onZoomIn}>
          +
        </button>
      </div>
      <div className="layout-viewport-toolbar__group">
        <button type="button" aria-label="Pan west" title="Pan west" onClick={onPanWest}>
          W
        </button>
        <button type="button" aria-label="Pan north" title="Pan north" onClick={onPanNorth}>
          N
        </button>
        <button type="button" aria-label="Pan south" title="Pan south" onClick={onPanSouth}>
          S
        </button>
        <button type="button" aria-label="Pan east" title="Pan east" onClick={onPanEast}>
          E
        </button>
      </div>
      {onReset == null ? null : (
        <button
          type="button"
          className="layout-viewport-toolbar__reset"
          aria-label="Reset viewport"
          onClick={onReset}
        >
          Reset
        </button>
      )}
    </div>
  );
}
