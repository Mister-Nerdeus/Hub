import {
  initialDemoPinUiState,
  submitDemoPin,
  tickDemoPinState,
  updateDemoPinInput
} from "../demoPinState";
import { createDemoPinGateViewModel } from "../demoPinViewModel";

const wrong = submitDemoPin(updateDemoPinInput(initialDemoPinUiState, "0000"), undefined, 1_000);
const cooldownVm = createDemoPinGateViewModel(tickDemoPinState(wrong, 2_000));
if (cooldownVm.countdownLabel == null || !cooldownVm.countdownLabel.includes("Cooldown")) {
  throw new Error("wrong attempt must expose visible cooldown countdown copy");
}
if (cooldownVm.canSubmit) {
  throw new Error("cooldown must disable submit");
}

const second = submitDemoPin(updateDemoPinInput(wrong, "0000"), undefined, 16_001);
const third = submitDemoPin(updateDemoPinInput(second, "0000"), undefined, 31_002);
const lockoutVm = createDemoPinGateViewModel(tickDemoPinState(third, 32_000));
if (lockoutVm.countdownLabel == null || !lockoutVm.countdownLabel.includes("Lockout")) {
  throw new Error("three wrong attempts must expose visible lockout countdown copy");
}
if (lockoutVm.canSubmit) {
  throw new Error("lockout must disable submit");
}
