import { createDefaultPlanBuilderDefaultsFormState, planBuilderDefaultsFormStateToContract } from "./planBuilderDefaultsFormState";

const defaultState = createDefaultPlanBuilderDefaultsFormState();

const validFullDefaults = planBuilderDefaultsFormStateToContract(defaultState);
if (!validFullDefaults.ok) {
  throw new Error(`full advanced defaults must validate: ${validFullDefaults.error}`);
}

const badHallway = planBuilderDefaultsFormStateToContract({
  ...defaultState,
  defaultHallwayWidthFeet: "0"
});
if (badHallway.ok || badHallway.error.length === 0) {
  throw new Error("invalid hallway width must surface an error");
}

const badDoor = planBuilderDefaultsFormStateToContract({
  ...defaultState,
  defaultDoorWidthFeet: "0"
});
if (badDoor.ok || badDoor.error.length === 0) {
  throw new Error("invalid door width must surface an error when autoCreateDoors is true");
}

const disabledDoors = planBuilderDefaultsFormStateToContract({
  ...defaultState,
  autoCreateDoors: false,
  defaultDoorWidthFeet: "0",
  autoCreateDoorPathNodes: false,
  autoCreatePathEdges: false,
  autoConnectRoomsToHallway: false,
  defaultHallwayEdgeWidthFeet: "0"
});
if (!disabledDoors.ok) {
  throw new Error("door width may be zero when autoCreateDoors is false");
}

const badStation = planBuilderDefaultsFormStateToContract({
  ...defaultState,
  nurseStationCount: "-1"
});
if (badStation.ok || badStation.error.length === 0) {
  throw new Error("invalid station count must surface an error");
}

const disabledPathEdges = planBuilderDefaultsFormStateToContract({
  ...defaultState,
  autoCreatePathEdges: false,
  defaultHallwayEdgeWidthFeet: "0"
});
if (!disabledPathEdges.ok) {
  throw new Error("path edge width may be zero when autoCreatePathEdges is false");
}

const blockedPathGraph = planBuilderDefaultsFormStateToContract({
  ...defaultState,
  pathGraphDefaultBlocked: true
});
if (!blockedPathGraph.ok || blockedPathGraph.value.pathGraphDefaults.defaultBlocked !== true) {
  throw new Error("path graph blocked field must map into pathGraphDefaults.defaultBlocked");
}
