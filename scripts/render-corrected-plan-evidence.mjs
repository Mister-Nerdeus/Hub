import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";
import { renderCorrectedPlanVisualEvidence, validateSourceCorrectedSavedCopy } from "../packages/shared/dist/index.js";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "302";
const planNumbers = [2, 3, 4, 5];
const outputs = [];

for (const planNumber of planNumbers) {
  const planId = `plan-${planNumber}`;
  const sourceSavedCopyPath = `packages/shared/fixtures/source-corrections/${planId}/${planId}-corrected-saved-copy.json`;
  const correctedSavedCopyBytes = readFileSync(abs(sourceSavedCopyPath));
  const correctedSavedCopy = validateSourceCorrectedSavedCopy(JSON.parse(correctedSavedCopyBytes.toString("utf8")));
  const render = renderCorrectedPlanVisualEvidence({ correctedSavedCopy });
  const png = encodePng(render.widthPx, render.heightPx, render.rgba);
  const renderedEvidencePath = `docs/verification/rendered-plans/${planId}-rendered-review.png`;
  const renderedEvidenceMetadataPath = `docs/verification/rendered-plans/${planId}-rendered-review.metadata.json`;
  const issueScreenshotPath = `docs/verification/issues/issue-${issue}/screenshots/${planId}-rendered-review.png`;
  writeBuffer(renderedEvidencePath, png);
  writeBuffer(issueScreenshotPath, png);
  const renderedEvidenceHash = sha256(png);
  const metadata = {
    planId,
    sourceSavedCopyPath,
    sourceSavedCopyHash: sha256(correctedSavedCopyBytes),
    renderedEvidencePath,
    renderedEvidenceHash,
    widthPx: render.widthPx,
    heightPx: render.heightPx,
    objectCounts: render.objectCounts,
    drawCounts: render.drawCounts,
    renderedFromCorrectedSavedCopy: true,
    privateSourceScreenshotStored: false,
    exactParityClaimMade: false,
    machineVisualSanityChecks: render.machineVisualSanityChecks,
    limitations: render.limitations
  };
  writeJson(renderedEvidenceMetadataPath, metadata);
  const planOutputPath = `docs/verification/issues/issue-${issue}/${planId}-render-output.json`;
  writeJson(planOutputPath, metadata);
  outputs.push(metadata);
}

const summary = {
  status: "passed",
  issue,
  renderedPlans: outputs.map((output) => ({
    planId: output.planId,
    renderedEvidencePath: output.renderedEvidencePath,
    renderedEvidenceHash: output.renderedEvidenceHash,
    metadataPath: `docs/verification/rendered-plans/${output.planId}-rendered-review.metadata.json`
  }))
};
writeJson(`docs/verification/issues/issue-${issue}/rendered-visual-generator-output.json`, summary);
writeJson(`docs/verification/issues/issue-${issue}/render-hash-output.json`, summary);
console.log(JSON.stringify(summary, null, 2));

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  const rgbaBuffer = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgbaBuffer.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const chunks = [
    chunk("IHDR", Buffer.concat([u32(width), u32(height), Buffer.from([8, 6, 0, 0, 0])])),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ];
  return Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), ...chunks]);
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const payload = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([u32(data.length), payload, u32(crc32(payload))]);
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeBuffer(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function abs(path) {
  return join(repoRoot, path);
}
