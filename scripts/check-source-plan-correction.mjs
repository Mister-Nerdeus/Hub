import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateSourceCorrectedSavedCopy,
  validateSourceCorrectionAudit,
  validateSourcePlanCorrectionManifest
} from "../packages/shared/dist/index.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "300";
const allowPartial = args.includes("--allow-partial");

const stageIssue = {
  protocol: "291",
  "plan-2-correction": "292",
  "plan-2-audit": "293",
  "plan-3-correction": "294",
  "plan-3-audit": "295",
  "plan-4-correction": "296",
  "plan-4-audit": "297",
  "plan-5-correction": "298",
  "plan-5-audit": "299",
  final: "300"
};

const defaultHashes = {
  "packages/shared/fixtures/default-plans/default-er-layout-plan-2.json":
    "d1b6700a9ac0bb3e6c48ba84b9a7cd9169722c749183a5961d6a9cc15e33efc3",
  "packages/shared/fixtures/default-plans/default-er-layout-plan-3.json":
    "827b0e440f47256bde17d8753e7e5c214cba16f1d3f0bd57d9115caf48f9d2b4",
  "packages/shared/fixtures/default-plans/default-er-layout-plan-4.json":
    "5f22083f41f3b54987dffa02bd530d13af81d634b9e510d3a689d81cb81932b2",
  "packages/shared/fixtures/default-plans/default-er-layout-plan-5.json":
    "dc12dfb2f821d0c70ff749898efa1937d2de4bad7df748cd99b3f2068cd3a67f"
};

if (!(stage in stageIssue)) {
  fail(`Unsupported source plan correction stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial until Issue 300 final audit`);
}

const failures = [];
const protocolPaths = [
  "docs/source-correction/source-correction-protocol.md",
  "docs/source-correction/private-source-boundary.md",
  "docs/verification/source-plan-correction-manifest.json",
  "packages/shared/src/floorplans/sourcePlanCorrectionManifest.ts"
];
for (const protocolPath of protocolPaths) {
  requireFile(protocolPath, failures);
}

const protocolText = protocolPaths
  .filter((path) => path.endsWith(".md") && existsSync(abs(path)))
  .map((path) => readFileSync(abs(path), "utf8"))
  .join("\n");
for (const required of [
  /saved editable copy only/i,
  /no direct default fixture mutation/i,
  /no raw source payload storage/i,
  /no source binary storage/i,
  /no source filename or private path storage/i,
  /no OCR dump or raw source text storage/i,
  /no private-source screenshot storage/i,
  /no exact CAD or exact DOCX parity claim/i,
  /rendered visual evidence/i,
  /route audit is required/i,
  /simulation-ready export status is required/i,
  /separate explicit issue/i
]) {
  if (!required.test(protocolText)) {
    failures.push(`source correction protocol missing rule: ${required}`);
  }
}

const manifest = readJson("docs/verification/source-plan-correction-manifest.json", failures);
let validatedManifest = null;
if (manifest != null) {
  try {
    validatedManifest = validateSourcePlanCorrectionManifest(manifest);
  } catch (error) {
    failures.push(`source correction manifest failed validation: ${error.message}`);
  }
}

const defaultFixtureStatus = defaultFixtureNonmutationStatus();
if (defaultFixtureStatus.hashMismatches.length > 0) {
  failures.push("Plans 2-5 default source fixtures changed");
}

if (stage !== "protocol" && validatedManifest != null) {
  validateStageArtifacts(stage, validatedManifest, failures);
}
if (stage === "final" && validatedManifest != null) {
  for (const planNumber of [2, 3, 4, 5]) {
    validateCorrectionArtifacts(planNumber, validatedManifest, true, failures);
  }
  if (validatedManifest.goNoGoStatus.length === 0) {
    failures.push("final goNoGoStatus is required");
  }
}

