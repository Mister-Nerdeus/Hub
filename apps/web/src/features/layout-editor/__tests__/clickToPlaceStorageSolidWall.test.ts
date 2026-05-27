import { buildObjectPlacementPreview, placeObjectOnCanvas } from "../clickToPlaceObject";

const storagePreview = buildObjectPlacementPreview({
  objectType: "storage_room",
  pointFeet: { xFeet: 10, yFeet: 11 }
});
if (
  storagePreview == null ||
  storagePreview.label !== "Storage room" ||
  storagePreview.fill !== "#b8c0ca" ||
  storagePreview.stroke !== "#5f6975"
) {
  throw new Error("storage placement preview must use semantic gray storage styling");
}

const solidWallPreview = buildObjectPlacementPreview({
  objectType: "solid_wall",
  pointFeet: { xFeet: 12, yFeet: 13 }
});
if (
  solidWallPreview == null ||
  solidWallPreview.label !== "Solid wall / blocked area" ||
  solidWallPreview.fill !== "#6f7782" ||
  solidWallPreview.stroke !== "#374151"
) {
  throw new Error("solid-wall placement preview must use semantic gray blocked styling");
}

if (placeObjectOnCanvas({ objectType: "storage_room", readOnly: false }) !== "place-room") {
  throw new Error("storage placement must create room semantics immediately");
}

if (placeObjectOnCanvas({ objectType: "solid_wall", readOnly: false }) !== "place-room") {
  throw new Error("solid-wall placement must create solid_wall semantics immediately");
}
