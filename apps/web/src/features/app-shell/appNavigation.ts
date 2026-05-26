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
};

export const APP_SECTIONS: readonly AppSection[] = [
  { id: "floorplans", label: "Floorplans" },
  { id: "editor", label: "Preview" },
  { id: "routes", label: "Review Candidates" },
  { id: "assignments", label: "Assignments" },
  { id: "manual-assignment", label: "Manual Assignment" },
  { id: "scenarios", label: "Scenarios" },
  { id: "simulation", label: "Simulation" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
  { id: "developer-evidence", label: "Developer/Evidence" }
];

export const DEVELOPER_EVIDENCE_SECTION_ID: AppSectionId = "developer-evidence";

export function isDeveloperEvidenceSection(id: AppSectionId): boolean {
  return id === DEVELOPER_EVIDENCE_SECTION_ID;
}
