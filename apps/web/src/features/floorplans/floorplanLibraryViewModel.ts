import type { DefaultSavedPlanFixtureContract } from "@nerdeus/shared";

import { defaultFloorplanLibraryFixtures } from "../../fixtures/defaultPlans";
import type { SavedFloorplanRecord } from "./savedFloorplanStore";

export type FloorplanLibraryCardViewModel = {
  planId: string;
  name: string;
  recordId: string;
  artifactType: "json-floorplan";
  accessMode: "read-only-default" | "editable-saved";
  readOnlyLabel: string;
  sourceDerivedStatus: string;
  importStatus: string;
  mappingStatus: string | null;
  parentDefaultPlanId: string | null;
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
  fixtures: DefaultSavedPlanFixtureContract[] = defaultFloorplanLibraryFixtures,
  savedRecords: SavedFloorplanRecord[] = []
): FloorplanLibraryViewModel {
  const defaultFloorplans = fixtures
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
      parentDefaultPlanId: null,
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
    }));
  const savedFloorplans = savedRecords.map((record) => ({
    planId: record.plan.planId,
    name: record.plan.name,
    recordId: record.recordId,
    artifactType: "json-floorplan" as const,
    accessMode: "editable-saved" as const,
    readOnlyLabel: "Editable saved copy",
    sourceDerivedStatus: "Editable JSON copy",
    importStatus: "validated_saved",
    mappingStatus: null,
    parentDefaultPlanId: record.parentDefaultPlanId,
    objectCounts: {
      rooms: record.plan.rooms.length,
      hallways: record.plan.hallways.length,
      doors: record.plan.doors.length,
      nurseStations: record.plan.nurseStations.length,
      zones: record.plan.zones.length,
      pathNodes: record.plan.pathNodes.length,
      pathEdges: record.plan.pathEdges.length
    },
    limitationsSummary: [
      "Editable saved JSON copy stored in local app state.",
      `Parent default plan: ${record.parentDefaultPlanId}`
    ]
  }));
  const floorplans = [...defaultFloorplans, ...savedFloorplans].sort((left, right) =>
    left.recordId.localeCompare(right.recordId)
  );

  return {
    libraryId: "json-floorplan-library-v1",
    floorplans,
    totals: {
      defaultJsonPlanCount: defaultFloorplans.length,
      editableSavedPlanCount: savedFloorplans.length
    },
    limitationsSummary: [
      "JSON floorplans are approximate operational layouts.",
      "Default floorplans are read-only; duplicated copies are editable local JSON records."
    ]
  };
}
