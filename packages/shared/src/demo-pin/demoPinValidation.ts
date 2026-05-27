import {
  DEMO_PIN_CODE,
  DEMO_PROTECTED_ACTION_IDS,
  demoPinContract,
  type DemoPinStateId,
  type DemoProtectedActionId
} from "./demoPinContract.js";

export type DemoPinValidationResult =
  | { ok: true; state: Extract<DemoPinStateId, "unlocked"> }
  | { ok: false; state: Extract<DemoPinStateId, "wrong_pin" | "cleared">; reason: "empty_pin" | "wrong_pin" };

export function validateDemoPin(input: string): DemoPinValidationResult {
  const normalized = input.trim();
  if (normalized.length === 0) {
    return { ok: false, state: "cleared", reason: "empty_pin" };
  }
  if (normalized === DEMO_PIN_CODE) {
    return { ok: true, state: "unlocked" };
  }
  return { ok: false, state: "wrong_pin", reason: "wrong_pin" };
}

export function isDemoProtectedActionId(value: string): value is DemoProtectedActionId {
  return (DEMO_PROTECTED_ACTION_IDS as readonly string[]).includes(value);
}

export function assertDemoPinContractHasNoClaims(): void {
  const copy = demoPinContract.copy.toLowerCase();
  const forbiddenClaims = [
    "production auth enabled",
    "secure access",
    "protects real data"
  ];
  const matched = forbiddenClaims.find((claim) => copy.includes(claim));
  if (matched != null) {
    throw new Error(`Demo PIN copy includes forbidden claim: ${matched}`);
  }
}
