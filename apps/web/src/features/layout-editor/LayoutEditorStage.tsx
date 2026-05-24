import { useReducer } from "react";
import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import { layoutEditorReducer, panViewportAction } from "./layoutEditorReducer";
import { LayoutInspectorPanel } from "./LayoutInspectorPanel";
import { buildLayoutInspectorViewModel } from "./layoutInspectorViewModel";
import { buildLayoutGridViewModel } from "./layoutGridViewModel";
import { createLayoutEditorState } from "./layoutEditorState";
import { LayoutViewportToolbar } from "./LayoutViewportToolbar";
import "./LayoutEditorStage.css";

const STAGE_WIDTH_FEET = 64;
const STAGE_HEIGHT_FEET = 40;
const STAGE_PIXELS_PER_FOOT = 12;
const STAGE_WIDTH_PIXELS = STAGE_WIDTH_FEET * STAGE_PIXELS_PER_FOOT;
const STAGE_HEIGHT_PIXELS = STAGE_HEIGHT_FEET * STAGE_PIXELS_PER_FOOT;
const STAGE_VIEW_BOX = `0 0 ${STAGE_WIDTH_PIXELS} ${STAGE_HEIGHT_PIXELS}`;

const proofLayout: EditableLayoutGeometryContract = {
  schemaVersion: "1.0.0",
  layoutId: "layout-editor-stage-proof",
  units: "feet",
  rooms: [
    {
      objectType: "room",
      id: "room-01",
      label: "Room 01",
      roomNumber: "01",
      roomType: "standard",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 0,
      yFeet: 0,
      widthFeet: 12,
      heightFeet: 10
    }
  ],
  doors: [
    {
      objectType: "door",
      id: "door-room-01-east",
      label: "Room 01 east door",
      ownerKind: "room",
      ownerId: "room-01",
      wall: "east",
      offsetFeet: 3,
      widthFeet: 4
    }
  ],
  stations: [
    {
      objectType: "station",
      id: "station-primary",
      label: "Primary nurse station",
      stationType: "nurse_station",
      xFeet: 18,
      yFeet: 0,
      widthFeet: 10,
      heightFeet: 6
    }
  ],
  hallways: [
    {
      objectType: "hallway",
      id: "hall-main",
      label: "Main hallway",
      xFeet: 0,
      yFeet: 12,
      widthFeet: 64,
      heightFeet: 8
    }
  ],
  zones: [
    {
      objectType: "zone",
      id: "zone-entry",
      label: "Entry zone",
      zoneType: "ems_entry",
      xFeet: 32,
      yFeet: 0,
      widthFeet: 12,
      heightFeet: 8
    }
  ],
  limitations: ["Proof-only stage shell; source geometry remains feet-based."]
};

const initialStageState = createLayoutEditorState({
  editableLayout: proofLayout,
  viewport: {
    pixelsPerFoot: STAGE_PIXELS_PER_FOOT,
    zoom: 1,
    panXFeet: 0,
    panYFeet: 0
  },
  selectedObjectId: "room-01",
  selectedObjectType: "room",
  snapMode: "default"
});

export function LayoutEditorStage() {
  const [stageState, dispatchStage] = useReducer(layoutEditorReducer, initialStageState);
  const grid = buildLayoutGridViewModel({
    widthFeet: STAGE_WIDTH_FEET,
    heightFeet: STAGE_HEIGHT_FEET,
    viewport: stageState.viewport,
    gridSpacingFeet: 1,
    majorEveryFeet: 5
  });
  const inspectorViewModel = buildLayoutInspectorViewModel({
    layout: stageState.editableLayout,
    selectedObjectId: stageState.selectedObjectId,
    selectedObjectType: stageState.selectedObjectType
  });

  return (
    <section
      id="layout-editor-stage-proof"
      className="layout-editor-stage"
      aria-labelledby="layout-editor-stage-title"
    >
      <header className="layout-editor-stage__header">
        <div>
          <p className="eyebrow">Layout editor proof</p>
          <h2 id="layout-editor-stage-title">SVG stage shell</h2>
        </div>
        <dl className="layout-editor-stage__meta" aria-label="Layout editor stage metadata">
          <div>
            <dt>Layout</dt>
            <dd>{stageState.editableLayout?.layoutId}</dd>
          </div>
          <div>
            <dt>Units</dt>
            <dd>{stageState.editableLayout?.units}</dd>
          </div>
          <div>
            <dt>Snap</dt>
            <dd>{stageState.snapMode}</dd>
          </div>
        </dl>
      </header>

      <LayoutViewportToolbar
        viewport={stageState.viewport}
        onZoomIn={() => dispatchStage({ type: "zoomViewport", direction: "in" })}
        onZoomOut={() => dispatchStage({ type: "zoomViewport", direction: "out" })}
        onPanNorth={() => dispatchStage(panViewportAction("north"))}
        onPanSouth={() => dispatchStage(panViewportAction("south"))}
        onPanWest={() => dispatchStage(panViewportAction("west"))}
        onPanEast={() => dispatchStage(panViewportAction("east"))}
        onReset={() => dispatchStage({ type: "resetViewport" })}
      />

      <div className="layout-editor-stage__workspace">
        <div className="layout-editor-stage__shell" data-proof-only="true">
          <svg
            className="layout-editor-stage__svg"
            viewBox={STAGE_VIEW_BOX}
            role="img"
            aria-label="Feet-based SVG grid stage"
          >
            <rect
              className="layout-editor-stage__frame"
              x="0"
              y="0"
              width={STAGE_WIDTH_PIXELS}
              height={STAGE_HEIGHT_PIXELS}
              rx="0"
            />
            <g>
              {grid.verticalLines.map((line) => (
                <line
                  key={line.id}
                  className={line.isMajor ? "layout-editor-stage__grid-line--major" : "layout-editor-stage__grid-line"}
                  x1={line.x1Pixels}
                  y1={line.y1Pixels}
                  x2={line.x2Pixels}
                  y2={line.y2Pixels}
                />
              ))}
              {grid.horizontalLines.map((line) => (
                <line
                  key={line.id}
                  className={line.isMajor ? "layout-editor-stage__grid-line--major" : "layout-editor-stage__grid-line"}
                  x1={line.x1Pixels}
                  y1={line.y1Pixels}
                  x2={line.x2Pixels}
                  y2={line.y2Pixels}
                />
              ))}
            </g>
            <g className="layout-editor-stage__labels">
              {grid.verticalLines
                .filter((line) => line.isMajor)
                .map((line) => (
                  <text key={`${line.id}-label`} x={line.x1Pixels + 3} y="14">
                    {line.label}
                  </text>
                ))}
              {grid.horizontalLines
                .filter((line) => line.isMajor && line.valueFeet > 0)
                .map((line) => (
                  <text key={`${line.id}-label`} x="4" y={line.y1Pixels - 4}>
                    {line.label}
                  </text>
                ))}
            </g>
          </svg>
        </div>
        <LayoutInspectorPanel viewModel={inspectorViewModel} />
      </div>
    </section>
  );
}
