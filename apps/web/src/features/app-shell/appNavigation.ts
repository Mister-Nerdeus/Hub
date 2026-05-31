export const APP_SECTION_IDS = [
  "floorplans",
  "editor",
  "routes",
  "assignments",
  "manual-assignment",
  "scenarios",
  "simulation",
  "reports",
  "help",
  "settings",
  "developer-evidence"
] as const;

export type AppSectionId = (typeof APP_SECTION_IDS)[number];

export const DEFAULT_APP_SECTION_ID: AppSectionId = "floorplans";

export type AppSection = {
  id: AppSectionId;
  label: string;
  group: "primary" | "advanced";
};

export const APP_SECTIONS: readonly AppSection[] = [
  { id: "floorplans", label: "Floorplan", group: "primary" },
  { id: "assignments", label: "Assignments", group: "primary" },
  { id: "scenarios", label: "Scenarios", group: "primary" },
  { id: "simulation", label: "Simulation", group: "primary" },
  { id: "reports", label: "Reports", group: "primary" },
  { id: "help", label: "Help", group: "primary" },
  { id: "editor", label: "Floorplan Editor", group: "advanced" },
  { id: "manual-assignment", label: "Manual Assignment", group: "advanced" },
  { id: "developer-evidence", label: "Advanced/Evidence", group: "advanced" }
];

export const DEVELOPER_EVIDENCE_SECTION_ID: AppSectionId = "developer-evidence";
export const PRIMARY_APP_SECTIONS = APP_SECTIONS.filter((section) => section.group === "primary");
export const ADVANCED_APP_SECTIONS = APP_SECTIONS.filter((section) => section.group === "advanced");
export const FUTURE_APP_SECTIONS: readonly AppSection[] = [];

export function isDeveloperEvidenceSection(id: AppSectionId): boolean {
  return id === DEVELOPER_EVIDENCE_SECTION_ID;
}
