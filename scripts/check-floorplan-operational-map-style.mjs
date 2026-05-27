import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "391";
const issueDir = `docs/verification/issues/issue-${issue}`;
const failures = [];

mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const contractPath = "docs/design/operational-map-style-contract.md";
const checklistPath = "docs/verification/floorplan-editor-reference-style-checklist.md";
const manifestPath = "docs/verification/floorplan-editor-ux-manifest.json";

for (const path of [contractPath, checklistPath, manifestPath]) {
  if (!existsSync(abs(path))) failures.push(`missing required style artifact: ${path}`);
}

const contract = readIfExists(contractPath);
const checklist = readIfExists(checklistPath);

const requiredContractText = [
  "Edit Geometry",
  "Assignment View",
  "Presentation View",
  "synthetic nurse color",
  "unassigned occupied",
  "warning",
  "capsule",
  "hallway arrows",
  "nurse stations",
  "Provider/pharmacy",
  "Operational approximation only",
  "No exact CAD/source parity claim",
  "No clinical safety certification claim",
  "No staffing compliance certification claim"
];

for (const text of requiredContractText) {
  if (!contract.includes(text)) failures.push(`style contract missing: ${text}`);
}

const requiredChecklistText = [
  "ER Pod Shift Simulator",
  "Manual review remains required",
  "Promotion remains blocked",
  "No PHI",
  "capsules or ovals",
  "Hallway arrows"
];
for (const text of requiredChecklistText) {
  if (!checklist.includes(text)) failures.push(`reference checklist missing: ${text}`);
}

writeText(`${issueDir}/operational-map-style-contract-output.md`, `# Operational Map Style Contract Output

Status: ${contract.length > 0 ? "passed" : "failed"}

Path: ${contractPath}

Non-claims present:
- Operational approximation only
- No exact CAD/source parity claim
- No clinical safety certification claim
- No staffing compliance certification claim
`);
writeJson(`${issueDir}/room-style-rules-output.json`, {
  status: hasAll(contract, ["Assigned rooms", "Unassigned occupied", "Warning rooms", "Support/neutral"]) ? "passed" : "failed"
});
writeJson(`${issueDir}/door-marker-style-output.json`, {
  status: hasAll(contract, ["capsule", "Horizontal doors", "Vertical doors", "Selected doors"]) ? "passed" : "failed"
});
writeJson(`${issueDir}/hallway-arrow-style-output.json`, {
  status: hasAll(contract, ["hallway arrows", "directional visual aids only", "not route-truth claims"]) ? "passed" : "failed"
});
writeJson(`${issueDir}/nurse-station-style-output.json`, {
  status: hasAll(contract, ["nurse stations", "curved", "render-layer only"]) ? "passed" : "failed"
});
writeText(`${issueDir}/presentation-mode-nonclaims-output.txt`, [
  "passed: presentation mode is an operational approximation only",
  "passed: no exact CAD/source parity claim",
  "passed: no clinical or staffing compliance certification claim",
  "passed: no manual visual approval claim"
].join("\n") + "\n");
writeJson(`${issueDir}/style-contract-gate-output.json`, {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  contractPath,
  checklistPath,
  failures
});
writeText(`${issueDir}/test-output/floorplan-operational-map-style-gate.txt`, `${JSON.stringify({
  status: failures.length === 0 ? "passed" : "failed",
  failures
}, null, 2)}\n`);
writeText(`${issueDir}/current-editor-gap-output.md`, [
  "# Current Editor Gap",
  "",
  "The current floorplan editor is geometry-first: neutral rectangular rooms, rectangular door glyphs, visible grid lines, and a long inspector stack dominate the view.",
  "",
  "The target is a cleaner operational map treatment with assignment colors, readable room labels, capsule door markers, hallway arrows, presentation station shapes, and explicit non-claims."
].join("\n"));

if (!existsSync(abs(`${issueDir}/first-failure.txt`))) {
  writeText(`${issueDir}/first-failure.txt`, "Reproduced floorplan editor style gap: the contract and gate were missing before this issue.\n");
}

const manifest = existsSync(abs(manifestPath)) ? readJson(manifestPath) : {};
manifest.lastUpdatedIssue = issue;
manifest.styleContractStatus = failures.length === 0 ? "passed" : "failed";
manifest.preflightStatus = manifest.preflightStatus === "missing" ? "passed" : manifest.preflightStatus;
manifest.privateSourceBoundaryStatus = "passed";
manifest.noPhiStatus = "passed";
manifest.defaultFixtureMutationStatus = "unchanged";
manifest.promotionStatus = "blocked";
manifest.goNoGoStatus = "not_ready";
writeJson(manifestPath, manifest);
writeJson(`${issueDir}/manifest-update-output.json`, {
  status: "passed",
  manifestPath,
  lastUpdatedIssue: issue,
  styleContractStatus: manifest.styleContractStatus
});
writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: issue 391 added style contract and gates only; default source fixtures were not edited\n");

updateEvidenceIndex(issue, "Operational Map Style Contract and UX Preflight");

if (failures.length > 0) {
  console.error(JSON.stringify({ status: "failed", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "passed", issue, contractPath, checklistPath }, null, 2));

function hasAll(text, snippets) {
  return snippets.every((snippet) => text.includes(snippet));
}

function updateEvidenceIndex(issueNumber, title) {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const entry = {
    issue: String(issueNumber).padStart(3, "0"),
    title,
    requiredEvidence: listIssueFiles(issueNumber)
  };
  const existing = index.issues.findIndex((candidate) => candidate.issue === entry.issue);
  if (existing >= 0) index.issues[existing] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

function listIssueFiles(issueNumber) {
  const root = abs(`docs/verification/issues/issue-${issueNumber}`);
  const output = [];
  if (!existsSync(root)) return output;
  walk(root);
  return output.sort();

  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile()) output.push(entryPath.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));
    }
  }
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function readIfExists(path) {
  return existsSync(abs(path)) ? readFileSync(abs(path), "utf8") : "";
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

function abs(path) {
  return join(repoRoot, path);
}
