import {
  feetToPixels,
  pixelsToFeet,
  rectFeetToPixels,
  rectPixelsToFeet,
  roundtripPointWithinSnapPrecision
} from "./layoutCoordinateSystem";

const viewport = {
  pixelsPerFoot: 12,
  zoom: 1.5,
  panXFeet: 2,
  panYFeet: -1
};

const pointFeet = { xFeet: 10, yFeet: 4 };
const pointPixels = feetToPixels(pointFeet, viewport);
if (pointPixels.xPixels !== 144 || pointPixels.yPixels !== 90) {
  throw new Error("feetToPixels must apply deterministic zoom and pan offsets");
}

const pointRoundtrip = pixelsToFeet(pointPixels, viewport);
if (pointRoundtrip.xFeet !== pointFeet.xFeet || pointRoundtrip.yFeet !== pointFeet.yFeet) {
  throw new Error("pixelsToFeet must invert feetToPixels");
}

const rectFeet = { xFeet: 3, yFeet: 5, widthFeet: 12, heightFeet: 8 };
const rectCopy = { ...rectFeet };
const rectPixels = rectFeetToPixels(rectFeet, viewport);
if (
  rectPixels.xPixels !== 18 ||
  rectPixels.yPixels !== 108 ||
  rectPixels.widthPixels !== 216 ||
  rectPixels.heightPixels !== 144
) {
  throw new Error("rectFeetToPixels must convert position and size deterministically");
}
if (JSON.stringify(rectFeet) !== JSON.stringify(rectCopy)) {
  throw new Error("feet-to-pixel conversion must not mutate source geometry");
}

const rectRoundtrip = rectPixelsToFeet(rectPixels, viewport);
if (JSON.stringify(rectRoundtrip) !== JSON.stringify(rectFeet)) {
  throw new Error("rectPixelsToFeet must invert rectFeetToPixels");
}

if (!roundtripPointWithinSnapPrecision({ xFeet: 7.25, yFeet: -2.5 }, viewport, 0.5)) {
  throw new Error("coordinate roundtrip must remain stable within snap precision");
}

try {
  feetToPixels({ xFeet: 1, yFeet: 1 }, { ...viewport, zoom: 0 });
  throw new Error("coordinate transforms must reject invalid zoom");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("zoom")) {
    throw error;
  }
}
