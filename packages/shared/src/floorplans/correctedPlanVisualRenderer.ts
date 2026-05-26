import { buildPlanContractFromEditableLayout } from "./simulationReadyExportContract.js";
import { validateSourceCorrectedSavedCopy, type SourceCorrectedSavedCopy } from "./sourcePlanCorrectionManifest.js";

export type CorrectedPlanVisualObjectCounts = {
  rooms: number;
  hallways: number;
  doors: number;
  nurseStations: number;
  zones: number;
  pathNodes: number;
  pathEdges: number;
};

export type CorrectedPlanVisualDrawCounts = {
  roomsDrawn: number;
  hallwaysDrawn: number;
  doorsDrawn: number;
  stationsDrawn: number;
  zonesDrawn: number;
  pathNodesDrawn: number;
  pathEdgesDrawn: number;
  labelsDrawn: number;
};

export type CorrectedPlanMachineVisualSanityChecks = {
  nonPlaceholderDimensions: boolean;
  roomsVisible: boolean;
  doorsVisibleWhenPresent: boolean;
  pathNodesVisibleWhenPresent: boolean;
  pathEdgesVisibleWhenPresent: boolean;
  labelsRendered: boolean;
};

export type CorrectedPlanVisualRenderMetadata = {
  planId: string;
  sourceSavedCopyPath: string;
  sourceSavedCopyHash: string;
  renderedEvidencePath: string;
  renderedEvidenceHash: string;
  widthPx: number;
  heightPx: number;
  objectCounts: CorrectedPlanVisualObjectCounts;
  drawCounts: CorrectedPlanVisualDrawCounts;
  renderedFromCorrectedSavedCopy: true;
  privateSourceScreenshotStored: false;
  exactParityClaimMade: false;
  machineVisualSanityChecks: CorrectedPlanMachineVisualSanityChecks;
  limitations: string[];
};

export type CorrectedPlanVisualRender = {
  widthPx: number;
  heightPx: number;
  rgba: Uint8ClampedArray;
  objectCounts: CorrectedPlanVisualObjectCounts;
  drawCounts: CorrectedPlanVisualDrawCounts;
  machineVisualSanityChecks: CorrectedPlanMachineVisualSanityChecks;
  limitations: string[];
};

