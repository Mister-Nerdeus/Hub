import { validateEditableLayoutGeometryContract, type EditableLayoutGeometryContract } from "../layout-editor/editableLayoutGeometryContract.js";

export type AutoPodBorder = {
  borderId: string;
  sourcePlanId: string;
  boundsFeet: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number };
  paddingFeet: number;
  strokeStyle: "generated_pod_border";
  generatedFromObjectIds: string[];
  limitations: string[];
};

export function generateAutoPodBorder(input: {
  layout: EditableLayoutGeometryContract;
  sourcePlanId: string;
  paddingFeet: number;
}): AutoPodBorder {
  const layout = validateEditableLayoutGeometryContract(input.layout);
  const objects = [...layout.rooms, ...layout.stations, ...layout.zones, ...layout.hallways];
  if (objects.length === 0) {
    throw new Error("cannot generate pod border from empty layout without warning");
  }
  const minX = Math.min(...objects.map((object) => object.xFeet)) - input.paddingFeet;
  const minY = Math.min(...objects.map((object) => object.yFeet)) - input.paddingFeet;
  const maxX = Math.max(...objects.map((object) => object.xFeet + object.widthFeet)) + input.paddingFeet;
  const maxY = Math.max(...objects.map((object) => object.yFeet + object.heightFeet)) + input.paddingFeet;
  return {
    borderId: `generated-pod-border-${input.sourcePlanId}`,
    sourcePlanId: input.sourcePlanId,
    boundsFeet: { xFeet: minX, yFeet: minY, widthFeet: maxX - minX, heightFeet: maxY - minY },
    paddingFeet: input.paddingFeet,
    strokeStyle: "generated_pod_border",
    generatedFromObjectIds: objects.map((object) => object.id).sort(),
    limitations: ["Generated border is an approximate visual envelope, not exact CAD geometry."]
  };
}
