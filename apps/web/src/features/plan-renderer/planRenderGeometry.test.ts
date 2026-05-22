import type { PathEdge, PathNode, Room, ScaleSettings } from "@nerdeus/shared";

import { pathEdgeToLine, roomToRect } from "./planRenderGeometry";

const scale: ScaleSettings = {
  unit: "feet",
  pixelsPerUnit: 10,
  gridSizeFeet: 1,
  snapToGrid: true,
  origin: "top-left"
};

const room: Room = {
  id: "room-test",
  label: "Room Test",
  type: "standard",
  x: 2,
  y: 3,
  widthFeet: 12,
  lengthFeet: 10
};

const nodes: PathNode[] = [
  {
    id: "node-a",
    type: "entry",
    x: 1,
    y: 1,
    linkedObjectId: null
  },
  {
    id: "node-b",
    type: "entry",
    x: 5,
    y: 1,
    linkedObjectId: null
  }
];

const edge: PathEdge = {
  id: "edge-a-b",
  fromNodeId: "node-a",
  toNodeId: "node-b",
  lengthFeet: 4,
  hallwayWidthFeet: 8,
  congestionFactor: 1,
  doorPenaltySeconds: 0,
  turnPenaltySeconds: 0,
  blocked: false
};

const rect = roomToRect(room, scale);
if (rect.width !== 120 || rect.height !== 100 || rect.x !== 20 || rect.y !== 30) {
  throw new Error("roomToRect must convert feet to pixels");
}

const line = pathEdgeToLine(edge, nodes, scale);
if (line.from.x !== 10 || line.to.x !== 50 || line.lengthFeet !== 4) {
  throw new Error("pathEdgeToLine must resolve node coordinates");
}

try {
  pathEdgeToLine({ ...edge, toNodeId: "missing-node" }, nodes, scale);
  throw new Error("pathEdgeToLine must reject missing nodes");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("missing path node")) {
    throw error;
  }
}
