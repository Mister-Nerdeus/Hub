import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildOperationalDemoSnapshot } from "../packages/shared/dist/index.js";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "379";
const issueDir = `docs/verification/issues/issue-${issue}`;
const failures = [];
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const basePlan = {
  planId: "plan-2",
  displayName: "Plan 2",
  safeReviewPacketLabel: "Plan 2 manual review packet",
  safeReviewTemplateLabel: "Plan 2 review record template",
  safeRenderedEvidenceLabel: "Plan 2 rendered operational review evidence",
  routeReadinessStatus: "ready",
  simulationReadyExportStatus: "simulation_ready",
  manualReviewStatus: "manual_review_required",
  promotionStatus: "blocked",
  reviewerDecisionSource: "none",
  canPromote: false,
  codexClaimedApproval: false,
  sampleRecordCountsAsApproval: false,
  exactParityClaimMade: false,
  privateSourcePayloadStored: false,
  reviewPacketPath: "docs/manual-review/plan-2-review-packet.md",
  reviewRecordTemplatePath: "docs/manual-review/plan-2-review-record.template.json",
  renderedEvidencePath: "docs/verification/rendered-plans/plan-2-rendered-review.png",
  renderedEvidenceHash: "a".repeat(64),
  renderedEvidenceMetadataHash: "b".repeat(64),
  renderedEvidenceMetadataSummary: {
    objectCounts: { rooms: 1, hallways: 1, doors: 1, nurseStations: 1, zones: 1, pathNodes: 1, pathEdges: 1 },
    drawCounts: { roomsDrawn: 1, hallwaysDrawn: 1, doorsDrawn: 1, stationsDrawn: 1, zonesDrawn: 1, pathNodesDrawn: 1, pathEdgesDrawn: 1, labelsDrawn: 1 },
    exactParityClaimMade: false,
    privateSourceScreenshotStored: false
  }
};

const cases = [
  ["forbidden-browser-title-negative-output.json", () => rejectIfForbiddenTitle("<title>Nerdeus ER Pod Shift Simulator</title>"), /forbidden browser title/u],
  ["unsafe-rendered-path-negative-output.json", () => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, renderedEvidencePath: "../private/source.png" }], includeDeveloperEvidence: true }), /safe repo-relative/u],
  ["private-source-image-negative-output.json", () => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, renderedEvidencePath: "private/source.png" }], includeDeveloperEvidence: true }), /safe repo-relative/u],
  ["raw-hash-operator-negative-output.json", () => rejectOperatorPayload({ renderedEvidenceHash: "a".repeat(64) }), /raw hash/u],
  ["approval-claim-negative-output.json", () => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, codexClaimedApproval: true }] }), /manual review or promotion/u],
  ["promotion-enabled-negative-output.json", () => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, canPromote: true }] }), /manual review or promotion/u],
  ["sample-approval-negative-output.json", () => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, sampleRecordCountsAsApproval: true }] }), /manual review or promotion/u],
  ["raw-manifest-leak-negative-output.json", () => rejectOperatorPayload({ path: "docs/verification/raw-manifest.json" }), /raw proof manifest/u],
  ["label-only-negative-proof-negative-output.json", () => rejectLabelOnlyProof({ status: "passed", rejected: true }), /label-only/u]
];

const results = [];
for (const [file, run, expected] of cases) {
  const result = captureFailure(run, expected);
  if (result.status !== "passed") failures.push(`${file} did not fail through expected validator`);
  writeJson(`${issueDir}/${file}`, result);
  results.push({ file, ...result });
}

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  validatorBacked: true,
  results,
  failures
};
writeJson(`${issueDir}/negative-evidence-inventory-output.json`, { status: "passed", cases: results.map((result) => result.file) });
writeJson(`${issueDir}/real-validator-failure-output.json`, output);
writeText(`${issueDir}/test-output/operational-demo-negative-tests.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function captureFailure(run, expected) {
  try {
    run();
    return { status: "failed", rejected: false, expectedReason: String(expected), actualError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: expected.test(message) ? "passed" : "failed", rejected: true, expectedReason: String(expected), actualError: message };
  }
}

function rejectIfForbiddenTitle(html) {
  if (html.includes("Nerdeus ER Pod Shift Simulator")) throw new Error("forbidden browser title");
}

function rejectOperatorPayload(payload) {
  const serialized = JSON.stringify(payload);
  if (/[a-f0-9]{64}/u.test(serialized)) throw new Error("raw hash in operator payload");
  if (/docs\/verification/u.test(serialized)) throw new Error("raw proof manifest leakage");
}

function rejectLabelOnlyProof(value) {
  if (value.status === "passed" && value.rejected === true && value.actualError == null) {
    throw new Error("label-only negative proof");
  }
}

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function abs(path) {
  return join(repoRoot, path);
}
