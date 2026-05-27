import {
  DEMO_PIN_COPY,
  DEMO_PROTECTED_ACTION_IDS,
  type DemoProtectedActionId
} from "@nerdeus/shared";

import type { DemoPinUiState } from "./demoPinState";

export type DemoProtectedActionViewModel = {
  actionId: DemoProtectedActionId;
  label: string;
  disabled: boolean;
};

export type DemoPinGateViewModel = {
  title: "Demo PIN Gate";
  copy: typeof DEMO_PIN_COPY;
  stateLabel: string;
  inputLabel: "Demo PIN";
  unlockLabel: "Unlock";
  clearLabel: "Clear";
  message: string;
  unlocked: boolean;
  protectedActions: DemoProtectedActionViewModel[];
};

const protectedActionLabels: Record<DemoProtectedActionId, string> = {
  edit_working_copy: "Edit Working Copy",
  proceed_to_assignments: "Proceed to Manual Assignment",
  proceed_to_ratio_comparison: "Proceed to Ratio Comparison",
  export_report_placeholder: "Export Report Placeholder"
};

export function createDemoPinGateViewModel(state: DemoPinUiState): DemoPinGateViewModel {
  return {
    title: "Demo PIN Gate",
    copy: DEMO_PIN_COPY,
    stateLabel: state.unlocked ? "Unlocked" : "Locked",
    inputLabel: "Demo PIN",
    unlockLabel: "Unlock",
    clearLabel: "Clear",
    message: state.message,
    unlocked: state.unlocked,
    protectedActions: DEMO_PROTECTED_ACTION_IDS.map((actionId) => ({
      actionId,
      label: protectedActionLabels[actionId],
      disabled: !state.unlocked
    }))
  };
}
