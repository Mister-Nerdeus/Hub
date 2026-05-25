import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const issueArgIndex = process.argv.indexOf("--issue");
const issue = issueArgIndex >= 0 ? String(process.argv[issueArgIndex + 1]).padStart(3, "0") : "unscoped";
const issueDir = join(repoRoot, "docs", "verification", "issues", `issue-${issue}`);
mkdirSync(issueDir, { recursive: true });

const requiredNonClaims = [
  "Synthetic operational modeling only.",
  "Not a clinical safety score.",
  "Not a staffing compliance recommendation.",
  "Not a legal compliance assessment.",
  "Not a patient outcome prediction.",
  "Not based on real patient, staff, EHR, or hospital data."
];

const prohibitedClaimPatterns = [
  /\bsafe staffing\b/iu,
  /\bunsafe staffing\b/iu,
  /\bstaffing compliant\b/iu,
  /\bclinically safe\b/iu,
  /\bclinically unsafe\b/iu,
  /\bpatient harm prediction\b/iu,
  /\bpatient outcome prediction\b/iu,
  /\blegal compliance\b/iu,
  /\brequired nurse ratio\b/iu,
  /\bcertified staffing recommendation\b/iu
];

const prohibitedDataFieldDefinitions = [
  { label: "patient name camel-case field", pieces: ["patient", "Name"] },
  { label: "medical record abbreviation field", pieces: ["m", "r", "n"] },
  { label: "birth date camel-case field", pieces: ["date", "Of", "Birth"] },
  { label: "diagnosis text camel-case field", pieces: ["diagnosis", "Text"] },
  { label: "medication name camel-case field", pieces: ["medication", "Name"] },
  { label: "clinical order text camel-case field", pieces: ["clinical", "Order", "Text"] },
  { label: "employee identifier camel-case field", pieces: ["employee", "Id"] },
  { label: "badge number camel-case field", pieces: ["badge", "Number"] },
  { label: "hospital name camel-case field", pieces: ["hospital", "Name"] },
  { label: "EHR identifier camel-case field", pieces: ["ehr", "Id"] }
].map((entry) => ({
  ...entry,
  token: entry.pieces.join(""),
  pattern: new RegExp(`\\b${escapeRegExp(entry.pieces.join(""))}\\b`, "u")
}));

const scannedExtensions = new Set([".json", ".md", ".mjs", ".ts", ".tsx", ".txt"]);
const allowedGuardFragments = [
  "scripts/check-plan-1-demo-no-claims.mjs",
  "packages/shared/src/no-phi/",
  "packages/shared/src/contracts.ts",
  "packages/shared/src/export/exportBundleIntegrity.ts",
  "packages/shared/src/outcomes/operationalMetricContract.ts",
  "packages/shared/src/simulation/plan1DemoProofBundle.ts",
  "packages/shared/src/simulation/plan1TimelineNarratives.ts",
  "packages/shared/src/simulation/plan1ScenarioNarratives.ts",
  ".test.",
  "docs/verification/issues/issue-278/no-claims-audit-output.json",
  "docs/verification/issues/issue-278/no-phi-demo-audit-output.json",
  "docs/verification/issues/issue-278/required-non-claims-present-output.json",
  "prohibited-claim-negative-output.json",
  "prohibited-data-field-negative-output.json",
  "fixtures/invalid/"
];

const manifest = readJsonIfExists("docs/verification/plan-1-demo-readiness-manifest.json");
const manifestEvidencePaths = Array.isArray(manifest?.requiredEvidenceArtifacts)
  ? manifest.requiredEvidenceArtifacts
  : [];
const scanRoots = [
  "packages/shared/src",
  "packages/shared/fixtures/demo/plan-1",
  "packages/shared/fixtures/scenarios/plan-1",
  "apps/web/src/features/demo",
  "apps/web/src/features/scenarios",
  "docs/project"
];

const filesToScan = new Set();
for (const root of scanRoots) {
  collectFiles(join(repoRoot, root), filesToScan);
}
for (const evidencePath of manifestEvidencePaths) {
  const absolutePath = join(repoRoot, evidencePath);
  if (existsSync(absolutePath) && statSync(absolutePath).isFile() && scannedExtensions.has(extname(absolutePath))) {
    filesToScan.add(absolutePath);
  }
}

const claimFindings = [];
const dataFieldFindings = [];
const scannedFiles = [...filesToScan].sort();
const scannedText = [];

