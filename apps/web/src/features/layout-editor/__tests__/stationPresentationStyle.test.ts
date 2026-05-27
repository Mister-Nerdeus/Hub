import {
  buildCurvedDeskPresentationPath,
  createStationLabelPlate,
  stationPresentationStyleForType
} from "../stationPresentationStyle";

if (stationPresentationStyleForType("nurse_station") !== "curved_desk") {
  throw new Error("nurse station presentation style must be curved_desk");
}
if (stationPresentationStyleForType("primary") !== "curved_desk") {
  throw new Error("canonical primary nurse stations must use curved_desk presentation style");
}
if (stationPresentationStyleForType("secondary") !== "curved_desk") {
  throw new Error("canonical secondary nurse stations must use curved_desk presentation style");
}
if (stationPresentationStyleForType("other_station") !== "rectangle") {
  throw new Error("non-nurse station presentation style must fall back to rectangle");
}

const path = buildCurvedDeskPresentationPath({
  xPixels: 10,
  yPixels: 20,
  widthPixels: 120,
  heightPixels: 60
});
if (!path.startsWith("M 10 ") || !path.includes(" Q ") || !path.endsWith(" Z")) {
  throw new Error("curved desk path must use a closed quadratic curved band");
}
if (path.includes("20 L") || path.includes("80 L")) {
  throw new Error("curved desk path must not be the edit-mode rectangle path");
}

const labelPlate = createStationLabelPlate({
  xPixels: 10,
  yPixels: 20,
  widthPixels: 120,
  heightPixels: 60,
  label: "Nurses station"
});
if (labelPlate.label !== "Nurses station" || labelPlate.textX <= 0 || labelPlate.textY <= 0) {
  throw new Error("station label plate must expose readable centered label geometry");
}