type RectLike = {
  id: string;
  label: string;
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const marginPx = 44;

export function renderCorrectedPlanVisualEvidence(input: {
  correctedSavedCopy: SourceCorrectedSavedCopy | unknown;
  widthPx?: number;
  heightPx?: number;
}): CorrectedPlanVisualRender {
  const correctedSavedCopy = validateSourceCorrectedSavedCopy(input.correctedSavedCopy);
  const widthPx = input.widthPx ?? 1200;
  const heightPx = input.heightPx ?? 900;
  const image = new Uint8ClampedArray(widthPx * heightPx * 4);
  fill(image, widthPx, heightPx, 0, 0, widthPx, heightPx, [248, 250, 252, 255]);

  const layout = correctedSavedCopy.authoringDraft.editableLayout;
  const reviewedPlan = buildPlanContractFromEditableLayout({
    sourcePlan: correctedSavedCopy.authoringDraft.sourcePlan,
    editableLayout: layout,
    planId: correctedSavedCopy.authoringDraft.planId
  });
  const bounds = layoutBounds([
    ...layout.hallways,
    ...layout.zones,
    ...layout.rooms,
    ...layout.stations,
    ...reviewedPlan.pathNodes.map((node) => ({
      id: node.id,
      label: node.id,
      xFeet: node.x,
      yFeet: node.y,
      widthFeet: 1,
      heightFeet: 1
    }))
  ]);
  const scale = Math.min(
    (widthPx - marginPx * 2) / Math.max(1, bounds.maxX - bounds.minX),
    (heightPx - marginPx * 2) / Math.max(1, bounds.maxY - bounds.minY)
  );
  const drawCounts: CorrectedPlanVisualDrawCounts = {
    roomsDrawn: 0,
    hallwaysDrawn: 0,
    doorsDrawn: 0,
    stationsDrawn: 0,
    zonesDrawn: 0,
    pathNodesDrawn: 0,
    pathEdgesDrawn: 0,
    labelsDrawn: 0
  };

  for (const hallway of layout.hallways) {
    drawRect(image, widthPx, heightPx, bounds, scale, hallway, [225, 231, 239, 255], [100, 116, 139, 255]);
    drawCounts.hallwaysDrawn += 1;
  }
  for (const zone of layout.zones) {
    drawRect(image, widthPx, heightPx, bounds, scale, zone, [209, 250, 229, 130], [20, 184, 166, 255]);
    drawCounts.zonesDrawn += 1;
  }
  for (const edge of reviewedPlan.pathEdges) {
    const from = reviewedPlan.pathNodes.find((node) => node.id === edge.fromNodeId);
    const to = reviewedPlan.pathNodes.find((node) => node.id === edge.toNodeId);
    if (from == null || to == null) {
      continue;
    }
    const fromPoint = toPixel(bounds, scale, from.x, from.y);
    const toPoint = toPixel(bounds, scale, to.x, to.y);
    drawLine(image, widthPx, heightPx, fromPoint.x, fromPoint.y, toPoint.x, toPoint.y, edge.blocked ? [185, 28, 28, 255] : [30, 64, 175, 255]);
    drawCounts.pathEdgesDrawn += 1;
  }
  for (const room of layout.rooms) {
    const fillColor = room.roomType === "trauma"
      ? [254, 226, 226, 255]
      : room.roomType === "procedure"
        ? [219, 234, 254, 255]
        : [241, 245, 249, 255];
    drawRect(image, widthPx, heightPx, bounds, scale, room, fillColor, [51, 65, 85, 255]);
    drawLabel(image, widthPx, heightPx, bounds, scale, room);
    drawCounts.roomsDrawn += 1;
    drawCounts.labelsDrawn += 1;
  }
  for (const station of layout.stations) {
    drawRect(image, widthPx, heightPx, bounds, scale, station, [254, 243, 199, 255], [146, 64, 14, 255]);
    drawLabel(image, widthPx, heightPx, bounds, scale, station);
    drawCounts.stationsDrawn += 1;
    drawCounts.labelsDrawn += 1;
  }
  for (const door of layout.doors) {
    const owner = layout.rooms.find((room) => room.id === door.ownerId);
    if (owner == null) {
      continue;
    }
    const xFeet = owner.xFeet + (door.wall === "east" ? owner.widthFeet : door.wall === "west" ? 0 : door.offsetFeet);
    const yFeet = owner.yFeet + (door.wall === "south" ? owner.heightFeet : door.wall === "north" ? 0 : door.offsetFeet);
    const point = toPixel(bounds, scale, xFeet, yFeet);
    fill(image, widthPx, heightPx, point.x - 4, point.y - 4, 8, 8, [15, 23, 42, 255]);
    drawCounts.doorsDrawn += 1;
  }
  for (const node of reviewedPlan.pathNodes) {
    const point = toPixel(bounds, scale, node.x, node.y);
    fill(image, widthPx, heightPx, point.x - 3, point.y - 3, 6, 6, node.nodeType === "station" ? [180, 83, 9, 255] : [37, 99, 235, 255]);
    drawCounts.pathNodesDrawn += 1;
  }

  const objectCounts = {
    rooms: layout.rooms.length,
    hallways: layout.hallways.length,
    doors: layout.doors.length,
    nurseStations: layout.stations.length,
    zones: layout.zones.length,
    pathNodes: reviewedPlan.pathNodes.length,
    pathEdges: reviewedPlan.pathEdges.length
  };
  const machineVisualSanityChecks = {
    nonPlaceholderDimensions: widthPx > 1 && heightPx > 1 && widthPx * heightPx > 20_000,
    roomsVisible: drawCounts.roomsDrawn > 0,
    doorsVisibleWhenPresent: objectCounts.doors === 0 || drawCounts.doorsDrawn >= objectCounts.doors,
    pathNodesVisibleWhenPresent: objectCounts.pathNodes === 0 || drawCounts.pathNodesDrawn >= objectCounts.pathNodes,
    pathEdgesVisibleWhenPresent: objectCounts.pathEdges === 0 || drawCounts.pathEdgesDrawn >= objectCounts.pathEdges,
    labelsRendered: drawCounts.labelsDrawn >= objectCounts.rooms + objectCounts.nurseStations
  };

  return {
    widthPx,
    heightPx,
    rgba: image,
    objectCounts,
    drawCounts,
    machineVisualSanityChecks,
    limitations: [
      "Rendered visual evidence is generated only from corrected saved-copy JSON.",
      "Machine visual sanity evidence does not claim human visual approval.",
      "The render does not claim exact CAD or exact DOCX parity."
    ]
  };
}

function layoutBounds(objects: RectLike[]): Bounds {
  if (objects.length === 0) {
    return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  }
  return {
    minX: Math.min(...objects.map((object) => object.xFeet)),
    minY: Math.min(...objects.map((object) => object.yFeet)),
    maxX: Math.max(...objects.map((object) => object.xFeet + object.widthFeet)),
    maxY: Math.max(...objects.map((object) => object.yFeet + object.heightFeet))
  };
}

function toPixel(bounds: Bounds, scale: number, xFeet: number, yFeet: number): { x: number; y: number } {
  return {
    x: marginPx + Math.round((xFeet - bounds.minX) * scale),
    y: marginPx + Math.round((yFeet - bounds.minY) * scale)
  };
}

function drawRect(
  image: Uint8ClampedArray,
  width: number,
  height: number,
  bounds: Bounds,
  scale: number,
  object: RectLike,
  fillColor: number[],
  strokeColor: number[]
): void {
  const point = toPixel(bounds, scale, object.xFeet, object.yFeet);
  const w = Math.max(2, Math.round(object.widthFeet * scale));
  const h = Math.max(2, Math.round(object.heightFeet * scale));
  fill(image, width, height, point.x, point.y, w, h, fillColor);
  fill(image, width, height, point.x, point.y, w, 2, strokeColor);
  fill(image, width, height, point.x, point.y + h - 2, w, 2, strokeColor);
  fill(image, width, height, point.x, point.y, 2, h, strokeColor);
  fill(image, width, height, point.x + w - 2, point.y, 2, h, strokeColor);
}

function drawLabel(
  image: Uint8ClampedArray,
  width: number,
  height: number,
  bounds: Bounds,
  scale: number,
  object: RectLike
): void {
  const point = toPixel(bounds, scale, object.xFeet, object.yFeet);
  const labelWidth = Math.min(Math.max(18, object.label.length * 4), Math.max(18, Math.round(object.widthFeet * scale) - 6));
  fill(image, width, height, point.x + 4, point.y + 4, labelWidth, 10, [255, 255, 255, 210]);
  const chars = object.label.slice(0, Math.floor(labelWidth / 4));
  for (let index = 0; index < chars.length; index += 1) {
    const code = chars.charCodeAt(index);
    const x = point.x + 6 + index * 4;
    const y = point.y + 6;
    if ((code & 1) !== 0) fill(image, width, height, x, y, 2, 1, [15, 23, 42, 255]);
    if ((code & 2) !== 0) fill(image, width, height, x, y + 2, 2, 1, [15, 23, 42, 255]);
    if ((code & 4) !== 0) fill(image, width, height, x, y + 4, 2, 1, [15, 23, 42, 255]);
    if ((code & 8) !== 0) fill(image, width, height, x + 1, y + 1, 1, 4, [15, 23, 42, 255]);
  }
}

function drawLine(
  image: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number[]
): void {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  let x = x0;
  let y = y0;
  while (true) {
    fill(image, width, height, x - 1, y - 1, 3, 3, color);
    if (x === x1 && y === y1) {
      break;
    }
    const doubleError = 2 * error;
    if (doubleError >= dy) {
      error += dy;
      x += sx;
    }
    if (doubleError <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function fill(
  image: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number[]
): void {
  const startX = Math.max(0, x);
  const startY = Math.max(0, y);
  const endX = Math.min(width, x + w);
  const endY = Math.min(height, y + h);
  const alpha = (color[3] ?? 255) / 255;
  for (let yy = startY; yy < endY; yy += 1) {
    for (let xx = startX; xx < endX; xx += 1) {
      const index = (yy * width + xx) * 4;
      image[index] = Math.round((color[0] ?? 0) * alpha + (image[index] ?? 0) * (1 - alpha));
      image[index + 1] = Math.round((color[1] ?? 0) * alpha + (image[index + 1] ?? 0) * (1 - alpha));
      image[index + 2] = Math.round((color[2] ?? 0) * alpha + (image[index + 2] ?? 0) * (1 - alpha));
      image[index + 3] = 255;
    }
  }
}
