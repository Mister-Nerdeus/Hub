#!/usr/bin/env node
import { existsSync } from "node:fs";
import {
  abs,
  addCheck,
  canonicalFloorplanId,
  fileExistsWithBytes,
  finalizeHardeningGate,
  issueDir,
  parseArgs,
  readJson,
  referenceImagePath,
  referenceOverlayPath,
  referenceSourceRecordPath,
  sha256File,
  stageListForFinal,
  writeJson,
  writeText
} from "./lib/canonical-fidelity-hardening-utils.mjs";

const stages = [
  "root-asset-detected",
  "source-asset",
  "moved-from-root",
  "metadata",
  "manual-review-required",
  "overlay-trace",
  "final"
];

const args = parseArgs();
const stage = args.stage ?? "final";
const issue = args.issue ?? "541";
const allowPartial = args["allow-partial"] === true;
if (!stages.includes(stage)) throw new Error(`Unsupported reference image asset stage: ${stage}`);

const checks = [];
const dir = issueDir(issue);
const sourceRecord = readJson(referenceSourceRecordPath);
const hasRootAsset = existsSync(abs("Screenshot.png"));
const hasStableAsset = fileExistsWithBytes(referenceImagePath, 100);
const checksum = hasStableAsset ? sha256File(referenceImagePath) : null;

function run(currentStage) {
  if (currentStage === "root-asset-detected") {
    writeJson(`${dir}/root-reference-asset-before-output.json`, {
      originalRootAssetName: "Screenshot.png",
      rootAssetCurrentlyPresent: hasRootAsset,
      stableReferenceAssetPresent: hasStableAsset,
      disposition: sourceRecord.rootAssetDisposition
    });
    addCheck(checks, "root-provided reference asset is detected or registered after move", hasRootAsset || hasStableAsset, { hasRootAsset, hasStableAsset });
  }

  if (currentStage === "source-asset") {
    writeJson(`${dir}/reference-source-record-output.json`, sourceRecord);
    addCheck(checks, "source record references canonical Plan 1", sourceRecord.canonicalFloorplanId === canonicalFloorplanId, sourceRecord.canonicalFloorplanId);
    addCheck(checks, "source record has stable reference asset path", sourceRecord.stableReferenceAssetPath === referenceImagePath, sourceRecord.stableReferenceAssetPath);
    addCheck(checks, "source record no longer says visual source is missing", sourceRecord.visualSourceStatus === "present" && sourceRecord.committedReferenceImage != null, sourceRecord.visualSourceStatus);
  }

  if (currentStage === "moved-from-root") {
    writeJson(`${dir}/moved-from-root-output.json`, {
      originalRootAssetName: "Screenshot.png",
      rootAssetCurrentlyPresent: hasRootAsset,
      stableReferenceAssetPath: referenceImagePath,
      stableReferenceAssetPresent: hasStableAsset,
      disposition: sourceRecord.rootAssetDisposition
    });
    addCheck(checks, "stable reference asset exists", hasStableAsset, referenceImagePath);
    addCheck(checks, "root reference asset is no longer unmanaged", !hasRootAsset && sourceRecord.rootAssetDisposition === "moved_from_root_to_stable_reference", sourceRecord.rootAssetDisposition);
  }

  if (currentStage === "metadata") {
    writeJson(`${dir}/reference-asset-after-output.json`, {
      path: referenceImagePath,
      exists: hasStableAsset,
      checksumAlgorithm: "SHA-256",
      checksum
    });
    writeText(`${dir}/reference-asset-checksum-output.txt`, `${checksum ?? "missing"}\n`);
    writeText(`${dir}/no-cad-parity-claim-output.txt`, "passed: exact CAD parity is not claimed for the committed operational visual reference.\n");
    addCheck(checks, "reference image checksum exists", typeof checksum === "string" && checksum.length === 64, checksum);
    addCheck(checks, "checksum matches source record", sourceRecord.checksum?.value === checksum, sourceRecord.checksum?.value);
    addCheck(checks, "asset type is PNG", sourceRecord.assetType === "image/png", sourceRecord.assetType);
    addCheck(checks, "exact CAD parity is not claimed", sourceRecord.exactCadParityClaimed === false, sourceRecord.exactCadParityClaimed);
  }

  if (currentStage === "manual-review-required") {
    writeText(`${dir}/manual-review-required-output.txt`, "passed: manual visual review remains required.\n");
    writeText(`${dir}/promotion-blocked-output.txt`, "passed: promotion remains blocked.\n");
    addCheck(checks, "manual visual review remains required", sourceRecord.manualVisualReviewRequired === true, sourceRecord.manualVisualReviewRequired);
    addCheck(checks, "promotion remains blocked", sourceRecord.promotionStatus === "blocked", sourceRecord.promotionStatus);
  }

  if (currentStage === "overlay-trace") {
    const overlayExists = fileExistsWithBytes(referenceOverlayPath, 100);
    writeJson(`${dir}/reference-overlay-output.json`, {
      overlayPath: referenceOverlayPath,
      overlayExists
    });
    addCheck(checks, "reference overlay trace asset exists", overlayExists, referenceOverlayPath);
  }
}

for (const currentStage of stage === "final" ? stageListForFinal(stages) : [stage]) run(currentStage);

finalizeHardeningGate({
  stage,
  issue,
  allowPartial,
  checks,
  outputName: "reference-image-asset-output.json",
  manifestUpdates: {
    rootReferenceAssetStatus: "moved_to_stable_reference",
    referenceImageAssetStatus: "registered",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    noPhiStatus: "passed"
  }
});
