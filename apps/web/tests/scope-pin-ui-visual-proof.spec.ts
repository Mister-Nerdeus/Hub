// Browser-rendered proof is captured by scripts/capture-scope-pin-ui-visual-proof.mjs.
// This file documents the required proof cases without adding another browser-test dependency.
export const scopePinUiVisualProofCases = [
  "Plan 1 visible in the main UI",
  "Plans 2-5 absent from the main UI",
  "Plans 2-5 visible in Advanced/Evidence only",
  "demo PIN gate locked state visible",
  "wrong PIN rejected visibly",
  "valid access code unlocks protected demo actions",
  "no production auth, real security, PHI, simulation output, or optimizer output claim"
] as const;
