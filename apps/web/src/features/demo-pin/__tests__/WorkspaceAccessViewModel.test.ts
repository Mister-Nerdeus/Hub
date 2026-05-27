import {
  initialDemoPinUiState,
  submitDemoPin,
  tickDemoPinState,
  updateDemoPinInput
} from "../demoPinState";
import { createWorkspaceAccessViewModel } from "../workspaceAccessViewModel";

const locked = createWorkspaceAccessViewModel(initialDemoPinUiState);
if (locked.title !== "Workspace Access" || locked.inputLabel !== "Access code") {
  throw new Error("workspace access view model must centralize professional labels");
}
if (/Demo PIN|demo-only|trial/iu.test(locked.copy)) {
  throw new Error("workspace access view model must not expose internal wording or code");
}

const wrong = submitDemoPin(updateDemoPinInput(initialDemoPinUiState, "0000"), undefined, 1_000);
const cooldown = createWorkspaceAccessViewModel(tickDemoPinState(wrong, 2_000));
if (!cooldown.message.includes("Please wait") || cooldown.countdownLabel == null) {
  throw new Error("cooldown copy must use professional wording");
}

const second = submitDemoPin(updateDemoPinInput(wrong, "0000"), undefined, 16_001);
const third = submitDemoPin(updateDemoPinInput(second, "0000"), undefined, 31_002);
const lockout = createWorkspaceAccessViewModel(tickDemoPinState(third, 32_000));
if (!lockout.message.includes("Too many attempts") || lockout.inputDisabled !== true) {
  throw new Error("lockout copy must use professional wording and disable input");
}
