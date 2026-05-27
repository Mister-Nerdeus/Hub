export const APP_SECTION_IDS = [
  "floorplans",
  "editor",
  "routes",
  "assignments",
  "manual-assignment",
  "scenarios",
  "simulation",
  "reports",
  "settings",
  "developer-evidence"
] as const;

export type AppSectionId = (typeof APP_SECTION_IDS)[number];

export const DEFAULT_APP_SECTION_ID: AppSectionId = "floorplans";

export type AppSection = {
  id: AppSectionId;
  label: string;
  group: "primary" | "advanced" | "future";
};

export const APP_SECTIONS: readonly AppSection[] = [
  { id: "floorplans", label: "Floorplans", group: "primary" },
  { id: "editor", label: "Editor", group: "primary" },
  { id: "manual-assignment", label: "Manual Assignment", group: "primary" },
  { id: "reports", label: "Review / Reports", group: "primary" },
  { id: "developer-evidence", label: "Developer/Evidence", group: "advanced" },
  { id: "routes", label: "Review Candidates", group: "future" },
  { id: "assignments", label: "Assignment Workflow", group: "future" },
  { id: "scenarios", label: "Scenarios", group: "future" },
  { id: "simulation", label: "Simulation", group: "future" },
  { id: "settings", label: "Settings", group: "future" }
];

export const DEVELOPER_EVIDENCE_SECTION_ID: AppSectionId = "developer-evidence";
export const PRIMARY_APP_SECTIONS = APP_SECTIONS.filter((section) => section.group === "primary");
export const ADVANCED_APP_SECTIONS = APP_SECTIONS.filter((section) => section.group === "advanced");
export const FUTURE_APP_SECTIONS = APP_SECTIONS.filter((section) => section.group === "future");

export function isDeveloperEvidenceSection(id: AppSectionId): boolean {
  return id === DEVELOPER_EVIDENCE_SECTION_ID;
}
