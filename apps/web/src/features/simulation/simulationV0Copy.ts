export const simulationV0Copy = {
  syntheticDryRunExplanation:
    "Review synthetic operational placeholders for a deterministic dry-run. Manual visual review is still required.",
  profileExplanation:
    "Choose one synthetic activity profile to change the number of occupied bed positions used by the dry-run.",
  ratioExplanation:
    "Choose a bounded ratio planning assumption. This changes the synthetic nurse grouping used for review.",
  timelineExplanation:
    "Inspect the generated placeholder events in time order. Rows use synthetic task, bed-position, and nurse-group identifiers.",
  summaryCardsExplanation:
    "Scan artifact-derived counts for generated, queued, delayed, and unassigned placeholders.",
  occupiedBedProofExplanation:
    "Shows which synthetic bed positions were selected and which non-bed spaces were excluded.",
  artifactHashExplanation:
    "This helps confirm the same synthetic inputs produce the same dry-run artifact.",
  exportExplanation:
    "Export a synthetic review bundle for local inspection. The preview is a bounded summary, not the full JSON.",
  limitationCopy: [
    "Internal synthetic dry-run only.",
    "Operational placeholders only.",
    "Manual visual review remains required.",
    "Promotion remains blocked.",
    "No optimizer.",
    "No automated assignment output.",
    "No care-quality certification.",
    "No staffing certification.",
    "No outcome prediction."
  ]
} as const;
