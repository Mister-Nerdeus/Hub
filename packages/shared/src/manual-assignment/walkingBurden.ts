import type { SemanticRoomType } from "../floorplans/roomTypeRules.js";
import { isWalkingDistanceEligibleRoomLocation } from "../floorplans/walkingDistanceEligibility.js";

export type ManualWalkingPoint = {
  x: number;
  y: number;
};

export type ManualWalkingPathNode = ManualWalkingPoint & {
  nodeId: string;
};

export type ManualWalkingPathEdge = {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  distanceUnits?: number;
};

export type ManualWalkingRoomLocation = ManualWalkingPoint & {
  roomId: string;
  pathNodeId?: string;
  roomType?: SemanticRoomType;
};

export type ManualWalkingStationLocation = ManualWalkingPoint & {
  stationId: string;
  pathNodeId?: string;
};

export type ManualWalkingAssignment = {
  nurseId: string;
  roomId: string;
};

export type ManualWalkingBurdenInput = {
  nurses: { nurseId: string }[];
  rooms: ManualWalkingRoomLocation[];
  station: ManualWalkingStationLocation;
  assignments: ManualWalkingAssignment[];
  pathNodes: ManualWalkingPathNode[];
  pathEdges: ManualWalkingPathEdge[];
};

export type ManualWalkingDistanceResult = {
  distanceUnits: number;
  method: "path-graph" | "straight-line-fallback";
  visibleComponents: string[];
};

export type ManualNurseWalkingBurdenSummary = {
  nurseId: string;
  assignedRoomCount: number;
  stationToRoomDistance: number;
  roomToRoomSpread: number;
  clusterSpreadBurden: number;
  estimatedWalkingBurdenUnits: number;
  usedGraphDistance: boolean;
  fallbackDistanceCount: number;
  excludedRoomIds: string[];
  visibleComponents: string[];
  syntheticDataOnly: true;
};

export function calculateManualAssignmentWalkingBurden(
  input: ManualWalkingBurdenInput
): ManualNurseWalkingBurdenSummary[] {
  const roomsById = new Map(input.rooms.map((room) => [room.roomId, room]));
  const assignmentsByNurse = new Map<string, ManualWalkingAssignment[]>();
  for (const nurse of input.nurses) assignmentsByNurse.set(nurse.nurseId, []);
  for (const assignment of input.assignments) {
    assignmentsByNurse.get(assignment.nurseId)?.push(assignment);
  }

  return input.nurses.map((nurse) => {
    const assignments = [...(assignmentsByNurse.get(nurse.nurseId) ?? [])].sort((left, right) =>
      left.roomId.localeCompare(right.roomId)
    );
    const roomCandidates = assignments.map((assignment) => roomsById.get(assignment.roomId)).filter(isRoomLocation);
    const assignedRooms = roomCandidates.filter(isWalkingDistanceEligibleRoomLocation);
    const excludedRoomIds = roomCandidates
      .filter((room) => !isWalkingDistanceEligibleRoomLocation(room))
      .map((room) => room.roomId)
      .sort();
    const stationDistances = assignedRooms.map((room) => resolveManualWalkingDistance(input.station, room, input));
    const roomPairDistances = buildRoomPairs(assignedRooms).map(([left, right]) =>
      resolveManualWalkingDistance(left, right, input)
    );
    const stationToRoomDistance = sumRounded(stationDistances.map((distance) => distance.distanceUnits));
    const roomToRoomSpread = roomPairDistances.length === 0
      ? 0
      : Math.round(Math.max(...roomPairDistances.map((distance) => distance.distanceUnits)));
    const allDistances = [...stationDistances, ...roomPairDistances];
    const fallbackDistanceCount = allDistances.filter((distance) => distance.method === "straight-line-fallback").length;
    const clusterSpreadBurden = Math.round(roomToRoomSpread / 50);
    const estimatedWalkingBurdenUnits = Math.round((stationToRoomDistance + roomToRoomSpread) / 25);

    return {
      nurseId: nurse.nurseId,
      assignedRoomCount: assignedRooms.length,
      stationToRoomDistance,
      roomToRoomSpread,
      clusterSpreadBurden,
      estimatedWalkingBurdenUnits,
      usedGraphDistance: allDistances.some((distance) => distance.method === "path-graph"),
      fallbackDistanceCount,
      excludedRoomIds,
      visibleComponents: [
        `assigned rooms ${assignedRooms.length}`,
        `station distance ${stationToRoomDistance}`,
        `room spread ${roomToRoomSpread}`,
        `spread burden ${clusterSpreadBurden}`
      ],
      syntheticDataOnly: true
    };
  });
}

