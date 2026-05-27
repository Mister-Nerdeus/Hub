import { DEMO_PIN_CODE } from "./demoPinContract.js";

export const DEMO_PIN_COOLDOWN_SECONDS = 15;
export const DEMO_PIN_LOCKOUT_SECONDS = 180;
export const DEMO_PIN_WRONG_ATTEMPTS_BEFORE_LOCKOUT = 3;

export const DEMO_PIN_COOLDOWN_MS = DEMO_PIN_COOLDOWN_SECONDS * 1000;
export const DEMO_PIN_LOCKOUT_MS = DEMO_PIN_LOCKOUT_SECONDS * 1000;

export type DemoPinAttemptBlockReason = "cooldown" | "lockout";
export type DemoPinAttemptSubmitStatus =
  | "unlocked"
  | "wrong_pin"
  | "empty_pin"
  | "cooldown_blocked"
  | "lockout_blocked";

export type DemoPinAttemptState = {
  wrongAttemptCount: number;
  lastAttemptAtMs: number | null;
  cooldownUntilMs: number | null;
  lockoutUntilMs: number | null;
};

export type DemoPinAttemptAvailability = {
  canSubmit: boolean;
  reason: DemoPinAttemptBlockReason | null;
  cooldownRemainingMs: number;
  lockoutRemainingMs: number;
  normalizedState: DemoPinAttemptState;
};

export type DemoPinAttemptSubmitResult = {
  status: DemoPinAttemptSubmitStatus;
  unlocked: boolean;
  message: string;
  state: DemoPinAttemptState;
  availability: DemoPinAttemptAvailability;
};

export function createDemoPinAttemptState(): DemoPinAttemptState {
  return {
    wrongAttemptCount: 0,
    lastAttemptAtMs: null,
    cooldownUntilMs: null,
    lockoutUntilMs: null
  };
}

export function normalizeDemoPinAttemptState(
  state: DemoPinAttemptState,
  nowMs: number
): DemoPinAttemptState {
  const lockoutActive = state.lockoutUntilMs != null && state.lockoutUntilMs > nowMs;
  const cooldownActive = state.cooldownUntilMs != null && state.cooldownUntilMs > nowMs;

  if (lockoutActive) {
    return state;
  }

  return {
    wrongAttemptCount: state.lockoutUntilMs != null ? 0 : state.wrongAttemptCount,
    lastAttemptAtMs: state.lastAttemptAtMs,
    cooldownUntilMs: cooldownActive ? state.cooldownUntilMs : null,
    lockoutUntilMs: null
  };
}

export function getDemoPinAttemptAvailability(
  state: DemoPinAttemptState,
  nowMs: number
): DemoPinAttemptAvailability {
  const normalizedState = normalizeDemoPinAttemptState(state, nowMs);
  const lockoutRemainingMs = Math.max(0, (normalizedState.lockoutUntilMs ?? 0) - nowMs);
  const cooldownRemainingMs = Math.max(0, (normalizedState.cooldownUntilMs ?? 0) - nowMs);

  if (lockoutRemainingMs > 0) {
    return {
      canSubmit: false,
      reason: "lockout",
      cooldownRemainingMs: 0,
      lockoutRemainingMs,
      normalizedState
    };
  }

  if (cooldownRemainingMs > 0) {
    return {
      canSubmit: false,
      reason: "cooldown",
      cooldownRemainingMs,
      lockoutRemainingMs: 0,
      normalizedState
    };
  }

  return {
    canSubmit: true,
    reason: null,
    cooldownRemainingMs: 0,
    lockoutRemainingMs: 0,
    normalizedState
  };
}

export function submitDemoPinAttempt(
  state: DemoPinAttemptState,
  pin: string,
  nowMs: number
): DemoPinAttemptSubmitResult {
  const availability = getDemoPinAttemptAvailability(state, nowMs);
  if (!availability.canSubmit) {
    const status = availability.reason === "lockout" ? "lockout_blocked" : "cooldown_blocked";
    return buildResult(status, false, messageForStatus(status, availability), availability.normalizedState, availability);
  }

  if (pin.trim() === "") {
    const nextState = {
      ...availability.normalizedState,
      lastAttemptAtMs: nowMs
    };
    return buildResult(
      "empty_pin",
      false,
      "Enter the demo PIN to proceed.",
      nextState,
      getDemoPinAttemptAvailability(nextState, nowMs)
    );
  }

  if (pin === DEMO_PIN_CODE) {
    const nextState = createDemoPinAttemptState();
    return buildResult(
      "unlocked",
      true,
      "Demo workspace unlocked for this browser session.",
      nextState,
      getDemoPinAttemptAvailability(nextState, nowMs)
    );
  }

  const wrongAttemptCount = availability.normalizedState.wrongAttemptCount + 1;
  const lockoutUntilMs =
    wrongAttemptCount >= DEMO_PIN_WRONG_ATTEMPTS_BEFORE_LOCKOUT ? nowMs + DEMO_PIN_LOCKOUT_MS : null;
  const nextState: DemoPinAttemptState = {
    wrongAttemptCount,
    lastAttemptAtMs: nowMs,
    cooldownUntilMs: lockoutUntilMs == null ? nowMs + DEMO_PIN_COOLDOWN_MS : null,
    lockoutUntilMs
  };
  const nextAvailability = getDemoPinAttemptAvailability(nextState, nowMs);
  const status = lockoutUntilMs == null ? "wrong_pin" : "lockout_blocked";
  const message =
    lockoutUntilMs == null
      ? "Wrong demo PIN. Wait 15 seconds before trying again."
      : "Three wrong demo PIN attempts. Wait 3 minutes before trying again.";

  return buildResult(status, false, message, nextState, nextAvailability);
}

function buildResult(
  status: DemoPinAttemptSubmitStatus,
  unlocked: boolean,
  message: string,
  state: DemoPinAttemptState,
  availability: DemoPinAttemptAvailability
): DemoPinAttemptSubmitResult {
  return {
    status,
    unlocked,
    message,
    state,
    availability
  };
}

function messageForStatus(
  status: "cooldown_blocked" | "lockout_blocked",
  availability: DemoPinAttemptAvailability
): string {
  if (status === "lockout_blocked") {
    return `Demo PIN entry is locked. Try again in ${secondsRemaining(availability.lockoutRemainingMs)} seconds.`;
  }
  return `Wait ${secondsRemaining(availability.cooldownRemainingMs)} seconds before another demo PIN attempt.`;
}

export function secondsRemaining(milliseconds: number): number {
  return Math.max(0, Math.ceil(milliseconds / 1000));
}
