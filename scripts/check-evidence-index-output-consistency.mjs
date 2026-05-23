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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const OUTPUT_INDEX_CONSISTENCY_REQUIRED_FROM_ISSUE = 112;

const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";

export function checkEvidenceIndexOutputConsistency(root = process.cwd()) {
  const failures = [];
  const indexedEvidence = readIndexedEvidence(root, failures);
  if (indexedEvidence == null) {
    return failures;
  }

  const issuesRoot = join(root, "docs", "verification", "issues");
  if (!existsSync(issuesRoot) || !statSync(issuesRoot).isDirectory()) {
    return [`Missing issue evidence root: ${issuesRoot}`];
  }

  for (const issueName of readdirSync(issuesRoot).sort()) {
    const issuePath = join(issuesRoot, issueName);
    if (!statSync(issuePath).isDirectory()) {
      continue;
    }

    const issueNumber = Number(issueName.match(/^issue-(\d{3})$/)?.[1]);
    if (
      !Number.isFinite(issueNumber) ||
      issueNumber < OUTPUT_INDEX_CONSISTENCY_REQUIRED_FROM_ISSUE
    ) {
      continue;
    }

    const mapPath = join(issuePath, "command-output-map.json");
    if (!existsSync(mapPath) || !statSync(mapPath).isFile()) {
      continue;
    }

    const commandOutputMap = parseJson(mapPath, failures, `${issueName} command-output-map.json`);
    if (commandOutputMap == null) {
      continue;
    }

    const entries = Array.isArray(commandOutputMap.commands) ? commandOutputMap.commands : [];
    const mappedOutputPaths = new Set();
    for (const entry of entries) {
      const outputs = Array.isArray(entry?.outputs) ? entry.outputs : [];
      for (const outputPath of outputs) {
        if (typeof outputPath !== "string" || outputPath.length === 0) {
          continue;
        }
        mappedOutputPaths.add(normalizeEvidencePath(outputPath));
      }
    }

    for (const mappedOutputPath of mappedOutputPaths) {
      if (!indexedEvidence.has(mappedOutputPath)) {
        failures.push(`${issueName} mapped output is missing from ${indexPath}: ${mappedOutputPath}`);
      }
    }
  }

  return failures;
}

export function runSelfTests() {
  const tempRoot = mkdtempSync(join(tmpdir(), "evidence-index-output-consistency-"));
  try {
    createIssue(tempRoot, "112", {
      mapOutputs: ["docs/verification/issues/issue-112/test-output/docs.txt"],
      indexedEvidence: [
        "docs/verification/issues/issue-112/closeout.md",
        "docs/verification/issues/issue-112/commands.txt",
        "docs/verification/issues/issue-112/command-output-map.json"
      ]
    });
    assertFailure(
      "mapped output absent from index fails",
      checkEvidenceIndexOutputConsistency(tempRoot),
      /mapped output is missing/
    );

    resetDocs(tempRoot);
    createIssue(tempRoot, "112", {
      mapOutputs: ["docs/verification/issues/issue-112/test-output/docs.txt"],
      indexedEvidence: [
        "docs/verification/issues/issue-112/closeout.md",
        "docs/verification/issues/issue-112/commands.txt",
        "docs/verification/issues/issue-112/command-output-map.json",
        "docs/verification/issues/issue-112/test-output/docs.txt"
      ]
    });
    assertPass(
      "mapped output present in index passes",
      checkEvidenceIndexOutputConsistency(tempRoot)
    );

    resetDocs(tempRoot);
    createIssue(tempRoot, "111", {
      mapOutputs: ["docs/verification/issues/issue-111/test-output/docs.txt"],
      indexedEvidence: [
        "docs/verification/issues/issue-111/closeout.md",
        "docs/verification/issues/issue-111/commands.txt",
        "docs/verification/issues/issue-111/command-output-map.json"
      ]
    });
    assertPass("older issue maps are ignored", checkEvidenceIndexOutputConsistency(tempRoot));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function readIndexedEvidence(root, failures) {
  const absoluteIndexPath = join(root, indexPath);
  if (!existsSync(absoluteIndexPath) || !statSync(absoluteIndexPath).isFile()) {
    failures.push(`Missing issue evidence index: ${indexPath}`);
    return null;
  }

  const index = parseJson(absoluteIndexPath, failures, indexPath);
  if (index == null) {
    return null;
  }
  if (index == null || typeof index !== "object" || !Array.isArray(index.issues)) {
    failures.push("Issue evidence index must contain an issues array");
    return null;
  }

  const indexedEvidence = new Set();
  for (const entry of index.issues) {
    const requiredEvidence = Array.isArray(entry?.requiredEvidence) ? entry.requiredEvidence : [];
    for (const evidencePath of requiredEvidence) {
      if (typeof evidencePath === "string") {
        indexedEvidence.add(normalizeEvidencePath(evidencePath));
      }
    }
  }

  return indexedEvidence;
}

function parseJson(path, failures, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failures.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function normalizeEvidencePath(path) {
  return path.replaceAll("\\", "/");
}

function resetDocs(root) {
  rmSync(join(root, "docs"), { recursive: true, force: true });
}

function createIssue(root, issue, options) {
  const issueName = `issue-${issue}`;
  const issuePath = join(root, "docs", "verification", "issues", issueName);
  mkdirSync(issuePath, { recursive: true });
  writeFileSync(join(issuePath, "closeout.md"), "closeout\n");
  writeFileSync(join(issuePath, "commands.txt"), "commands\n");
  writeFileSync(
    join(issuePath, "command-output-map.json"),
    `${JSON.stringify(
      {
        issue,
        commands: [
          {
            command: "commands",
            outputs: options.mapOutputs
          }
        ]
      },
      null,
      2
    )}\n`
  );

  for (const outputPath of options.mapOutputs) {
    const absoluteOutputPath = join(root, outputPath);
    mkdirSync(dirname(absoluteOutputPath), { recursive: true });
    writeFileSync(absoluteOutputPath, "captured output\n");
  }

  mkdirSync(join(root, "docs", "verification"), { recursive: true });
  writeFileSync(
    join(root, indexPath),
    `${JSON.stringify(
      {
        issues: [
          {
            issue,
            title: `Issue ${issue}`,
            requiredEvidence: options.indexedEvidence
          }
        ]
      },
      null,
      2
    )}\n`
  );
}

function assertFailure(label, failures, pattern) {
  if (!failures.some((failure) => pattern.test(failure))) {
    throw new Error(`${label}: expected failure matching ${pattern}, got ${failures.join("; ")}`);
  }
}

function assertPass(label, failures) {
  if (failures.length > 0) {
    throw new Error(`${label}: expected pass, got ${failures.join("; ")}`);
  }
}

function runCli() {
  runSelfTests();
  const failures = checkEvidenceIndexOutputConsistency(process.cwd());
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log("Evidence index output consistency self-tests pass.");
  console.log("Issue 112+ mapped command outputs are indexed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
