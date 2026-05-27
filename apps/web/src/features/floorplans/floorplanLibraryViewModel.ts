import type { DefaultSavedPlanFixtureContract } from "@nerdeus/shared";

import { defaultFloorplanLibraryFixtures } from "../../fixtures/defaultPlans";
import {
  CANONICAL_FLOORPLAN_ID,
  classifyDefaultFloorplan,
  type DefaultFloorplanClassification
} from "./canonicalFloorplanViewModel";
import type { SavedFloorplanRecord } from "./savedFloorplanStore";

export type FloorplanLibraryCardViewModel = {
  planId: string;
  name: string;
  recordId: string;
  artifactType: "json-floorplan";
  accessMode: "read-only-default" | "editable-saved";
  defaultClassification: DefaultFloorplanClassification | null;
  productVisibility: "normal-product" | "developer-reference";
  isCanonicalProductFloorplan: boolean;
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
  libraryId: "canonical-er-pod-floorplan-library-v1";
  title: "Canonical ER Pod Floorplan";
  floorplans: FloorplanLibraryCardViewModel[];
  legacyDefaultFloorplans: FloorplanLibraryCardViewModel[];
  totals: {
    canonicalDefaultPlanCount: number;
    defaultJsonPlanCount: number;
    editableSavedPlanCount: number;
    protectedLegacyDefaultPlanCount: number;
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
      defaultClassification: classifyDefaultFloorplan(fixture),
      productVisibility: classifyDefaultFloorplan(fixture) === "canonical-default"
        ? "normal-product" as const
        : "developer-reference" as const,
      isCanonicalProductFloorplan: fixture.plan.planId === CANONICAL_FLOORPLAN_ID,
      readOnlyLabel: classifyDefaultFloorplan(fixture) === "canonical-default"
        ? "Canonical read-only default"
        : "Protected legacy reference",
      sourceDerivedStatus: classifyDefaultFloorplan(fixture) === "canonical-default"
        ? "Canonical source-derived JSON default"
        : "Legacy source-derived JSON reference fixture",
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
    defaultClassification: null,
    productVisibility: "normal-product" as const,
    isCanonicalProductFloorplan: false,
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
  const canonicalDefaultFloorplans = defaultFloorplans.filter(
    (floorplan) => floorplan.defaultClassification === "canonical-default"
  );
  const legacyDefaultFloorplans = defaultFloorplans.filter(
    (floorplan) => floorplan.defaultClassification === "legacy-default"
  );
  const floorplans = [...canonicalDefaultFloorplans, ...savedFloorplans].sort((left, right) =>
    left.recordId.localeCompare(right.recordId)
  );

  return {
    libraryId: "canonical-er-pod-floorplan-library-v1",
    title: "Canonical ER Pod Floorplan",
    floorplans,
    legacyDefaultFloorplans,
    totals: {
      canonicalDefaultPlanCount: canonicalDefaultFloorplans.length,
      defaultJsonPlanCount: canonicalDefaultFloorplans.length,
      editableSavedPlanCount: savedFloorplans.length,
      protectedLegacyDefaultPlanCount: legacyDefaultFloorplans.length
    },
    limitationsSummary: [
      "The product uses one canonical floorplan.",
      "Plan 2-5 legacy fixtures are retained for verification only.",
      "JSON floorplans are approximate operational layouts.",
      "Default floorplans are read-only; duplicated copies are editable local JSON records."
    ]
  };
}
