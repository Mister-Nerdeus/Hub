import {
  validateEditableLayoutGeometryContract,
  type EditableHallwayGeometry,
  type EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";

export type AutoHallwayGridSubtractionResult = {
  generationMethod: "grid_subtraction";
  gridCellSizeFeet: number;
  occupiedCellCount: number;
  publicCellCount: number;
  mergedPublicRegionCount: number;
  generatedHallwayZones: EditableHallwayGeometry[];
  preservedManualHallwayIds: string[];
  limitations: string[];
  nonClaims: string[];
  warnings: string[];
};

type Rect = { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number };
type Cell = { col: number; row: number; key: string };
type PublicRun = { row: number; startCol: number; endCol: number };
type PublicRect = { startRow: number; endRow: number; startCol: number; endCol: number };

export function generateGridSubtractionHallways(input: {
  layout: EditableLayoutGeometryContract;
  sourcePlanId: string;
  boundsFeet: Rect;
  gridCellSizeFeet?: number;
}): AutoHallwayGridSubtractionResult {
  const layout = validateEditableLayoutGeometryContract(input.layout);
  const gridCellSizeFeet = requirePositive(input.gridCellSizeFeet ?? 4, "gridCellSizeFeet");
  const bounds = normalizeBounds(input.boundsFeet);
  if (bounds.widthFeet < gridCellSizeFeet || bounds.heightFeet < gridCellSizeFeet) {
    return {
      generationMethod: "grid_subtraction",
      gridCellSizeFeet,
      occupiedCellCount: 0,
      publicCellCount: 0,
      mergedPublicRegionCount: 0,
      generatedHallwayZones: [],
      preservedManualHallwayIds: manualHallwayIds(layout),
      limitations: ["Bounds are too small for grid-subtraction public-space generation."],
      nonClaims: ["Generated hallway geometry is not an exact CAD reconstruction."],
      warnings: ["BOUNDS_TOO_SMALL_FOR_GRID_SUBTRACTION"]
    };
  }

  const occupiedRects = [...layout.rooms, ...layout.stations, ...layout.zones].map((object) => ({
    xFeet: object.xFeet,
    yFeet: object.yFeet,
    widthFeet: object.widthFeet,
    heightFeet: object.heightFeet
  }));
  const cols = Math.floor(bounds.widthFeet / gridCellSizeFeet);
  const rows = Math.floor(bounds.heightFeet / gridCellSizeFeet);
  const occupiedCells = new Set<string>();
  const publicCells: Cell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = { col, row, key: `${col}:${row}` };
      const cellRect = cellToRect(bounds, gridCellSizeFeet, cell);
      if (occupiedRects.some((rect) => rectsOverlap(cellRect, rect))) {
        occupiedCells.add(cell.key);
      } else {
        publicCells.push(cell);
      }
    }
  }

  const generatedHallwayZones = publicRects(publicCells)
    .map((rect, index) => rectToHallway(input.sourcePlanId, bounds, gridCellSizeFeet, rect, index + 1))
    .filter((hallway) => hallway.widthFeet >= 1 && hallway.heightFeet >= 1);

  return {
    generationMethod: "grid_subtraction",
    gridCellSizeFeet,
    occupiedCellCount: occupiedCells.size,
    publicCellCount: publicCells.length,
    mergedPublicRegionCount: generatedHallwayZones.length,
    generatedHallwayZones,
    preservedManualHallwayIds: manualHallwayIds(layout),
    limitations: [
      "Generated hallways are approximate operational public-space rectangles.",
      "Grid subtraction uses coarse cells and occupied-safe rectangle merging; manual review is required."
    ],
    nonClaims: ["Generated hallway geometry is not an exact CAD reconstruction."],
    warnings: []
  };
}

