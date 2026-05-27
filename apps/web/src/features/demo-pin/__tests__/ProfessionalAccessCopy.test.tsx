import { initialDemoPinUiState } from "../demoPinState";
import { createWorkspaceAccessViewModel } from "../workspaceAccessViewModel";

const viewModel = createWorkspaceAccessViewModel(initialDemoPinUiState);
const visibleCopy = [
  viewModel.productDisplayName,
  viewModel.title,
  viewModel.eyebrow,
  viewModel.accessTitle,
  viewModel.copy,
  viewModel.caveat,
  viewModel.inputLabel,
  viewModel.unlockLabel,
  viewModel.clearLabel,
  viewModel.stateLabel,
  viewModel.message
].join("\n");

for (const required of [
  "Workspace Access",
  "Private operational workspace",
  "Access Required",
  "Access code",
  "Continue",
  "Reset",
  "Locked",
  "Workspace access is required to continue.",
  "Controlled review flow only. Not a production security system."
]) {
  if (!visibleCopy.includes(required)) {
    throw new Error(`professional access copy missing: ${required}`);
  }
}

if (/Demo PIN|demo-only|trial/iu.test(visibleCopy)) {
  throw new Error("professional access copy includes forbidden internal wording or code");
}

if (/production auth enabled|secure access|protects real data|PHI protection enabled/iu.test(visibleCopy)) {
  throw new Error("professional access copy includes a forbidden claim");
}
