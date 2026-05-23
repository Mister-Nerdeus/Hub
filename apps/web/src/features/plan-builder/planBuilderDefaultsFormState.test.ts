import { createDefaultPlanBuilderDefaultsFormState, planBuilderDefaultsFormStateToContract, updatePlanBuilderDefaultsFormState } from "./planBuilderDefaultsFormState";

const defaultState = createDefaultPlanBuilderDefaultsFormState();
const defaultResult = planBuilderDefaultsFormStateToContract(defaultState);
if (!defaultResult.ok) {
  throw new Error(`default form state must produce a valid contract: ${defaultResult.error}`);
}

const changedRooms = updatePlanBuilderDefaultsFormState(defaultState, "roomCount", "8");
const changedRoomResult = planBuilderDefaultsFormStateToContract(changedRooms);
if (!changedRoomResult.ok || changedRoomResult.value.roomDefaults.roomCount !== 8) {
  throw new Error("roomCount field must parse as a number into the defaults contract");
}

const changedSize = {
  ...defaultState,
  defaultRoomWidthFeet: "14",
  defaultRoomLengthFeet: "11",
  roomSpacingFeet: "3"
};
const changedSizeResult = planBuilderDefaultsFormStateToContract(changedSize);
if (
  !changedSizeResult.ok ||
  changedSizeResult.value.roomDefaults.defaultRoomWidthFeet !== 14 ||
  changedSizeResult.value.roomDefaults.defaultRoomLengthFeet !== 11 ||
  changedSizeResult.value.roomDefaults.roomSpacingFeet !== 3
) {
  throw new Error("room size and spacing fields must parse as numbers");
}

const invalidNumeric = planBuilderDefaultsFormStateToContract({
  ...defaultState,
  defaultRoomWidthFeet: "not-a-number"
});
if (invalidNumeric.ok || invalidNumeric.error.length === 0) {
  throw new Error("invalid numeric fields must surface validation errors");
}
