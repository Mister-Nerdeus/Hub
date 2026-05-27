import {
  initialDemoPinUiState,
  submitDemoPin,
  tickDemoPinState,
  updateDemoPinInput
} from "../demoPinState";
import { createWorkspaceAccessViewModel } from "../workspaceAccessViewModel";

const wrong = submitDemoPin(updateDemoPinInput(initialDemoPinUiState, "0000"), undefined, 1_000);
if (wrong.message !== "Access code not accepted. Try again in 15 seconds.") {
  throw new Error("wrong-attempt message must be professional");
}

const cooldown = createWorkspaceAccessViewModel(tickDemoPinState(wrong, 2_000));
if (cooldown.message !== "Please wait 14 seconds before trying again.") {
  throw new Error("cooldown message must be professional");
}

const second = submitDemoPin(updateDemoPinInput(wrong, "0000"), undefined, 16_001);
const third = submitDemoPin(updateDemoPinInput(second, "0000"), undefined, 31_002);
const lockout = createWorkspaceAccessViewModel(tickDemoPinState(third, 31_002));
if (lockout.message !== "Too many attempts. Try again in 3 minutes.") {
  throw new Error("lockout message must be professional");
}

const unlocked = submitDemoPin(updateDemoPinInput(initialDemoPinUiState, "2026"), undefined, 1_000);
if (unlocked.message !== "Workspace access granted for this session.") {
  throw new Error("success message must be professional");
}
