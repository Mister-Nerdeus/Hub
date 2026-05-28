#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRepairContext,
  finalizeRepairGate,
  runSelectedRepairStages,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";

const FIRST_INDEXED_ISSUE = 82;
const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";

export function checkIssueEvidenceIndex(root = process.cwd(), options = {}) {
  const failures = [];
  const absoluteIndexPath = join(root, indexPath);
  if (!existsSync(absoluteIndexPath) || !statSync(absoluteIndexPath).isFile()) {
    return [`Missing issue evidence index: ${indexPath}`];
  }
  if (statSync(absoluteIndexPath).size === 0) {
    return [`Issue evidence index is empty: ${indexPath}`];
  }

  let index;
  try {
    index = JSON.parse(readFileSync(absoluteIndexPath, "utf8"));
  } catch (error) {
    return [`Issue evidence index is not valid JSON: ${error.message}`];
  }

  if (index == null || typeof index !== "object" || !Array.isArray(index.issues)) {
    return ["Issue evidence index must contain an issues array"];
  }
  if (options.requireSchemaVersion && typeof index.schemaVersion !== "string") {
    failures.push("Issue evidence index schemaVersion is required");
  }
  if (options.requireLastRebuiltIssue && typeof index.lastRebuiltIssue !== "string") {
    failures.push("Issue evidence index lastRebuiltIssue is required");
  }

  const seenIssues = new Set();
  let previousIssueNumber = 0;
  for (const entry of index.issues) {
    if (entry == null || typeof entry !== "object") {
      failures.push("Issue evidence index entries must be objects");
      continue;
    }
    const issue = String(entry.issue ?? "");
    const issueNumber = Number(issue);
    if (!/^\d{3}$/.test(issue) || !Number.isFinite(issueNumber)) {
      failures.push(`Invalid issue evidence index issue: ${issue}`);
      continue;
    }
    if (seenIssues.has(issue)) failures.push(`Issue ${issue} has duplicate evidence index entries`);
    seenIssues.add(issue);
    if (issueNumber < previousIssueNumber) failures.push(`Issue evidence index must be sorted by issue number: ${issue}`);
    previousIssueNumber = issueNumber;

    if (typeof entry.title !== "string" || entry.title.length === 0) {
      failures.push(`Issue ${issue} evidence index title is required`);
    }
    if (!Array.isArray(entry.requiredEvidence) || entry.requiredEvidence.length === 0) {
      failures.push(`Issue ${issue} requiredEvidence must contain at least one path`);
      continue;
    }
    const requiredBasics = [
      `docs/verification/issues/issue-${issue}/closeout.md`,
      `docs/verification/issues/issue-${issue}/commands.txt`
    ];
    for (const required of requiredBasics) {
      if (!entry.requiredEvidence.includes(required)) {
        failures.push(`Issue ${issue} requiredEvidence must include ${required}`);
      }
    }
    if (issueNumber >= 571) {
      for (const required of [
        `docs/verification/issues/issue-${issue}/command-output-map.json`,
        `docs/verification/issues/issue-${issue}/manifest-update-output.json`
      ]) {
        if (!entry.requiredEvidence.includes(required)) {
          failures.push(`Issue ${issue} requiredEvidence must include ${required}`);
        }
      }
    }
    for (const evidencePath of entry.requiredEvidence) {
      const absoluteEvidencePath = join(root, evidencePath);
      if (!existsSync(absoluteEvidencePath) || !statSync(absoluteEvidencePath).isFile()) {
        failures.push(`Issue ${issue} missing indexed evidence: ${evidencePath}`);
      } else if (statSync(absoluteEvidencePath).size === 0) {
        failures.push(`Issue ${issue} indexed evidence is empty: ${evidencePath}`);
      }
    }
  }

  if (options.requireExistingIssueDirs) {
    for (const issue of existingIssueNumbers(root)) {
      if (issue < FIRST_INDEXED_ISSUE) continue;
      const issueKey = String(issue).padStart(3, "0");
      if (!seenIssues.has(issueKey)) failures.push(`Issue ${issueKey} is missing from ${indexPath}`);
    }
  }
  for (const issue of options.requiredIssues ?? []) {
    if (!seenIssues.has(issue)) failures.push(`Issue ${issue} is missing from ${indexPath}`);
  }
  return failures;
}

