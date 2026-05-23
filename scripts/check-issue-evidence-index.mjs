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
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const FIRST_INDEXED_ISSUE = 82;
const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";

export function checkIssueEvidenceIndex(root = process.cwd()) {
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
    if (seenIssues.has(issue)) {
      failures.push(`Issue ${issue} has duplicate evidence index entries`);
    }
    seenIssues.add(issue);
    if (issueNumber < previousIssueNumber) {
      failures.push(`Issue evidence index must be sorted by issue number: ${issue}`);
    }
    previousIssueNumber = issueNumber;

    if (typeof entry.title !== "string" || entry.title.length === 0) {
      failures.push(`Issue ${issue} evidence index title is required`);
    }
    if (!Array.isArray(entry.requiredEvidence) || entry.requiredEvidence.length === 0) {
      failures.push(`Issue ${issue} requiredEvidence must contain at least one path`);
      continue;
    }

    const closeoutPath = `docs/verification/issues/issue-${issue}/closeout.md`;
    const commandsPath = `docs/verification/issues/issue-${issue}/commands.txt`;
    if (!entry.requiredEvidence.includes(closeoutPath)) {
      failures.push(`Issue ${issue} requiredEvidence must include ${closeoutPath}`);
    }
    if (!entry.requiredEvidence.includes(commandsPath)) {
      failures.push(`Issue ${issue} requiredEvidence must include ${commandsPath}`);
    }

    for (const evidencePath of entry.requiredEvidence) {
      const absoluteEvidencePath = join(root, evidencePath);
      if (!existsSync(absoluteEvidencePath) || !statSync(absoluteEvidencePath).isFile()) {
        failures.push(`Issue ${issue} missing indexed evidence: ${evidencePath}`);
        continue;
      }
      if (statSync(absoluteEvidencePath).size === 0) {
        failures.push(`Issue ${issue} indexed evidence is empty: ${evidencePath}`);
      }
    }
  }

  for (const issue of existingIssueNumbers(root)) {
    if (issue < FIRST_INDEXED_ISSUE) {
      continue;
    }
    const issueKey = String(issue).padStart(3, "0");
    if (!seenIssues.has(issueKey)) {
      failures.push(`Issue ${issueKey} is missing from ${indexPath}`);
    }
  }

  return failures;
}

export function runSelfTests() {
  const tempRoot = mkdtempSync(join(tmpdir(), "issue-evidence-index-"));
  try {
    createIssueEvidence(tempRoot, "082", "closeout");
    writeIndex(tempRoot, [
      {
        issue: "082",
        title: "Indexed Issue",
        requiredEvidence: [
          "docs/verification/issues/issue-082/closeout.md",
          "docs/verification/issues/issue-082/commands.txt",
          "docs/verification/issues/issue-082/missing.json"
        ]
      }
    ]);
    assertFailure(
      "missing evidence reports exact issue number",
      checkIssueEvidenceIndex(tempRoot),
      /Issue 082 missing indexed evidence/
    );

    rmSync(join(tempRoot, "docs"), { recursive: true, force: true });
    createIssueEvidence(tempRoot, "082", "");
    writeIndex(tempRoot, [
      {
        issue: "082",
        title: "Indexed Issue",
        requiredEvidence: [
          "docs/verification/issues/issue-082/closeout.md",
          "docs/verification/issues/issue-082/commands.txt"
        ]
      }
    ]);
    assertFailure(
      "empty file fails",
      checkIssueEvidenceIndex(tempRoot),
      /Issue 082 indexed evidence is empty/
    );

    rmSync(join(tempRoot, "docs"), { recursive: true, force: true });
    createIssueEvidence(tempRoot, "082", "closeout");
    createIssueEvidence(tempRoot, "083", "closeout");
    writeIndex(tempRoot, [
      {
        issue: "083",
        title: "Indexed Issue 083",
        requiredEvidence: [
          "docs/verification/issues/issue-083/closeout.md",
          "docs/verification/issues/issue-083/commands.txt"
        ]
      },
      {
        issue: "082",
        title: "Indexed Issue 082",
        requiredEvidence: [
          "docs/verification/issues/issue-082/closeout.md",
          "docs/verification/issues/issue-082/commands.txt"
        ]
      }
    ]);
    assertFailure("unsorted index fails", checkIssueEvidenceIndex(tempRoot), /must be sorted/);

    rmSync(join(tempRoot, "docs"), { recursive: true, force: true });
    createIssueEvidence(tempRoot, "082", "closeout");
    writeIndex(tempRoot, [
      {
        issue: "082",
        title: "Indexed Issue",
        requiredEvidence: [
          "docs/verification/issues/issue-082/closeout.md",
          "docs/verification/issues/issue-082/commands.txt"
        ]
      },
      {
        issue: "082",
        title: "Duplicate Indexed Issue",
        requiredEvidence: [
          "docs/verification/issues/issue-082/closeout.md",
          "docs/verification/issues/issue-082/commands.txt"
        ]
      }
    ]);
    assertFailure("duplicate issue entry fails", checkIssueEvidenceIndex(tempRoot), /duplicate/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function existingIssueNumbers(root) {
  const issuesRoot = join(root, "docs", "verification", "issues");
  if (!existsSync(issuesRoot)) {
    return [];
  }
  if (!statSync(issuesRoot).isDirectory()) {
    return [];
  }
  return readdirSync(issuesRoot)
    .map((issueName) => Number(issueName.match(/^issue-(\d{3})$/)?.[1]))
    .filter((issueNumber) => Number.isFinite(issueNumber))
    .sort((left, right) => left - right);
}

function createIssueEvidence(root, issue, closeoutContent) {
  const issuePath = join(root, "docs", "verification", "issues", `issue-${issue}`);
  mkdirSync(issuePath, { recursive: true });
  writeFileSync(join(issuePath, "closeout.md"), closeoutContent);
  writeFileSync(join(issuePath, "commands.txt"), "commands\n");
}

function writeIndex(root, issues) {
  const indexDirectory = join(root, "docs", "verification");
  mkdirSync(indexDirectory, { recursive: true });
  writeFileSync(join(indexDirectory, "ISSUE_EVIDENCE_INDEX.json"), JSON.stringify({ issues }, null, 2));
}

function assertFailure(label, failures, pattern) {
  if (!failures.some((failure) => pattern.test(failure))) {
    throw new Error(`${label}: expected failure matching ${pattern}, got ${failures.join("; ")}`);
  }
}

function runCli() {
  runSelfTests();
  const failures = checkIssueEvidenceIndex(process.cwd());
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log("Issue evidence index gate self-tests pass.");
  console.log("Issue evidence index artifacts pass.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
