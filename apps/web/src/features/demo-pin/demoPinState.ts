import {
  createDemoPinAttemptState,
  formatAccessWait,
  getDemoPinAttemptAvailability,
  secondsRemaining,
  submitDemoPinAttempt,
  type DemoPinAttemptState,
  type DemoPinStateId
} from "@nerdeus/shared";

import {
  clearDemoPinSessionUnlock,
  readDemoPinSessionUnlock,
  writeDemoPinSessionUnlock
} from "./demoPinSessionStorage";

export type DemoPinUiState = {
  state: DemoPinStateId;
  input: string;
  message: string;
  unlocked: boolean;
  attemptState: DemoPinAttemptState;
  nowMs: number;
};

const initialNowMs = 0;

export const initialDemoPinUiState: DemoPinUiState = {
  state: "locked",
  input: "",
  message: "Workspace access is required to continue.",
  unlocked: false,
  attemptState: createDemoPinAttemptState(),
  nowMs: initialNowMs
};

export function createInitialDemoPinUiState(
  storage: Storage | null | undefined,
  nowMs = Date.now()
): DemoPinUiState {
  const sessionUnlock = readDemoPinSessionUnlock(storage);
  if (sessionUnlock?.unlocked === true) {
    return {
      state: "unlocked",
      input: "",
      message: "Workspace access granted for this session.",
      unlocked: true,
      attemptState: createDemoPinAttemptState(),
      nowMs
    };
  }
  return {
    ...initialDemoPinUiState,
    nowMs
  };
}

export function updateDemoPinInput(state: DemoPinUiState, input: string): DemoPinUiState {
  return { ...state, input };
}

export function submitDemoPin(
  state: DemoPinUiState,
  storage: Storage | null | undefined = undefined,
  nowMs = Date.now()
): DemoPinUiState {
  const result = submitDemoPinAttempt(state.attemptState, state.input, nowMs);
  if (result.unlocked) {
    writeDemoPinSessionUnlock(storage, nowMs);
    return {
      state: "unlocked",
      input: "",
      message: result.message,
      unlocked: true,
      attemptState: result.state,
      nowMs
    };
  }
  const stateId = result.status === "empty_pin" ? "cleared" : "wrong_pin";
  return {
    state: stateId,
    input: "",
    message: result.message,
    unlocked: false,
    attemptState: result.state,
    nowMs
  };
}

export function clearDemoPinUnlock(
  storage: Storage | null | undefined = undefined,
  nowMs = Date.now()
): DemoPinUiState {
  clearDemoPinSessionUnlock(storage);
  return {
    state: "cleared",
    input: "",
    message: "Workspace access is required to continue.",
    unlocked: false,
    attemptState: createDemoPinAttemptState(),
    nowMs
  };
}

export function tickDemoPinState(state: DemoPinUiState, nowMs = Date.now()): DemoPinUiState {
  const availability = getDemoPinAttemptAvailability(state.attemptState, nowMs);
  return {
    ...state,
    attemptState: availability.normalizedState,
    nowMs,
    message: state.unlocked ? state.message : messageForAvailability(state.message, availability)
  };
}

function messageForAvailability(
  fallback: string,
  availability: ReturnType<typeof getDemoPinAttemptAvailability>
): string {
  if (availability.reason === "lockout") {
    return `Too many attempts. Try again in ${formatAccessWait(availability.lockoutRemainingMs)}.`;
  }
  if (availability.reason === "cooldown") {
    return `Please wait ${secondsRemaining(availability.cooldownRemainingMs)} seconds before trying again.`;
  }
  return fallback;
}
