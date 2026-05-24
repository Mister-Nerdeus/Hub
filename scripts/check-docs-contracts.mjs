import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join, normalize } from "node:path";

import { checkCommandOutputMap } from "./check-command-output-map.mjs";
import { checkEvidenceIndexOutputConsistency } from "./check-evidence-index-output-consistency.mjs";
import { checkIssueCommandOutput } from "./check-issue-command-output.mjs";
import { checkIssueEvidenceIndex } from "./check-issue-evidence-index.mjs";
import { requiredEvidenceGates } from "./phase-evidence-gates.mjs";

const root = process.cwd();
const HARDENED_EVIDENCE_REQUIRED_FROM_ISSUE = 187;

const requiredFiles = [
  "AGENTS.md",
  "docs/contracts/codex-global-invariants.md",
  "docs/compliance/non-phi-policy.md",
  "docs/architecture/dependency-decision-matrix.md",
  "docs/contracts/reproducibility-contract.md",
  "docs/contracts/issue-evidence-output-contract.md",
  "docs/contracts/command-output-map-contract.md",
  "docs/codex/drift-traps.md",
  "docs/codex/codex-operating-rules.md",
  "docs/codex/forbidden-implementation-patterns.md",
  "docs/codex/codex-issue-template-v2.md",
  "docs/contracts/environment-contract.md",
  "docs/project/project-charter.md",
  "docs/architecture/monorepo-structure.md"
];

const requiredTemplateFields = [
  "Depends On",
  "Non-Goals",
  "Commands Codex Must Run",
  "Required Evidence",
  "Closeout Response Format",
  "Do Not Close Unless"
];

const strictCloseoutConcepts = [
  ["Summary", /\bsummary\b/i],
  ["Files Changed", /\bfiles\s+changed\b/i],
  ["Commands Run", /\bcommands\s+run\b/i],
  ["Tests Passed", /\btests\s+passed(?:\/failed)?\b|\btests\s+passed\s+failed\b/i],
  ["Evidence", /\bevidence\b/i],
  ["Known Limitations", /\bknown\s+limitations\b/i],
  ["Non-PHI Confirmation", /\bnon-phi\s+confirmation\b/i],
  ["Next Recommended Issue", /\bnext\s+recommended\s+issue\b/i]
];

const failures = [];

if (process.argv.includes("--self-test")) {
  const output = runHardenedEvidenceSelfTests();
  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

for (const file of requiredFiles) {
  requireExistingFile(file, `Missing required doc: ${file}`);
}

const agentsPath = join(root, "AGENTS.md");
if (existsSync(agentsPath)) {
  const agents = readFileSync(agentsPath, "utf8");
  const linkPattern = /\]\(([^)]+)\)/g;
  for (const match of agents.matchAll(linkPattern)) {
    const target = normalize(join(root, match[1]));
    if (!existsSync(target)) {
      failures.push(`Broken AGENTS.md link: ${match[1]}`);
    }
  }
}

const templatePath = join(root, "docs/codex/codex-issue-template-v2.md");
if (existsSync(templatePath)) {
  const template = readFileSync(templatePath, "utf8");
  for (const field of requiredTemplateFields) {
    if (!template.includes(field)) {
      failures.push(`Issue template missing field: ${field}`);
    }
  }
}

const closeoutRoot = join(root, "docs/verification/issues");
for (const issueName of readdirSync(closeoutRoot)) {
  const issuePath = join(closeoutRoot, issueName);
  if (!statSync(issuePath).isDirectory() || !/^issue-/.test(issueName)) {
    continue;
  }

  const issueNumber = Number(issueName.match(/^issue-(\d+)/)?.[1]);
  if (!Number.isFinite(issueNumber) || issueNumber < 15) {
    const closeoutPath = join(issuePath, "closeout.md");
    if (!existsSync(closeoutPath)) {
      failures.push(`Missing closeout artifact: ${closeoutPath}`);
    }
    continue;
  }

  requireIssueEvidence(issueName, issuePath);
}

for (const gate of requiredEvidenceGates) {
  for (const evidencePath of gate.paths) {
    requireExistingFile(evidencePath, `Missing ${gate.label}: ${evidencePath}`);
  }
  for (const contentCheck of gate.contentChecks ?? []) {
    requireContentChecks(gate.label, contentCheck.path, contentCheck.checks);
  }
}

failures.push(...checkIssueCommandOutput(root));
failures.push(...checkIssueEvidenceIndex(root));
failures.push(...checkCommandOutputMap(root));
failures.push(...checkEvidenceIndexOutputConsistency(root));
failures.push(...checkHardenedIssueEvidence(root));

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Docs and contract guardrails pass.");

function requireIssueEvidence(issueName, issuePath) {
  const closeoutPath = join(issuePath, "closeout.md");
  const commandsPath = join(issuePath, "commands.txt");

  if (!existsSync(closeoutPath)) {
    failures.push(`Missing closeout artifact: ${closeoutPath}`);
  }
  if (!existsSync(commandsPath)) {
    failures.push(`Missing commands artifact: ${commandsPath}`);
  }
  if (!existsSync(closeoutPath)) {
    return;
  }

  const closeout = readFileSync(closeoutPath, "utf8");
  for (const [concept, pattern] of strictCloseoutConcepts) {
    if (!pattern.test(closeout)) {
      failures.push(`${issueName}/closeout.md missing closeout concept: ${concept}`);
    }
  }
}

function requireExistingFile(path, message) {
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    failures.push(message);
    return;
  }
  if (statSync(absolutePath).size === 0) {
    failures.push(`Required evidence is empty: ${path}`);
  }
}

