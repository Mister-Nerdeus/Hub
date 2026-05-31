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

for (const label of ["Floorplan", "Assignments", "Scenarios", "Simulation", "Reports", "Help"]) {
  assert(primaryLabels.includes(label), `primary navigation missing ${label}`);
}

assert(!primaryLabels.includes("Floorplans"), "primary navigation must use singular floorplan language");
assert(!primaryLabels.includes("Advanced/Evidence"), "Advanced/Evidence must not remain primary");
assert(advancedLabels.includes("Advanced/Evidence"), "Advanced/Evidence must remain accessible under Advanced");
assert(advancedLabels.includes("Floorplan Editor"), "editor must be an advanced floorplan subflow");
assert(advancedLabels.includes("Manual Assignment"), "manual assignment must be an advanced assignments subflow");

assert(futureLabels.length === 0, "future tools should not appear in normal navigation");
assert(APP_SECTIONS.find((section) => section.id === "assignments")?.label === "Assignments", "Assignments must be a normal workflow step");