function publicRects(cells: Cell[]): PublicRect[] {
  const runsByRow = new Map<number, PublicRun[]>();
  for (const cell of cells) {
    const runs = runsByRow.get(cell.row) ?? [];
    runs.push({ row: cell.row, startCol: cell.col, endCol: cell.col });
    runsByRow.set(cell.row, runs);
  }

  const rowRuns = [...runsByRow.entries()]
    .sort(([left], [right]) => left - right)
    .map(([row, runs]) => [row, mergeRuns(runs)] as const);
  const openRects = new Map<string, PublicRect>();
  const completed: PublicRect[] = [];
  let previousRow: number | null = null;

  for (const [row, runs] of rowRuns) {
    if (previousRow != null && row > previousRow + 1) {
      completed.push(...openRects.values());
      openRects.clear();
    }
    const rowKeys = new Set(runs.map((run) => runKey(run)));
    for (const [openKey, rect] of [...openRects.entries()]) {
      if (!rowKeys.has(openKey) || rect.endRow !== row - 1) {
        completed.push(rect);
        openRects.delete(openKey);
      }
    }
    for (const run of runs) {
      const key = runKey(run);
      const existing = openRects.get(key);
      if (existing != null) {
        existing.endRow = row;
      } else {
        openRects.set(key, {
          startRow: row,
          endRow: row,
          startCol: run.startCol,
          endCol: run.endCol
        });
      }
    }
    previousRow = row;
  }

  completed.push(...openRects.values());
  return completed.sort((left, right) =>
    left.startRow === right.startRow
      ? left.startCol - right.startCol
      : left.startRow - right.startRow
  );
}

function runKey(run: PublicRun): string {
  return `${run.startCol}:${run.endCol}`;
}

function mergeRuns(runs: PublicRun[]): PublicRun[] {
  const sorted = [...runs].sort((left, right) => left.startCol - right.startCol);
  const merged: PublicRun[] = [];
  for (const run of sorted) {
    const previous = merged[merged.length - 1];
    if (previous != null && previous.endCol + 1 === run.startCol) {
      previous.endCol = run.endCol;
    } else {
      merged.push({ ...run });
    }
  }
  return merged;
}

function rectToHallway(
  sourcePlanId: string,
  bounds: Rect,
  gridCellSizeFeet: number,
  rect: PublicRect,
  sequence: number
): EditableHallwayGeometry {
  return {
    objectType: "hallway",
    id: `generated-hallway-${sourcePlanId}-grid-${String(sequence).padStart(2, "0")}`,
    label: `Generated public space ${sequence}`,
    xFeet: bounds.xFeet + rect.startCol * gridCellSizeFeet,
    yFeet: bounds.yFeet + rect.startRow * gridCellSizeFeet,
    widthFeet: (rect.endCol - rect.startCol + 1) * gridCellSizeFeet,
    heightFeet: (rect.endRow - rect.startRow + 1) * gridCellSizeFeet
  };
}

function cellToRect(bounds: Rect, gridCellSizeFeet: number, cell: Cell): Rect {
  return {
    xFeet: bounds.xFeet + cell.col * gridCellSizeFeet,
    yFeet: bounds.yFeet + cell.row * gridCellSizeFeet,
    widthFeet: gridCellSizeFeet,
    heightFeet: gridCellSizeFeet
  };
}

function rectsOverlap(left: Rect, right: Rect): boolean {
  return (
    left.xFeet < right.xFeet + right.widthFeet &&
    left.xFeet + left.widthFeet > right.xFeet &&
    left.yFeet < right.yFeet + right.heightFeet &&
    left.yFeet + left.heightFeet > right.yFeet
  );
}

function manualHallwayIds(layout: EditableLayoutGeometryContract): string[] {
  return layout.hallways
    .filter((hallway) => !hallway.id.startsWith("generated-hallway-"))
    .map((hallway) => hallway.id)
    .sort();
}

function normalizeBounds(bounds: Rect): Rect {
  return {
    xFeet: requireFinite(bounds.xFeet, "boundsFeet.xFeet"),
    yFeet: requireFinite(bounds.yFeet, "boundsFeet.yFeet"),
    widthFeet: requirePositive(bounds.widthFeet, "boundsFeet.widthFeet"),
    heightFeet: requirePositive(bounds.heightFeet, "boundsFeet.heightFeet")
  };
}

function requirePositive(value: number, label: string): number {
  const finite = requireFinite(value, label);
  if (finite <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return finite;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}