function requireContentChecks(label, path, checks) {
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    return;
  }

  const content = readFileSync(absolutePath, "utf8");
  for (const [name, pattern] of checks) {
    if (!pattern.test(content)) {
      failures.push(`${label} content missing ${name}: ${path}`);
    }
  }
}

function checkHardenedIssueEvidence(rootPath = process.cwd()) {
  const failures = [];
  const issuesRoot = join(rootPath, "docs", "verification", "issues");
  if (!existsSync(issuesRoot) || !statSync(issuesRoot).isDirectory()) {
    return [`Missing issue evidence root: ${issuesRoot}`];
  }
  const indexedIssues = readIndexedIssues(rootPath, failures);
  const requiredRootFiles = ["closeout.md", "commands.txt", "command-output-map.json"];

  for (const issueName of readdirSync(issuesRoot).sort()) {
    const issuePath = join(issuesRoot, issueName);
    if (!statSync(issuePath).isDirectory()) {
      continue;
    }
    const issueNumber = Number(issueName.match(/^issue-(\d{3})$/)?.[1]);
    if (
      !Number.isFinite(issueNumber) ||
      issueNumber < HARDENED_EVIDENCE_REQUIRED_FROM_ISSUE
    ) {
      continue;
    }
    const issue = String(issueNumber).padStart(3, "0");
    if (!indexedIssues.has(issue)) {
      failures.push(`Issue ${issue} is missing from docs/verification/ISSUE_EVIDENCE_INDEX.json`);
    }
    for (const fileName of requiredRootFiles) {
      const evidencePath = `docs/verification/issues/issue-${issue}/${fileName}`;
      const absolutePath = join(rootPath, evidencePath);
      if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
        failures.push(`Issue ${issue} missing required evidence artifact: ${evidencePath}`);
        continue;
      }
      if (statSync(absolutePath).size === 0) {
        failures.push(`Issue ${issue} required evidence artifact is empty: ${evidencePath}`);
      }
    }
  }
  return failures;
}

function readIndexedIssues(rootPath, failures) {
  const indexedIssues = new Set();
  const absoluteIndexPath = join(rootPath, "docs", "verification", "ISSUE_EVIDENCE_INDEX.json");
  if (!existsSync(absoluteIndexPath) || !statSync(absoluteIndexPath).isFile()) {
    failures.push("Missing issue evidence index: docs/verification/ISSUE_EVIDENCE_INDEX.json");
    return indexedIssues;
  }
  let index;
  try {
    index = JSON.parse(readFileSync(absoluteIndexPath, "utf8"));
  } catch (error) {
    failures.push(`Issue evidence index is not valid JSON: ${error.message}`);
    return indexedIssues;
  }
  for (const entry of Array.isArray(index.issues) ? index.issues : []) {
    if (typeof entry?.issue === "string") {
      indexedIssues.add(entry.issue);
    }
  }
  return indexedIssues;
}

function runHardenedEvidenceSelfTests() {
  const tempRoot = mkdtempSync(join(tmpdir(), "hardened-evidence-gate-"));
  const cases = [];
  try {
    cases.push(runHardenedCase(tempRoot, "missing closeout", { closeout: false }, /closeout\.md/));
    cases.push(runHardenedCase(tempRoot, "missing commands", { commands: false }, /commands\.txt/));
    cases.push(
      runHardenedCase(tempRoot, "missing command-output-map", { map: false }, /command-output-map\.json/)
    );
    cases.push(runHardenedCase(tempRoot, "missing index entry", { indexed: false }, /missing from/));
    cases.push(
      runHardenedCase(
        tempRoot,
        "empty command-output-map",
        { mapContent: "" },
        /command-output-map\.json/
      )
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
  return {
    issue: "195",
    gate: "hardened issue evidence",
    firstHardenedIssue: HARDENED_EVIDENCE_REQUIRED_FROM_ISSUE,
    cases,
    testsPassed: true
  };
}

function runHardenedCase(tempRoot, label, options, expectedPattern) {
  rmSync(join(tempRoot, "docs"), { recursive: true, force: true });
  createHardenedIssue(tempRoot, options);
  const failures = checkHardenedIssueEvidence(tempRoot);
  if (!failures.some((failure) => expectedPattern.test(failure))) {
    throw new Error(`${label}: expected ${expectedPattern}, got ${failures.join("; ")}`);
  }
  return {
    label,
    passed: true,
    failure: failures.find((failure) => expectedPattern.test(failure))
  };
}

function createHardenedIssue(tempRoot, options) {
  const issuePath = join(tempRoot, "docs", "verification", "issues", "issue-187");
  mkdirSync(issuePath, { recursive: true });
  if (options.closeout !== false) {
    writeFileSync(join(issuePath, "closeout.md"), "Summary\n");
  }
  if (options.commands !== false) {
    writeFileSync(join(issuePath, "commands.txt"), "command\n");
  }
  if (options.map !== false) {
    writeFileSync(join(issuePath, "command-output-map.json"), options.mapContent ?? "{}\n");
  }
  mkdirSync(join(tempRoot, "docs", "verification"), { recursive: true });
  writeFileSync(
    join(tempRoot, "docs", "verification", "ISSUE_EVIDENCE_INDEX.json"),
    `${JSON.stringify(
      {
        issues:
          options.indexed === false
            ? []
            : [
                {
                  issue: "187",
                  title: "Hardened Issue",
                  requiredEvidence: []
                }
              ]
      },
      null,
      2
    )}\n`
  );
}
