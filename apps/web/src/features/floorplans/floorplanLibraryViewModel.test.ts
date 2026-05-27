// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createDuplicateFloorplanViewModel } from "./duplicateFloorplanViewModel";
import { createFloorplanLibraryViewModel } from "./floorplanLibraryViewModel";
import { createSavedFloorplanStore } from "./savedFloorplanStore";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-441");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const viewModel = createFloorplanLibraryViewModel();

if (viewModel.floorplans.length !== 1) {
  throw new Error("floorplan library must list only the canonical default JSON floorplan in product mode");
}

if (
  viewModel.totals.canonicalDefaultPlanCount !== 1 ||
  viewModel.totals.defaultJsonPlanCount !== 1 ||
  viewModel.totals.protectedLegacyDefaultPlanCount !== 4 ||
  viewModel.totals.editableSavedPlanCount !== 0
) {
  throw new Error("floorplan library totals must separate canonical default, legacy references, and saved plans");
}

for (const floorplan of viewModel.floorplans) {
  if (floorplan.artifactType !== "json-floorplan") {
    throw new Error(`floorplan library must expose JSON artifacts only for ${floorplan.planId}`);
  }
  if (floorplan.accessMode !== "read-only-default" || floorplan.readOnlyLabel !== "Canonical read-only default") {
    throw new Error(`canonical default floorplan must be read-only for ${floorplan.planId}`);
  }
  if (floorplan.importStatus !== "validated_default") {
    throw new Error(`default floorplan import status must be validated_default for ${floorplan.planId}`);
  }
  if (floorplan.mappingStatus == null || !floorplan.mappingStatus.startsWith("mapping-er-layout-plan-")) {
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

if (viewModel.floorplans[0]?.planId !== "default-er-layout-plan-1") {
  throw new Error("normal product floorplan library must expose Plan 1 as the canonical default");
}

const legacyPlanIds = viewModel.legacyDefaultFloorplans.map((floorplan) => floorplan.planId);
if (JSON.stringify(legacyPlanIds) !== JSON.stringify([
  "default-er-layout-plan-2",
  "default-er-layout-plan-3",
  "default-er-layout-plan-4",
  "default-er-layout-plan-5"
])) {
  throw new Error("legacy default fixtures must remain available outside the product floorplan cards");
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

const savedStore = createSavedFloorplanStore();
const savedCopy = savedStore.save(
  createDuplicateFloorplanViewModel("default-er-layout-plan-1").copy
);
const savedViewModel = createFloorplanLibraryViewModel(undefined, savedStore.list());
if (savedViewModel.totals.defaultJsonPlanCount !== 1 || savedViewModel.totals.editableSavedPlanCount !== 1) {
  throw new Error("floorplan library must list editable saved JSON copies separately from defaults");
}
const savedCard = savedViewModel.floorplans.find((floorplan) => floorplan.recordId === savedCopy.recordId);
if (savedCard == null || savedCard.accessMode !== "editable-saved") {
  throw new Error("floorplan library must expose saved floorplan cards as editable JSON records");
}
if (savedCard.readOnlyLabel !== "Editable saved copy" || savedCard.parentDefaultPlanId !== "default-er-layout-plan-1") {
  throw new Error("saved floorplan card must preserve editable status and parent default plan");
}
if (JSON.stringify(savedViewModel).includes(`.${"docx"}`)) {
  throw new Error("saved floorplan cards must not expose private document extensions");
}

writeEvidence("floorplan-library-output.json", {
  issue: "441",
  status: "passed",
  libraryId: viewModel.libraryId,
  defaultJsonPlanCount: viewModel.totals.defaultJsonPlanCount,
  protectedLegacyDefaultPlanCount: viewModel.totals.protectedLegacyDefaultPlanCount,
  editableSavedPlanCount: viewModel.totals.editableSavedPlanCount,
  readOnlyDefaultCount: viewModel.floorplans.filter(
    (floorplan) => floorplan.accessMode === "read-only-default"
  ).length
});

writeEvidence("no-docx-exposure-output.json", {
  issue: "441",
  status: "passed",
  prohibitedFragments,
  serializedViewModelExposesDocx: false
});

writeEvidence("default-json-plan-list-output.json", {
  issue: "441",
  status: "passed",
  listedPlanIds: viewModel.floorplans.map((floorplan) => floorplan.planId),
  legacyPlanIds,
  artifactTypes: [...new Set(viewModel.floorplans.map((floorplan) => floorplan.artifactType))],
  importStatuses: [...new Set(viewModel.floorplans.map((floorplan) => floorplan.importStatus))],
  mappingStatuses: viewModel.floorplans.map((floorplan) => floorplan.mappingStatus)
});
