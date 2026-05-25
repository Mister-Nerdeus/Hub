import { PLAN_1_ID } from "../assignment/plan1AssignmentCommon.js";
import { validatePlan1NonClaims } from "../scenario/plan1SimulationAssumptions.js";
import type { Plan1DemoSeedPackSummary } from "./plan1DemoSeedPack.js";
import type { Plan1SimulationProofReport } from "./plan1SimulationProofReport.js";

export type Plan1DemoProofBundleSectionId =
  | "demo-identity"
  | "gate-status-summary"
  | "plan-1-visual-parity-summary"
  | "assignment-workflow-summary"
  | "scenario-simulation-summary"
  | "simulation-refinement-summary"
  | "demo-seed-summary"
  | "assumptions-summary"
  | "warning-explanation-summary"
  | "scenario-comparison-summary"
  | "proof-report-summary"
  | "evidence-artifact-references"
  | "limitations"
  | "non-claims";

export type Plan1DemoProofBundleSection = {
  sectionId: Plan1DemoProofBundleSectionId;
  label: string;
  status: "passed" | "referenced" | "included";
  details: string[];
  artifactPaths: string[];
};

export type Plan1DemoProofBundleEvidenceReference = {
  artifactId: string;
  label: string;
  issue: string;
  path: string;
  requiredForDemo: true;
};

