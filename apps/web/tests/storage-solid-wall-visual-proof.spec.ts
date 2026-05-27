// Browser-rendered proof is captured by scripts/capture-storage-solid-wall-visual-proof.mjs.
// This spec records the required Issue 439 proof cases without adding a new browser test dependency.
export const storageSolidWallVisualProofCases = [
  {
    screenshot: "storage-solid-wall-visual-proof.png",
    assertions: [
      "storage object exists",
      "solid-wall object exists",
      "storage and solid wall render gray",
      "legend entries are visible",
      "solid-wall door marker count is zero",
      "storage and solid-wall nurse-color overlays are zero"
    ]
  },
  {
    screenshot: "trauma-storage-proof.png",
    assertions: [
      "canonical Trauma One storage object remains storage",
      "manual visual approval is not claimed"
    ]
  }
] as const;
