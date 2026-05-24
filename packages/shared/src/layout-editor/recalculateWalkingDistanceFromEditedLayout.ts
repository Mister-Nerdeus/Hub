import type { PlanContract } from "../contracts.js";
import { LAYOUT_FRICTION_LIMITATIONS } from "../outcomes/nurseWalkLayoutFrictionSummary.js";
import {
  calculatePathTravelTime,
  rebuildPathEdgeLengthsFromNodeGeometry
} from "../pathing/pathTravelTime.js";

export const WALKING_DISTANCE_RECALCULATION_LIMITATIONS = [
  "Walking distance recalculation is derived from baseline and edited path node geometry only.",
  "Output is feet-based and compares deterministic path travel distance for the supplied route.",
  "No full simulation rerun, task schedule regeneration, or pathfinding algorithm change is performed."
] as const;

export type WalkingDistanceFromEditedLayoutResult = {
  baselinePlanId: string;
  editedPlanId: string;
  originNodeId: string;
  destinationNodeId: string;
  baselineDistanceFeet: number;
  editedDistanceFeet: number;
  deltaFeet: number;
  percentChange: number;
  baselineRouteEdgeIds: string[];
  editedRouteEdgeIds: string[];
  limitations: string[];
};

export type RecalculateWalkingDistanceFromEditedLayoutInput = {
  baselinePlan: PlanContract;
  editedPlan: PlanContract;
  originNodeId: string;
  destinationNodeId: string;
  walkingSpeedFeetPerMinute?: number;
};

export function recalculateWalkingDistanceFromEditedLayout(
  input: RecalculateWalkingDistanceFromEditedLayoutInput
): WalkingDistanceFromEditedLayoutResult {
  const walkingSpeedFeetPerMinute = input.walkingSpeedFeetPerMinute ?? 240;
  const baselinePlan = rebuildPathEdgeLengthsFromNodeGeometry(input.baselinePlan);
  const editedPlan = rebuildPathEdgeLengthsFromNodeGeometry(input.editedPlan);
  const baselineTravel = calculatePathTravelTime({
    plan: baselinePlan,
    originNodeId: input.originNodeId,
    destinationNodeId: input.destinationNodeId,
    walkingSpeedFeetPerMinute
  });
  const editedTravel = calculatePathTravelTime({
    plan: editedPlan,
    originNodeId: input.originNodeId,
    destinationNodeId: input.destinationNodeId,
    walkingSpeedFeetPerMinute
  });

  const baselineDistanceFeet = roundFeet(baselineTravel.travelDistanceFeet);
  const editedDistanceFeet = roundFeet(editedTravel.travelDistanceFeet);
  const deltaFeet = roundFeet(editedDistanceFeet - baselineDistanceFeet);

  return {
    baselinePlanId: baselinePlan.planId,
    editedPlanId: editedPlan.planId,
    originNodeId: input.originNodeId,
    destinationNodeId: input.destinationNodeId,
    baselineDistanceFeet,
    editedDistanceFeet,
    deltaFeet,
    percentChange: calculatePercentChange(baselineDistanceFeet, editedDistanceFeet),
    baselineRouteEdgeIds: baselineTravel.routeEdgeIds,
    editedRouteEdgeIds: editedTravel.routeEdgeIds,
    limitations: [
      ...WALKING_DISTANCE_RECALCULATION_LIMITATIONS,
      ...LAYOUT_FRICTION_LIMITATIONS.slice(0, 1)
    ]
  };
}

function calculatePercentChange(baselineDistanceFeet: number, editedDistanceFeet: number): number {
  if (baselineDistanceFeet === 0) {
    return editedDistanceFeet === 0 ? 0 : 100;
  }
  return roundPercent(((editedDistanceFeet - baselineDistanceFeet) / baselineDistanceFeet) * 100);
}

function roundFeet(value: number): number {
  return normalizeSignedZero(Math.round(value * 1000) / 1000);
}

function roundPercent(value: number): number {
  return normalizeSignedZero(Math.round(value * 1000) / 1000);
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}
