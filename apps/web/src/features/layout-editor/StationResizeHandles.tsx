import type { PointerEvent } from "react";

import type {
  StationResizeHandle,
  StationResizeHandlesViewModel
} from "./stationResizeHandlesViewModel";

export type StationResizeHandlesProps = {
  viewModel: StationResizeHandlesViewModel;
  onResizeStart?: (
    stationId: string,
    handle: StationResizeHandle,
    event: PointerEvent<SVGRectElement>
  ) => void;
  onResize?: (
    stationId: string,
    handle: StationResizeHandle,
    event: PointerEvent<SVGRectElement>
  ) => void;
  onResizeEnd?: (
    stationId: string,
    handle: StationResizeHandle,
    event: PointerEvent<SVGRectElement>
  ) => void;
};

export function StationResizeHandles({
  viewModel,
  onResizeStart,
  onResize,
  onResizeEnd
}: StationResizeHandlesProps) {
  return (
    <g
      className="layout-editor-stage__resize-handles layout-editor-stage__station-resize-handles"
      data-object-type={viewModel.objectType}
      data-object-id={viewModel.objectId}
      data-display-only={String(viewModel.isDisplayOnly)}
      aria-label={`Resize handles for ${viewModel.objectId}`}
    >
      {viewModel.handles.map((handle) => {
        const halfSize = handle.sizePixels / 2;
        return (
          <rect
            key={handle.handle}
            className={`layout-editor-stage__resize-handle layout-editor-stage__resize-handle--${handle.handle}`}
            x={handle.xPixels - halfSize}
            y={handle.yPixels - halfSize}
            width={handle.sizePixels}
            height={handle.sizePixels}
            rx="1"
            role="img"
            aria-label={handle.ariaLabel}
            data-handle={handle.handle}
            onPointerDown={(event) => onResizeStart?.(viewModel.objectId, handle.handle, event)}
            onPointerMove={(event) => onResize?.(viewModel.objectId, handle.handle, event)}
            onPointerUp={(event) => onResizeEnd?.(viewModel.objectId, handle.handle, event)}
            onPointerCancel={(event) => onResizeEnd?.(viewModel.objectId, handle.handle, event)}
          />
        );
      })}
    </g>
  );
}
