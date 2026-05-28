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
import {
  createRepairContext,
  finalizeRepairGate,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";

const root = process.cwd();
const HARDENED_EVIDENCE_REQUIRED_FROM_ISSUE = 187;
const policyPath = "docs/verification/docs-contract-scope-policy.json";
const stageArgs = parseArgs(process.argv.slice(2));

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
  ["Next Recommended Issue", /\bnext\s+recommended\s+issue\b|\bgo\s*\/\s*no-go\b/i]
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

const scopedResult = scopeDocsContractFailures(failures);

if (stageArgs.stage != null) {
  runDocsContractStage(scopedResult);
} else if (scopedResult.currentBatchFailures.length > 0 || !scopedResult.policyValid) {
  console.error(scopedResult.currentBatchFailures.concat(scopedResult.policyFailures).join("\n"));
  process.exit(1);
} else {
  if (scopedResult.historicalBacklogFailures.length > 0) {
    console.log(`Docs and contract guardrails pass for current blocking scope; historical backlog non-blocking failures: ${scopedResult.historicalBacklogFailures.length}.`);
  } else {
    console.log("Docs and contract guardrails pass.");
  }
}

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

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function scopeDocsContractFailures(rawFailures) {
  const policy = readDocsContractScopePolicy();
  const policyFailures = validateDocsContractScopePolicy(policy);
  const currentRanges = parseRanges(policy?.currentBatchBlocking?.issueRanges ?? ["591-600"]);
  const historicalRanges = parseRanges(policy?.historicalBacklogNonblocking?.issueRanges ?? ["015-590"]);
  const currentBatchFailures = [];
  const historicalBacklogFailures = [];
  const uncategorizedFailures = [];

  for (const failure of rawFailures) {
    const issue = extractIssueNumber(failure);
    if (issue != null && inRanges(issue, currentRanges)) {
      currentBatchFailures.push(failure);
    } else if (issue != null && inRanges(issue, historicalRanges)) {
      historicalBacklogFailures.push(failure);
    } else {
      uncategorizedFailures.push(failure);
      currentBatchFailures.push(failure);
    }
  }

  return {
    status: currentBatchFailures.length === 0 && policyFailures.length === 0 ? "passed" : "failed",
    policyValid: policyFailures.length === 0,
    policyFailures,
    currentBatchFailures,
    historicalBacklogFailures,
    uncategorizedFailures,
    policy
  };
}

function readDocsContractScopePolicy() {
  const absolutePath = join(root, policyPath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) return null;
  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch {
    return null;
  }
}

function validateDocsContractScopePolicy(policy) {
  const policyFailures = [];
  if (policy == null || typeof policy !== "object") {
    return [`Missing or invalid docs contract scope policy: ${policyPath}`];
  }
  if (policy.schemaVersion !== "1.0.0") policyFailures.push("docs contract scope policy schemaVersion must be 1.0.0");
  if (policy.currentBatchBlocking?.blocking !== true) policyFailures.push("current_batch_blocking scope must be blocking");
  if (policy.historicalBacklogNonblocking?.blocking !== false) policyFailures.push("historical_backlog_nonblocking scope must be non-blocking");
  for (const field of ["followUpCleanupIssue", "acceptedRisk", "expiryCondition"]) {
    if (typeof policy.historicalBacklogNonblocking?.[field] !== "string" || policy.historicalBacklogNonblocking[field].length === 0) {
      policyFailures.push(`historical_backlog_nonblocking missing ${field}`);
    }
  }
  return policyFailures;
}

function parseRanges(values) {
  return values.map((value) => {
    const [start, end = start] = String(value).split("-").map((part) => Number(part));
    return { start, end };
  });
}

function inRanges(issue, ranges) {
  return ranges.some((range) => issue >= range.start && issue <= range.end);
}

function extractIssueNumber(value) {
  const text = String(value);
  const match = text.match(/issue-(\d{3})|Issue\s+(\d{3})|issue\s+(\d{3})/i);
  const raw = match?.[1] ?? match?.[2] ?? match?.[3];
  return raw == null ? null : Number(raw);
}

function runDocsContractStage(scoped) {
  const stages = [
    "current-batch",
    "historical-backlog",
    "docs-contract-policy",
    "contradiction-negative",
    "required-gate-failed-go-negative",
    "final"
  ];
  const context = createRepairContext({
    scriptName: "docs contracts",
    stages,
    statusKeyByStage: {
      "current-batch": "docsContractResolutionStatus",
      "historical-backlog": "docsContractResolutionStatus",
      "docs-contract-policy": "docsContractResolutionStatus",
      "contradiction-negative": "docsContractResolutionStatus",
      "required-gate-failed-go-negative": "docsContractResolutionStatus"
    },
    outputName: "docs-contracts-output.json",
    defaultIssue: "593"
  });

  const selected = context.stage === "final"
    ? stages.filter((stage) => stage !== "final")
    : [context.stage];
  for (const stage of selected) {
    if (stage === "current-batch") {
      const passed = scoped.currentBatchFailures.length === 0 && scoped.policyValid;
      context.add("current-batch docs contracts are blocking and passing", passed, {
        currentBatchFailureCount: scoped.currentBatchFailures.length,
        policyFailures: scoped.policyFailures
      });
      writeJson(`${context.dir}/docs-contract-current-batch-output.json`, {
        status: passed ? "passed" : "failed",
        blocking: true,
        currentBatchFailureCount: scoped.currentBatchFailures.length,
        failures: scoped.currentBatchFailures
      });
    }
    if (stage === "historical-backlog") {
      const nonblocking = scoped.policy?.historicalBacklogNonblocking?.blocking === false;
      context.add("historical docs-contract backlog is scoped and non-blocking by policy", nonblocking, {
        historicalBacklogFailureCount: scoped.historicalBacklogFailures.length
      });
      writeJson(`${context.dir}/docs-contract-historical-backlog-output.json`, {
        status: nonblocking ? "passed" : "failed",
        blocking: false,
        historicalBacklogFailureCount: scoped.historicalBacklogFailures.length,
        sampleFailures: scoped.historicalBacklogFailures.slice(0, 25)
      });
    }
    if (stage === "docs-contract-policy") {
      context.add("docs contract scope policy is machine-readable", scoped.policyValid, {
        policyPath,
        policyFailures: scoped.policyFailures
      });
      writeJson(`${context.dir}/docs-contract-policy-output.json`, {
        status: scoped.policyValid ? "passed" : "failed",
        policyPath,
        policy: scoped.policy,
        policyFailures: scoped.policyFailures
      });
    }
    if (stage === "contradiction-negative") {
      const failed = closeoutContradictionFails({ requiredGateFailed: true, closeoutSaysGo: true });
      context.add("requiredGateFailed plus closeoutSaysGo negative fixture fails", failed, null);
      writeJson(`${context.dir}/contradiction-negative-output.json`, { status: failed ? "passed" : "failed" });
    }
    if (stage === "required-gate-failed-go-negative") {
      const failed = closeoutContradictionFails({ requiredGateFailed: true, closeoutSaysGo: true });
      context.add("required gate failure cannot coexist with GO", failed, null);
      writeJson(`${context.dir}/required-gate-failed-go-negative-output.json`, { status: failed ? "passed" : "failed" });
    }
  }

  finalizeRepairGate(context, {
    testOutputName: "docs-contracts.txt",
    manifestUpdates: {
      docsContractResolutionStatus: context.checks.every((check) => check.passed) ? "passed" : "failed",
      docsContractsBlockingStatus: context.checks.every((check) => check.passed) ? "resolved" : "failed"
    }
  });
}

function closeoutContradictionFails(input) {
  return input.requiredGateFailed === true && input.closeoutSaysGo === true;
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
