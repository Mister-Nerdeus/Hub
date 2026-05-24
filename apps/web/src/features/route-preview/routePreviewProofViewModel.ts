import {
  buildRoutePreview,
  type DefaultSavedPlanFixtureContract,
  type RoutePreviewOutput
} from "@nerdeus/shared";

import { defaultPlanFixtures } from "../../fixtures/defaultPlans";

export type RoutePreviewProofNodeOption = {
  pathNodeId: string;
  label: string;
  nodeType: string;
};

export type RoutePreviewProofPlanOption = {
  planId: string;
  label: string;
  nodeOptions: RoutePreviewProofNodeOption[];
};

export type RoutePreviewProofViewModel = {
  planOptions: RoutePreviewProofPlanOption[];
  selectedPlanId: string;
  originPathNodeId: string;
  destinationPathNodeId: string;
  routePreview: RoutePreviewOutput;
  limitations: string[];
};

export type RoutePreviewProofSelection = {
  selectedPlanId?: string;
  originPathNodeId?: string;
  destinationPathNodeId?: string;
};

export function createRoutePreviewProofViewModel(
  selection: RoutePreviewProofSelection = {},
  fixtures: DefaultSavedPlanFixtureContract[] = defaultPlanFixtures
): RoutePreviewProofViewModel {
  if (fixtures.length === 0) {
    throw new Error("route preview proof requires at least one default plan fixture");
  }
  const planOptions = fixtures.map((fixture) => ({
    planId: fixture.plan.planId,
    label: fixture.plan.name,
    nodeOptions: fixture.plan.pathNodes
      .map((node) => ({
        pathNodeId: node.id,
        label: `${node.id} (${node.nodeType})`,
        nodeType: node.nodeType
      }))
      .sort((left, right) => left.pathNodeId.localeCompare(right.pathNodeId))
  }));
  const selectedPlan =
    fixtures.find((fixture) => fixture.plan.planId === selection.selectedPlanId) ?? fixtures[0];
  if (selectedPlan == null) {
    throw new Error("route preview selected plan is missing");
  }
  const selectedPlanOption = planOptions.find((option) => option.planId === selectedPlan.plan.planId);
  if (selectedPlanOption == null) {
    throw new Error("route preview selected plan option is missing");
  }

  const originPathNodeId =
    selection.originPathNodeId && selectedPlan.plan.pathNodes.some((node) => node.id === selection.originPathNodeId)
      ? selection.originPathNodeId
      : defaultOriginPathNodeId(selectedPlan);
  const destinationPathNodeId =
    selection.destinationPathNodeId &&
    selectedPlan.plan.pathNodes.some((node) => node.id === selection.destinationPathNodeId)
      ? selection.destinationPathNodeId
      : defaultDestinationPathNodeId(selectedPlan, originPathNodeId);
  const routePreview = buildRoutePreview(selectedPlan.plan, {
    schemaVersion: "1.0.0",
    planId: selectedPlan.plan.planId,
    originPathNodeId,
    destinationPathNodeId
  });

  return {
    planOptions,
    selectedPlanId: selectedPlan.plan.planId,
    originPathNodeId,
    destinationPathNodeId,
    routePreview,
    limitations: routePreview.limitations
  };
}

function defaultOriginPathNodeId(fixture: DefaultSavedPlanFixtureContract): string {
  const entryNode = fixture.plan.pathNodes.find((node) => node.nodeType === "entry");
  if (entryNode != null) {
    return entryNode.id;
  }
  return fixture.plan.pathNodes[0]?.id ?? "";
}

function defaultDestinationPathNodeId(
  fixture: DefaultSavedPlanFixtureContract,
  originPathNodeId: string
): string {
  const traumaRoom = fixture.plan.rooms.find((room) => room.traumaCapable && room.pathNodeId != null);
  if (traumaRoom?.pathNodeId != null && traumaRoom.pathNodeId !== originPathNodeId) {
    return traumaRoom.pathNodeId;
  }
  return fixture.plan.pathNodes.find((node) => node.id !== originPathNodeId)?.id ?? originPathNodeId;
}
