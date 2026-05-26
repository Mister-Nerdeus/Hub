export type DemoWalkthroughViewModel = {
  walkthroughId: "operational-demo-walkthrough-v1";
  steps: { label: string; status: string }[];
  limitations: string[];
};

export function createDemoWalkthroughViewModel(): DemoWalkthroughViewModel {
  return {
    walkthroughId: "operational-demo-walkthrough-v1",
    steps: [
      { label: "Floorplans", status: "Open a default, saved copy, or review candidate." },
      { label: "Review Candidates", status: "Confirm route/export readiness labels." },
      { label: "Preview", status: "Inspect rendered operational evidence." },
      { label: "Review Packet", status: "Open packet/template references for human review." },
      { label: "Manual Review Helper", status: "Use draft-only checklist guidance." },
      { label: "Developer/Evidence", status: "Open raw hashes and paths only in developer mode." }
    ],
    limitations: [
      "Manual review remains required.",
      "Promotion remains blocked.",
      "Rendered previews are operational approximations."
    ]
  };
}
