import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  buildManualReviewPacket,
  validateCorrectedPlanRouteRepairManifest
} from "../packages/shared/dist/index.js";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "323";
const issueDir = `docs/verification/issues/issue-${issue}`;
const routeManifestPath = "docs/verification/corrected-plan-route-repair-manifest.json";
const outputDir = "docs/manual-review";

mkdirSync(abs(issueDir), { recursive: true });
mkdirSync(abs(outputDir), { recursive: true });

const routeManifest = validateCorrectedPlanRouteRepairManifest(readJson(routeManifestPath));
const packets = [];

for (const entry of routeManifest.repairedPlans) {
  const metadataPath = `docs/verification/rendered-plans/${entry.planId}-rendered-review.metadata.json`;
  const renderedEvidencePath = `docs/verification/rendered-plans/${entry.planId}-rendered-review.png`;
  const reviewPacketPath = `${outputDir}/${entry.planId}-review-packet.md`;
  const metadata = readJson(metadataPath);
  const packet = buildManualReviewPacket({
    planId: entry.planId,
    sourceDefaultPlanId: entry.sourceDefaultPlanId,
    renderedEvidencePath,
    renderedEvidenceMetadataPath: metadataPath,
    renderedEvidenceHash: hashFile(renderedEvidencePath),
    renderedEvidenceMetadata: metadata,
    repairedSavedCopyPath: entry.repairedSavedCopyPath,
    repairedSavedCopyHash: entry.repairedSavedCopyHash,
    simulationReadyExportPath: entry.simulationReadyExportPath,
    simulationReadyExportHash: entry.simulationReadyExportHash,
    routeReadinessStatus: entry.pathSyncStatus === "fresh" ? "ready" : "blocked",
    simulationReadyExportStatus: entry.simulationReadyExportStatus === "simulation_ready" ? "simulation_ready" : "blocked",
    blockingIssues: entry.blockingIssues,
    warningIssues: entry.warningIssues,
    limitations: entry.limitations
  });
  writeText(reviewPacketPath, packet);
  packets.push({
    planId: entry.planId,
    reviewPacketPath,
    reviewPacketHash: hashFile(reviewPacketPath)
  });
  writeText(`${issueDir}/${entry.planId}-review-packet-output.json`, `${JSON.stringify(packets.at(-1), null, 2)}\n`);
}

const output = {
  status: "passed",
  packetCount: packets.length,
  packets
};
writeJson(`${issueDir}/review-packet-builder-output.json`, output);
console.log(JSON.stringify(output, null, 2));

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function readJson(path) {
  return JSON.parse(readFileSync(abs(path), "utf8"));
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function hashFile(path) {
  if (!existsSync(abs(path))) {
    return null;
  }
  return createHash("sha256").update(readFileSync(abs(path))).digest("hex");
}

function abs(path) {
  return join(repoRoot, path);
}
