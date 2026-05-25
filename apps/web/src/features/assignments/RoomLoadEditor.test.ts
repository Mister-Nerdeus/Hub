// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/assignments/RoomLoadEditor.tsx"), "utf8");

assertEditor(source.includes("Synthetic Room Loads"), "room load editor must render synthetic room load heading");
assertEditor(source.includes("data-assignment-stage=\"room-loads\""), "room load editor must expose room-loads stage");
assertEditor(source.includes("data-room-id"), "room load editor must expose room IDs");

function assertEditor(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
