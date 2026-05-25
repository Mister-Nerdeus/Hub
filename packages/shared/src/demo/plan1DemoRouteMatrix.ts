import { PLAN_1_ID } from "../assignment/plan1AssignmentCommon.js";
import { validatePlan1NonClaims } from "../scenario/plan1SimulationAssumptions.js";

export type Plan1DemoScreenId =
  | "floorplans"
  | "layout-editor"
  | "assignments"
  | "scenarios"
  | "assumptions"
  | "scenario-controls"
  | "operational-summary"
  | "timeline"
  | "warning-explanations"
  | "scenario-comparison"
  | "proof-report"
  | "demo-proof-bundle";

export type Plan1DemoRouteMatrixStatus = "covered";

export type Plan1DemoRouteMatrixEntry = {
  screenId: Plan1DemoScreenId;
  label: string;
  appSection: string;
  requiredForDemo: true;
  expectedContent: string[];
  nonClaimsRequired: boolean;
  screenshotRequired: boolean;
  screenshotPath: string;
  status: Plan1DemoRouteMatrixStatus;
  nonClaims: string[];
};

export type Plan1DemoRouteMatrix = {
  matrixId: "plan-1-demo-route-matrix-v1";
  planId: typeof PLAN_1_ID;
  sourceIssue: string;
  screens: Plan1DemoRouteMatrixEntry[];
  requiredNonClaims: string[];
  limitations: string[];
  syntheticDataOnly: true;
};

export type Plan1DemoRouteMatrixSummary = {
  planId: typeof PLAN_1_ID;
  screenCount: number;
  coveredScreenCount: number;
  requiredScreenIds: Plan1DemoScreenId[];
  missingScreenIds: Plan1DemoScreenId[];
  nonClaimsRequiredScreenCount: number;
  screenshotRequiredScreenCount: number;
  screenshotPaths: string[];
};

export const PLAN_1_DEMO_REQUIRED_SCREEN_IDS: Plan1DemoScreenId[] = [
  "floorplans",
  "layout-editor",
  "assignments",
  "scenarios",
  "assumptions",
  "scenario-controls",
  "operational-summary",
  "timeline",
  "warning-explanations",
  "scenario-comparison",
  "proof-report",
  "demo-proof-bundle"
];

const REQUIRED_NON_CLAIMS = validatePlan1NonClaims([
  "Synthetic operational modeling only.",
  "Not a clinical safety score.",
  "Not a staffing compliance recommendation.",
  "Not a legal compliance assessment.",
  "Not a patient outcome prediction.",
  "Not based on real patient, staff, EHR, or hospital data."
], "plan1DemoRouteMatrix.requiredNonClaims");

const SCREEN_DEFINITIONS: Array<Omit<Plan1DemoRouteMatrixEntry, "screenshotPath" | "status" | "nonClaims"> & {
  screenshotName: string;
}> = [
  {
    screenId: "floorplans",
    label: "Floorplans",
    appSection: "floorplans",
    expectedContent: ["Plan 1 floorplan selection", "Repaired Plan 1 visual parity"],
    nonClaimsRequired: false,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "floorplans.png"
  },
  {
    screenId: "layout-editor",
    label: "Layout editor",
    appSection: "layout-editor",
    expectedContent: ["Editable Plan 1 layout surface", "Route-affecting edit warning context"],
    nonClaimsRequired: false,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "editor.png"
  },
  {
    screenId: "assignments",
    label: "Assignments",
    appSection: "assignments",
    expectedContent: ["Manual Plan 1 assignment state", "Assignment validation and walking preview"],
    nonClaimsRequired: false,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "assignments.png"
  },
  {
    screenId: "scenarios",
    label: "Scenarios",
    appSection: "scenarios",
    expectedContent: ["Plan 1 scenario builder", "Synthetic scenario profile selection"],
    nonClaimsRequired: true,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "scenarios.png"
  },
  {
    screenId: "assumptions",
    label: "Assumptions",
    appSection: "scenarios",
    expectedContent: ["Grouped simulation assumptions", "What this simulation does NOT claim"],
    nonClaimsRequired: true,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "assumptions.png"
  },
  {
    screenId: "scenario-controls",
    label: "Scenario controls",
    appSection: "scenarios",
    expectedContent: ["Deterministic seed control", "Duration and task template controls"],
    nonClaimsRequired: true,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "scenario-controls.png"
  },
  {
    screenId: "operational-summary",
    label: "Operational summary",
    appSection: "scenarios",
    expectedContent: ["Synthetic task counts", "Deferred work and walking summary"],
    nonClaimsRequired: true,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "operational-summary.png"
  },
  {
    screenId: "timeline",
    label: "Timeline",
    appSection: "scenarios",
    expectedContent: ["Highest queue callout", "Deferred task and walking load callouts"],
    nonClaimsRequired: true,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "timeline.png"
  },
  {
    screenId: "warning-explanations",
    label: "Warning explanations",
    appSection: "scenarios",
    expectedContent: ["Warning explanation cards", "Operational-only label"],
    nonClaimsRequired: true,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "warning-explanations.png"
  },
  {
    screenId: "scenario-comparison",
    label: "Scenario comparison",
    appSection: "scenarios",
    expectedContent: ["Human-readable scenario narratives", "Operational comparison only"],
    nonClaimsRequired: true,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "scenario-comparison.png"
  },
  {
    screenId: "proof-report",
    label: "Proof report",
    appSection: "scenarios",
    expectedContent: ["Simulation proof report", "Traceable deterministic proof sections"],
    nonClaimsRequired: true,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "proof-report.png"
  },
  {
    screenId: "demo-proof-bundle",
    label: "Demo proof bundle",
    appSection: "demo",
    expectedContent: ["Exportable demo proof bundle", "Evidence artifact references"],
    nonClaimsRequired: true,
    screenshotRequired: true,
    requiredForDemo: true,
    screenshotName: "demo-proof-bundle.png"
  }
];

