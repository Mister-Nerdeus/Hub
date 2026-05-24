import type { RoomResizeHandlesViewModel } from "./roomResizeHandlesViewModel";

export type RoomResizeHandlesProps = {
  viewModel: RoomResizeHandlesViewModel;
};

export function RoomResizeHandles({ viewModel }: RoomResizeHandlesProps) {
  return (
    <g
      className="layout-editor-stage__resize-handles"
      data-object-type={viewModel.objectType}
      data-object-id={viewModel.objectId}
      data-display-only={String(viewModel.isDisplayOnly)}
      aria-label={`Display-only resize handles for ${viewModel.objectId}`}
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
          />
        );
      })}
    </g>
  );
}
