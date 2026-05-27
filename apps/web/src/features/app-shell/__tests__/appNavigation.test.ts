import { APP_SECTIONS, FUTURE_APP_SECTIONS, PRIMARY_APP_SECTIONS } from "../appNavigation";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const primaryLabels = PRIMARY_APP_SECTIONS.map((section) => section.label);
const futureLabels = FUTURE_APP_SECTIONS.map((section) => section.label);

for (const label of ["Floorplans", "Editor", "Manual Assignment", "Review / Reports", "Developer/Evidence"]) {
  assert(primaryLabels.includes(label), `primary navigation missing ${label}`);
}

for (const label of ["Review Candidates", "Assignment Workflow", "Scenarios", "Simulation", "Settings"]) {
  assert(futureLabels.includes(label), `future tools missing ${label}`);
}

assert(
  APP_SECTIONS.find((section) => section.id === "assignments")?.label !== "Assignments",
  "legacy Assignments label should not compete with Manual Assignment"
);