export function buildPlan1DemoRouteMatrix(input: {
  sourceIssue?: string;
  screenshotBasePath?: string;
} = {}): Plan1DemoRouteMatrix {
  const sourceIssue = input.sourceIssue ?? "279";
  const screenshotBasePath = input.screenshotBasePath ?? `docs/verification/issues/issue-${sourceIssue}/screenshots`;
  const screens = SCREEN_DEFINITIONS.map((screen) => ({
    screenId: screen.screenId,
    label: screen.label,
    appSection: screen.appSection,
    requiredForDemo: true as const,
    expectedContent: [...screen.expectedContent],
    nonClaimsRequired: screen.nonClaimsRequired,
    screenshotRequired: screen.screenshotRequired,
    screenshotPath: `${screenshotBasePath}/${screen.screenshotName}`,
    status: "covered" as const,
    nonClaims: screen.nonClaimsRequired ? [...REQUIRED_NON_CLAIMS] : []
  }));
  const matrix: Plan1DemoRouteMatrix = {
    matrixId: "plan-1-demo-route-matrix-v1",
    planId: PLAN_1_ID,
    sourceIssue,
    screens,
    requiredNonClaims: [...REQUIRED_NON_CLAIMS],
    limitations: [
      "Screens are Plan 1 demo proof references only.",
      "Route matrix status tracks local demo coverage, not production readiness."
    ],
    syntheticDataOnly: true
  };
  return validatePlan1DemoRouteMatrix(matrix);
}

export function validatePlan1DemoRouteMatrix(matrix: Plan1DemoRouteMatrix): Plan1DemoRouteMatrix {
  if (matrix.planId !== PLAN_1_ID) {
    throw new Error("Plan 1 demo route matrix must use Plan 1");
  }
  if (matrix.syntheticDataOnly !== true) {
    throw new Error("Plan 1 demo route matrix must be synthetic-data-only");
  }
  validatePlan1NonClaims(matrix.requiredNonClaims, "plan1DemoRouteMatrix.requiredNonClaims");
  const screenIds = new Set(matrix.screens.map((screen) => screen.screenId));
  for (const requiredScreenId of PLAN_1_DEMO_REQUIRED_SCREEN_IDS) {
    if (!screenIds.has(requiredScreenId)) {
      throw new Error(`Plan 1 demo route matrix missing screen: ${requiredScreenId}`);
    }
  }
  for (const screen of matrix.screens) {
    if (!PLAN_1_DEMO_REQUIRED_SCREEN_IDS.includes(screen.screenId)) {
      throw new Error(`Unexpected Plan 1 demo screen: ${screen.screenId}`);
    }
    if (screen.requiredForDemo !== true) {
      throw new Error(`Plan 1 demo screen must be required: ${screen.screenId}`);
    }
    if (screen.status !== "covered") {
      throw new Error(`Plan 1 demo screen must be covered: ${screen.screenId}`);
    }
    if (!Array.isArray(screen.expectedContent) || screen.expectedContent.length === 0) {
      throw new Error(`Plan 1 demo screen missing expected content: ${screen.screenId}`);
    }
    if (screen.screenshotRequired && screen.screenshotPath.length === 0) {
      throw new Error(`Plan 1 demo screen missing screenshot path: ${screen.screenId}`);
    }
    if (screen.nonClaimsRequired) {
      validatePlan1NonClaims(screen.nonClaims, `plan1DemoRouteMatrix.${screen.screenId}.nonClaims`);
    }
  }
  return matrix;
}

export function summarizePlan1DemoRouteMatrix(matrix: Plan1DemoRouteMatrix): Plan1DemoRouteMatrixSummary {
  const screenIds = new Set(matrix.screens.map((screen) => screen.screenId));
  return {
    planId: matrix.planId,
    screenCount: matrix.screens.length,
    coveredScreenCount: matrix.screens.filter((screen) => screen.status === "covered").length,
    requiredScreenIds: [...PLAN_1_DEMO_REQUIRED_SCREEN_IDS],
    missingScreenIds: PLAN_1_DEMO_REQUIRED_SCREEN_IDS.filter((screenId) => !screenIds.has(screenId)),
    nonClaimsRequiredScreenCount: matrix.screens.filter((screen) => screen.nonClaimsRequired).length,
    screenshotRequiredScreenCount: matrix.screens.filter((screen) => screen.screenshotRequired).length,
    screenshotPaths: matrix.screens.map((screen) => screen.screenshotPath)
  };
}
