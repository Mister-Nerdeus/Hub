import {
  AUTHORING_ROOM_TYPES,
  authoringRoomTypeToEditableRoomType,
  authoringRoomTypeToPlanRoomType,
  validateAuthoringRoomType
} from "../dist/index.js";
import { throws } from "./authoring-test-helpers.mjs";

if (AUTHORING_ROOM_TYPES.length !== 11) {
  throw new Error("authoring room type list must include required values");
}
if (authoringRoomTypeToEditableRoomType("provider_pharmacy") === "trauma") {
  throw new Error("provider_pharmacy must not be treated as trauma");
}
if (authoringRoomTypeToPlanRoomType("provider_pharmacy") !== "standard") {
  throw new Error("provider_pharmacy must not become nurse station");
}
throws(() => validateAuthoringRoomType("icu"), /roomType/);
