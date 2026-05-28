import {
  buildObjectPlacementPreview,
  getDefaultPlacementSizeForObject
} from "../clickToPlaceObject";

const patientPlacementSize = getDefaultPlacementSizeForObject("patient_care_room");
const patientPreview = buildObjectPlacementPreview({
  objectType: "patient_care_room",
  pointFeet: { xFeet: 12, yFeet: 8 }
});

if (
  patientPreview == null ||
  patientPreview.widthFeet !== patientPlacementSize.widthFeet ||
  patientPreview.heightFeet !== patientPlacementSize.heightFeet
) {
  throw new Error("LayoutEditorStage actual placement and preview must share patient room default size");
}

const storagePlacementSize = getDefaultPlacementSizeForObject("storage_room");
const storagePreview = buildObjectPlacementPreview({
  objectType: "storage_room",
  pointFeet: { xFeet: 12, yFeet: 8 }
});

if (
  storagePreview == null ||
  storagePreview.widthFeet !== storagePlacementSize.widthFeet ||
  storagePreview.heightFeet !== storagePlacementSize.heightFeet
) {
  throw new Error("LayoutEditorStage actual placement and preview must share storage room default size");
}

if (patientPlacementSize.widthFeet !== 10 || patientPlacementSize.heightFeet !== 10) {
  throw new Error("actual patient room placement default must remain 10 by 10");
}

if (storagePlacementSize.widthFeet !== 10 || storagePlacementSize.heightFeet !== 10) {
  throw new Error("actual storage room placement default must remain 10 by 10");
}
