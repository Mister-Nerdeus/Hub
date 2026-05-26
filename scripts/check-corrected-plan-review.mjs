import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  buildCorrectedPlanReadinessMatrix,
  validateCorrectedPlanReviewManifest,
  validateSourceCorrectedSavedCopy,
  validateSourceCorrectionAudit,
  validateSourcePlanCorrectionManifest
} from "../packages/shared/dist/index.js";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "310";
const allowPartial = args.includes("--allow-partial");

const stages = new Set([
  "preflight",
  "protocol",
  "rendered-evidence",
  "plan-2-review",
  "plan-3-review",
  "plan-4-review",
  "plan-5-review",
  "route-export-matrix",
  "private-source-final",
  "promotion-protocol",
  "final"
]);

if (!stages.has(stage)) {
  fail(`Unsupported corrected plan review stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial until Issue 310 final audit`);
}
if (stage === "final" && allowPartial) {
  fail("final corrected plan review must run without --allow-partial");
}

const failures = [];
const requiredProtocolPaths = [
  "docs/plan-review/corrected-plan-review-protocol.md",
  "docs/plan-review/default-fixture-promotion-protocol.md",
  "docs/verification/corrected-plan-review-manifest.json",
  "packages/shared/src/floorplans/correctedPlanReviewManifest.ts",
  "scripts/check-corrected-plan-review.mjs"
];
const sourceCorrectionManifestPath = "docs/verification/source-plan-correction-manifest.json";
const reviewManifestPath = "docs/verification/corrected-plan-review-manifest.json";

if (stage === "preflight" || stage === "protocol" || stage === "final" || stage === "promotion-protocol") {
  for (const path of requiredProtocolPaths) {
    requireFile(path, failures);
  }
}

const sourceManifestRaw = readJson(sourceCorrectionManifestPath, failures);
let sourceManifest = null;
if (sourceManifestRaw != null) {
  try {
    sourceManifest = validateSourcePlanCorrectionManifest(sourceManifestRaw);
  } catch (error) {
    failures.push(`source correction manifest failed validation: ${error.message}`);
  }
}

const reviewManifestRaw = readJson(reviewManifestPath, failures);
let reviewManifest = null;
if (reviewManifestRaw != null) {
  try {
    reviewManifest = validateCorrectedPlanReviewManifest(reviewManifestRaw);
  } catch (error) {
    failures.push(`corrected plan review manifest failed validation: ${error.message}`);
  }
}

const sourceArtifacts = validateSourceArtifacts(sourceManifest, failures);
const reviewArtifacts = validateReviewArtifacts(reviewManifest, failures);
const defaultFixtureStatus = defaultFixtureNonmutationStatus();
if (!defaultFixtureStatus.sourceFixturesRemainUnchanged) {
  failures.push("Plans 2-5 default source fixtures changed");
}

if (stage === "protocol" || stage === "promotion-protocol" || stage === "final") {
  validateProtocolText(failures);
}
if (stage === "rendered-evidence" || stage === "final") {
  validateRenderedEvidence(reviewManifest, failures);
}
if (/^plan-[2-5]-review$/u.test(stage) || stage === "final") {
  const planNumbers = stage === "final" ? [2, 3, 4, 5] : [Number(stage.match(/^plan-(\d)-review$/u)?.[1])];
  for (const planNumber of planNumbers) {
    validatePlanReview(planNumber, reviewManifest, failures);
  }
}
if (stage === "route-export-matrix" || stage === "final") {
  validateReadinessMatrix(reviewManifest, failures);
}
if (stage === "private-source-final" || stage === "final") {
  failures.push(...scanCorrectedPlanPrivateSourceArtifacts());
}
if (stage === "promotion-protocol" || stage === "final") {
  validatePromotionProtocol(reviewManifest, failures);
}

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  sourceCorrectionManifestPath,
  reviewManifestPath,
  sourceArtifacts,
  reviewArtifacts,
  defaultFixtureMutationStatus: defaultFixtureStatus,
  failures,
  evidenceDir: `docs/verification/issues/issue-${issue}`
};

