import { fitLayoutViewportToBounds } from "../layoutViewportControls";

const viewport = fitLayoutViewportToBounds(
  { xFeet: 10, yFeet: 20, widthFeet: 100, heightFeet: 50 },
  { widthPixels: 600, heightPixels: 300 },
  10,
  5
);

if (viewport.panXFeet !== 5 || viewport.panYFeet !== 15) {
  throw new Error("fit viewport should pan to padded floorplan origin");
}

if (viewport.zoom <= 0 || viewport.zoom > 3) {
  throw new Error("fit viewport should produce a valid clamped zoom");
}