for (const filePath of scannedFiles) {
  const normalizedPath = normalizeRelative(filePath);
  if (allowedGuardFragments.some((fragment) => normalizedPath.includes(fragment))) {
    continue;
  }
  const content = readFileSync(filePath, "utf8");
  scannedText.push(content);
  content.split(/\r?\n/).forEach((line, index) => {
    if (!isAllowedNonClaimLine(line)) {
      for (const pattern of prohibitedClaimPatterns) {
        if (pattern.test(line)) {
          claimFindings.push({
            path: normalizedPath,
            line: index + 1,
            pattern: String(pattern),
            text: line.trim()
          });
        }
      }
    }
    for (const definition of prohibitedDataFieldDefinitions) {
      if (definition.pattern.test(line)) {
        dataFieldFindings.push({
          path: normalizedPath,
          line: index + 1,
          fieldLabel: definition.label,
          text: line.trim()
        });
      }
    }
  });
}

const combinedText = scannedText.join("\n");
const nonClaimCoverage = requiredNonClaims.map((nonClaim) => ({
  nonClaim,
  present: combinedText.includes(nonClaim)
}));
const negativeClaimProof = runNegativeClaimProof();
const negativeDataFieldProof = runNegativeDataFieldProof();
const status = claimFindings.length === 0 && dataFieldFindings.length === 0 && nonClaimCoverage.every((entry) => entry.present)
  ? "passed"
  : "failed";

writeJson(join(issueDir, "no-claims-audit-output.json"), {
  issue,
  status: claimFindings.length === 0 ? "passed" : "failed",
  scannedFileCount: scannedFiles.length,
  findingCount: claimFindings.length,
  findings: claimFindings,
  prohibitedClaimPatterns: prohibitedClaimPatterns.map(String)
});
writeJson(join(issueDir, "no-phi-demo-audit-output.json"), {
  issue,
  status: dataFieldFindings.length === 0 ? "passed" : "failed",
  scannedFileCount: scannedFiles.length,
  findingCount: dataFieldFindings.length,
  findings: dataFieldFindings,
  prohibitedDataFieldLabels: prohibitedDataFieldDefinitions.map((definition) => definition.label)
});
writeJson(join(issueDir, "prohibited-claim-negative-output.json"), negativeClaimProof);
writeJson(join(issueDir, "prohibited-data-field-negative-output.json"), negativeDataFieldProof);
writeJson(join(issueDir, "required-non-claims-present-output.json"), {
  issue,
  status: nonClaimCoverage.every((entry) => entry.present) ? "passed" : "failed",
  requiredNonClaims,
  coverage: nonClaimCoverage
});

const output = {
  issue,
  status,
  scannedFileCount: scannedFiles.length,
  claimFindingCount: claimFindings.length,
  dataFieldFindingCount: dataFieldFindings.length,
  requiredNonClaimsPresent: nonClaimCoverage.every((entry) => entry.present),
  negativeClaimProof,
  negativeDataFieldProof
};
console.log(JSON.stringify(output, null, 2));
if (status === "failed") {
  process.exitCode = 1;
}

function collectFiles(path, files) {
  if (!existsSync(path)) {
    return;
  }
  const stats = statSync(path);
  if (stats.isDirectory()) {
    const basename = path.split(/[\\/]/).at(-1);
    if (basename === "dist" || basename === "node_modules" || basename === ".git") {
      return;
    }
    for (const entry of readdirSync(path)) {
      collectFiles(join(path, entry), files);
    }
    return;
  }
  if (stats.isFile() && scannedExtensions.has(extname(path))) {
    files.add(path);
  }
}

function isAllowedNonClaimLine(line) {
  return requiredNonClaims.some((nonClaim) => line.includes(nonClaim)) ||
    line.includes("It is not a patient outcome prediction.") ||
    line.includes("No patient outcome prediction.") ||
    line.includes("no clinical safety claim") ||
    line.includes("no staffing compliance claim") ||
    line.includes("no legal compliance claim") ||
    line.includes("does not add API endpoints") ||
    line.includes("is not clinical safety, staffing compliance, legal compliance, care quality, or patient outcome evidence") ||
    line.includes("or patient outcome prediction.");
}

function runNegativeClaimProof() {
  const rejectedExamples = [
    "safe staffing",
    "unsafe staffing",
    "staffing compliant",
    "clinically safe",
    "clinically unsafe",
    "patient harm prediction",
    "required nurse ratio",
    "certified staffing recommendation"
  ].map((example) => ({
    example,
    rejected: prohibitedClaimPatterns.some((pattern) => pattern.test(example))
  }));
  return {
    issue,
    status: rejectedExamples.every((entry) => entry.rejected) ? "passed" : "failed",
    rejectedExamples
  };
}

function runNegativeDataFieldProof() {
  const rejectedExamples = prohibitedDataFieldDefinitions.map((definition) => ({
    exampleLabel: definition.label,
    rejected: definition.pattern.test(definition.token)
  }));
  return {
    issue,
    status: rejectedExamples.every((entry) => entry.rejected) ? "passed" : "failed",
    rejectedExamples
  };
}

function normalizeRelative(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

function readJsonIfExists(path) {
  const absolutePath = join(repoRoot, path);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    return null;
  }
  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
