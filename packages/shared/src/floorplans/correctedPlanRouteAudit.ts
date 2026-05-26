import {
  validatePlanContract,
  type PathEdge,
  type PathNode,
  type PlanContract
} from "../contracts.js";
import {
  buildPlanContractFromEditableLayout,
  validateSimulationReadyExport
} from "./simulationReadyExportContract.js";
import {
  validateSourceCorrectedSavedCopy,
  type SourceCorrectedSavedCopy
} from "./sourcePlanCorrectionManifest.js";

export type CorrectedPlanRouteAudit = {
  roomsChecked: number;
  roomsMissingDoor: string[];
  roomsMissingPathNode: string[];
  unreachableRoomIds: string[];
  orphanPathNodeIds: string[];
  danglingPathEdgeIds: string[];
  invalidPathEdgeIds: string[];
  nonFinitePathEdgeIds: string[];
  nonPositivePathEdgeIds: string[];
  blockedRequiredEdgeIds: string[];
  stationToRoomRoutesChecked: number;
  stationToRoomRoutesPassed: number;
};

export type CorrectedPlanRouteRepairStatus =
  | "repaired"
  | "blocked_needs_manual_layout_review"
  | "blocked_invalid_geometry"
  | "blocked_no_safe_route_target";

export type CorrectedPlanPathSyncStatus = "fresh" | "stale_warning" | "blocked";

export type CorrectedPlanRouteRepairReport = {
  planId: string;
  sourceDefaultPlanId: string;
  correctedSavedCopyPath: string;
  repairedSavedCopyPath: string;
  routeRepairStatus: CorrectedPlanRouteRepairStatus;
  pathSyncStatus: CorrectedPlanPathSyncStatus;
  beforeAudit: CorrectedPlanRouteAudit;
  afterAudit: CorrectedPlanRouteAudit;
  generatedPathNodes: RepairedPathNodeEvidence[];
  generatedPathEdges: RepairedPathEdgeEvidence[];
  blockingIssues: string[];
  warningIssues: string[];
  limitations: string[];
};

export type CorrectedPlanRouteRepairResult = {
  repairedSavedCopy: SourceCorrectedSavedCopy;
  repairedPlan: PlanContract | null;
  report: CorrectedPlanRouteRepairReport;
};

export type RepairedPathNodeEvidence = {
  id: string;
  linkedRoomId: string;
  linkedDoorId: string;
  x: number;
  y: number;
  generated: true;
  repaired: true;
  repairRule: "door_node_rule";
};

export type RepairedPathEdgeEvidence = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  lengthFeet: number;
  generated: true;
  repaired: true;
  repairRule: "edge_rule";
};

type RouteNode = {
  id: string;
  x: number;
  y: number;
};

export function buildReviewedPlanFromCorrectedSavedCopy(
  correctedSavedCopyValue: SourceCorrectedSavedCopy | unknown
): PlanContract {
  const correctedSavedCopy = validateSourceCorrectedSavedCopy(correctedSavedCopyValue);
  return buildPlanContractFromEditableLayout({
    sourcePlan: correctedSavedCopy.authoringDraft.sourcePlan,
    editableLayout: correctedSavedCopy.authoringDraft.editableLayout,
    planId: correctedSavedCopy.authoringDraft.planId
  });
}

export function auditCorrectedPlanRouteReadiness(input: {
  correctedSavedCopy: SourceCorrectedSavedCopy | unknown;
  reviewedPlan?: PlanContract | unknown;
}): CorrectedPlanRouteAudit {
  const correctedSavedCopy = validateSourceCorrectedSavedCopy(input.correctedSavedCopy);
  const plan = input.reviewedPlan == null
    ? buildReviewedPlanFromCorrectedSavedCopy(correctedSavedCopy)
    : validatePlanContract(input.reviewedPlan);
  return auditRouteGraph(correctedSavedCopy, plan);
}

