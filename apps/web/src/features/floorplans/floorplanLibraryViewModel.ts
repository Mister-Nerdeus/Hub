import type { DefaultSavedPlanFixtureContract } from "@nerdeus/shared";

import { defaultFloorplanLibraryFixtures } from "../../fixtures/defaultPlans";

export type FloorplanLibraryCardViewModel = {
  planId: string;
  name: string;
  recordId: string;
  artifactType: "json-floorplan";
  accessMode: "read-only-default";
  readOnlyLabel: string;
  sourceDerivedStatus: string;
  importStatus: string;
  mappingStatus: string;
  objectCounts: {
    rooms: number;
    hallways: number;
    doors: number;
    nurseStations: number;
    zones: number;
    pathNodes: number;
    pathEdges: number;
  };
  limitationsSummary: string[];
};

export type FloorplanLibraryViewModel = {
  libraryId: "json-floorplan-library-v1";
  floorplans: FloorplanLibraryCardViewModel[];
  totals: {
    defaultJsonPlanCount: number;
    editableSavedPlanCount: number;
  };
  limitationsSummary: string[];
};

export function createFloorplanLibraryViewModel(
  fixtures: DefaultSavedPlanFixtureContract[] = defaultFloorplanLibraryFixtures
): FloorplanLibraryViewModel {
  const floorplans = fixtures
    .map((fixture) => ({
      planId: fixture.plan.planId,
      name: fixture.plan.name,
      recordId: fixture.defaultPlanRecordId,
      artifactType: "json-floorplan" as const,
      accessMode: "read-only-default" as const,
      readOnlyLabel: "Read-only default",
      sourceDerivedStatus: "Source-derived JSON default",
      importStatus: fixture.importStatus,
      mappingStatus: fixture.mappingId,
      objectCounts: {
        rooms: fixture.plan.rooms.length,
        hallways: fixture.plan.hallways.length,
        doors: fixture.plan.doors.length,
        nurseStations: fixture.plan.nurseStations.length,
        zones: fixture.plan.zones.length,
        pathNodes: fixture.plan.pathNodes.length,
        pathEdges: fixture.plan.pathEdges.length
      },
      limitationsSummary: fixture.limitations
    }))
    .sort((left, right) => left.planId.localeCompare(right.planId));

  return {
    libraryId: "json-floorplan-library-v1",
    floorplans,
    totals: {
      defaultJsonPlanCount: floorplans.length,
      editableSavedPlanCount: 0
    },
    limitationsSummary: [
      "JSON floorplans are approximate operational layouts.",
      "Default floorplans are read-only until duplicated in a later workflow."
    ]
  };
}
