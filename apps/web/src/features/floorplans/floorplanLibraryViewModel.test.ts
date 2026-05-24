// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createFloorplanLibraryViewModel } from "./floorplanLibraryViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-219");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const viewModel = createFloorplanLibraryViewModel();

if (viewModel.floorplans.length !== 5) {
  throw new Error("floorplan library must list all five default JSON floorplans");
}

if (viewModel.totals.defaultJsonPlanCount !== 5 || viewModel.totals.editableSavedPlanCount !== 0) {
  throw new Error("floorplan library totals must separate default JSON plans from saved plans");
}

for (const floorplan of viewModel.floorplans) {
  if (floorplan.artifactType !== "json-floorplan") {
    throw new Error(`floorplan library must expose JSON artifacts only for ${floorplan.planId}`);
  }
  if (floorplan.accessMode !== "read-only-default" || floorplan.readOnlyLabel !== "Read-only default") {
    throw new Error(`default floorplan must be read-only for ${floorplan.planId}`);
  }
  if (floorplan.importStatus !== "validated_default") {
    throw new Error(`default floorplan import status must be validated_default for ${floorplan.planId}`);
  }
  if (!floorplan.mappingStatus.startsWith("mapping-er-layout-plan-")) {
    throw new Error(`default floorplan mapping status must reference a mapping id for ${floorplan.planId}`);
  }
  if (
    floorplan.objectCounts.rooms <= 0 ||
    floorplan.objectCounts.hallways <= 0 ||
    floorplan.objectCounts.doors <= 0 ||
    floorplan.objectCounts.nurseStations <= 0 ||
    floorplan.objectCounts.zones <= 0 ||
    floorplan.objectCounts.pathNodes <= 0 ||
    floorplan.objectCounts.pathEdges <= 0
  ) {
    throw new Error(`default floorplan object counts must be populated for ${floorplan.planId}`);
  }
}

const serialized = JSON.stringify(viewModel);
const prohibitedFragments = [
  `.${"docx"}`,
  `docs/${"floorplans"}`,
  "apps/web/public",
  "ER Layout_plan",
  `sourceDocument${"Path"}`,
  "sourceFilename",
  "download",
  "preview link"
];

for (const fragment of prohibitedFragments) {
  if (serialized.includes(fragment)) {
    throw new Error(`floorplan library view model must not expose ${fragment}`);
  }
}

writeEvidence("floorplan-library-output.json", {
  issue: "219",
  status: "passed",
  libraryId: viewModel.libraryId,
  defaultJsonPlanCount: viewModel.totals.defaultJsonPlanCount,
  editableSavedPlanCount: viewModel.totals.editableSavedPlanCount,
  readOnlyDefaultCount: viewModel.floorplans.filter(
    (floorplan) => floorplan.accessMode === "read-only-default"
  ).length
});

writeEvidence("no-docx-exposure-output.json", {
  issue: "219",
  status: "passed",
  prohibitedFragments,
  serializedViewModelExposesDocx: false
});

writeEvidence("default-json-plan-list-output.json", {
  issue: "219",
  status: "passed",
  listedPlanIds: viewModel.floorplans.map((floorplan) => floorplan.planId),
  artifactTypes: [...new Set(viewModel.floorplans.map((floorplan) => floorplan.artifactType))],
  importStatuses: [...new Set(viewModel.floorplans.map((floorplan) => floorplan.importStatus))],
  mappingStatuses: viewModel.floorplans.map((floorplan) => floorplan.mappingStatus)
});
