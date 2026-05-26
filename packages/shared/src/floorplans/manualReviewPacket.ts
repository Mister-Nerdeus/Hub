import { assertNoForbiddenDecisionClaims } from "./manualReviewDecisionContract.js";

export type ManualReviewPacketInput = {
  planId: "plan-2" | "plan-3" | "plan-4" | "plan-5";
  sourceDefaultPlanId: string;
  renderedEvidencePath: string;
  renderedEvidenceMetadataPath: string;
  renderedEvidenceHash: string;
  renderedEvidenceMetadata: {
    objectCounts?: Record<string, number>;
    drawCounts?: Record<string, number>;
    renderedFromCorrectedSavedCopy?: boolean;
    privateSourceScreenshotStored?: boolean;
    exactParityClaimMade?: boolean;
  };
  repairedSavedCopyPath: string;
  repairedSavedCopyHash: string;
  simulationReadyExportPath: string;
  simulationReadyExportHash: string;
  routeReadinessStatus: "ready" | "blocked";
  simulationReadyExportStatus: "simulation_ready" | "blocked";
  blockingIssues: string[];
  warningIssues: string[];
  limitations: string[];
};

export function buildManualReviewPacket(input: ManualReviewPacketInput): string {
  const metadata = input.renderedEvidenceMetadata;
  const objectCounts = metadata.objectCounts ?? {};
  const drawCounts = metadata.drawCounts ?? {};
  const lines = [
    `# ${input.planId} Manual Visual Review Packet`,
    "",
    "## Scope",
    "",
    "- Review is limited to operational layout plausibility.",
    "- Review does not authorize default fixture promotion.",
    "- Review does not approve clinical safety, staffing compliance, or private-source comparison.",
    "- No private source file, source screenshot, source path, or raw source text is included.",
    "",
    "## Safe Rendered Evidence",
    "",
    `- Rendered image: ${input.renderedEvidencePath}`,
    `- Rendered image hash: ${input.renderedEvidenceHash}`,
    `- Render metadata: ${input.renderedEvidenceMetadataPath}`,
    `- Rendered from corrected saved copy: ${metadata.renderedFromCorrectedSavedCopy === true}`,
    `- Private source screenshot stored: ${metadata.privateSourceScreenshotStored === true}`,
    `- Private-source comparison claim made: ${metadata.exactParityClaimMade === true}`,
    "",
    "## Draw Count Proof",
    "",
    `- Rooms: ${countLine(objectCounts.rooms, drawCounts.roomsDrawn)}`,
    `- Doors: ${countLine(objectCounts.doors, drawCounts.doorsDrawn)}`,
    `- Hallways: ${countLine(objectCounts.hallways, drawCounts.hallwaysDrawn)}`,
    `- Path nodes: ${countLine(objectCounts.pathNodes, drawCounts.pathNodesDrawn)}`,
    `- Path edges: ${countLine(objectCounts.pathEdges, drawCounts.pathEdgesDrawn)}`,
    "",
    "## Route And Export Status",
    "",
    `- Source default plan id: ${input.sourceDefaultPlanId}`,
    `- Repaired saved copy: ${input.repairedSavedCopyPath}`,
    `- Repaired saved copy hash: ${input.repairedSavedCopyHash}`,
    `- Route readiness: ${input.routeReadinessStatus}`,
    `- Simulation-ready export: ${input.simulationReadyExportPath}`,
    `- Simulation-ready export hash: ${input.simulationReadyExportHash}`,
    `- Simulation-ready export status: ${input.simulationReadyExportStatus}`,
    "",
    "## Reviewer Checklist",
    "",
    "- Room placement plausibility",
    "- Door placement plausibility",
    "- Hallway/path connectivity plausibility",
    "- Station placement plausibility",
    "- Labels/readability",
    "- Known limitations accepted",
    "",
    "## Allowed Structured Decisions",
    "",
    "- manual_review_required",
    "- approved_for_promotion_review",
    "- approved_with_notes",
    "- rejected_needs_correction",
    "",
    "## Current Decision State",
    "",
    "- manual_review_required",
    "- No reviewer decision artifact is present in this packet.",
    "- Codex has not approved visual correctness.",
    "",
    "## Blocking Issues",
    "",
    ...asList(input.blockingIssues),
    "",
    "## Warning Issues",
    "",
    ...asList(input.warningIssues),
    "",
    "## Limitations",
    "",
    ...asList(input.limitations),
    "- The rendered plan is repo-safe evidence for human review only.",
    "- Future promotion review remains blocked until an explicit structured manual decision exists."
  ];
  const packet = `${lines.join("\n")}\n`;
  assertNoForbiddenDecisionClaims(packet, "manualReviewPacket");
  return packet;
}

function countLine(expected: number | undefined, drawn: number | undefined): string {
  return `${expected ?? 0} expected, ${drawn ?? 0} drawn`;
}

function asList(values: string[]): string[] {
  return values.length === 0 ? ["- None"] : values.map((value) => `- ${value}`);
}
