// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";
import { defaultInspectorTabForSelection, LAYOUT_INSPECTOR_TABS } from "../layoutInspectorTabsViewModel";

declare const process: { cwd(): string };

if (defaultInspectorTabForSelection("door") !== "door") throw new Error("door selection should open Door tab");
if (defaultInspectorTabForSelection("room") !== "room") throw new Error("room selection should open Room tab");

for (const label of ["Room", "Door", "Assignment", "Validation"]) {
  if (!LAYOUT_INSPECTOR_TABS.some((tab) => tab.label === label)) {
    throw new Error(`missing inspector tab ${label}`);
  }
}

const repoRoot = resolve(process.cwd(), "../..");
const stage = readFileSync(resolve(repoRoot, "apps/web/src/features/layout-editor/LayoutEditorStage.tsx"), "utf8");
if (!stage.includes("DoorEditor")) throw new Error("Door tab should retain door tools");
if (!stage.includes("LayoutValidationPanel")) throw new Error("Validation tab should preserve validation panel");