export function auditRouteGraph(
  correctedSavedCopy: SourceCorrectedSavedCopy,
  plan: PlanContract
): CorrectedPlanRouteAudit {
  const layout = correctedSavedCopy.authoringDraft.editableLayout;
  const roomIds = layout.rooms.map((room) => room.id).sort();
  const doorRoomIds = new Set(layout.doors.filter((door) => door.ownerKind === "room").map((door) => door.ownerId));
  const nodeIds = new Set(plan.pathNodes.map((node) => node.id));
  const roomNodeIdByRoomId = roomRouteNodeIds(plan);
  const edgeIds = new Set<string>();
  const danglingPathEdgeIds: string[] = [];
  const invalidPathEdgeIds: string[] = [];
  const nonFinitePathEdgeIds: string[] = [];
  const nonPositivePathEdgeIds: string[] = [];
  const validEdges: PathEdge[] = [];
  const degree = new Map(plan.pathNodes.map((node) => [node.id, 0]));

  for (const edge of plan.pathEdges) {
    if (edgeIds.has(edge.id) || edge.fromNodeId === edge.toNodeId) {
      invalidPathEdgeIds.push(edge.id);
    }
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) {
      danglingPathEdgeIds.push(edge.id);
      invalidPathEdgeIds.push(edge.id);
      continue;
    }
    if (!Number.isFinite(edge.lengthFeet)) {
      nonFinitePathEdgeIds.push(edge.id);
      continue;
    }
    if (edge.lengthFeet <= 0) {
      nonPositivePathEdgeIds.push(edge.id);
      continue;
    }
    degree.set(edge.fromNodeId, (degree.get(edge.fromNodeId) ?? 0) + 1);
    degree.set(edge.toNodeId, (degree.get(edge.toNodeId) ?? 0) + 1);
    validEdges.push(edge);
  }

  const adjacency = buildAdjacency(plan.pathNodes, validEdges.filter((edge) => !edge.blocked));
  const stationNodes = plan.pathNodes.filter((node) => node.nodeType === "station");
  const stationReachability = stationNodes.map((station) => ({
    stationId: station.id,
    reachableNodeIds: reachableNodeIds(station.id, adjacency)
  }));
  const stationReachableUnion = new Set(stationReachability.flatMap((entry) => [...entry.reachableNodeIds]));
  const roomsMissingDoor = roomIds.filter((roomId) => !doorRoomIds.has(roomId));
  const roomsMissingPathNode = roomIds.filter((roomId) => roomNodeIdByRoomId.get(roomId) == null);
  const unreachableRoomIds = roomIds.filter((roomId) => {
    const nodeId = roomNodeIdByRoomId.get(roomId);
    return nodeId == null || !stationReachableUnion.has(nodeId);
  });
  const stationToRoomRoutesChecked = stationNodes.length * roomIds.length;
  const stationToRoomRoutesPassed = stationReachability.reduce((count, station) => (
    count + roomIds.filter((roomId) => {
      const nodeId = roomNodeIdByRoomId.get(roomId);
      return nodeId != null && station.reachableNodeIds.has(nodeId);
    }).length
  ), 0);
  const blockedRequiredEdgeIds = plan.pathEdges
    .filter((edge) => edge.blocked)
    .filter((edge) => {
      const roomNodeIds = new Set([...roomNodeIdByRoomId.values()].filter((value): value is string => value != null));
      return roomNodeIds.has(edge.fromNodeId) || roomNodeIds.has(edge.toNodeId);
    })
    .map((edge) => edge.id)
    .sort();

  return {
    roomsChecked: roomIds.length,
    roomsMissingDoor,
    roomsMissingPathNode,
    unreachableRoomIds,
    orphanPathNodeIds: plan.pathNodes
      .filter((node) => (degree.get(node.id) ?? 0) === 0 && node.nodeType !== "entry")
      .map((node) => node.id)
      .sort(),
    danglingPathEdgeIds: uniqueSorted(danglingPathEdgeIds),
    invalidPathEdgeIds: uniqueSorted(invalidPathEdgeIds),
    nonFinitePathEdgeIds: uniqueSorted(nonFinitePathEdgeIds),
    nonPositivePathEdgeIds: uniqueSorted(nonPositivePathEdgeIds),
    blockedRequiredEdgeIds,
    stationToRoomRoutesChecked,
    stationToRoomRoutesPassed
  };
}

