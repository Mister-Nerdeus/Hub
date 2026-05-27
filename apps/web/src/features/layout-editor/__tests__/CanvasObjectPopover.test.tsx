// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { buildCanvasObjectPopover } from "../canvasObjectPopoverViewModel";
import type { LayoutObjectRenderItem } from "../layoutObjectRenderPipeline";

declare const process: { cwd(): string };

const renderItems: LayoutObjectRenderItem[] = [
  renderItem("room", "room-01", 100, 120, 80, 60),
  renderItem("door", "door-01", 180, 130, 20, 8),
  renderItem("station", "station-01", 240, 150, 48, 32),
  renderItem("hallway", "hallway-01", 300, 220, 120, 24),
  renderItem("zone", "zone-01", 420, 260, 96, 48)
];

for (const objectType of ["room", "door", "station", "hallway", "zone"] as const) {
  const objectId = `${objectType}-01`;
  const viewModel = buildCanvasObjectPopover({
    selectedObjectType: objectType,
    selectedObjectId: objectId,
    renderItems
  });
  if (viewModel == null) {
    throw new Error(`${objectType} popover should anchor to selected render item`);
  }
  if (viewModel.objectType !== objectType || viewModel.objectId !== objectId) {
    throw new Error(`${objectType} popover should preserve selected object identity`);
  }
}

if (buildCanvasObjectPopover({ selectedObjectType: null, selectedObjectId: null, renderItems }) !== null) {
  throw new Error("popover should not render without a selected object");
}

const repoRoot = resolve(process.cwd(), "../..");
const componentSource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/layout-editor/CanvasObjectPopover.tsx"),
  "utf8"
);
const stageSource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/layout-editor/LayoutEditorStage.tsx"),
  "utf8"
);

for (const snippet of ["role=\"dialog\"", "aria-label", "Escape", "onClose"]) {
  if (!componentSource.includes(snippet)) {
    throw new Error(`CanvasObjectPopover missing ${snippet}`);
  }
}
for (const snippet of ["setCanvasPopoverOpen(true)", "setCanvasPopoverOpen(false)", "CanvasObjectPopover"]) {
  if (!stageSource.includes(snippet)) {
    throw new Error(`LayoutEditorStage missing popover framework wiring: ${snippet}`);
  }
}

function renderItem(
  objectType: LayoutObjectRenderItem["objectType"],
  objectId: string,
  x: number,
  y: number,
  width: number,
  height: number
): LayoutObjectRenderItem {
  return {
    objectType,
    objectId,
    renderLayer: "rooms",
    renderLayerIndex: 0,
    ariaLabel: objectId,
    hitTargetKey: `${objectType}:${objectId}`,
    displayRectFeet: { xFeet: 0, yFeet: 0, widthFeet: 1, heightFeet: 1 },
    displayRectPixels: { xPixels: x, yPixels: y, widthPixels: width, heightPixels: height },
    sourceGeometry: { id: objectId, x: 0, y: 0, widthFeet: 1, heightFeet: 1, label: objectId }
  } as unknown as LayoutObjectRenderItem;
}