writeIssueEvidence(issue, output);

if (output.status !== "passed") {
  fail(JSON.stringify(output, null, 2));
}

console.log(JSON.stringify(output, null, 2));

function validateSourceArtifacts(manifest, failureList) {
  const result = [];
  if (manifest == null) {
    return result;
  }
  for (const entry of manifest.planCorrections) {
    const paths = [entry.correctedSavedCopyPath, entry.correctionAuditPath];
    for (const path of paths) {
      requireFile(path, failureList);
    }
    const copy = readJson(entry.correctedSavedCopyPath, failureList);
    const audit = readJson(entry.correctionAuditPath, failureList);
    if (copy != null) {
      try {
        const validatedCopy = validateSourceCorrectedSavedCopy(copy);
        if (validatedCopy.sourceDefaultPlanId !== entry.sourceDefaultPlanId) {
          failureList.push(`${entry.planId} corrected copy sourceDefaultPlanId mismatch`);
        }
      } catch (error) {
        failureList.push(`${entry.planId} corrected saved copy failed validation: ${error.message}`);
      }
    }
    if (audit != null) {
      try {
        validateSourceCorrectionAudit(audit);
      } catch (error) {
        failureList.push(`${entry.planId} correction audit failed validation: ${error.message}`);
      }
    }
    result.push({
      planId: entry.planId,
      correctedSavedCopyPath: entry.correctedSavedCopyPath,
      correctionAuditPath: entry.correctionAuditPath
    });
  }
  return result;
}

function validateReviewArtifacts(manifest, failureList) {
  const result = [];
  if (manifest == null) {
    return result;
  }
  for (const entry of manifest.reviewedPlans) {
    for (const path of [
      entry.correctedSavedCopyPath,
      entry.correctionAuditPath,
      entry.renderedEvidencePath,
      entry.renderedEvidenceMetadataPath,
      `packages/shared/fixtures/source-corrections/${entry.planId}/${entry.planId}-review.json`
    ]) {
      requireFile(path, failureList);
    }
    for (const [path, expectedHash] of [
      [entry.correctedSavedCopyPath, entry.correctedSavedCopyHash],
      [entry.correctionAuditPath, entry.correctionAuditHash],
      [entry.renderedEvidencePath, entry.renderedEvidenceHash]
    ]) {
      if (existsSync(abs(path)) && hashFile(path) !== expectedHash) {
        failureList.push(`${entry.planId} hash mismatch for ${path}`);
      }
    }
    result.push({
      planId: entry.planId,
      renderedEvidencePath: entry.renderedEvidencePath,
      promotionCandidateStatus: entry.promotionCandidateStatus
    });
  }
  return result;
}

function validateRenderedEvidence(manifest, failureList) {
  if (manifest == null) {
    return;
  }
  if (manifest.renderedEvidenceStatus !== "complete") {
    failureList.push("renderedEvidenceStatus must be complete");
  }
  for (const entry of manifest.reviewedPlans) {
    const metadata = readJson(entry.renderedEvidenceMetadataPath, failureList);
    if (metadata == null) {
      continue;
    }
    if (metadata.renderedFromCorrectedSavedCopy !== true) {
      failureList.push(`${entry.planId} render metadata must be generated from corrected saved copy`);
    }
    if (metadata.privateSourceScreenshotStored !== false) {
      failureList.push(`${entry.planId} render metadata stores private source screenshot`);
    }
    if (metadata.exactParityClaimMade !== false) {
      failureList.push(`${entry.planId} render metadata claims exact parity`);
    }
    if (metadata.widthPx <= 1 || metadata.heightPx <= 1) {
      failureList.push(`${entry.planId} render is placeholder-sized`);
    }
    for (const key of ["rooms", "hallways", "doors", "nurseStations", "zones", "pathNodes", "pathEdges"]) {
      if (!Number.isInteger(metadata.objectCounts?.[key])) {
        failureList.push(`${entry.planId} render metadata missing object count ${key}`);
      }
    }
    if (hashFile(entry.renderedEvidencePath) !== entry.renderedEvidenceHash) {
      failureList.push(`${entry.planId} rendered evidence hash mismatch`);
    }
  }
}

