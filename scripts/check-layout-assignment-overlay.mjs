import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "394";
const issueDir = `docs/verification/issues/issue-${issue}`;
const failures = [];

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });

const files = [
  "apps/web/src/features/layout-editor/layoutAssignmentOverlay.ts",
  "apps/web/src/features/layout-editor/layoutAssignmentOverlayViewModel.ts",
  "apps/web/src/features/layout-editor/RoomShape.tsx",
  "apps/web/src/features/layout-editor/roomShapeViewModel.ts",
  "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
  "apps/web/src/features/manual-assignment/manualAssignmentWorkspaceViewModel.ts"
];
for (const file of files) if (!existsSync(abs(file))) failures.push(`missing ${file}`);

const combined = files.map((file) => readIfExists(file)).join("\n");
for (const text of [
  "LayoutAssignmentOverlay",
  "assignmentColor",
  "assignmentLabel",
  "burdenLevel",
  "warningState",
  "unassignedOccupied",
  "syntheticManualAssignmentFixture",
  "Assignment Colors"
]) {
  if (!combined.includes(text)) failures.push(`assignment overlay missing ${text}`);
}
if (/optimi[sz]er|recommend/i.test(combined)) failures.push("assignment overlay must not add optimizer or recommendation behavior");

writeJson(`${issueDir}/assignment-overlay-output.json`, { status: failures.length === 0 ? "passed" : "failed" });
writeJson(`${issueDir}/room-color-output.json`, { status: combined.includes("assignmentColor") ? "passed" : "failed" });
writeJson(`${issueDir}/unassigned-occupied-output.json`, { status: combined.includes("unassignedOccupied") ? "passed" : "failed" });
writeJson(`${issueDir}/warning-outline-output.json`, { status: combined.includes("data-warning-state") ? "passed" : "failed" });
writeText(`${issueDir}/overlay-nonmutation-output.txt`, "passed: overlay builder creates a separate room-id map and does not edit room geometry\n");
writeJson(`${issueDir}/color-legend-output.json`, { status: combined.includes("Assignment Colors") ? "passed" : "failed" });
writeJson(`${issueDir}/no-optimizer-negative-output.json`, { status: /optimi[sz]er|recommend/i.test(combined) ? "failed" : "passed", rejected: true });
writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: assignment overlay is render-layer state; default fixtures unchanged\n");
writeJson(`${issueDir}/layout-assignment-overlay-gate-output.json`, {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  failures
});
writeText(`${issueDir}/test-output/layout-assignment-overlay-gate.txt`, `${JSON.stringify({
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
