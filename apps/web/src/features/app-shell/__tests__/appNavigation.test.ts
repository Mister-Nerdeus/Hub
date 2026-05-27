import {
  ADVANCED_APP_SECTIONS,
  APP_SECTIONS,
  FUTURE_APP_SECTIONS,
  PRIMARY_APP_SECTIONS
} from "../appNavigation";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const primaryLabels = PRIMARY_APP_SECTIONS.map((section) => section.label);
const advancedLabels = ADVANCED_APP_SECTIONS.map((section) => section.label);
const futureLabels = FUTURE_APP_SECTIONS.map((section) => section.label);

for (const label of ["Floorplan", "Editor", "Manual Assignment", "Review / Reports"]) {
  assert(primaryLabels.includes(label), `primary navigation missing ${label}`);
}

assert(!primaryLabels.includes("Floorplans"), "primary navigation must use singular floorplan language");
assert(!primaryLabels.includes("Developer/Evidence"), "Developer/Evidence must not remain primary");
assert(advancedLabels.includes("Developer/Evidence"), "Developer/Evidence must remain accessible under Advanced");

for (const label of ["Review Candidates", "Assignment Workflow", "Scenarios", "Simulation", "Settings"]) {
  assert(futureLabels.includes(label), `future tools missing ${label}`);
}

assert(
  APP_SECTIONS.find((section) => section.id === "assignments")?.label !== "Assignments",
  "legacy Assignments label should not compete with Manual Assignment"
);
