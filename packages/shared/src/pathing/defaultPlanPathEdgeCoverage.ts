import type { PlanContract } from "../contracts.js";

export type DefaultPlanPathEdgeCoverageGap = {
  code: string;
  objectId: string;
  message: string;
};

export type DefaultPlanPathEdgeCoverageAudit = {
  schemaVersion: "1.0.0";
  planId: string;
  status: "passed" | "failed";
  counts: {
    pathNodes: number;
    pathEdges: number;
    usablePathEdges: number;
    blockedPathEdges: number;
    requiredOperationalNodes: number;
    connectedRequiredOperationalNodes: number;
  };
  gaps: DefaultPlanPathEdgeCoverageGap[];
  limitations: string[];
};

export const DEFAULT_PLAN_PATH_EDGE_COVERAGE_LIMITATIONS = [
  "Path-edge coverage confirms graph connectivity over fixture edges.",
  "Fixture edge lengths are approximate placeholders and are not measured walking truth."
];

export function auditDefaultPlanPathEdgeCoverage(
  planValue: PlanContract
): DefaultPlanPathEdgeCoverageAudit {
  const plan = planValue;
  const nodeIds = new Set(plan.pathNodes.map((node) => node.id));
  const gaps: DefaultPlanPathEdgeCoverageGap[] = [];

  for (const edge of plan.pathEdges) {
    if (!nodeIds.has(edge.fromNodeId)) {
      addGap(gaps, "BROKEN_FROM_NODE", edge.id, "Path edge fromNodeId must reference an existing path node.");
    }
    if (!nodeIds.has(edge.toNodeId)) {
      addGap(gaps, "BROKEN_TO_NODE", edge.id, "Path edge toNodeId must reference an existing path node.");
    }
    if (!Number.isFinite(edge.lengthFeet) || edge.lengthFeet <= 0) {
      addGap(gaps, "INVALID_EDGE_LENGTH", edge.id, "Path edge lengthFeet must be positive and finite.");
    }
  }

  const usableEdges = plan.pathEdges.filter(
    (edge) => !edge.blocked && nodeIds.has(edge.fromNodeId) && nodeIds.has(edge.toNodeId)
  );
  const adjacency = buildAdjacency(usableEdges);
  const requiredNodeIds = requiredOperationalNodeIds(plan);

  for (const nodeId of requiredNodeIds) {
    if ((adjacency.get(nodeId)?.length ?? 0) === 0) {
      addGap(gaps, "REQUIRED_NODE_WITHOUT_USABLE_EDGE", nodeId, "Required operational path node must have at least one usable incident edge.");
    }
  }

  let connectedRequiredOperationalNodes = 0;
  if (requiredNodeIds.length > 0) {
    const firstRequiredNodeId = requiredNodeIds[0];
    if (firstRequiredNodeId == null) {
      throw new Error("required operational node list unexpectedly empty");
    }
    const reachable = traverse(firstRequiredNodeId, adjacency);
    connectedRequiredOperationalNodes = requiredNodeIds.filter((nodeId) => reachable.has(nodeId)).length;
    for (const nodeId of requiredNodeIds) {
      if (!reachable.has(nodeId)) {
        addGap(gaps, "REQUIRED_NODE_DISCONNECTED", nodeId, "Required operational path node must be in the primary usable connected component.");
      }
    }
  }

  return {
    schemaVersion: "1.0.0",
    planId: plan.planId,
    status: gaps.length === 0 ? "passed" : "failed",
    counts: {
      pathNodes: plan.pathNodes.length,
      pathEdges: plan.pathEdges.length,
      usablePathEdges: usableEdges.length,
      blockedPathEdges: plan.pathEdges.length - usableEdges.length,
      requiredOperationalNodes: requiredNodeIds.length,
      connectedRequiredOperationalNodes
    },
    gaps,
    limitations: [...DEFAULT_PLAN_PATH_EDGE_COVERAGE_LIMITATIONS]
  };
}

function requiredOperationalNodeIds(plan: PlanContract): string[] {
  const ids = new Set<string>();
  for (const room of plan.rooms) {
    if (room.pathNodeId != null) {
      ids.add(room.pathNodeId);
    }
  }
  for (const station of plan.nurseStations) {
    ids.add(station.pathNodeId);
  }
  for (const node of plan.pathNodes) {
    if (node.nodeType === "entry") {
      ids.add(node.id);
    }
    if (node.nodeType === "hallway" && node.linkedObjectId != null) {
      ids.add(node.id);
    }
  }
  return [...ids].sort();
}

function buildAdjacency(edges: PlanContract["pathEdges"]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    addNeighbor(adjacency, edge.fromNodeId, edge.toNodeId);
    addNeighbor(adjacency, edge.toNodeId, edge.fromNodeId);
  }
  for (const neighbors of adjacency.values()) {
    neighbors.sort();
  }
  return adjacency;
}

function addNeighbor(adjacency: Map<string, string[]>, nodeId: string, neighborId: string): void {
  const neighbors = adjacency.get(nodeId) ?? [];
  neighbors.push(neighborId);
  adjacency.set(nodeId, neighbors);
}

function traverse(startNodeId: string, adjacency: ReadonlyMap<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const frontier = [startNodeId];
  while (frontier.length > 0) {
    const current = frontier.shift();
    if (current == null || visited.has(current)) {
      continue;
    }
    visited.add(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        frontier.push(neighbor);
      }
    }
  }
  return visited;
}

function addGap(
  gaps: DefaultPlanPathEdgeCoverageGap[],
  code: string,
  objectId: string,
  message: string
): void {
  gaps.push({ code, objectId, message });
}
