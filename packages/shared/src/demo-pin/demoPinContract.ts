export const DEMO_PIN_CODE = "2026" as const;

export const DEMO_PIN_COPY =
  "Demo proceed gate only. Not production authentication or real data protection." as const;

export const DEMO_PIN_STATE_IDS = ["locked", "wrong_pin", "unlocked", "cleared"] as const;
export type DemoPinStateId = (typeof DEMO_PIN_STATE_IDS)[number];

export const DEMO_PROTECTED_ACTION_IDS = [
  "edit_working_copy",
  "proceed_to_assignments",
  "proceed_to_ratio_comparison",
  "export_report_placeholder"
] as const;

export type DemoProtectedActionId = (typeof DEMO_PROTECTED_ACTION_IDS)[number];

export type DemoPinContract = {
  pin: typeof DEMO_PIN_CODE;
  states: readonly DemoPinStateId[];
  protectedActionIds: readonly DemoProtectedActionId[];
  copy: typeof DEMO_PIN_COPY;
  demoOnly: true;
};

export const demoPinContract: DemoPinContract = {
  pin: DEMO_PIN_CODE,
  states: DEMO_PIN_STATE_IDS,
  protectedActionIds: DEMO_PROTECTED_ACTION_IDS,
  copy: DEMO_PIN_COPY,
  demoOnly: true
};