export type Plan1DemoProofBundle = {
  bundleId: "plan-1-demo-proof-bundle-v1";
  planId: typeof PLAN_1_ID;
  demoScope: "Plan 1 synthetic operational demo proof bundle";
  sourceIssue: string;
  sections: Plan1DemoProofBundleSection[];
  evidenceArtifactReferences: Plan1DemoProofBundleEvidenceReference[];
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

export const PLAN_1_DEMO_PROOF_BUNDLE_REQUIRED_SECTION_IDS: Plan1DemoProofBundleSectionId[] = [
  "demo-identity",
  "gate-status-summary",
  "plan-1-visual-parity-summary",
  "assignment-workflow-summary",
  "scenario-simulation-summary",
  "simulation-refinement-summary",
  "demo-seed-summary",
  "assumptions-summary",
  "warning-explanation-summary",
  "scenario-comparison-summary",
  "proof-report-summary",
  "evidence-artifact-references",
  "limitations",
  "non-claims"
];

const PROHIBITED_BUNDLE_CLAIMS = [
  "safe staffing",
  "unsafe staffing",
  "staffing compliant",
  "clinically safe",
  "clinically unsafe",
  "patient harm prediction",
  "patient outcome prediction",
  "required nurse ratio",
  "certified staffing recommendation"
];

export function buildPlan1DemoProofBundle(input: {
  proofReport: Plan1SimulationProofReport;
  demoSeedSummary: Plan1DemoSeedPackSummary;
  sourceIssue?: string;
  evidenceArtifactReferences?: Plan1DemoProofBundleEvidenceReference[];
}): Plan1DemoProofBundle {
  if (input.proofReport.planId !== PLAN_1_ID || input.demoSeedSummary.planId !== PLAN_1_ID) {
    throw new Error("Plan 1 demo proof bundle only accepts Plan 1 proof inputs");
  }
  const sourceIssue = input.sourceIssue ?? "277";
  const evidenceArtifactReferences = input.evidenceArtifactReferences ?? buildDefaultEvidenceReferences(sourceIssue);
  const proofSections = input.proofReport.sections;
  const limitations = [
    ...input.proofReport.sections.limitations,
    ...input.demoSeedSummary.limitations
  ];
  const nonClaims = validatePlan1NonClaims([
    ...input.proofReport.sections.nonClaims,
    ...input.demoSeedSummary.nonClaims
  ], "demoProofBundle.nonClaims");
  const bundle: Plan1DemoProofBundle = {
    bundleId: "plan-1-demo-proof-bundle-v1",
    planId: PLAN_1_ID,
    demoScope: "Plan 1 synthetic operational demo proof bundle",
    sourceIssue,
    sections: [
      section("demo-identity", "Demo identity", "included", [
        `Plan: ${PLAN_1_ID}`,
        "Scope: synthetic operational Plan 1 demo proof only.",
        `Source issue: ${sourceIssue}`
      ], []),
      section("gate-status-summary", "Gate status summary", "referenced", [
        "Local shared, web, build, no-PHI, docs, Plan 1, and Plans 2-5 unchanged gates are referenced as issue-scoped evidence."
      ], evidenceArtifactReferences.filter((reference) => reference.artifactId.includes("gate")).map((reference) => reference.path)),
      section("plan-1-visual-parity-summary", "Plan 1 visual parity summary", "referenced", [
        "Plan 1 visual parity evidence is issue-scoped and referenced in the bundle."
      ], pathsFor(evidenceArtifactReferences, "visual-parity")),
      section("assignment-workflow-summary", "Assignment workflow summary", "referenced", [
        `Assignments represented: ${proofSections.assignmentSummary.assignmentCount}`,
        `Synthetic nurses represented: ${proofSections.assignmentSummary.nurseCount}`,
        `Room loads represented: ${proofSections.assignmentSummary.roomLoadCount}`
      ], pathsFor(evidenceArtifactReferences, "assignment-workflow")),
      section("scenario-simulation-summary", "Scenario/simulation summary", "included", [
        `Scenario: ${proofSections.scenarioIdentity.scenarioId}`,
        `Profile: ${proofSections.scenarioIdentity.profileId}`,
        `Seed: ${proofSections.scenarioIdentity.seed}`,
        `Generated tasks: ${proofSections.generatedTaskSummary.taskCount}`,
        `Deferred synthetic tasks: ${proofSections.dryRunSummary.deferredTaskCount}`
      ], pathsFor(evidenceArtifactReferences, "scenario-simulation")),
      section("simulation-refinement-summary", "Simulation refinement summary", "included", [
        `Path-based tasks: ${proofSections.dryRunSummary.pathBasedTaskCount}`,
        `Fallback route tasks: ${proofSections.dryRunSummary.fallbackTaskCount}`,
        `Missing route tasks: ${proofSections.dryRunSummary.missingRouteTaskCount}`,
        `Deterministic report: ${proofSections.determinismProof.sameInputProducesSameReport}`
      ], pathsFor(evidenceArtifactReferences, "simulation-refinement")),
      section("demo-seed-summary", "Demo seed summary", "included", [
        `Seed pack: ${input.demoSeedSummary.packId}`,
        `Seed count: ${input.demoSeedSummary.seedCount}`,
        `Demo seeds: ${input.demoSeedSummary.demoSeedIds.join(", ")}`,
        `Expected signals: ${input.demoSeedSummary.expectedSignals.join("; ")}`
      ], pathsFor(evidenceArtifactReferences, "demo-seed")),
      section("assumptions-summary", "Assumptions summary", "included", [
        `Assumptions source: ${proofSections.assumptionsSummary.assumptionsId}`,
        `Reader sections: ${proofSections.assumptionsSummary.sectionLabels.join(", ")}`
      ], pathsFor(evidenceArtifactReferences, "assumptions")),
      section("warning-explanation-summary", "Warning explanation summary", "included", [
        `Warning explanations: ${proofSections.warningExplanations.length}`,
        `Warning codes: ${proofSections.warningExplanations.map((warning) => warning.warningCode).join(", ")}`
      ], pathsFor(evidenceArtifactReferences, "warning")),
      section("scenario-comparison-summary", "Scenario comparison summary", "included", [
        `Comparison: ${proofSections.scenarioComparisonSummary.comparisonId}`,
        `Rows: ${proofSections.scenarioComparisonSummary.rowCount}`,
        `Narratives: ${proofSections.scenarioComparisonSummary.plainLanguageSummaries.length}`
      ], pathsFor(evidenceArtifactReferences, "scenario-comparison")),
      section("proof-report-summary", "Proof report summary", "included", [
        `Proof report: ${input.proofReport.reportId}`,
        `Proof report sections: ${Object.keys(proofSections).join(", ")}`,
        `Deterministic key: ${proofSections.determinismProof.deterministicKey}`
      ], pathsFor(evidenceArtifactReferences, "proof-report")),
      section("evidence-artifact-references", "Evidence artifact references", "referenced", [
        `Artifact references: ${evidenceArtifactReferences.length}`,
        "All references are local verification artifacts."
      ], evidenceArtifactReferences.map((reference) => reference.path)),
      section("limitations", "Limitations", "included", [...new Set(limitations)].sort(), []),
      section("non-claims", "Non-claims", "included", [...new Set(nonClaims)].sort(), [])
    ],
    evidenceArtifactReferences,
    limitations: [...new Set(limitations)].sort(),
    nonClaims: [...new Set(nonClaims)].sort(),
    syntheticDataOnly: true
  };
  assertPlan1DemoProofBundleHasRequiredSections(bundle);
  assertPlan1DemoProofBundleHasNoProhibitedClaims(bundle);
  return bundle;
}

export function assertPlan1DemoProofBundleHasRequiredSections(bundle: Plan1DemoProofBundle): void {
  const actual = bundle.sections.map((sectionEntry) => sectionEntry.sectionId);
  for (const requiredSectionId of PLAN_1_DEMO_PROOF_BUNDLE_REQUIRED_SECTION_IDS) {
    if (!actual.includes(requiredSectionId)) {
      throw new Error(`Plan 1 demo proof bundle missing section: ${requiredSectionId}`);
    }
  }
}

export function assertPlan1DemoProofBundleHasNoProhibitedClaims(bundle: Plan1DemoProofBundle): void {
  const searchable = JSON.stringify({
    ...bundle,
    nonClaims: [],
    sections: bundle.sections.map((sectionEntry) => sectionEntry.sectionId === "non-claims"
      ? { ...sectionEntry, details: [] }
      : sectionEntry)
  }).toLowerCase();
  for (const prohibited of PROHIBITED_BUNDLE_CLAIMS) {
    if (searchable.includes(prohibited)) {
      throw new Error(`Plan 1 demo proof bundle must not include prohibited claim language: ${prohibited}`);
    }
  }
}

function buildDefaultEvidenceReferences(issue: string): Plan1DemoProofBundleEvidenceReference[] {
  return [
    reference("shared-gate", "Shared tests", issue, `docs/verification/issues/issue-${issue}/test-output/shared.txt`),
    reference("web-gate", "Web tests", issue, `docs/verification/issues/issue-${issue}/test-output/web.txt`),
    reference("web-build-gate", "Web build", issue, `docs/verification/issues/issue-${issue}/test-output/web-build.txt`),
    reference("no-phi-gate", "No-PHI gate", issue, `docs/verification/issues/issue-${issue}/test-output/no-phi.txt`),
    reference("docs-gate", "Docs gate", issue, `docs/verification/issues/issue-${issue}/test-output/docs-gate.txt`),
    reference("visual-parity-gate", "Plan 1 visual parity gate", issue, `docs/verification/issues/issue-${issue}/test-output/plan-1-visual-parity-gate.txt`),
    reference("assignment-workflow-gate", "Assignment workflow gate", issue, `docs/verification/issues/issue-${issue}/test-output/plan-1-assignment-workflow-gate.txt`),
    reference("scenario-simulation-gate", "Scenario simulation gate", issue, `docs/verification/issues/issue-${issue}/test-output/plan-1-scenario-simulation-gate.txt`),
    reference("simulation-refinement-gate", "Simulation refinement gate", issue, `docs/verification/issues/issue-${issue}/test-output/plan-1-simulation-refinement-gate.txt`),
    reference("demo-readiness-gate", "Demo readiness gate", issue, `docs/verification/issues/issue-${issue}/test-output/plan-1-demo-readiness-gate.txt`),
    reference("plans-2-through-5-gate", "Plans 2-5 unchanged gate", issue, `docs/verification/issues/issue-${issue}/test-output/plans-2-through-5-unchanged.txt`),
    reference("demo-seed-pack", "Demo seed pack evidence", "276", "docs/verification/issues/issue-276/demo-seed-pack-output.json"),
    reference("assumptions-presentation", "Assumptions presentation evidence", "274", "docs/verification/issues/issue-274/assumptions-display-groups-output.json"),
    reference("warning-ux", "Timeline and warning UX evidence", "275", "docs/verification/issues/issue-275/timeline-narratives-output.json"),
    reference("scenario-comparison-narratives", "Scenario comparison narrative evidence", "273", "docs/verification/issues/issue-273/scenario-narratives-output.json"),
    reference("proof-report", "Simulation proof report evidence", issue, `docs/verification/issues/issue-${issue}/demo-proof-bundle-output.json`)
  ];
}

function reference(
  artifactId: string,
  label: string,
  issue: string,
  path: string
): Plan1DemoProofBundleEvidenceReference {
  return {
    artifactId,
    label,
    issue,
    path,
    requiredForDemo: true
  };
}

function section(
  sectionId: Plan1DemoProofBundleSectionId,
  label: string,
  status: Plan1DemoProofBundleSection["status"],
  details: string[],
  artifactPaths: string[]
): Plan1DemoProofBundleSection {
  return {
    sectionId,
    label,
    status,
    details,
    artifactPaths
  };
}

function pathsFor(references: Plan1DemoProofBundleEvidenceReference[], fragment: string): string[] {
  return references
    .filter((referenceEntry) => referenceEntry.artifactId.includes(fragment))
    .map((referenceEntry) => referenceEntry.path);
}