const status = failures.length === 0 ? "passed" : "failed";
const output = {
  status,
  stage,
  issue,
  allowPartial,
  protocolPaths,
  manifestPath: "docs/verification/source-plan-correction-manifest.json",
  manifestValidated: validatedManifest != null && failures.every((failure) => !failure.includes("manifest failed")),
  defaultFixtureMutationStatus: defaultFixtureStatus,
  failures,
  evidenceDir: `docs/verification/issues/issue-${issue}`
};

writeIssueEvidence(issue, output);

if (status !== "passed") {
  fail(JSON.stringify(output, null, 2));
}

console.log(JSON.stringify(output, null, 2));

function validateStageArtifacts(stageName, manifestValue, failureList) {
  const match = stageName.match(/^plan-(\d)-(correction|audit)$/);
  if (match == null) {
    return;
  }
  const planNumber = Number(match[1]);
  validateCorrectionArtifacts(planNumber, manifestValue, match[2] === "audit", failureList);
}

function validateCorrectionArtifacts(planNumber, manifestValue, requireAudit, failureList) {
  const entry = manifestValue.planCorrections.find((candidate) => candidate.planId === `plan-${planNumber}`);
  if (entry == null) {
    failureList.push(`manifest missing plan-${planNumber}`);
    return;
  }
  for (const path of [entry.correctedSavedCopyPath, entry.correctionNotesPath, entry.visualEvidencePath]) {
    requireFile(path, failureList);
  }
  const copy = readJson(entry.correctedSavedCopyPath, failureList);
  if (copy != null) {
    try {
      const validatedCopy = validateSourceCorrectedSavedCopy(copy);
      if (validatedCopy.sourceDefaultPlanId !== entry.sourceDefaultPlanId) {
        failureList.push(`plan-${planNumber} sourceDefaultPlanId mismatch`);
      }
      if (validatedCopy.correctionMetadata.exactParityClaimMade !== false) {
        failureList.push(`plan-${planNumber} exact parity claim must be false`);
      }
      if (validatedCopy.correctionMetadata.renderedVisualEvidencePath !== entry.visualEvidencePath) {
        failureList.push(`plan-${planNumber} visual evidence path mismatch`);
      }
    } catch (error) {
      failureList.push(`plan-${planNumber} corrected saved copy failed validation: ${error.message}`);
    }
  }
  if (entry.promotionStatus === "promoted") {
    failureList.push(`plan-${planNumber} must not be promoted`);
  }
  if (requireAudit) {
    requireFile(entry.correctionAuditPath, failureList);
    const audit = readJson(entry.correctionAuditPath, failureList);
    if (audit != null) {
      try {
        const validatedAudit = validateSourceCorrectionAudit(audit);
        if (validatedAudit.correctedSavedCopyPath !== entry.correctedSavedCopyPath) {
          failureList.push(`plan-${planNumber} audit correctedSavedCopyPath mismatch`);
        }
        if (validatedAudit.visualEvidencePath !== entry.visualEvidencePath) {
          failureList.push(`plan-${planNumber} audit visualEvidencePath mismatch`);
        }
      } catch (error) {
        failureList.push(`plan-${planNumber} correction audit failed validation: ${error.message}`);
      }
    }
  }
}

function defaultFixtureNonmutationStatus() {
  const hashMismatches = [];
  for (const [path, expectedSha256] of Object.entries(defaultHashes)) {
    if (!existsSync(abs(path))) {
      hashMismatches.push({ path, expectedSha256, actualSha256: null });
      continue;
    }
    const actualSha256 = createHash("sha256").update(readFileSync(abs(path))).digest("hex");
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
  writeJson(join(issueDir, "source-plan-correction-gate-output.json"), output);
  writeJson(join(issueDir, "test-output/source-plan-correction-gate.txt"), output);
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function requireFile(path, failureList) {
  const absolutePath = abs(path);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    failureList.push(`missing required file: ${path}`);
    return;
  }
  if (statSync(absolutePath).size === 0) {
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

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function abs(path) {
  return join(repoRoot, path);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
