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

  const generatedHallwayZones = connectedRegions(publicCells, cols, rows)
    .map((region, index) => regionToHallway(input.sourcePlanId, bounds, gridCellSizeFeet, region, index + 1))
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
      "Grid subtraction uses coarse cells and merged bounding boxes; manual review is required."
    ],
    nonClaims: ["Generated hallway geometry is not an exact CAD reconstruction."],
    warnings: []
  };
}

function connectedRegions(cells: Cell[], cols: number, rows: number): Cell[][] {
  const publicByKey = new Map(cells.map((cell) => [cell.key, cell]));
  const visited = new Set<string>();
  const regions: Cell[][] = [];
  for (const cell of cells) {
    if (visited.has(cell.key)) {
      continue;
    }
    const queue = [cell];
    const region: Cell[] = [];
    visited.add(cell.key);
    while (queue.length > 0) {
      const current = queue.shift();
      if (current == null) {
        continue;
      }
      region.push(current);
      for (const neighbor of neighbors(current, cols, rows)) {
        if (!visited.has(neighbor.key) && publicByKey.has(neighbor.key)) {
          visited.add(neighbor.key);
          queue.push(neighbor);
        }
      }
    }
    regions.push(region);
  }
  return regions.sort((left, right) => firstCell(left).key.localeCompare(firstCell(right).key));
}

function firstCell(cells: Cell[]): Cell {
  const cell = cells[0];
  if (cell == null) {
    throw new Error("grid subtraction region must contain at least one cell");
  }
  return cell;
}

function neighbors(cell: Cell, cols: number, rows: number): Cell[] {
  return [
    { col: cell.col - 1, row: cell.row },
    { col: cell.col + 1, row: cell.row },
    { col: cell.col, row: cell.row - 1 },
    { col: cell.col, row: cell.row + 1 }
  ]
    .filter((candidate) => candidate.col >= 0 && candidate.row >= 0 && candidate.col < cols && candidate.row < rows)
    .map((candidate) => ({ ...candidate, key: `${candidate.col}:${candidate.row}` }));
}

function regionToHallway(
  sourcePlanId: string,
  bounds: Rect,
  gridCellSizeFeet: number,
  cells: Cell[],
  sequence: number
): EditableHallwayGeometry {
  const minCol = Math.min(...cells.map((cell) => cell.col));
  const maxCol = Math.max(...cells.map((cell) => cell.col));
  const minRow = Math.min(...cells.map((cell) => cell.row));
  const maxRow = Math.max(...cells.map((cell) => cell.row));
  return {
    objectType: "hallway",
    id: `generated-hallway-${sourcePlanId}-grid-${String(sequence).padStart(2, "0")}`,
    label: `Generated public space ${sequence}`,
    xFeet: bounds.xFeet + minCol * gridCellSizeFeet,
    yFeet: bounds.yFeet + minRow * gridCellSizeFeet,
    widthFeet: (maxCol - minCol + 1) * gridCellSizeFeet,
    heightFeet: (maxRow - minRow + 1) * gridCellSizeFeet
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