export function runSelfTests() {
  const tempRoot = mkdtempSync(join(tmpdir(), "issue-evidence-index-"));
  try {
    createIssueEvidence(tempRoot, "082", "closeout");
    writeIndex(tempRoot, [
      entry("082", ["docs/verification/issues/issue-082/missing.json"])
    ]);
    assertFailure("missing evidence reports exact issue number", checkIssueEvidenceIndex(tempRoot), /Issue 082 missing indexed evidence/);

    rmSync(join(tempRoot, "docs"), { recursive: true, force: true });
    createIssueEvidence(tempRoot, "082", "");
    writeIndex(tempRoot, [entry("082")]);
    assertFailure("empty file fails", checkIssueEvidenceIndex(tempRoot), /Issue 082 indexed evidence is empty/);

    rmSync(join(tempRoot, "docs"), { recursive: true, force: true });
    createIssueEvidence(tempRoot, "082", "closeout");
    createIssueEvidence(tempRoot, "083", "closeout");
    writeIndex(tempRoot, [entry("083"), entry("082")]);
    assertFailure("unsorted index fails", checkIssueEvidenceIndex(tempRoot), /must be sorted/);

    rmSync(join(tempRoot, "docs"), { recursive: true, force: true });
    createIssueEvidence(tempRoot, "082", "closeout");
    writeIndex(tempRoot, [entry("082"), entry("082")]);
    assertFailure("duplicate issue entry fails", checkIssueEvidenceIndex(tempRoot), /duplicate/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function existingIssueNumbers(root) {
  const issuesRoot = join(root, "docs", "verification", "issues");
  if (!existsSync(issuesRoot) || !statSync(issuesRoot).isDirectory()) return [];
  return readdirSync(issuesRoot)
    .map((issueName) => Number(issueName.match(/^issue-(\d{3})$/)?.[1]))
    .filter((issueNumber) => Number.isFinite(issueNumber))
    .sort((left, right) => left - right);
}

function createIssueEvidence(root, issue, closeoutContent) {
  const issuePath = join(root, "docs", "verification", "issues", `issue-${issue}`);
  mkdirSync(join(issuePath, "test-output"), { recursive: true });
  writeFileSync(join(issuePath, "closeout.md"), closeoutContent);
  writeFileSync(join(issuePath, "commands.txt"), "commands\n");
}

function entry(issue, extra = []) {
  return {
    issue,
    title: `Indexed Issue ${issue}`,
    requiredEvidence: [
      `docs/verification/issues/issue-${issue}/closeout.md`,
      `docs/verification/issues/issue-${issue}/commands.txt`,
      ...extra
    ]
  };
}

function writeIndex(root, issues) {
  const indexDirectory = join(root, "docs", "verification");
  mkdirSync(indexDirectory, { recursive: true });
  writeFileSync(join(indexDirectory, "ISSUE_EVIDENCE_INDEX.json"), JSON.stringify({ schemaVersion: "1.0.0", lastRebuiltIssue: "082", issues }, null, 2));
}

function assertFailure(label, failures, pattern) {
  if (!failures.some((failure) => pattern.test(failure))) {
    throw new Error(`${label}: expected failure matching ${pattern}, got ${failures.join("; ")}`);
  }
}

async function runCli() {
  const args = process.argv.slice(2);
  const hasStage = args.includes("--stage");
  if (!hasStage) {
    runSelfTests();
    const failures = checkIssueEvidenceIndex(process.cwd());
    if (failures.length > 0) {
      console.error(failures.join("\n"));
      process.exit(1);
    }
    console.log("Issue evidence index gate self-tests pass.");
    console.log("Issue evidence index artifacts pass.");
    return;
  }

  const stages = ["valid-json", "issue-coverage", "stale-entry-negative", "missing-evidence-negative", "rebuilt-index", "missing-evidence", "final"];
  const context = createRepairContext({
    scriptName: "issue evidence index",
    stages,
    statusKeyByStage: {
      "valid-json": "evidenceIndexStatus",
      "issue-coverage": "evidenceIndexStatus",
      "stale-entry-negative": "evidenceIndexStatus",
      "missing-evidence-negative": "evidenceIndexStatus"
    },
    outputName: "issue-evidence-index-output.json",
    defaultIssue: "584"
  });

  await runSelectedRepairStages(context, async (stage) => {
    const requiredIssues = Array.from({ length: 14 }, (_, index) => String(571 + index).padStart(3, "0"));
    if (stage === "valid-json") {
      const failures = checkIssueEvidenceIndex(process.cwd(), { requireSchemaVersion: true, requireLastRebuiltIssue: true });
      context.add("issue evidence index is valid JSON with schema metadata", failures.length === 0, { failures });
      writeJson(`${context.dir}/valid-json-output.json`, { status: failures.length === 0 ? "passed" : "failed", failures });
    }
    if (stage === "issue-coverage") {
      const failures = checkIssueEvidenceIndex(process.cwd(), { requiredIssues });
      const coverageFailures = failures.filter((failure) => /Issue 57[1-9]|Issue 58[0-4]/u.test(failure));
      context.add("issue evidence index covers 571-584", coverageFailures.length === 0, { coverageFailures });
      writeJson(`${context.dir}/issue-coverage-output.json`, { status: coverageFailures.length === 0 ? "passed" : "failed", requiredIssues, coverageFailures });
    }
    if (stage === "stale-entry-negative") {
      const failed = checkStaleEntryNegative();
      context.add("stale entry negative fixture fails", failed, null);
      writeJson(`${context.dir}/stale-entry-negative-output.json`, { status: failed ? "passed" : "failed" });
    }
    if (stage === "missing-evidence-negative") {
      const failed = checkMissingEvidenceNegative();
      context.add("missing evidence negative fixture fails", failed, null);
      writeJson(`${context.dir}/missing-evidence-negative-output.json`, { status: failed ? "passed" : "failed" });
    }
    if (stage === "rebuilt-index") {
      context.add("rebuilt index exists", existsSync(indexPath), { indexPath });
      writeJson(`${context.dir}/rebuilt-index-output.json`, { status: existsSync(indexPath) ? "passed" : "failed", indexPath });
    }
    if (stage === "missing-evidence") {
      const failures = checkIssueEvidenceIndex(process.cwd()).filter((failure) => failure.includes("missing indexed evidence"));
      context.add("indexed evidence is present", failures.length === 0, { missingEvidenceCount: failures.length });
      writeJson(`${context.dir}/missing-evidence-output.json`, { status: failures.length === 0 ? "passed" : "failed", missingEvidenceCount: failures.length });
    }
  });
  finalizeRepairGate(context, {
    testOutputName: "issue-evidence-index.txt",
    manifestUpdates: {
      evidenceIndexStatus: context.checks.every((check) => check.passed) ? "passed" : "failed",
      evidenceIndexValid: context.checks.every((check) => check.passed)
    }
  });
}

function checkStaleEntryNegative() {
  const tempRoot = mkdtempSync(join(tmpdir(), "issue-evidence-stale-"));
  try {
    createIssueEvidence(tempRoot, "571", "closeout");
    writeIndex(tempRoot, [{ ...entry("571"), requiredEvidence: ["docs/verification/issues/issue-571/closeout.md", "docs/verification/issues/issue-571/commands.txt", "docs/verification/issues/issue-571/stale.json"] }]);
    return checkIssueEvidenceIndex(tempRoot).some((failure) => failure.includes("stale.json"));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function checkMissingEvidenceNegative() {
  const tempRoot = mkdtempSync(join(tmpdir(), "issue-evidence-missing-"));
  try {
    mkdirSync(join(tempRoot, "docs", "verification"), { recursive: true });
    writeFileSync(join(tempRoot, "docs", "verification", "ISSUE_EVIDENCE_INDEX.json"), JSON.stringify({ schemaVersion: "1.0.0", lastRebuiltIssue: "571", issues: [] }, null, 2));
    mkdirSync(join(tempRoot, "docs", "verification", "issues", "issue-571"), { recursive: true });
    return checkIssueEvidenceIndex(tempRoot, { requiredIssues: ["571"] }).some((failure) => failure.includes("Issue 571 is missing"));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