function validatePlanReview(planNumber, manifest, failureList) {
  if (manifest == null) {
    return;
  }
  const planId = `plan-${planNumber}`;
  const entry = manifest.reviewedPlans.find((candidate) => candidate.planId === planId);
  if (entry == null) {
    failureList.push(`manifest missing ${planId}`);
    return;
  }
  const review = readJson(`packages/shared/fixtures/source-corrections/${planId}/${planId}-review.json`, failureList);
  if (review == null) {
    return;
  }
  for (const key of [
    "roomsMissingDoor",
    "roomsMissingPathNode",
    "unreachableRoomIds",
    "orphanPathNodeIds",
    "invalidPathEdgeIds",
    "nonFinitePathEdgeIds",
    "blockedRequiredEdgeIds",
    "stationToRoomRoutesChecked",
    "stationToRoomRoutesPassed",
    "pathSyncStatus"
  ]) {
    if (!(key in review.routeAudit)) {
      failureList.push(`${planId} routeAudit missing ${key}`);
    }
  }
  if (review.manualVisualReviewStatus === "manual_review_completed") {
    failureList.push(`${planId} must not claim manual visual review completed`);
  }
  if (review.privateSourcePayloadStored !== false || review.exactParityClaimMade !== false) {
    failureList.push(`${planId} violates private-source or exact-parity review boundary`);
  }
  if (review.correctedSavedCopyPath !== entry.correctedSavedCopyPath) {
    failureList.push(`${planId} review correctedSavedCopyPath mismatch`);
  }
}

function validateReadinessMatrix(manifest, failureList) {
  if (manifest == null) {
    return;
  }
  const matrix = buildCorrectedPlanReadinessMatrix(manifest);
  if (matrix.length !== 4) {
    failureList.push("readiness matrix must include Plans 2-5");
  }
  if (matrix.some((entry) => entry.promotionCandidateStatus.length === 0)) {
    failureList.push("readiness matrix entries require promotionCandidateStatus");
  }
}

function validatePromotionProtocol(manifest, failureList) {
  const promotionProtocol = readText("docs/plan-review/default-fixture-promotion-protocol.md", failureList);
  if (promotionProtocol == null) {
    return;
  }
  for (const required of [/manual visual review approval/i, /rollback plan/i, /separately approved/i, /private-source boundary/i]) {
    if (!required.test(promotionProtocol)) {
      failureList.push(`promotion protocol missing ${required}`);
    }
  }
  if (manifest?.promotionStatus !== "blocked") {
    failureList.push("promotionStatus must remain blocked for this batch");
  }
}

function validateProtocolText(failureList) {
  const protocol = readText("docs/plan-review/corrected-plan-review-protocol.md", failureList);
  if (protocol == null) {
    return;
  }
  for (const required of [
    /Do not mutate default source fixtures/i,
    /Do not promote corrected saved copies/i,
    /corrected saved-copy JSON/i,
    /Do not claim exact CAD parity/i,
    /Do not claim completed human\/manual visual approval/i
  ]) {
    if (!required.test(protocol)) {
      failureList.push(`corrected plan review protocol missing ${required}`);
    }
  }
}

