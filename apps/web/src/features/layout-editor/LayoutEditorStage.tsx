import { useReducer } from "react";

import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { DoorShape } from "./DoorShape";
import { buildDoorShapeViewModel } from "./doorShapeViewModel";
import { layoutEditorReducer, panViewportAction } from "./layoutEditorReducer";
import { HallwayShape } from "./HallwayShape";
import {
  buildHallwayShapeViewModel,
  buildZoneShapeViewModel
} from "./hallwayZoneShapeViewModel";
import { LayoutInspectorPanel } from "./LayoutInspectorPanel";
import { buildLayoutInspectorViewModel } from "./layoutInspectorViewModel";
import { buildLayoutGridViewModel } from "./layoutGridViewModel";
import { buildLayoutObjectRenderPipeline } from "./layoutObjectRenderPipeline";
import { isLayoutObjectSelected } from "./layoutSelectionHighlight";
import { createLayoutEditorState } from "./layoutEditorState";
import { LayoutViewportToolbar } from "./LayoutViewportToolbar";
import { RoomShape } from "./RoomShape";
import { buildRoomShapeViewModel } from "./roomShapeViewModel";
import { StationShape } from "./StationShape";
import { buildStationShapeViewModel } from "./stationShapeViewModel";
import { ZoneShape } from "./ZoneShape";
import "./LayoutEditorStage.css";

const STAGE_WIDTH_FEET = 64;
const STAGE_HEIGHT_FEET = 40;
const STAGE_PIXELS_PER_FOOT = 12;
const STAGE_WIDTH_PIXELS = STAGE_WIDTH_FEET * STAGE_PIXELS_PER_FOOT;
const STAGE_HEIGHT_PIXELS = STAGE_HEIGHT_FEET * STAGE_PIXELS_PER_FOOT;
const STAGE_VIEW_BOX = `0 0 ${STAGE_WIDTH_PIXELS} ${STAGE_HEIGHT_PIXELS}`;

const initialStageState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
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
  const renderItems = stageState.editableLayout == null
    ? []
    : buildLayoutObjectRenderPipeline({
        layout: stageState.editableLayout,
        viewport: stageState.viewport
      });
  const hallwayItems = renderItems.filter((item) => item.objectType === "hallway");
  const zoneItems = renderItems.filter((item) => item.objectType === "zone");
  const roomItems = renderItems.filter((item) => item.objectType === "room");
  const doorItems = renderItems.filter((item) => item.objectType === "door");
  const stationItems = renderItems.filter((item) => item.objectType === "station");

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
            data-render-item-count={renderItems.length}
          >
            <rect
              className="layout-editor-stage__frame"
              x="0"
              y="0"
              width={STAGE_WIDTH_PIXELS}
              height={STAGE_HEIGHT_PIXELS}
              rx="0"
            />
            <g className="layout-editor-stage__background-objects">
              {hallwayItems.map((item) => (
                <HallwayShape
                  key={item.hitTargetKey}
                  viewModel={buildHallwayShapeViewModel(item)}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                />
              ))}
              {zoneItems.map((item) => (
                <ZoneShape
                  key={item.hitTargetKey}
                  viewModel={buildZoneShapeViewModel(item)}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                />
              ))}
            </g>
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
            <g className="layout-editor-stage__rooms">
              {roomItems.map((item) => (
                <RoomShape
                  key={item.hitTargetKey}
                  viewModel={buildRoomShapeViewModel(item)}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                />
              ))}
            </g>
            <g className="layout-editor-stage__doors">
              {doorItems.map((item) => (
                <DoorShape
                  key={item.hitTargetKey}
                  viewModel={buildDoorShapeViewModel(item)}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                />
              ))}
            </g>
            <g className="layout-editor-stage__stations">
              {stationItems.map((item) => (
                <StationShape
                  key={item.hitTargetKey}
                  viewModel={buildStationShapeViewModel(item)}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                />
              ))}
            </g>
          </svg>
        </div>
        <LayoutInspectorPanel viewModel={inspectorViewModel} />
      </div>
    </section>
  );
}