export function isFreshPathSyncEligible(audit: CorrectedPlanRouteAudit): boolean {
  return audit.roomsMissingDoor.length === 0 &&
    audit.roomsMissingPathNode.length === 0 &&
    audit.unreachableRoomIds.length === 0 &&
    audit.orphanPathNodeIds.length === 0 &&
    audit.danglingPathEdgeIds.length === 0 &&
    audit.invalidPathEdgeIds.length === 0 &&
    audit.nonFinitePathEdgeIds.length === 0 &&
    audit.nonPositivePathEdgeIds.length === 0 &&
    audit.blockedRequiredEdgeIds.length === 0 &&
    audit.stationToRoomRoutesChecked === audit.stationToRoomRoutesPassed;
}

export function repairCorrectedPlanRoutes(input: {
  correctedSavedCopy: SourceCorrectedSavedCopy | unknown;
  correctedSavedCopyPath: string;
  repairedSavedCopyPath: string;
  issue: string;
}): CorrectedPlanRouteRepairResult {
  const correctedSavedCopy = validateSourceCorrectedSavedCopy(input.correctedSavedCopy);
  const basePlan = buildReviewedPlanFromCorrectedSavedCopy(correctedSavedCopy);
  const beforeAudit = auditRouteGraph(correctedSavedCopy, basePlan);
  const nextNodes: PathNode[] = basePlan.pathNodes.map((node) => ({ ...node }));
  const nextEdges: PathEdge[] = basePlan.pathEdges.map((edge) => ({ ...edge }));
  const generatedPathNodes: RepairedPathNodeEvidence[] = [];
  const generatedPathEdges: RepairedPathEdgeEvidence[] = [];
  const blockingIssues: string[] = [];
  const layout = correctedSavedCopy.authoringDraft.editableLayout;

  for (const roomId of beforeAudit.roomsMissingPathNode) {
    const room = layout.rooms.find((candidate) => candidate.id === roomId);
    const door = layout.doors.find((candidate) => candidate.ownerKind === "room" && candidate.ownerId === roomId);
    if (room == null || door == null) {
      blockingIssues.push("blocked_needs_manual_layout_review");
      continue;
    }
    const doorPoint = doorPointFeet(door, room);
    const nodeId = `repaired-node-door-${roomId}`;
    if (!nextNodes.some((node) => node.id === nodeId)) {
      nextNodes.push({
        id: nodeId,
        nodeType: "room_door",
        x: doorPoint.x,
        y: doorPoint.y,
        linkedObjectId: door.id,
        entryOperationalMetadata: null,
        pathRepairMetadata: {
          repairBatch: "311-320",
          repairIssue: input.issue,
          repairAction: "generated",
          repairSource: "corrected_saved_copy",
          repairRule: "door_node_rule"
        }
      });
      generatedPathNodes.push({
        id: nodeId,
        linkedRoomId: roomId,
        linkedDoorId: door.id,
        x: doorPoint.x,
        y: doorPoint.y,
        generated: true,
        repaired: true,
        repairRule: "door_node_rule"
      });
    }
    const safeTarget = nearestSafeRouteTarget(basePlan, doorPoint);
    if (safeTarget == null) {
      blockingIssues.push("blocked_no_safe_route_target");
      continue;
    }
    const lengthFeet = euclideanDistance(doorPoint, safeTarget);
    const edgeId = `repaired-edge-${nodeId}-to-${safeTarget.id}`;
    if (!Number.isFinite(lengthFeet) || lengthFeet <= 0) {
      blockingIssues.push("blocked_invalid_geometry");
      continue;
    }
    if (!nextEdges.some((edge) => edge.id === edgeId)) {
      nextEdges.push({
        id: edgeId,
        fromNodeId: nodeId,
        toNodeId: safeTarget.id,
        lengthFeet,
        hallwayWidthFeet: 6,
        congestionFactor: 1,
        doorPenaltySeconds: 5,
        turnPenaltySeconds: 0,
        blocked: false,
        pathRepairMetadata: {
          repairBatch: "311-320",
          repairIssue: input.issue,
          repairAction: "repaired",
          repairSource: "corrected_saved_copy",
          repairRule: "edge_rule"
        }
      });
      generatedPathEdges.push({
        id: edgeId,
        fromNodeId: nodeId,
        toNodeId: safeTarget.id,
        lengthFeet,
        generated: true,
        repaired: true,
        repairRule: "edge_rule"
      });
    }
  }

  let repairedPlan: PlanContract | null = null;
  let afterAudit: CorrectedPlanRouteAudit = beforeAudit;
  let pathSyncStatus: CorrectedPlanPathSyncStatus = "blocked";
  let routeRepairStatus: CorrectedPlanRouteRepairStatus = blockingIssues.includes("blocked_no_safe_route_target")
    ? "blocked_no_safe_route_target"
    : blockingIssues.includes("blocked_invalid_geometry")
      ? "blocked_invalid_geometry"
      : blockingIssues.includes("blocked_needs_manual_layout_review")
        ? "blocked_needs_manual_layout_review"
        : "repaired";

  try {
    const roomNodeByDoorId = new Map(generatedPathNodes.map((node) => [node.linkedDoorId, node.id]));
    repairedPlan = validatePlanContract({
      ...basePlan,
      rooms: basePlan.rooms.map((room) => {
        const door = basePlan.doors.find((candidate) => candidate.roomId === room.id);
        return {
          ...room,
          pathNodeId: door == null ? room.pathNodeId ?? null : roomNodeByDoorId.get(door.id) ?? room.pathNodeId ?? null
        };
      }),
      doors: basePlan.doors.map((door) => ({
        ...door,
        pathNodeId: roomNodeByDoorId.get(door.id) ?? door.pathNodeId ?? null
      })),
      pathNodes: sortNodes(nextNodes),
      pathEdges: sortEdges(nextEdges)
    });
    afterAudit = auditRouteGraph(correctedSavedCopy, repairedPlan);
    pathSyncStatus = isFreshPathSyncEligible(afterAudit) &&
      correctedSavedCopy.syntheticDataOnly === true &&
      correctedSavedCopy.correctionMetadata.exactParityClaimMade === false
      ? "fresh"
      : "stale_warning";
    if (pathSyncStatus !== "fresh" && routeRepairStatus === "repaired") {
      routeRepairStatus = "blocked_needs_manual_layout_review";
    }
  } catch {
    routeRepairStatus = "blocked_invalid_geometry";
    pathSyncStatus = "blocked";
  }

  const repairedSavedCopy = validateSourceCorrectedSavedCopy({
    ...correctedSavedCopy,
    versionLabel: `${correctedSavedCopy.versionLabel}-route-repaired-${input.issue}`,
    authoringDraft: {
      ...correctedSavedCopy.authoringDraft,
      versionLabel: `${correctedSavedCopy.authoringDraft.versionLabel}-route-repaired-${input.issue}`,
      sourcePlan: repairedPlan ?? correctedSavedCopy.authoringDraft.sourcePlan,
      pathSyncStatus,
      authoringStatus: pathSyncStatus === "fresh" ? "simulation_ready" : "draft_has_warnings",
      authoringWarnings: pathSyncStatus === "fresh"
        ? []
        : uniqueSorted([
            ...correctedSavedCopy.authoringDraft.authoringWarnings,
            "Corrected saved copy route repair remains blocked."
          ])
    }
  });

  return {
    repairedSavedCopy,
    repairedPlan,
    report: {
      planId: correctedSavedCopy.planId,
      sourceDefaultPlanId: correctedSavedCopy.sourceDefaultPlanId,
      correctedSavedCopyPath: input.correctedSavedCopyPath,
      repairedSavedCopyPath: input.repairedSavedCopyPath,
      routeRepairStatus,
      pathSyncStatus,
      beforeAudit,
      afterAudit,
      generatedPathNodes,
      generatedPathEdges,
      blockingIssues: uniqueSorted([
        ...blockingIssues,
        ...(pathSyncStatus === "fresh" ? [] : ["PATH_SYNC_NOT_FRESH"])
      ]),
      warningIssues: pathSyncStatus === "fresh" ? [] : ["MANUAL_LAYOUT_REVIEW_REQUIRED"],
      limitations: [
        "Route repair uses deterministic graph connectivity rules on corrected saved-copy JSON only.",
        "Generated route links do not claim exact walking route truth.",
        "No manual visual approval or default fixture promotion is claimed."
      ]
    }
  };
}

