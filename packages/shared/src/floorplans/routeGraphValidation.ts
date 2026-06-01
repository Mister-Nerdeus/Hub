import {
  deriveRouteGraphFromGeometry
} from "./deriveRouteGraphFromGeometry.js";
import type { RouteGraphContract, RouteGraphWarningContract } from "./routeGraphContract.js";
import type { EditableLayoutGeometryContract } from "../layout-editor/editableLayoutGeometryContract.js";
import { routeNodeIdFor } from "./routeNodeContract.js";

export type RouteGraphValidationResult = {
  status: "passed" | "warning" | "failed";
  warnings: RouteGraphWarningContract[];
};

export function validateRouteGraphConnectivity(
  layout: EditableLayoutGeometryContract,
  graph: RouteGraphContract = deriveRouteGraphFromGeometry(layout)
): RouteGraphValidationResult {
  const warnings = [...graph.warnings];
  const traversableEdges = graph.edges.filter((edge) => edge.traversable);
  for (const room of layout.rooms) {
    if (room.roomType === "solid_wall" || room.roomType === "storage" || room.roomType === "provider_pharmacy") {
      continue;
    }
    const nodeId = routeNodeIdFor("room", room.id);
    if (!traversableEdges.some((edge) => edge.fromNodeId === nodeId || edge.toNodeId === nodeId)) {
      warnings.push({
        code: "route_disconnected_room",
        severity: "warning",
        sourceObjectType: "room",
        sourceObjectId: room.id,
        message: "Room has no traversable route connectivity."
      });
    }
  }
  const hasError = warnings.some((warning) => warning.severity === "error");
  return {
    status: hasError ? "failed" : warnings.length === 0 ? "passed" : "warning",
    warnings
  };
}
