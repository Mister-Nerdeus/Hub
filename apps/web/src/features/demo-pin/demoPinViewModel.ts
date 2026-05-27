import type { DemoPinUiState } from "./demoPinState";
import {
  createWorkspaceAccessViewModel,
  type WorkspaceAccessActionViewModel,
  type WorkspaceAccessViewModel
} from "./workspaceAccessViewModel";

export type DemoProtectedActionViewModel = WorkspaceAccessActionViewModel;
export type DemoPinGateViewModel = WorkspaceAccessViewModel;

export function createDemoPinGateViewModel(state: DemoPinUiState): DemoPinGateViewModel {
  return createWorkspaceAccessViewModel(state);
}
