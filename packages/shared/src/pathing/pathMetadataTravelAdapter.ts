import { validatePlanContract, type PlanContract } from "../contracts.js";
import {
  validateRoutePreviewOutput,
  type RoutePreviewOutput
} from "./routePreviewContract.js";

export type RouteMetadataAnnotation = {
  routeEdgeId: string;
  hallwayId?: string | null;
  hallwayClass?: string | null;
  congestionLevel?: string | null;
  bottleneck?: boolean | null;
  doorId?: string | null;
  doorClass?: string | null;
  delayCategory?: string | null;
  limitations: string[];
};

export type RoutePreviewMetadataAnnotationResult = {
  schemaVersion: "1.0.0";
  planId: string;
  routePreview: RoutePreviewOutput;
  metadataAnnotations: RouteMetadataAnnotation[];
  limitations: string[];
};

export const ROUTE_METADATA_ANNOTATION_LIMITATIONS = [
  "Metadata annotations are descriptive fixture metadata only.",
  "Annotations do not change route selection, distance, travel time, scoring, simulation, or optimizer behavior."
];

export function annotateRoutePreviewWithPathMetadata(
  planValue: PlanContract,
  routePreviewValue: RoutePreviewOutput
): RoutePreviewMetadataAnnotationResult {
  const plan = validatePlanContract(planValue);
  const routePreview = validateRoutePreviewOutput(routePreviewValue);
  if (routePreview.planId !== plan.planId) {
    throw new Error("routePreview.planId must match plan.planId");
  }

  const nodeById = new Map(plan.pathNodes.map((node) => [node.id, node]));
  const edgeById = new Map(plan.pathEdges.map((edge) => [edge.id, edge]));
  const hallwayById = new Map(plan.hallways.map((hallway) => [hallway.id, hallway]));
  const doorById = new Map(plan.doors.map((door) => [door.id, door]));

  const metadataAnnotations = routePreview.routeEdgeIds.map((routeEdgeId) => {
    const edge = edgeById.get(routeEdgeId);
    if (edge == null) {
      throw new Error("routeEdgeIds must reference plan path edges");
    }
    const nodes = [nodeById.get(edge.fromNodeId), nodeById.get(edge.toNodeId)].filter(
      (node): node is NonNullable<typeof node> => node != null
    );
    const hallway = nodes
      .map((node) => (node.nodeType === "hallway" && node.linkedObjectId ? hallwayById.get(node.linkedObjectId) : null))
      .find((candidate) => candidate != null);
    const door = nodes
      .map((node) => (node.nodeType === "room_door" && node.linkedObjectId ? doorById.get(node.linkedObjectId) : null))
      .find((candidate) => candidate != null);

    return {
      routeEdgeId,
      hallwayId: hallway?.id ?? null,
      hallwayClass: hallway?.hallwayOperationalMetadata?.hallwayClass ?? null,
      congestionLevel: hallway?.hallwayOperationalMetadata?.congestionLevel ?? null,
      bottleneck: hallway?.hallwayOperationalMetadata?.bottleneck ?? null,
      doorId: door?.id ?? null,
      doorClass: door?.doorOperationalMetadata?.doorClass ?? null,
      delayCategory: door?.doorOperationalMetadata?.delayCategory ?? null,
      limitations: [...ROUTE_METADATA_ANNOTATION_LIMITATIONS]
    };
  });

  return {
    schemaVersion: "1.0.0",
    planId: plan.planId,
    routePreview,
    metadataAnnotations,
    limitations: [...ROUTE_METADATA_ANNOTATION_LIMITATIONS]
  };
}
