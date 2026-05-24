import { validatePlanContract, type PathEdge, type PlanContract } from "../contracts.js";
import {
  ROUTE_PREVIEW_LIMITATIONS,
  validateRoutePreviewInput,
  validateRoutePreviewOutput,
  type RoutePreviewInput,
  type RoutePreviewOutput,
  type RoutePreviewWarning
} from "./routePreviewContract.js";

export const DEFAULT_ROUTE_PREVIEW_WALKING_SPEED_FEET_PER_MINUTE = 264;

type RouteState = {
  nodeId: string;
  distanceFeet: number;
  travelSeconds: number;
  routeNodeIds: string[];
  routeEdgeIds: string[];
};

type AdjacencyEdge = {
  edge: PathEdge;
  nextNodeId: string;
};

export function buildRoutePreview(
  planValue: PlanContract,
  inputValue: RoutePreviewInput
): RoutePreviewOutput {
  const plan = validatePlanContract(planValue);
  const input = validateRoutePreviewInput(inputValue);
  if (input.planId !== plan.planId) {
    throw new Error("routePreviewInput.planId must match plan.planId");
  }

  const nodeIds = new Set(plan.pathNodes.map((node) => node.id));
  const warnings: RoutePreviewWarning[] = [];
  if (!nodeIds.has(input.originPathNodeId)) {
    warnings.push({
      code: "MISSING_ORIGIN_NODE",
      message: "Origin path node is missing from the plan graph."
    });
  }
  if (!nodeIds.has(input.destinationPathNodeId)) {
    warnings.push({
      code: "MISSING_DESTINATION_NODE",
      message: "Destination path node is missing from the plan graph."
    });
  }
  if (warnings.length > 0) {
    return validateRoutePreviewOutput(baseOutput(input, "invalid", warnings));
  }

  if (input.originPathNodeId === input.destinationPathNodeId) {
    return validateRoutePreviewOutput(
      baseOutput(input, "invalid", [
        {
          code: "SAME_ORIGIN_DESTINATION_NODE",
          message: "Origin and destination path nodes must be different."
        }
      ])
    );
  }

  if (plan.pathEdges.some((edge) => edge.blocked)) {
    warnings.push({
      code: "BLOCKED_EDGE_EXCLUDED",
      message: "Blocked path edges were excluded from route preview."
    });
  }

  const route = shortestRoute(plan, input.originPathNodeId, input.destinationPathNodeId);
  if (route == null) {
    return validateRoutePreviewOutput(
      baseOutput(input, "unreachable", [
        ...warnings,
        {
          code: "UNREACHABLE_ROUTE",
          message: "No usable graph route connects the selected path nodes."
        }
      ])
    );
  }

  return validateRoutePreviewOutput({
    ...baseOutput(input, "reachable", [
      ...warnings,
      {
        code: "APPROXIMATE_GRAPH_ONLY",
        message: "Route preview uses approximate fixture graph edges."
      }
    ]),
    routeNodeIds: route.routeNodeIds,
    routeEdgeIds: route.routeEdgeIds,
    totalDistanceFeet: round(route.distanceFeet),
    totalTravelSeconds: round(route.travelSeconds)
  });
}

function baseOutput(
  input: RoutePreviewInput,
  status: RoutePreviewOutput["status"],
  warnings: RoutePreviewWarning[]
): RoutePreviewOutput {
  return {
    schemaVersion: "1.0.0",
    planId: input.planId,
    originPathNodeId: input.originPathNodeId,
    destinationPathNodeId: input.destinationPathNodeId,
    status,
    routeNodeIds: [],
    routeEdgeIds: [],
    totalDistanceFeet: 0,
    totalTravelSeconds: 0,
    warnings,
    limitations: [...ROUTE_PREVIEW_LIMITATIONS]
  };
}

function shortestRoute(
  plan: PlanContract,
  originPathNodeId: string,
  destinationPathNodeId: string
): RouteState | null {
  const adjacency = buildAdjacency(plan);
  const visited = new Set<string>();
  const frontier: RouteState[] = [
    {
      nodeId: originPathNodeId,
      distanceFeet: 0,
      travelSeconds: 0,
      routeNodeIds: [originPathNodeId],
      routeEdgeIds: []
    }
  ];

  while (frontier.length > 0) {
    frontier.sort(compareRouteStates);
    const current = frontier.shift();
    if (current == null || visited.has(current.nodeId)) {
      continue;
    }
    if (current.nodeId === destinationPathNodeId) {
      return current;
    }
    visited.add(current.nodeId);
    for (const adjacencyEdge of adjacency.get(current.nodeId) ?? []) {
      if (visited.has(adjacencyEdge.nextNodeId)) {
        continue;
      }
      frontier.push({
        nodeId: adjacencyEdge.nextNodeId,
        distanceFeet: current.distanceFeet + adjacencyEdge.edge.lengthFeet,
        travelSeconds:
          current.travelSeconds +
          edgeTravelSeconds(adjacencyEdge.edge, DEFAULT_ROUTE_PREVIEW_WALKING_SPEED_FEET_PER_MINUTE),
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

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
