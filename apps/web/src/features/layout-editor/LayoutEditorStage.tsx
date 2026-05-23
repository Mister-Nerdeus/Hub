import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import { buildLayoutGridViewModel } from "./layoutGridViewModel";
import { createLayoutEditorState } from "./layoutEditorState";
import "./LayoutEditorStage.css";

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
  doors: [],
  stations: [],
  hallways: [],
  zones: [],
  limitations: ["Proof-only stage shell; source geometry remains feet-based."]
};

const stageState = createLayoutEditorState({
  editableLayout: proofLayout,
  viewport: {
    pixelsPerFoot: 12,
    zoom: 1,
    panXFeet: 0,
    panYFeet: 0
  },
  snapMode: "default"
});

const grid = buildLayoutGridViewModel({
  widthFeet: 64,
  heightFeet: 40,
  viewport: stageState.viewport,
  gridSpacingFeet: 1,
  majorEveryFeet: 5
});

export function LayoutEditorStage() {
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

      <div className="layout-editor-stage__shell" data-proof-only="true">
        <svg
          className="layout-editor-stage__svg"
          viewBox={grid.viewBox}
          role="img"
          aria-label="Feet-based SVG grid stage"
        >
          <rect
            className="layout-editor-stage__frame"
            x={grid.frame.xPixels}
            y={grid.frame.yPixels}
            width={grid.frame.widthPixels}
            height={grid.frame.heightPixels}
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
                <text key={`${line.id}-label`} x={line.x1Pixels + 3} y={grid.frame.yPixels + 14}>
                  {line.label}
                </text>
              ))}
            {grid.horizontalLines
              .filter((line) => line.isMajor && line.valueFeet > 0)
              .map((line) => (
                <text key={`${line.id}-label`} x={grid.frame.xPixels + 4} y={line.y1Pixels - 4}>
                  {line.label}
                </text>
              ))}
          </g>
        </svg>
      </div>
    </section>
  );
}
