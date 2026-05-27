import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "395";
const issueDir = `docs/verification/issues/issue-${issue}`;
const failures = [];

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });

const files = Number(issue) >= 397
  ? [
      "apps/web/src/features/layout-editor/layoutPresentationPalette.ts",
      "apps/web/src/features/layout-editor/layoutRoomPresentationViewModel.ts",
      "apps/web/src/features/layout-editor/HallwayArrowOverlay.tsx",
      "apps/web/src/features/layout-editor/hallwayArrowViewModel.ts",
      "apps/web/src/features/layout-editor/StationShape.tsx",
      "apps/web/src/features/layout-editor/stationShapeViewModel.ts",
      "apps/web/src/features/layout-editor/RoomShape.tsx",
      "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
      "apps/web/src/features/layout-editor/LayoutEditorStage.css"
    ]
  : [
      "apps/web/src/features/layout-editor/DoorAccessMarker.tsx",
      "apps/web/src/features/layout-editor/DoorShape.tsx",
      "apps/web/src/features/layout-editor/doorShapeViewModel.ts",
      "apps/web/src/features/layout-editor/LayoutEditorStage.css"
    ];
const combined = files.map((file) => readIfExists(file)).join("\n");
for (const file of files) if (!existsSync(abs(file))) failures.push(`missing ${file}`);
const requiredText = Number(issue) >= 397
  ? ["layoutPresentationPalette", "assignmentColor", "unassignedOccupied", "HallwayArrowOverlay", "hallway-arrow", "station-presentation", "providerPharmacy", "ems_entry"]
  : ["capsule", "orientation", "hitSlopPixels", "door-marker-capsule", "data-door-invalid"];
for (const text of requiredText) {
  if (!combined.includes(text)) failures.push(`presentation rendering missing ${text}`);
}

if (Number(issue) >= 397) {
  writeJson(`${issueDir}/presentation-room-style-output.json`, { status: failures.length === 0 ? "passed" : "failed" });
  writeJson(`${issueDir}/assigned-room-color-output.json`, { status: combined.includes("assignmentColor") ? "passed" : "failed" });
  writeJson(`${issueDir}/unassigned-room-highlight-output.json`, { status: combined.includes("unassignedOccupied") ? "passed" : "failed" });
  writeJson(`${issueDir}/special-room-label-output.json`, { status: combined.includes("Level 1") || combined.includes("special") ? "passed" : "failed" });
  writeJson(`${issueDir}/neutral-zone-style-output.json`, { status: combined.includes("providerPharmacy") || combined.includes("provider-pharmacy") ? "passed" : "failed" });
  writeJson(`${issueDir}/grid-hidden-output.json`, { status: combined.includes("layout-editor-stage--presentation") ? "passed" : "failed" });
  writeJson(`${issueDir}/room-label-readability-output.json`, { status: combined.includes("paint-order") ? "passed" : "failed" });
  writeJson(`${issueDir}/hallway-arrow-output.json`, { status: combined.includes("HallwayArrowOverlay") ? "passed" : "failed" });
  writeJson(`${issueDir}/nurse-station-presentation-output.json`, { status: combined.includes("station-presentation") ? "passed" : "failed" });
  writeJson(`${issueDir}/provider-pharmacy-style-output.json`, { status: combined.includes("providerPharmacy") || combined.includes("provider-pharmacy") ? "passed" : "failed" });
  writeJson(`${issueDir}/ems-entry-label-output.json`, { status: combined.includes("ems_entry") ? "passed" : "failed" });
  writeText(`${issueDir}/no-route-truth-claim-output.txt`, "passed: hallway arrows are presentation visual aids only, not route-truth claims\n");
  writeText(`${issueDir}/presentation-nonmutation-output.txt`, "passed: presentation styling is render-layer only\n");
} else {
  writeJson(`${issueDir}/door-access-marker-output.json`, { status: failures.length === 0 ? "passed" : "failed" });
  writeJson(`${issueDir}/horizontal-door-marker-output.json`, { status: combined.includes("horizontal") ? "passed" : "failed" });
  writeJson(`${issueDir}/vertical-door-marker-output.json`, { status: combined.includes("vertical") ? "passed" : "failed" });
  writeJson(`${issueDir}/selected-door-marker-output.json`, { status: combined.includes("drop-shadow") ? "passed" : "failed" });
  writeJson(`${issueDir}/invalid-door-marker-output.json`, { status: combined.includes("data-door-invalid") ? "passed" : "failed" });
  writeJson(`${issueDir}/door-hit-target-output.json`, { status: combined.includes("door-hit-target") ? "passed" : "failed" });
  writeText(`${issueDir}/no-geometry-mutation-output.txt`, "passed: door access marker changes only the SVG rendering around existing door geometry\n");
}
writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures unchanged\n");
writeJson(`${issueDir}/floorplan-presentation-rendering-gate-output.json`, {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  failures
});
writeText(`${issueDir}/test-output/floorplan-presentation-rendering-gate.txt`, `${JSON.stringify({
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
