import type { PathEdge, PlanContract } from "../contracts.js";
import { validatePlanContract } from "../contracts.js";
import {
  type PathTravelCalculationInput,
  type PathTravelResponseContract,
  validatePathTravelResponseContract
} from "./pathTravelContract.js";

export const PATH_TRAVEL_LIMITATIONS = [
  "Operational-only deterministic shortest-path calculation over plan path graph data.",
  "Blocked path edges are excluded.",
  "No optimizer, real map data, or clinical claim is applied."
];

type RouteState = {
  nodeId: string;
  travelSeconds: number;
  routeNodeIds: string[];
  routeEdgeIds: string[];
};

type AdjacencyEdge = {
  edge: PathEdge;
  nextNodeId: string;
};

export function calculatePathTravelTime(
  input: PathTravelCalculationInput
): PathTravelResponseContract {
  const plan = validatePlanContract(input.plan);
  const nodeIds = new Set(plan.pathNodes.map((node) => node.id));
  if (!nodeIds.has(input.originNodeId)) {
    throw new Error("originNodeId references a missing path node");
  }
  if (!nodeIds.has(input.destinationNodeId)) {
    throw new Error("destinationNodeId references a missing path node");
  }
  if (input.walkingSpeedFeetPerMinute <= 0) {
    throw new Error("walkingSpeedFeetPerMinute must be positive");
  }

  const route = shortestRoute(plan, input);
  if (route == null) {
    return validatePathTravelResponseContract({
      schemaVersion: "1.0.0",
      planId: plan.planId,
      originNodeId: input.originNodeId,
      destinationNodeId: input.destinationNodeId,
      routeNodeIds: [],
      routeEdgeIds: [],
      travelSeconds: 0,
      travelMinutes: 0,
      warnings: [
        `No deterministic path found from ${input.originNodeId} to ${input.destinationNodeId}.`
      ],
      limitations: [...PATH_TRAVEL_LIMITATIONS]
    });
  }

  const travelSeconds = roundSeconds(route.travelSeconds);
  return validatePathTravelResponseContract({
    schemaVersion: "1.0.0",
    planId: plan.planId,
    originNodeId: input.originNodeId,
    destinationNodeId: input.destinationNodeId,
    routeNodeIds: route.routeNodeIds,
    routeEdgeIds: route.routeEdgeIds,
    travelSeconds,
    travelMinutes: Math.ceil(travelSeconds / 60),
    warnings: [],
    limitations: [...PATH_TRAVEL_LIMITATIONS]
  });
}

function shortestRoute(
  plan: PlanContract,
  input: PathTravelCalculationInput
): RouteState | null {
  const adjacency = buildAdjacency(plan);
  const visited = new Set<string>();
  const frontier: RouteState[] = [
    {
      nodeId: input.originNodeId,
      travelSeconds: 0,
      routeNodeIds: [input.originNodeId],
      routeEdgeIds: []
    }
  ];

  while (frontier.length > 0) {
    frontier.sort(compareRouteStates);
    const current = frontier.shift();
    if (current == null || visited.has(current.nodeId)) {
      continue;
    }
    if (current.nodeId === input.destinationNodeId) {
      return current;
    }
    visited.add(current.nodeId);

    for (const adjacencyEdge of adjacency.get(current.nodeId) ?? []) {
      if (visited.has(adjacencyEdge.nextNodeId)) {
        continue;
      }
      frontier.push({
        nodeId: adjacencyEdge.nextNodeId,
        travelSeconds:
          current.travelSeconds +
          edgeTravelSeconds(adjacencyEdge.edge, input.walkingSpeedFeetPerMinute),
        routeNodeIds: [...current.routeNodeIds, adjacencyEdge.nextNodeId],
        routeEdgeIds: [...current.routeEdgeIds, adjacencyEdge.edge.id]
      });
    }
  }

  return null;
}

function buildAdjacency(plan: PlanContract): Map<string, AdjacencyEdge[]> {
  const adjacency = new Map<string, AdjacencyEdge[]>();
  for (const edge of plan.pathEdges) {
    if (edge.blocked) {
      continue;
    }
    addAdjacency(adjacency, edge.fromNodeId, { edge, nextNodeId: edge.toNodeId });
    addAdjacency(adjacency, edge.toNodeId, { edge, nextNodeId: edge.fromNodeId });
  }
  for (const edges of adjacency.values()) {
    edges.sort((left, right) => {
      const nextNodeDelta = left.nextNodeId.localeCompare(right.nextNodeId);
      if (nextNodeDelta !== 0) {
        return nextNodeDelta;
      }
      return left.edge.id.localeCompare(right.edge.id);
    });
  }
  return adjacency;
}

function addAdjacency(
  adjacency: Map<string, AdjacencyEdge[]>,
  nodeId: string,
  edge: AdjacencyEdge
): void {
  const edges = adjacency.get(nodeId) ?? [];
  edges.push(edge);
  adjacency.set(nodeId, edges);
}

function edgeTravelSeconds(edge: PathEdge, walkingSpeedFeetPerMinute: number): number {
  return (
    (edge.lengthFeet / walkingSpeedFeetPerMinute) * 60 * edge.congestionFactor +
    edge.doorPenaltySeconds +
    edge.turnPenaltySeconds
  );
}

function compareRouteStates(left: RouteState, right: RouteState): number {
  const travelDelta = left.travelSeconds - right.travelSeconds;
  if (travelDelta !== 0) {
    return travelDelta;
  }
  const nodeDelta = left.nodeId.localeCompare(right.nodeId);
  if (nodeDelta !== 0) {
    return nodeDelta;
  }
  return left.routeEdgeIds.join("|").localeCompare(right.routeEdgeIds.join("|"));
}

function roundSeconds(value: number): number {
  return Math.round(value * 1000) / 1000;
}
