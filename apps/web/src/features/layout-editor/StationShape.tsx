import type { PointerEvent } from "react";

import type { StationShapeViewModel } from "./stationShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type StationShapeProps = {
  viewModel: StationShapeViewModel;
  isSelected?: boolean;
  presentation?: boolean;
  onSelect?: (objectType: "station", objectId: string) => void;
  onMoveStart?: (objectId: string, event: PointerEvent<SVGGElement>) => void;
  onMove?: (objectId: string, event: PointerEvent<SVGGElement>) => void;
  onMoveEnd?: (objectId: string, event: PointerEvent<SVGGElement>) => void;
};

export function StationShape({
  viewModel,
  isSelected = false,
  presentation = false,
  onSelect,
  onMoveStart,
  onMove,
  onMoveEnd
}: StationShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__station", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-layout-object-type="station"
      data-layout-object-id={viewModel.objectId}
      data-station-type={viewModel.stationType}
      role="img"
      aria-label={viewModel.ariaLabel}
      tabIndex={0}
      onClick={() => onSelect?.("station", viewModel.objectId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.("station", viewModel.objectId);
        }
      }}
      onPointerDown={(event) => onMoveStart?.(viewModel.objectId, event)}
      onPointerMove={(event) => onMove?.(viewModel.objectId, event)}
      onPointerUp={(event) => onMoveEnd?.(viewModel.objectId, event)}
      onPointerCancel={(event) => onMoveEnd?.(viewModel.objectId, event)}
    >
      {presentation ? (
        <>
          <rect
            className="layout-editor-stage__station-hit-target"
            x={viewModel.xPixels}
            y={viewModel.yPixels}
            width={viewModel.widthPixels}
            height={viewModel.heightPixels}
          />
          {viewModel.presentationStyle === "curved_desk" ? (
            <path
              className="layout-editor-stage__station-presentation"
              data-presentation-style={viewModel.presentationStyle}
              d={viewModel.presentationPath}
            />
          ) : (
            <rect
              className="layout-editor-stage__station-presentation"
              data-presentation-style={viewModel.presentationStyle}
              x={viewModel.xPixels}
              y={viewModel.yPixels}
              width={viewModel.widthPixels}
              height={viewModel.heightPixels}
            />
          )}
          <rect
            className="layout-editor-stage__station-label-plate"
            x={viewModel.labelPlate.xPixels}
            y={viewModel.labelPlate.yPixels}
            width={viewModel.labelPlate.widthPixels}
            height={viewModel.labelPlate.heightPixels}
            rx={3}
          />
          <text
            className="layout-editor-stage__station-label-plate-text"
            x={viewModel.labelPlate.textX}
            y={viewModel.labelPlate.textY}
          >
            {viewModel.labelPlate.label}
          </text>
        </>
      ) : (
        <rect
          x={viewModel.xPixels}
          y={viewModel.yPixels}
          width={viewModel.widthPixels}
          height={viewModel.heightPixels}
        />
      )}
      {presentation ? null : <text x={viewModel.labelX} y={viewModel.labelY}>{viewModel.label}</text>}
    </g>
  );
}