function scanCorrectedPlanPrivateSourceArtifacts() {
  const scanRoots = [
    "packages/shared/fixtures/source-corrections",
    "docs/verification/rendered-plans",
    "docs/verification/corrected-plan-review-manifest.json",
    "docs/plan-review"
  ];
  const failures = [];
  const patterns = [
    [/\.docx\b/i, "DOCX reference"],
    [/[A-Za-z]:[\\/][^\s"]+/u, "private absolute path"],
    [/\bocr(?:Dump|Text)\b|OCR dump:/i, "OCR dump text"],
    [/\brawSourceText\b|raw source text:/i, "raw source text"],
    [/\bprivateSourceScreenshotStored\s*:\s*true\b|private-source screenshot:/i, "private-source screenshot"],
    [/exact (?:CAD|DOCX) parity (?:achieved|confirmed|passed|approved)/i, "exact parity claim"]
  ];
  for (const root of scanRoots) {
    for (const file of listFiles(root)) {
      if (file.endsWith(".png")) {
        continue;
      }
      const text = readFileSync(abs(file), "utf8");
      for (const [pattern, label] of patterns) {
        if (pattern.test(text)) {
          failures.push(`${file} contains forbidden ${label}`);
        }
      }
    }
  }
  return failures;
}

function defaultFixtureNonmutationStatus() {
  const expectedHashes = {
    "packages/shared/fixtures/default-plans/default-er-layout-plan-2.json":
      "d1b6700a9ac0bb3e6c48ba84b9a7cd9169722c749183a5961d6a9cc15e33efc3",
    "packages/shared/fixtures/default-plans/default-er-layout-plan-3.json":
      "827b0e440f47256bde17d8753e7e5c214cba16f1d3f0bd57d9115caf48f9d2b4",
    "packages/shared/fixtures/default-plans/default-er-layout-plan-4.json":
      "5f22083f41f3b54987dffa02bd530d13af81d634b9e510d3a689d81cb81932b2",
    "packages/shared/fixtures/default-plans/default-er-layout-plan-5.json":
      "dc12dfb2f821d0c70ff749898efa1937d2de4bad7df748cd99b3f2068cd3a67f"
  };
  const hashMismatches = [];
  for (const [path, expectedSha256] of Object.entries(expectedHashes)) {
    if (!existsSync(abs(path))) {
      hashMismatches.push({ path, expectedSha256, actualSha256: null });
      continue;
    }
    const actualSha256 = hashFile(path);
    if (actualSha256 !== expectedSha256) {
      hashMismatches.push({ path, expectedSha256, actualSha256 });
    }
  }
  return {
    sourceFixturesRemainUnchanged: hashMismatches.length === 0,
    hashMismatches
  };
}

function writeIssueEvidence(issueNumber, output) {
  const issueDir = abs(`docs/verification/issues/issue-${issueNumber}`);
  mkdirSync(join(issueDir, "test-output"), { recursive: true });
  writeJson(join(issueDir, "corrected-plan-review-gate-output.json"), output);
  writeJson(join(issueDir, "test-output/corrected-plan-review-gate.txt"), output);
}

function requireFile(path, failureList) {
  if (!existsSync(abs(path)) || !statSync(abs(path)).isFile()) {
    failureList.push(`missing required file: ${path}`);
    return;
  }
  if (statSync(abs(path)).size === 0) {
    failureList.push(`required file is empty: ${path}`);
  }
}

function readJson(path, failureList) {
  try {
    return JSON.parse(readFileSync(abs(path), "utf8"));
  } catch (error) {
    failureList.push(`invalid JSON ${path}: ${error.message}`);
    return null;
  }
}

function readText(path, failureList) {
  try {
    return readFileSync(abs(path), "utf8");
  } catch (error) {
    failureList.push(`cannot read ${path}: ${error.message}`);
    return null;
  }
}

function listFiles(path) {
  if (!existsSync(abs(path))) {
    return [];
  }
  const stat = statSync(abs(path));
  if (stat.isFile()) {
    return [path];
  }
  return stat.isDirectory() ? walk(path) : [];
}

function walk(root) {
  const entries = [];
  for (const dirent of readdirSync(abs(root), { withFileTypes: true })) {
    const child = `${root}/${dirent.name}`;
    if (dirent.isDirectory()) {
      entries.push(...walk(child));
    } else if (dirent.isFile()) {
      entries.push(child);
    }
  }
  return entries;
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(abs(path))).digest("hex");
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function abs(path) {
  return join(repoRoot, path);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
