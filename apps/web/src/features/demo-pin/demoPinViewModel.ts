import {
  DEMO_PIN_COPY,
  DEMO_PROTECTED_ACTION_IDS,
  getDemoPinAttemptAvailability,
  secondsRemaining,
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
  canSubmit: boolean;
  inputDisabled: boolean;
  countdownLabel: string | null;
  wrongAttemptCount: number;
  protectedActions: DemoProtectedActionViewModel[];
};

const protectedActionLabels: Record<DemoProtectedActionId, string> = {
  edit_working_copy: "Edit Working Copy",
  proceed_to_assignments: "Proceed to Manual Assignment",
  proceed_to_ratio_comparison: "Proceed to Ratio Comparison",
  export_report_placeholder: "Export Report Placeholder"
};

export function createDemoPinGateViewModel(state: DemoPinUiState): DemoPinGateViewModel {
  const availability = getDemoPinAttemptAvailability(state.attemptState, state.nowMs);
  const countdownLabel = availability.reason === "lockout"
    ? `Lockout ${secondsRemaining(availability.lockoutRemainingMs)} seconds remaining`
    : availability.reason === "cooldown"
      ? `Cooldown ${secondsRemaining(availability.cooldownRemainingMs)} seconds remaining`
      : null;

  return {
    title: "Demo PIN Gate",
    copy: DEMO_PIN_COPY,
    stateLabel: state.unlocked ? "Unlocked" : "Locked",
    inputLabel: "Demo PIN",
    unlockLabel: "Unlock",
    clearLabel: "Clear",
    message: state.message,
    unlocked: state.unlocked,
    canSubmit: availability.canSubmit,
    inputDisabled: availability.reason === "lockout",
    countdownLabel,
    wrongAttemptCount: availability.normalizedState.wrongAttemptCount,
    protectedActions: DEMO_PROTECTED_ACTION_IDS.map((actionId) => ({
      actionId,
      label: protectedActionLabels[actionId],
      disabled: !state.unlocked
    }))
  };
}
