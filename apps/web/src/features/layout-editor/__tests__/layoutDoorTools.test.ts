// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const reducer = readFileSync(resolve(repoRoot, "apps/web/src/features/layout-editor/layoutEditorReducer.ts"), "utf8");
const editor = readFileSync(resolve(repoRoot, "apps/web/src/features/layout-editor/DoorEditor.tsx"), "utf8");

for (const text of ["Opposite", "Nudge", "Center", "Adjacent", "Danger zone"]) {
  if (!editor.includes(text)) throw new Error(`door editor missing ${text}`);
}
if (!reducer.includes("doorToolMove")) throw new Error("layout reducer should expose doorToolMove action");
if (!reducer.includes("path_sync_stale_after_door_edit")) throw new Error("door tools should keep path sync stale warning");
