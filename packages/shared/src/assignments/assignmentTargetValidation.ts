import type { RouteGraphContract } from "../floorplans/routeGraphContract.js";
import {
  validateAssignmentTargetContract,
  type AssignmentTargetContract
} from "./assignmentTargetContract.js";

export type AssignmentTargetRouteStatus =
  | "connected"
  | "missing"
  | "inactive"
  | "disconnected"
  | "unknown";

export type AssignmentTargetValidationResult = {
  assignmentTargetId: string;
  routeStatus: AssignmentTargetRouteStatus;
  messages: string[];
};

export function validateAssignmentTargetConnectivity(input: {
  target: AssignmentTargetContract | null;
  activeTargetIds: ReadonlySet<string>;
  routeGraph?: RouteGraphContract | null;
}): AssignmentTargetValidationResult {
  if (input.target == null) {
    return {
      assignmentTargetId: "unknown",
      routeStatus: "missing",
      messages: ["Target not found in active floorplan"]
    };
  }
  const target = validateAssignmentTargetContract(input.target);
  if (!input.activeTargetIds.has(target.assignmentTargetId)) {
    return {
      assignmentTargetId: target.assignmentTargetId,
      routeStatus: "missing",
      messages: ["Target not found in active floorplan"]
    };
  }
  if (!target.active) {
    return {
      assignmentTargetId: target.assignmentTargetId,
      routeStatus: "inactive",
      messages: ["Inactive assignment target"]
    };
  }
  if (target.routeNodeId == null || input.routeGraph == null) {
    return {
      assignmentTargetId: target.assignmentTargetId,
      routeStatus: "unknown",
      messages: []
    };
  }
  const node = input.routeGraph.nodes.find((candidate) => candidate.routeNodeId === target.routeNodeId);
  if (node == null) {
    return {
      assignmentTargetId: target.assignmentTargetId,
      routeStatus: "disconnected",
      messages: ["Assignment target not connected in route graph"]
    };
  }
  return {
    assignmentTargetId: target.assignmentTargetId,
    routeStatus: "connected",
    messages: []
  };
}
