// Browser-rendered proof is captured by scripts/capture-floorplan-editor-ux-screenshots.mjs.
// This file records the Issue 449 proof contract without adding a new test runner dependency.
export const canonicalFloorplanVisualProof = {
  issue: "449",
  screenshot: "canonical-floorplan-presentation-proof.png",
  requiredDomAssertions: [
    "canonical Plan 1 visible",
    "legacy default Plans 2-5 hidden from product cards",
    "saved editable copies remain delete-capable",
    "default fixtures remain delete-blocked",
    "presentation mode exposes curved_desk nurse desk paths",
    "presentation mode exposes nurse desk label plates",
    "door markers and hallway arrows render in browser proof",
    "no exact CAD parity claim",
    "no manual visual approval claim",
    "no full-shift simulation or optimizer behavior"
  ]
} as const;
