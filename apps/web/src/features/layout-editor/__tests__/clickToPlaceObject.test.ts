import {
  buildObjectPlacementPreview,
  getDefaultPlacementSizeForObject,
  isCanvasPlacementTarget,
  placeObjectOnCanvas
} from "../clickToPlaceObject";
import { ObjectPlacementPreview } from "../ObjectPlacementPreview";

const emptyPreview = buildObjectPlacementPreview({
  objectType: null,
  pointFeet: { xFeet: 4, yFeet: 6 }
});
if (emptyPreview !== null) {
  throw new Error("no object type should not create a ghost preview");
}

const roomPreview = buildObjectPlacementPreview({
  objectType: "patient_care_room",
  pointFeet: { xFeet: 12, yFeet: 9 }
});
if (
  roomPreview == null ||
  roomPreview.label !== "Patient care room" ||
  roomPreview.xFeet !== 12 ||
  roomPreview.yFeet !== 9 ||
  roomPreview.widthFeet !== 10 ||
  roomPreview.heightFeet !== 10
) {
  throw new Error("room placement preview should use the active canvas point and default room size");
}

const storagePreview = buildObjectPlacementPreview({
  objectType: "storage_room",
  pointFeet: { xFeet: 12, yFeet: 9 }
});
if (storagePreview == null || storagePreview.widthFeet !== 10 || storagePreview.heightFeet !== 10) {
  throw new Error("storage placement preview should use the 10 by 10 default room size");
}

const patientPlacementSize = getDefaultPlacementSizeForObject("patient_care_room");
const storagePlacementSize = getDefaultPlacementSizeForObject("storage_room");
if (
  patientPlacementSize.widthFeet !== roomPreview.widthFeet ||
  patientPlacementSize.heightFeet !== roomPreview.heightFeet ||
  storagePlacementSize.widthFeet !== storagePreview.widthFeet ||
  storagePlacementSize.heightFeet !== storagePreview.heightFeet
) {
  throw new Error("preview and actual placement defaults must use the same room-size helper");
}

const defaultPreview = buildObjectPlacementPreview({
  objectType: "zone",
  pointFeet: null
});
if (defaultPreview == null || defaultPreview.xFeet !== 18 || defaultPreview.yFeet !== 16) {
  throw new Error("ghost preview should have a stable default point before pointer movement");
}

if (placeObjectOnCanvas({ objectType: "patient_care_room", readOnly: true }) !== "blocked") {
  throw new Error("read-only layouts must block click-to-place");
}
if (placeObjectOnCanvas({ objectType: null, readOnly: false }) !== "blocked") {
  throw new Error("missing placement mode must not create an object");
}
if (placeObjectOnCanvas({ objectType: "patient_care_room", readOnly: false }) !== "place-room") {
  throw new Error("room placement should be routed to the existing add-room reducer");
}
if (placeObjectOnCanvas({ objectType: "storage_room", readOnly: false }) !== "place-room") {
  throw new Error("storage placement should be routed to the existing add-room reducer");
}
if (placeObjectOnCanvas({ objectType: "solid_wall", readOnly: false }) !== "place-room") {
  throw new Error("solid-wall placement should be routed to the existing add-room reducer");
}
if (placeObjectOnCanvas({ objectType: "hallway", readOnly: false }) !== "future-object") {
  throw new Error("non-room placement should remain a non-mutating future placement intent");
}
if (isCanvasPlacementTarget(null)) {
  throw new Error("null targets must not count as placement canvas targets");
}

const previewElement = ObjectPlacementPreview({
  viewModel: roomPreview,
  viewport: { pixelsPerFoot: 12, zoom: 1, panXFeet: 0, panYFeet: 0 }
}) as {
  type: string;
  props: Record<string, unknown>;
};
if (previewElement.type !== "g") {
  throw new Error("ObjectPlacementPreview should render an SVG group");
}
if (previewElement.props["data-object-placement-preview"] !== "ready") {
  throw new Error("ObjectPlacementPreview must expose a DOM assertion marker");
}
if (previewElement.props["data-object-placement-type"] !== "patient_care_room") {
  throw new Error("ObjectPlacementPreview should expose the pending object type");
}
