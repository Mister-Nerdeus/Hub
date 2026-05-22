import type { Hallway, PathEdge, PathNode, PlanContract, Room, ScaleSettings, Zone } from "@nerdeus/shared";

export type RectGeometry = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PointGeometry = {
  x: number;
  y: number;
};

export type LineGeometry = {
  id: string;
  from: PointGeometry;
  to: PointGeometry;
  lengthFeet: number;
  strokeWidth: number;
  blocked: boolean;
};

export type PlanBounds = {
  width: number;
  height: number;
};

export function feetToPixels(value: number, scale: ScaleSettings): number {
  return value * scale.pixelsPerUnit;
}

export function pointToPixels(point: { x: number; y: number }, scale: ScaleSettings): PointGeometry {
  return {
    x: feetToPixels(point.x, scale),
    y: feetToPixels(point.y, scale)
  };
}

export function roomToRect(room: Room, scale: ScaleSettings): RectGeometry {
  return {
    id: room.id,
    label: room.label,
    x: feetToPixels(room.x, scale),
    y: feetToPixels(room.y, scale),
    width: feetToPixels(room.widthFeet, scale),
    height: feetToPixels(room.lengthFeet, scale)
  };
}

export function zoneToRect(zone: Zone, scale: ScaleSettings): RectGeometry {
  return {
    id: zone.id,
    label: zone.label,
    x: feetToPixels(zone.x, scale),
    y: feetToPixels(zone.y, scale),
    width: feetToPixels(zone.widthFeet, scale),
    height: feetToPixels(zone.lengthFeet, scale)
  };
}

export function hallwayToPolyline(hallway: Hallway, scale: ScaleSettings): PointGeometry[] {
  return hallway.points.map((point) => pointToPixels(point, scale));
}

export function pathEdgeToLine(
  edge: PathEdge,
  pathNodes: PathNode[],
  scale: ScaleSettings
): LineGeometry {
  const nodeById = new Map(pathNodes.map((node) => [node.id, node]));
  const from = nodeById.get(edge.fromNodeId);
  const to = nodeById.get(edge.toNodeId);

  if (!from || !to) {
    throw new Error(`Path edge ${edge.id} references a missing path node`);
  }

  return {
    id: edge.id,
    from: pointToPixels(from, scale),
    to: pointToPixels(to, scale),
    lengthFeet: edge.lengthFeet,
    strokeWidth: Math.max(1, feetToPixels(edge.hallwayWidthFeet, scale) / 18),
    blocked: edge.blocked
  };
}

export function getPlanBounds(plan: PlanContract): PlanBounds {
  const scale = plan.scale;
  const extents = [
    ...plan.zones.map((zone) => ({
      x: zone.x + zone.widthFeet,
      y: zone.y + zone.lengthFeet
    })),
    ...plan.rooms.map((room) => ({
      x: room.x + room.widthFeet,
      y: room.y + room.lengthFeet
    })),
    ...plan.hallways.flatMap((hallway) => hallway.points),
    ...plan.pathNodes
  ];

  const maxX = Math.max(...extents.map((point) => point.x), 1);
  const maxY = Math.max(...extents.map((point) => point.y), 1);

  return {
    width: feetToPixels(maxX + 4, scale),
    height: feetToPixels(maxY + 4, scale)
  };
}
