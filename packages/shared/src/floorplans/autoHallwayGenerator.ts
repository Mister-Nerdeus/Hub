import {
  validateEditableLayoutGeometryContract,
  type EditableHallwayGeometry,
  type EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";
import { generateGridSubtractionHallways } from "./autoHallwayGridSubtraction.js";

export type AutoHallwayGenerationResult = {
  generatedHallwayId: string;
  sourcePlanId: string;
  boundsUsed: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number };
  occupiedFootprintCount: number;
  publicSpaceFootprintCount: number;
  generatedHallwayZones: EditableHallwayGeometry[];
  preservedManualHallwayIds: string[];
  generationMethod: "grid_subtraction" | "rectangular_envelope_difference" | "manual_seeded_generation";
  limitations: string[];
  nonClaims: string[];
};

export function generateAutoHallways(input: {
  layout: EditableLayoutGeometryContract;
  sourcePlanId: string;
  readOnly: boolean;
  boundsFeet: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number };
  generationMethod?: "grid_subtraction" | "rectangular_envelope_difference";
  gridCellSizeFeet?: number;
}): AutoHallwayGenerationResult {
  if (input.readOnly) {
    throw new Error("auto hallway generation is blocked for read-only default plans");
  }
  const layout = validateEditableLayoutGeometryContract(input.layout);
  if (input.generationMethod !== "rectangular_envelope_difference") {
    const grid = generateGridSubtractionHallways({
      layout,
      sourcePlanId: input.sourcePlanId,
      boundsFeet: input.boundsFeet,
      gridCellSizeFeet: input.gridCellSizeFeet
    });
    return {
      generatedHallwayId: `generated-hallway-${input.sourcePlanId}`,
      sourcePlanId: input.sourcePlanId,
      boundsUsed: { ...input.boundsFeet },
      occupiedFootprintCount: grid.occupiedCellCount,
      publicSpaceFootprintCount: grid.publicCellCount,
      generatedHallwayZones: grid.generatedHallwayZones,
      preservedManualHallwayIds: grid.preservedManualHallwayIds,
      generationMethod: grid.generationMethod,
      limitations: grid.limitations,
      nonClaims: grid.nonClaims
    };
  }
  const occupied = [...layout.rooms, ...layout.stations, ...layout.zones];
  const envelope = occupied.length === 0 ? null : envelopeFor(occupied);
  const generatedHallwayId = `generated-hallway-${input.sourcePlanId}`;
  const generatedHallwayZones =
    envelope == null
      ? []
      : buildEnvelopeDifference(generatedHallwayId, input.boundsFeet, envelope);
  return {
    generatedHallwayId,
    sourcePlanId: input.sourcePlanId,
    boundsUsed: { ...input.boundsFeet },
    occupiedFootprintCount: occupied.length,
    publicSpaceFootprintCount: generatedHallwayZones.length,
    generatedHallwayZones,
    preservedManualHallwayIds: layout.hallways
      .filter((hallway) => !hallway.id.startsWith("generated-hallway-"))
      .map((hallway) => hallway.id),
    generationMethod: "rectangular_envelope_difference",
    limitations: [
      "Generated hallways are approximate operational public-space rectangles.",
      "Manual review is required before treating route/path sync as fresh."
    ],
    nonClaims: ["Generated hallway geometry is not an exact CAD reconstruction."]
  };
}

function envelopeFor(objects: Array<{ xFeet: number; yFeet: number; widthFeet: number; heightFeet: number }>) {
  const minX = Math.min(...objects.map((object) => object.xFeet));
  const minY = Math.min(...objects.map((object) => object.yFeet));
  const maxX = Math.max(...objects.map((object) => object.xFeet + object.widthFeet));
  const maxY = Math.max(...objects.map((object) => object.yFeet + object.heightFeet));
  return { xFeet: minX, yFeet: minY, widthFeet: maxX - minX, heightFeet: maxY - minY };
}

function buildEnvelopeDifference(
  id: string,
  bounds: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number },
  envelope: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number }
): EditableHallwayGeometry[] {
  const rects = [
    { id: `${id}-north`, label: "Generated public space north", xFeet: bounds.xFeet, yFeet: bounds.yFeet, widthFeet: bounds.widthFeet, heightFeet: envelope.yFeet - bounds.yFeet },
    { id: `${id}-south`, label: "Generated public space south", xFeet: bounds.xFeet, yFeet: envelope.yFeet + envelope.heightFeet, widthFeet: bounds.widthFeet, heightFeet: bounds.yFeet + bounds.heightFeet - (envelope.yFeet + envelope.heightFeet) },
    { id: `${id}-west`, label: "Generated public space west", xFeet: bounds.xFeet, yFeet: envelope.yFeet, widthFeet: envelope.xFeet - bounds.xFeet, heightFeet: envelope.heightFeet },
    { id: `${id}-east`, label: "Generated public space east", xFeet: envelope.xFeet + envelope.widthFeet, yFeet: envelope.yFeet, widthFeet: bounds.xFeet + bounds.widthFeet - (envelope.xFeet + envelope.widthFeet), heightFeet: envelope.heightFeet }
  ];
  return rects
    .filter((rect) => rect.widthFeet >= 1 && rect.heightFeet >= 1)
    .map((rect) => ({ objectType: "hallway", ...rect }));
}
