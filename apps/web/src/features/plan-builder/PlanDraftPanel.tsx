import type { Dispatch } from "react";

import type { PlanContract } from "@nerdeus/shared";

import type { PlanDraftAction } from "./planDraftReducer";
import "./PlanDraftPanel.css";

type PlanDraftPanelProps = {
  plan: PlanContract;
  dispatch: Dispatch<PlanDraftAction>;
};

export function PlanDraftPanel({ plan, dispatch }: PlanDraftPanelProps) {
  return (
    <section className="plan-draft-panel" aria-label="Plan draft operations">
      <div className="plan-draft-panel__summary">
        <div>
          <p className="eyebrow">Developer Proof Controls</p>
          <h2>Manual draft reducer checks</h2>
        </div>
        <div className="plan-draft-panel__metrics" aria-label="Draft counts">
          <span>{plan.rooms.length} rooms</span>
          <span>{plan.hallways.length} hallways</span>
          <span>{plan.pathEdges.length} path edges</span>
        </div>
      </div>
      <div className="plan-draft-panel__actions">
        <button type="button" onClick={() => dispatch({ type: "addRoom", room: room07 })}>
          Add Room 07
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "updateRoom",
              roomId: "room-07",
              changes: { widthFeet: 14, lengthFeet: 11 }
            })
          }
        >
          Set Room 07 Size
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "moveRoom", roomId: "room-07", x: 36, y: 34 })}
        >
          Move Room 07
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "updateHallway", hallwayId: "hallway-main", changes: { widthFeet: 12 } })}
        >
          Set Main Hallway Width
        </button>
        <button type="button" onClick={() => dispatch({ type: "addDoor", door: door07 })}>
          Add Door 07
        </button>
        <button type="button" onClick={() => dispatch({ type: "addPathNode", pathNode: nodeDoor07 })}>
          Add Door Node 07
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "updateRoom",
              roomId: "room-07",
              changes: { pathNodeId: "node-door-room-07" }
            })
          }
        >
          Link Room 07 Node
        </button>
        <button type="button" onClick={() => dispatch({ type: "addPathEdge", pathEdge: edgeRoom07Hall })}>
          Add Room 07 Edge
        </button>
      </div>
    </section>
  );
}

const room07 = {
  id: "room-07",
  label: "Room 07",
  roomType: "standard",
  x: 36,
  y: 34,
  widthFeet: 12,
  lengthFeet: 10,
  maxPatients: 1,
  traumaCapable: false,
  isolationCapable: false,
  doorPoint: { x: 42, y: 34 },
  zoneId: "zone-pod-a",
  nearestStationId: "station-primary",
  pathNodeId: null
} as const;

const door07 = {
  id: "door-room-07",
  label: "Door Room 07",
  roomId: "room-07",
  x: 42,
  y: 34,
  widthFeet: 3,
  pathNodeId: null
} as const;

const nodeDoor07 = {
  id: "node-door-room-07",
  nodeType: "room_door",
  x: 42,
  y: 32,
  linkedObjectId: "door-room-07"
} as const;

const edgeRoom07Hall = {
  id: "edge-room-07-hall",
  fromNodeId: "node-door-room-07",
  toNodeId: "node-hall-mid",
  lengthFeet: 8,
  hallwayWidthFeet: 12,
  congestionFactor: 1,
  doorPenaltySeconds: 4,
  turnPenaltySeconds: 2,
  blocked: false
} as const;
