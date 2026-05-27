import { DEMO_PIN_COPY, PRODUCT_DISPLAY_NAME } from "@nerdeus/shared";
import {
  formatAccessWait,
  getDemoPinAttemptAvailability,
  secondsRemaining,
  type DemoProtectedActionId
} from "@nerdeus/shared";

import type { DemoPinUiState } from "./demoPinState";

export type WorkspaceAccessActionViewModel = {
  actionId: DemoProtectedActionId;
  label: string;
  disabled: boolean;
};

export type WorkspaceAccessViewModel = {
  productDisplayName: typeof PRODUCT_DISPLAY_NAME;
  title: "Workspace Access";
  eyebrow: "Private operational workspace";
  accessTitle: "Access Required";
  copy: "Workspace access is required to continue.";
  caveat: typeof DEMO_PIN_COPY;
  stateLabel: string;
  inputLabel: "Access code";
  unlockLabel: "Continue";
  clearLabel: "Reset";
  message: string;
  unlocked: boolean;
  canSubmit: boolean;
  inputDisabled: boolean;
  countdownLabel: string | null;
  wrongAttemptCount: number;
  protectedActions: WorkspaceAccessActionViewModel[];
};

const protectedActionLabels: Record<DemoProtectedActionId, string> = {
  edit_working_copy: "Edit Working Copy",
  proceed_to_assignments: "Proceed to Manual Assignment",
  proceed_to_ratio_comparison: "Proceed to Ratio Comparison",
  export_report_placeholder: "Export Report Placeholder"
};

const protectedActionIds: readonly DemoProtectedActionId[] = [
  "edit_working_copy",
  "proceed_to_assignments",
  "proceed_to_ratio_comparison",
  "export_report_placeholder"
];

export function createWorkspaceAccessViewModel(state: DemoPinUiState): WorkspaceAccessViewModel {
  const availability = getDemoPinAttemptAvailability(state.attemptState, state.nowMs);
  const countdownLabel = availability.reason === "lockout"
    ? `Try again in ${formatAccessWait(availability.lockoutRemainingMs)}`
    : availability.reason === "cooldown"
      ? `Try again in ${secondsRemaining(availability.cooldownRemainingMs)} seconds`
      : null;

  return {
    productDisplayName: PRODUCT_DISPLAY_NAME,
    title: "Workspace Access",
    eyebrow: "Private operational workspace",
    accessTitle: "Access Required",
    copy: "Workspace access is required to continue.",
    caveat: DEMO_PIN_COPY,
    stateLabel: state.unlocked ? "Unlocked" : "Locked",
    inputLabel: "Access code",
    unlockLabel: "Continue",
    clearLabel: "Reset",
    message: state.message,
    unlocked: state.unlocked,
    canSubmit: availability.canSubmit,
    inputDisabled: availability.reason === "lockout",
    countdownLabel,
    wrongAttemptCount: availability.normalizedState.wrongAttemptCount,
    protectedActions: protectedActionIds.map((actionId) => ({
      actionId,
      label: protectedActionLabels[actionId],
      disabled: !state.unlocked
    }))
  };
}