export function resolveManualWalkingDistance(
  from: (ManualWalkingPoint & { pathNodeId?: string }),
  to: (ManualWalkingPoint & { pathNodeId?: string }),
  input: Pick<ManualWalkingBurdenInput, "pathNodes" | "pathEdges">
): ManualWalkingDistanceResult {
  if (from.pathNodeId && to.pathNodeId) {
    const graphDistance = shortestPathDistance(from.pathNodeId, to.pathNodeId, input.pathNodes, input.pathEdges);
    if (graphDistance != null) {
      return {
        distanceUnits: Math.round(graphDistance),
        method: "path-graph",
        visibleComponents: [`path graph ${from.pathNodeId} to ${to.pathNodeId}`]
      };
    }
  }
  return {
    distanceUnits: Math.round(euclideanDistance(from, to)),
    method: "straight-line-fallback",
    visibleComponents: ["straight-line fallback"]
  };
}

export function shortestPathDistance(
  fromNodeId: string,
  toNodeId: string,
  pathNodes: ManualWalkingPathNode[],
  pathEdges: ManualWalkingPathEdge[]
): number | null {
  const nodeIds = new Set(pathNodes.map((node) => node.nodeId));
  if (!nodeIds.has(fromNodeId) || !nodeIds.has(toNodeId)) return null;
  if (fromNodeId === toNodeId) return 0;

  const adjacency = new Map<string, { nodeId: string; distance: number }[]>();
  for (const nodeId of nodeIds) adjacency.set(nodeId, []);
  const nodesById = new Map(pathNodes.map((node) => [node.nodeId, node]));
  for (const edge of pathEdges) {
    const from = nodesById.get(edge.fromNodeId);
    const to = nodesById.get(edge.toNodeId);
    if (!from || !to) continue;
    const distance = edge.distanceUnits ?? euclideanDistance(from, to);
    adjacency.get(edge.fromNodeId)?.push({ nodeId: edge.toNodeId, distance });
    adjacency.get(edge.toNodeId)?.push({ nodeId: edge.fromNodeId, distance });
  }

  const distances = new Map<string, number>();
  const unsettled = new Set(nodeIds);
  for (const nodeId of nodeIds) distances.set(nodeId, Number.POSITIVE_INFINITY);
  distances.set(fromNodeId, 0);

  while (unsettled.size > 0) {
    const current = [...unsettled].sort((left, right) => (distances.get(left) ?? 0) - (distances.get(right) ?? 0) || left.localeCompare(right))[0];
    if (current == null) break;
    if (current === toNodeId) return distances.get(current) ?? null;
    unsettled.delete(current);
    const currentDistance = distances.get(current) ?? Number.POSITIVE_INFINITY;
    if (!Number.isFinite(currentDistance)) break;
    for (const edge of adjacency.get(current) ?? []) {
      if (!unsettled.has(edge.nodeId)) continue;
      const candidateDistance = currentDistance + edge.distance;
      if (candidateDistance < (distances.get(edge.nodeId) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.nodeId, candidateDistance);
      }
    }
  }

  const result = distances.get(toNodeId);
  return result != null && Number.isFinite(result) ? result : null;
}

function buildRoomPairs(rooms: ManualWalkingRoomLocation[]): [ManualWalkingRoomLocation, ManualWalkingRoomLocation][] {
  const pairs: [ManualWalkingRoomLocation, ManualWalkingRoomLocation][] = [];
  for (let left = 0; left < rooms.length; left += 1) {
    for (let right = left + 1; right < rooms.length; right += 1) {
      const leftRoom = rooms[left];
      const rightRoom = rooms[right];
      if (leftRoom && rightRoom) pairs.push([leftRoom, rightRoom]);
    }
  }
  return pairs;
}

function isRoomLocation(value: ManualWalkingRoomLocation | undefined): value is ManualWalkingRoomLocation {
  return value != null;
}

function sumRounded(values: number[]): number {
  return Math.round(values.reduce((total, value) => total + value, 0));
}

function euclideanDistance(from: ManualWalkingPoint, to: ManualWalkingPoint): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}
