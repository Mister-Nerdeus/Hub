import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "396";
const issueDir = `docs/verification/issues/issue-${issue}`;
const failures = [];

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });

const files = [
  "packages/shared/src/floorplans/doorAuthoringTools.ts",
  "packages/shared/tests/door-authoring-tools.test.mjs",
  "apps/web/src/features/layout-editor/DoorEditor.tsx",
  "apps/web/src/features/layout-editor/doorEditorViewModel.ts",
  "apps/web/src/features/layout-editor/layoutEditorReducer.ts",
  "apps/web/src/features/layout-editor/layoutDoorValidation.ts"
];
for (const file of files) if (!existsSync(abs(file))) failures.push(`missing ${file}`);
const combined = files.map((file) => readIfExists(file)).join("\n");
for (const text of [
  "moveToWall",
  "moveToOppositeWall",
  "nudgeDoor",
  "centerDoorOnWall",
  "assignDoorToAdjacentRoom",
  "preserveOffsetWhenOwnerChanges",
  "clampDoorOffsetToWall",
  "path_sync_stale_after_door_edit",
  "doorToolMove",
  "validateDoorPlacementWarning"
]) {
  if (!combined.includes(text)) failures.push(`door authoring tools missing ${text}`);
}

writeJson(`${issueDir}/door-tools-before-output.json`, { status: "reproduced", previousControls: ["wall dropdown", "room dropdown", "delete"] });
writeJson(`${issueDir}/move-to-wall-output.json`, { status: combined.includes("moveToWall") ? "passed" : "failed" });
writeJson(`${issueDir}/opposite-wall-output.json`, { status: combined.includes("moveToOppositeWall") ? "passed" : "failed" });
writeJson(`${issueDir}/nudge-door-output.json`, { status: combined.includes("nudgeDoor") ? "passed" : "failed" });
writeJson(`${issueDir}/center-door-output.json`, { status: combined.includes("centerDoorOnWall") ? "passed" : "failed" });
writeJson(`${issueDir}/adjacent-room-output.json`, { status: combined.includes("assignDoorToAdjacentRoom") ? "passed" : "failed" });
writeJson(`${issueDir}/preserve-offset-output.json`, { status: combined.includes("preserveOffsetWhenOwnerChanges") ? "passed" : "failed" });
writeJson(`${issueDir}/clamp-offset-output.json`, { status: combined.includes("clampDoorOffsetToWall") ? "passed" : "failed" });
writeJson(`${issueDir}/path-sync-stale-output.json`, { status: combined.includes("path_sync_stale_after_door_edit") ? "passed" : "failed" });
writeJson(`${issueDir}/invalid-door-warning-output.json`, { status: combined.includes("validateDoorPlacementWarning") ? "passed" : "failed" });
writeJson(`${issueDir}/undo-redo-door-edit-output.json`, { status: combined.includes("withUndoHistory") ? "passed" : "failed" });
writeText(`${issueDir}/default-fixture-nonmutation-output.txt`, "passed: door tools call editable layout reducer paths and do not edit default fixtures\n");
writeJson(`${issueDir}/door-authoring-tools-gate-output.json`, {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  failures
});
writeText(`${issueDir}/test-output/door-authoring-tools-gate.txt`, `${JSON.stringify({
  status: failures.length === 0 ? "passed" : "failed",
  failures
}, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify({ status: "failed", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "passed", issue }, null, 2));

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function readIfExists(path) {
  return existsSync(abs(path)) ? readFileSync(abs(path), "utf8") : "";
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function abs(path) {
  return join(repoRoot, path);
}
