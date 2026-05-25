import type {
  Plan1AssumptionSectionId,
  Plan1AssumptionViewModel,
  Plan1AssumptionViewModelSection
} from "./plan1AssumptionViewModel.js";

export type Plan1AssumptionDisplayGroupId =
  | "what-this-simulation-assumes"
  | "walking-and-route-assumptions"
  | "task-volume-and-duration-assumptions"
  | "queue-and-interruption-assumptions"
  | "warning-thresholds"
  | "what-this-simulation-does-not-claim";

export type Plan1AssumptionDisplayGroup = {
  groupId: Plan1AssumptionDisplayGroupId;
  label: string;
  readerSummary: string;
  sections: Plan1AssumptionViewModelSection[];
  entries: Array<{ label: string; value: string }>;
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

const DISPLAY_GROUP_DEFINITIONS: Array<{
  groupId: Plan1AssumptionDisplayGroupId;
  label: string;
  readerSummary: string;
  sectionIds: Plan1AssumptionSectionId[];
}> = [
  {
    groupId: "what-this-simulation-assumes",
    label: "What this simulation assumes",
    readerSummary: "Synthetic room load, assignment, task, status, and burden inputs are fixed before reading the dry-run output.",
    sectionIds: ["burden-score-weights", "scenario-intensity-assumptions", "status-semantics"]
  },
  {
    groupId: "walking-and-route-assumptions",
    label: "Walking and route assumptions",
    readerSummary: "Walking estimates come from repaired Plan 1 graph and baseline proof, not measured walking truth.",
    sectionIds: ["walking-assumptions"]
  },
  {
    groupId: "task-volume-and-duration-assumptions",
    label: "Task volume and duration assumptions",
    readerSummary: "Task counts and durations come from seeded synthetic task templates and profile multipliers.",
    sectionIds: ["task-duration-assumptions", "task-frequency-assumptions", "scenario-intensity-assumptions"]
  },
  {
    groupId: "queue-and-interruption-assumptions",
    label: "Queue and interruption assumptions",
    readerSummary: "Queue, handoff, and interruption assumptions describe dry-run operational friction only.",
    sectionIds: ["queue-assumptions", "handoff-assumptions", "interruption-assumptions"]
  },
  {
    groupId: "warning-thresholds",
    label: "Warning thresholds",
    readerSummary: "Thresholds produce operational review signals and do not certify staffing or clinical adequacy.",
    sectionIds: ["overload-thresholds", "status-semantics"]
  },
  {
    groupId: "what-this-simulation-does-not-claim",
    label: "What this simulation does NOT claim",
    readerSummary: "The proof stays limited to deterministic synthetic operational modeling and explicit non-claims.",
    sectionIds: ["limitations-and-non-claims"]
  }
];

export function buildPlan1AssumptionDisplayGroups(
  viewModel: Plan1AssumptionViewModel
): Plan1AssumptionDisplayGroup[] {
  const sectionsById = new Map(viewModel.sections.map((section) => [section.sectionId, section]));
  return DISPLAY_GROUP_DEFINITIONS.map((definition) => {
    const sections = definition.sectionIds.map((sectionId) => {
      const section = sectionsById.get(sectionId);
      if (section == null) {
        throw new Error(`Plan 1 assumption display group missing section ${sectionId}`);
      }
      return section;
    });
    return {
      groupId: definition.groupId,
      label: definition.label,
      readerSummary: definition.readerSummary,
      sections,
      entries: sections.flatMap((section) =>
        section.entries.map((entry) => ({
          label: `${section.label}: ${formatAssumptionEntryLabel(entry.label)}`,
          value: entry.value
        }))
      ),
      limitations: [...viewModel.limitations],
      nonClaims: [...viewModel.nonClaims],
      syntheticDataOnly: true as const
    };
  });
}

export function assertPlan1AssumptionDisplayGroupsComplete(groups: Plan1AssumptionDisplayGroup[]): void {
  const actual = new Set(groups.map((group) => group.groupId));
  for (const definition of DISPLAY_GROUP_DEFINITIONS) {
    if (!actual.has(definition.groupId)) {
      throw new Error(`Plan 1 assumption display groups missing ${definition.groupId}`);
    }
  }
  const nonClaimGroup = groups.find((group) => group.groupId === "what-this-simulation-does-not-claim");
  if (nonClaimGroup == null || nonClaimGroup.nonClaims.length === 0) {
    throw new Error("Plan 1 assumption display groups require a non-claims group");
  }
}

function formatAssumptionEntryLabel(label: string): string {
  return label
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (value) => value.toUpperCase());
}
