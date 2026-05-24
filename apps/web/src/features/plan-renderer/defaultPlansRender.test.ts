import {
  defaultPlanFixtureReferences,
  defaultPlanFixtures,
  defaultPlanRenderProofPlans
} from "../../fixtures/defaultPlans";
import {
  getPlanBounds,
  hallwayToPolyline,
  pathEdgeToLine,
  roomToRect,
  zoneToRect
} from "./planRenderGeometry";

if (
  defaultPlanFixtureReferences.length !== 5 ||
  defaultPlanFixtures.length !== 5 ||
  defaultPlanRenderProofPlans.length !== 5
) {
  throw new Error("Web default plan fixture list must include all five plans");
}

for (const reference of defaultPlanFixtureReferences) {
  const fixture = defaultPlanFixtures.find((candidate) => candidate.plan.planId === reference.planId);
  const plan = defaultPlanRenderProofPlans.find((candidate) => candidate.planId === reference.planId);
  if (!fixture) {
    throw new Error(`Missing loaded default plan fixture for ${reference.planId}`);
  }
  if (!plan) {
    throw new Error(`Missing web render proof plan for ${reference.planId}`);
  }
  if (fixture.readOnly !== true || fixture.defaultPlanRecordId !== `default-plan-er-layout-plan-${reference.planId.slice(-1)}`) {
    throw new Error(`Default plan fixture wrapper must be read-only and namespaced for ${reference.planId}`);
  }
  if (fixture.plan !== plan) {
    throw new Error(`Default plan render proof must use loaded fixture plan for ${reference.planId}`);
  }
  if (!reference.fixturePath.includes(`${reference.planId}.json`)) {
    throw new Error(`Default plan fixture path must include ${reference.planId}`);
  }
  if (plan.rooms.length === 0 || plan.hallways.length === 0 || plan.zones.length === 0) {
    throw new Error(`Default plan render proof must include visible geometry for ${reference.planId}`);
  }

  const bounds = getPlanBounds(plan);
  if (bounds.width <= 0 || bounds.height <= 0) {
    throw new Error(`Default plan render bounds must be positive for ${reference.planId}`);
  }
  if (!plan.rooms.every((room) => roomToRect(room, plan.scale).width > 0)) {
    throw new Error(`Default plan rooms must render with positive width for ${reference.planId}`);
  }
  if (!plan.zones.every((zone) => zoneToRect(zone, plan.scale).height > 0)) {
    throw new Error(`Default plan zones must render with positive height for ${reference.planId}`);
  }
  if (!plan.hallways.every((hallway) => hallwayToPolyline(hallway, plan.scale).length >= 2)) {
    throw new Error(`Default plan hallways must render as polylines for ${reference.planId}`);
  }
  if (!plan.pathEdges.every((edge) => pathEdgeToLine(edge, plan.pathNodes, plan.scale).strokeWidth > 0)) {
    throw new Error(`Default plan path edges must render with visible stroke width for ${reference.planId}`);
  }
}
