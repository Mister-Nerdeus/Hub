import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runFloorplanAuthoringBehaviorHarness } from "../dist/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(resolve(testDir, "../fixtures/default-plans/default-er-layout-plan-1.json"), "utf8")
);
const result = runFloorplanAuthoringBehaviorHarness({ defaultFixture: fixture });

const requiredTrueFields = [
  "reloadMatchedEditableLayout",
  "roomTypeChanged",
  "roomAdded",
  "doorAdded",
  "doorMoved",
  "hallwayGenerated",
  "podBorderGenerated",
  "exportValidated",
  "sourceDefaultUnchanged"
];

for (const field of requiredTrueFields) {
  if (result[field] !== true) {
    throw new Error(`behavior harness expected ${field} to be true`);
  }
}
if (result.privateSourcePayloadStored !== false) {
  throw new Error("behavior harness must prove private source payload is absent");
}
if (result.pathSyncStatus !== "stale_warning") {
  throw new Error("route-affecting authoring must leave path sync stale until reviewed");
}
