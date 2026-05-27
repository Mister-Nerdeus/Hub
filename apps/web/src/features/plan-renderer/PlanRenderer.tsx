import { useMemo, useState } from "react";
import type { Door, NurseStation, PathNode, PlanContract, Room } from "@nerdeus/shared";

import {
  getPlanBounds,
  hallwayToPolyline,
  pathEdgeToLine,
  pointToPixels,
  roomToRect,
  zoneToRect
} from "./planRenderGeometry";
import "./PlanRenderer.css";

type PlanRendererProps = {
  plan: PlanContract;
};

const roomTypeLabels: Record<Room["roomType"], string> = {
  standard: "Standard",
  trauma: "Trauma",
  isolation: "Isolation",
  psych: "Psych",
  hall_bed: "Hall bed",
  procedure: "Procedure",
  overflow: "Overflow",
  storage: "Storage",
  solid_wall: "Solid wall / blocked area"
};

export function PlanRenderer({ plan }: PlanRendererProps) {
  const [showLabels, setShowLabels] = useState(true);
  const [showPathGraph, setShowPathGraph] = useState(true);
  const bounds = useMemo(() => getPlanBounds(plan), [plan]);

  return (
    <section className="plan-renderer" aria-labelledby="plan-renderer-title">
      <div className="plan-renderer__header">
        <div>
          <p className="eyebrow">Read-only layout</p>
          <h2 id="plan-renderer-title">{plan.name}</h2>
        </div>
        <div className="plan-renderer__controls" aria-label="Renderer controls">
          <label>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(event) => setShowLabels(event.target.checked)}
            />
            Labels
          </label>
          <label>
            <input
              type="checkbox"
              checked={showPathGraph}
              onChange={(event) => setShowPathGraph(event.target.checked)}
            />
            Path graph
          </label>
        </div>
      </div>

      <div className="plan-renderer__canvas-wrap">
        <svg
          className="plan-renderer__canvas"
          role="img"
          aria-label={`${plan.name} rendered in feet`}
          viewBox={`0 0 ${bounds.width} ${bounds.height}`}
        >
          <Grid bounds={bounds} pixelsPerUnit={plan.scale.pixelsPerUnit} />

          {plan.zones.map((zone) => {
            const rect = zoneToRect(zone, plan.scale);
            return (
              <g className="plan-zone" key={zone.id}>
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={zone.color}
                />
                {showLabels ? <text x={rect.x + 8} y={rect.y + 18}>{zone.label}</text> : null}
              </g>
            );
          })}

          {plan.hallways.map((hallway) => {
            const points = hallwayToPolyline(hallway, plan.scale);
            return (
              <g className="plan-hallway" key={hallway.id}>
                <polyline
                  points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                  strokeWidth={hallway.widthFeet * plan.scale.pixelsPerUnit}
                />
                {showLabels ? (
                  <text x={points[0]?.x ?? 0} y={(points[0]?.y ?? 0) - 8}>
                    {hallway.label} - {hallway.widthFeet} ft
                  </text>
                ) : null}
              </g>
            );
          })}

          {showPathGraph
            ? plan.pathEdges.map((edge) => {
                const line = pathEdgeToLine(edge, plan.pathNodes, plan.scale);
                return (
                  <line
                    className={line.blocked ? "plan-path-edge plan-path-edge--blocked" : "plan-path-edge"}
                    key={line.id}
                    x1={line.from.x}
                    y1={line.from.y}
                    x2={line.to.x}
                    y2={line.to.y}
                    strokeWidth={line.strokeWidth}
                  />
                );
              })
            : null}

          {plan.rooms.map((room) => (
            <RoomShape key={room.id} plan={plan} room={room} showLabels={showLabels} />
          ))}

          {plan.doors.map((door) => (
            <DoorShape door={door} key={door.id} plan={plan} />
          ))}

          {plan.nurseStations.map((station) => (
            <NurseStationShape key={station.id} plan={plan} station={station} showLabels={showLabels} />
          ))}

          {showPathGraph
            ? plan.pathNodes.map((node) => (
                <PathNodeShape key={node.id} node={node} plan={plan} showLabels={showLabels} />
              ))
            : null}
        </svg>
      </div>

      <div className="plan-renderer__legend" aria-label="Legend">
        {Object.entries(roomTypeLabels).map(([type, label]) => (
          <span className={`legend-swatch legend-swatch--${type}`} key={type}>
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

function Grid({ bounds, pixelsPerUnit }: { bounds: { width: number; height: number }; pixelsPerUnit: number }) {
  const gridLines = [];
  const majorStep = pixelsPerUnit * 5;
  for (let x = 0; x <= bounds.width; x += majorStep) {
    gridLines.push(<line className="plan-grid" key={`x-${x}`} x1={x} y1={0} x2={x} y2={bounds.height} />);
  }
  for (let y = 0; y <= bounds.height; y += majorStep) {
    gridLines.push(<line className="plan-grid" key={`y-${y}`} x1={0} y1={y} x2={bounds.width} y2={y} />);
  }
  return <g aria-hidden="true">{gridLines}</g>;
}

function RoomShape({
  room,
  plan,
  showLabels
}: {
  room: Room;
  plan: PlanContract;
  showLabels: boolean;
}) {
  const rect = roomToRect(room, plan.scale);

  return (
    <g className={`plan-room plan-room--${room.roomType}`}>
      <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={2} />
      {showLabels ? (
        <>
          <text x={rect.x + 8} y={rect.y + 18}>{room.label}</text>
          <text className="plan-room__meta" x={rect.x + 8} y={rect.y + 34}>
            {room.widthFeet}x{room.lengthFeet} ft
          </text>
        </>
      ) : null}
    </g>
  );
}

function DoorShape({ door, plan }: { door: Door; plan: PlanContract }) {
  const point = pointToPixels(door, plan.scale);
  const width = door.widthFeet * plan.scale.pixelsPerUnit;
  return (
    <rect
      className="plan-door"
      x={point.x - width / 2}
      y={point.y - 3}
      width={width}
      height={6}
      rx={1}
    />
  );
}

function NurseStationShape({
  station,
  plan,
  showLabels
}: {
  station: NurseStation;
  plan: PlanContract;
  showLabels: boolean;
}) {
  const point = pointToPixels(station, plan.scale);
  const width = station.widthFeet * plan.scale.pixelsPerUnit;
  const height = station.lengthFeet * plan.scale.pixelsPerUnit;
  return (
    <g className="plan-station">
      <rect x={point.x} y={point.y} width={width} height={height} rx={3} />
      {showLabels ? <text x={point.x + 8} y={point.y + 20}>{station.label}</text> : null}
    </g>
  );
}

function PathNodeShape({
  node,
  plan,
  showLabels
}: {
  node: PathNode;
  plan: PlanContract;
  showLabels: boolean;
}) {
  const point = pointToPixels(node, plan.scale);
  return (
    <g className={`plan-path-node plan-path-node--${node.nodeType}`}>
      <circle cx={point.x} cy={point.y} r={5} />
      {showLabels ? <text x={point.x + 7} y={point.y - 7}>{node.id}</text> : null}
    </g>
  );
}