export function buildSimulationReadyExportFromRepairedCopy(input: {
  repairedSavedCopy: SourceCorrectedSavedCopy | unknown;
  repairedPlan: PlanContract | unknown;
}) {
  const repairedSavedCopy = validateSourceCorrectedSavedCopy(input.repairedSavedCopy);
  const repairedPlan = validatePlanContract(input.repairedPlan);
  return validateSimulationReadyExport({
    authoringDraft: repairedSavedCopy.authoringDraft,
    reviewedPathPlan: repairedPlan
  });
}

function roomRouteNodeIds(plan: PlanContract): Map<string, string | null> {
  const doorById = new Map(plan.doors.map((door) => [door.id, door]));
  const result = new Map<string, string | null>();
  for (const room of plan.rooms) {
    result.set(room.id, room.pathNodeId ?? null);
  }
  for (const node of plan.pathNodes) {
    if (node.nodeType !== "room_door" || node.linkedObjectId == null) {
      continue;
    }
    const door = doorById.get(node.linkedObjectId);
    if (door != null && result.get(door.roomId) == null) {
      result.set(door.roomId, node.id);
    }
  }
  return result;
}

function nearestSafeRouteTarget(plan: PlanContract, point: { x: number; y: number }): RouteNode | null {
  const adjacency = buildAdjacency(plan.pathNodes, plan.pathEdges.filter((edge) => (
    !edge.blocked && Number.isFinite(edge.lengthFeet) && edge.lengthFeet > 0
  )));
  const stationNodeIds = plan.pathNodes.filter((node) => node.nodeType === "station").map((node) => node.id);
  const stationReachableNodeIds = new Set(stationNodeIds.flatMap((stationId) => [...reachableNodeIds(stationId, adjacency)]));
  return plan.pathNodes
    .filter((node) => (node.nodeType === "hallway" || node.nodeType === "station") && stationReachableNodeIds.has(node.id))
    .map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      distance: euclideanDistance(point, node)
    }))
    .filter((candidate) => Number.isFinite(candidate.distance) && candidate.distance > 0)
    .sort((left, right) => left.distance - right.distance || left.id.localeCompare(right.id))
    .map(({ id, x, y }) => ({ id, x, y }))[0] ?? null;
}

