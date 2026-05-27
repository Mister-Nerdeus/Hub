// Browser-rendered viewport proof is captured by scripts/capture-floorplan-editor-ux-screenshots.mjs.
// This file records the required local proof case without adding a new test runner dependency.
export const editorViewportFitProof = {
  issue: "407",
  viewport: { width: 1440, height: 1200 },
  screenshot: "editor-viewport-fit.png",
  requiredDomAssertions: [
    "command bar visible",
    "canvas visible",
    "inspector tabs visible",
    "validation drawer visible",
    "base editor proof does not require a full-page tall screenshot"
  ]
} as const;
