import type { DefaultSavedPlanFixtureContract, PlanContract } from "@nerdeus/shared";

import { defaultFloorplanLibraryFixtures } from "../../fixtures/defaultPlans";

export type ActiveFloorplanRecord = {
  planId: string;
  name: string;
  recordId: string;
  sourceKind: "default-json";
  readOnly: true;
  importStatus: "validated_default";
  mappingStatus: string;
  plan: PlanContract;
};

export type ActiveFloorplanSelectionState = {
  selectedObjectId: string | null;
  routePreviewDraft: null;
};

export type ActiveFloorplanState = {
  activeFloorplan: ActiveFloorplanRecord | null;
  selection: ActiveFloorplanSelectionState;
  sequence: number;
};

export type ActiveFloorplanSummaryViewModel = {
  hasActiveFloorplan: boolean;
  planId: string | null;
  name: string;
  readOnly: boolean;
  sourceKind: "default-json" | null;
  importStatus: string | null;
  mappingStatus: string | null;
  selectedObjectId: string | null;
  objectCounts: {
    rooms: number;
    hallways: number;
    doors: number;
    nurseStations: number;
    zones: number;
    pathNodes: number;
    pathEdges: number;
  } | null;
};

export function createEmptyActiveFloorplanState(): ActiveFloorplanState {
  return {
    activeFloorplan: null,
    selection: createEmptySelectionState(),
    sequence: 0
  };
}

export function openDefaultFloorplan(
  state: ActiveFloorplanState,
  planId: string,
  fixtures: DefaultSavedPlanFixtureContract[] = defaultFloorplanLibraryFixtures
): ActiveFloorplanState {
  const fixture = fixtures.find((candidate) => candidate.plan.planId === planId);
  if (fixture == null || fixture.readOnly !== true || fixture.importStatus !== "validated_default") {
    throw new Error(`Cannot open non-validated default JSON floorplan: ${planId}`);
  }

  return {
    activeFloorplan: {
      planId: fixture.plan.planId,
      name: fixture.plan.name,
      recordId: fixture.defaultPlanRecordId,
      sourceKind: "default-json",
      readOnly: true,
      importStatus: fixture.importStatus,
      mappingStatus: fixture.mappingId,
      plan: fixture.plan
    },
    selection: createEmptySelectionState(),
    sequence: state.sequence + 1
  };
}

export function createActiveFloorplanSummaryViewModel(
  state: ActiveFloorplanState
): ActiveFloorplanSummaryViewModel {
  const floorplan = state.activeFloorplan;
  if (floorplan == null) {
    return {
      hasActiveFloorplan: false,
      planId: null,
      name: "No active floorplan",
      readOnly: false,
      sourceKind: null,
      importStatus: null,
      mappingStatus: null,
      selectedObjectId: state.selection.selectedObjectId,
      objectCounts: null
    };
  }

  return {
    hasActiveFloorplan: true,
    planId: floorplan.planId,
    name: floorplan.name,
    readOnly: floorplan.readOnly,
    sourceKind: floorplan.sourceKind,
    importStatus: floorplan.importStatus,
    mappingStatus: floorplan.mappingStatus,
    selectedObjectId: state.selection.selectedObjectId,
    objectCounts: {
      rooms: floorplan.plan.rooms.length,
      hallways: floorplan.plan.hallways.length,
      doors: floorplan.plan.doors.length,
      nurseStations: floorplan.plan.nurseStations.length,
      zones: floorplan.plan.zones.length,
      pathNodes: floorplan.plan.pathNodes.length,
      pathEdges: floorplan.plan.pathEdges.length
    }
  };
}

function createEmptySelectionState(): ActiveFloorplanSelectionState {
  return {
    selectedObjectId: null,
    routePreviewDraft: null
  };
}