function buildAdjacency(nodes: PathNode[], edges: PathEdge[]): Map<string, Set<string>> {
  const adjacency = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of edges) {
    adjacency.get(edge.fromNodeId)?.add(edge.toNodeId);
    adjacency.get(edge.toNodeId)?.add(edge.fromNodeId);
  }
  return adjacency;
}

function reachableNodeIds(startNodeId: string, adjacency: Map<string, Set<string>>): Set<string> {
  const reachable = new Set<string>([startNodeId]);
  const queue = [startNodeId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) {
      continue;
    }
    for (const next of adjacency.get(current) ?? []) {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }
  return reachable;
}

function doorPointFeet(
  door: { wall: "north" | "south" | "east" | "west"; offsetFeet: number; widthFeet: number },
  room: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number }
): { x: number; y: number } {
  switch (door.wall) {
    case "north":
      return { x: room.xFeet + door.offsetFeet + door.widthFeet / 2, y: room.yFeet };
    case "south":
      return { x: room.xFeet + door.offsetFeet + door.widthFeet / 2, y: room.yFeet + room.heightFeet };
    case "east":
      return { x: room.xFeet + room.widthFeet, y: room.yFeet + door.offsetFeet + door.widthFeet / 2 };
    case "west":
      return { x: room.xFeet, y: room.yFeet + door.offsetFeet + door.widthFeet / 2 };
  }
}

function euclideanDistance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function sortNodes(nodes: PathNode[]): PathNode[] {
  return [...nodes].sort((left, right) => left.id.localeCompare(right.id));
}

function sortEdges(edges: PathEdge[]): PathEdge[] {
  return [...edges].sort((left, right) => left.id.localeCompare(right.id));
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}
