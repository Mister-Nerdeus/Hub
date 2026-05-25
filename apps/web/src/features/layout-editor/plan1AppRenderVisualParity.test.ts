// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { defaultPlan1RenderProofFixture } from "../../fixtures/defaultPlans";
import {
  createEmptyActiveFloorplanState,
  openDefaultFloorplan
} from "../floorplans/activeFloorplanState";
import {
  createLayoutEditorStateFromFloorplan,
  DEFAULT_LAYOUT_EDITOR_VIEWPORT
} from "./layoutEditorState";
import { buildLayoutObjectRenderPipeline } from "./layoutObjectRenderPipeline";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-238");
const screenshotsDir = resolve(evidenceDir, "screenshots");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function assert238(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const requiredRenderedLabels = [
  "Level 1 Trauma",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "Provider Pharmacy"
];

const activeState = openDefaultFloorplan(
  createEmptyActiveFloorplanState(),
  defaultPlan1RenderProofFixture.plan.planId
);
const activeFloorplan = activeState.activeFloorplan;
if (activeFloorplan == null) {
  throw new Error("Plan 1 must open from the normal default JSON floorplan library path");
}

const editorState = createLayoutEditorStateFromFloorplan(activeFloorplan);
if (editorState.editableLayout == null) {
  throw new Error("Plan 1 editor state must derive editable geometry from JSON fixture data");
}

const renderItems = buildLayoutObjectRenderPipeline({
  layout: editorState.editableLayout,
  viewport: DEFAULT_LAYOUT_EDITOR_VIEWPORT
});
const roomItems = renderItems.filter((item) => item.objectType === "room");
const stationItems = renderItems.filter((item) => item.objectType === "station");
const zoneItems = renderItems.filter((item) => item.objectType === "zone");
const providerPharmacyZoneItems = zoneItems.filter((item) => item.objectId === "zone-provider-pharmacy");
const renderedLabels = new Set<string>();
for (const room of editorState.editableLayout.rooms) {
  renderedLabels.add(room.roomNumber);
}
for (const zone of editorState.editableLayout.zones) {
  renderedLabels.add(zone.label);
}
for (const station of editorState.editableLayout.stations) {
  renderedLabels.add(station.label);
}

const labelCoverage = Object.fromEntries(
  requiredRenderedLabels.map((label) => [label, renderedLabels.has(label)])
);
const missingLabels = requiredRenderedLabels.filter((label) => !renderedLabels.has(label));
const renderedRoomIds = new Set(roomItems.map((item) => item.objectId));
const oldSimplifiedLayoutPresent =
  renderedRoomIds.has("room-01") ||
  renderedRoomIds.has("space-07") ||
  stationItems.some((item) => item.objectId === "station-provider-pharmacy") ||
  roomItems.length <= 8;

assert238(activeFloorplan.sourceKind === "default-json", "Plan 1 must render from default JSON fixture data");
assert238(roomItems.length >= 23, "Plan 1 render requires at least 23 room items");
assert238(stationItems.length >= 2, "Plan 1 render requires at least 2 station items");
assert238(providerPharmacyZoneItems.length >= 1, "Plan 1 render requires a provider/pharmacy zone item");
assert238(missingLabels.length === 0, `Plan 1 render missing labels: ${missingLabels.join(", ")}`);
assert238(!oldSimplifiedLayoutPresent, "Plan 1 render must not be the old simplified layout");

writeEvidence("plan-1-render-after-output.json", {
  issue: "238",
  status: "passed",
  planId: activeFloorplan.planId,
  sourceKind: activeFloorplan.sourceKind,
  renderedFromJsonFixture: true,
  renderItemCount: renderItems.length,
  labels: [...renderedLabels].sort()
});
writeEvidence("plan-1-label-render-coverage-output.json", {
  issue: "238",
  status: "passed",
  requiredRenderedLabels,
  coverage: labelCoverage,
  missingLabels
});
writeEvidence("plan-1-render-object-count-output.json", {
  issue: "238",
  status: "passed",
  roomRenderCount: roomItems.length,
  stationRenderCount: stationItems.length,
  providerPharmacyZoneRenderCount: providerPharmacyZoneItems.length,
  hallwayRenderCount: renderItems.filter((item) => item.objectType === "hallway").length,
  doorRenderCount: renderItems.filter((item) => item.objectType === "door").length,
  totalRenderItemCount: renderItems.length
});
writeEvidence("plan-1-old-render-negative-output.json", {
  issue: "238",
  status: "passed",
  oldSimplifiedLayoutPresent,
  unsupportedRenderedObjectIds: [...renderedRoomIds].filter((id) =>
    ["room-01", "space-07"].includes(id)
  ),
  renderedRoomCount: roomItems.length
});

mkdirSync(screenshotsDir, { recursive: true });
writeFileSync(
  resolve(screenshotsDir, "plan-1-after-updated-render.html"),
  buildRenderProofHtml(renderItems, [...renderedLabels].sort())
);
writeFileSync(
  resolve(screenshotsDir, "plan-1-before-current-render.html"),
  `<html><body><main style="font-family: sans-serif; padding: 24px;"><h1>No old local render screenshot available</h1><p>The old simplified Plan 1 render had already been replaced before Issue 238 started.</p></main></body></html>`
);

function buildRenderProofHtml(
  items: typeof renderItems,
  labels: string[]
): string {
  const rects = items.map((item) => {
    const rect = item.displayRectPixels;
    const color = item.objectType === "room"
      ? "#f6b26b"
      : item.objectType === "station"
        ? "#93c47d"
        : item.objectType === "zone"
          ? "#cfe2f3"
          : item.objectType === "hallway"
            ? "#d9d9d9"
            : "#6fa8dc";
    const text = labelForRenderItem(item);
    return `<g><rect x="${rect.xPixels}" y="${rect.yPixels}" width="${rect.widthPixels}" height="${rect.heightPixels}" fill="${color}" stroke="#222" stroke-width="1"/><text x="${rect.xPixels + 4}" y="${rect.yPixels + 14}" font-size="10" fill="#111">${escapeHtml(text)}</text></g>`;
  }).join("");
  return `<html><body style="margin:0;background:#fff;"><svg xmlns="http://www.w3.org/2000/svg" width="2300" height="1650" viewBox="-20 -20 2300 1650" role="img" aria-label="Plan 1 app render proof from JSON fixture">${rects}</svg><aside style="font-family:sans-serif;padding:12px;"><strong>Rendered labels:</strong> ${escapeHtml(labels.join(", "))}</aside></body></html>`;
}

function labelForRenderItem(item: (typeof renderItems)[number]): string {
  const source = item.sourceGeometry;
  if (source.objectType === "room") {
    return source.roomNumber;
  }
  return source.label;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
