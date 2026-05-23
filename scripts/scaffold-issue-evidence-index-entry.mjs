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

const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
const issueEvidenceRoot = "docs/verification/issues";
const commonEvidenceFolders = ["test-output", "api-responses", "sample-json", "screenshots"];

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    write: false,
    force: false,
    selfTest: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--self-test") {
      options.selfTest = true;
    } else if (arg === "--write") {
      options.write = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--root") {
      options.root = requireValue(argv, index);
      index += 1;
    } else if (arg === "--issue") {
      options.issue = requireValue(argv, index);
      index += 1;
    } else if (arg === "--title") {
      options.title = requireValue(argv, index);
      index += 1;
    } else {
      throw new Error(`unknown option: ${arg}`);
    }
  }
  return options;
}

function requireValue(argv, index) {
  const value = argv[index + 1];
  if (value == null || value.startsWith("--")) {
    throw new Error(`${argv[index]} requires a value`);
  }
  return value;
}

export function scaffoldIssueEvidenceIndexEntry(root, options) {
  const issue = normalizeIssue(options.issue);
  const title = options.title ?? `Issue ${issue}`;
  const entry = buildEntry(root, issue, title);
  const index = readIndex(root);
  const existingIndex = index.issues.findIndex((candidate) => candidate.issue === issue);

  if (existingIndex !== -1 && !options.force) {
    throw new Error(`Issue ${issue} already exists in ${indexPath}; use --force to replace it`);
  }

  const nextIssues = [...index.issues];
  if (existingIndex === -1) {
    nextIssues.push(entry);
  } else {
    nextIssues[existingIndex] = entry;
  }
  nextIssues.sort((left, right) => Number(left.issue) - Number(right.issue));

  const nextIndex = { issues: nextIssues };
  const output = {
    issue,
    title,
    mode: options.write ? "write" : "dry-run",
    force: Boolean(options.force),
    indexIssueCount: nextIssues.length,
    entry,
    detectedEvidenceFolders: detectedFolders(root, issue)
  };

  if (options.write) {
    writeJson(join(root, indexPath), nextIndex);
  }

  return output;
}

function buildEntry(root, issue, title) {
  const issuePath = join(root, issueEvidenceRoot, `issue-${issue}`);
  const evidence = [
    `${issueEvidenceRoot}/issue-${issue}/closeout.md`,
    `${issueEvidenceRoot}/issue-${issue}/commands.txt`
  ];

  for (const fileName of rootEvidenceFiles(issuePath)) {
    evidence.push(`${issueEvidenceRoot}/issue-${issue}/${fileName}`);
  }
  for (const folder of commonEvidenceFolders) {
    for (const fileName of folderEvidenceFiles(join(issuePath, folder))) {
      evidence.push(`${issueEvidenceRoot}/issue-${issue}/${folder}/${fileName}`);
    }
  }

  return {
    issue,
    title,
    requiredEvidence: [...new Set(evidence)]
  };
}

function rootEvidenceFiles(issuePath) {
  if (!existsSync(issuePath) || !statSync(issuePath).isDirectory()) {
    return [];
  }
  return readdirSync(issuePath)
    .filter((fileName) => fileName.endsWith(".json"))
    .filter((fileName) => statSync(join(issuePath, fileName)).isFile())
    .sort();
}

function folderEvidenceFiles(folderPath) {
  if (!existsSync(folderPath) || !statSync(folderPath).isDirectory()) {
    return [];
  }
  return readdirSync(folderPath)
    .filter((fileName) => statSync(join(folderPath, fileName)).isFile())
    .sort();
}

function detectedFolders(root, issue) {
  const issuePath = join(root, issueEvidenceRoot, `issue-${issue}`);
  return commonEvidenceFolders.filter((folder) => {
    const folderPath = join(issuePath, folder);
    return existsSync(folderPath) && statSync(folderPath).isDirectory();
  });
}

function readIndex(root) {
  const absoluteIndexPath = join(root, indexPath);
  if (!existsSync(absoluteIndexPath)) {
    return { issues: [] };
  }
  const parsed = JSON.parse(readFileSync(absoluteIndexPath, "utf8"));
  if (parsed == null || typeof parsed !== "object" || !Array.isArray(parsed.issues)) {
    throw new Error(`${indexPath} must contain an issues array`);
  }
  return parsed;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeIssue(issue) {
  if (issue == null) {
    throw new Error("--issue is required");
  }
  const normalized = String(issue).padStart(3, "0");
  if (!/^\d{3}$/.test(normalized)) {
    throw new Error(`invalid issue number: ${issue}`);
  }
  return normalized;
}

export function runSelfTests(root = process.cwd()) {
  const tempRoot = mkdtempSync(join(tmpdir(), "issue-index-scaffold-"));
  try {
    createIndex(tempRoot, [
      {
        issue: "112",
        title: "Command-to-Output Evidence Mapping",
        requiredEvidence: [
          "docs/verification/issues/issue-112/closeout.md",
          "docs/verification/issues/issue-112/commands.txt"
        ]
      },
      {
        issue: "114",
        title: "Later Issue",
        requiredEvidence: [
          "docs/verification/issues/issue-114/closeout.md",
          "docs/verification/issues/issue-114/commands.txt"
        ]
      }
    ]);
    createIssueEvidence(tempRoot, "113");

    const beforeDryRun = readFileSync(join(tempRoot, indexPath), "utf8");
    const dryRun = scaffoldIssueEvidenceIndexEntry(tempRoot, {
      issue: "113",
      title: "Issue Evidence Index Scaffolder",
      write: false
    });
    assertEqual("dry-run does not modify index", readFileSync(join(tempRoot, indexPath), "utf8"), beforeDryRun);
    assertIncludes("dry-run includes closeout", dryRun.entry.requiredEvidence, "docs/verification/issues/issue-113/closeout.md");
    assertIncludes("dry-run includes commands", dryRun.entry.requiredEvidence, "docs/verification/issues/issue-113/commands.txt");
    assertIncludes(
      "dry-run detects root JSON",
      dryRun.entry.requiredEvidence,
      "docs/verification/issues/issue-113/command-output-map.json"
    );
    for (const folder of commonEvidenceFolders) {
      assertIncludes(`dry-run detects ${folder}`, dryRun.detectedEvidenceFolders, folder);
    }

    const deterministicDryRun = scaffoldIssueEvidenceIndexEntry(tempRoot, {
      issue: "113",
      title: "Issue Evidence Index Scaffolder",
      write: false
    });
    assertEqual("dry-run output is deterministic", JSON.stringify(dryRun), JSON.stringify(deterministicDryRun));

    const writeOutput = scaffoldIssueEvidenceIndexEntry(tempRoot, {
      issue: "113",
      title: "Issue Evidence Index Scaffolder",
      write: true
    });
    assertEqual("write mode reports write", writeOutput.mode, "write");
    assertEqual(
      "write mode keeps sorted issue order",
      JSON.stringify(readIndex(tempRoot).issues.map((entry) => entry.issue)),
      JSON.stringify(["112", "113", "114"])
    );

    assertThrows(
      "existing entry is not overwritten by default",
      () =>
        scaffoldIssueEvidenceIndexEntry(tempRoot, {
          issue: "113",
          title: "Issue Evidence Index Scaffolder",
          write: true
        }),
      /already exists/
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }

  const summary = {
    issue: "113",
    dryRunWorks: true,
    writeModeAddsSortedEntry: true,
    noOverwriteDefault: true,
    detectedEvidenceFolders: commonEvidenceFolders,
    deterministicOutput: true,
    testsPassed: true
  };
  writeJson(join(root, "docs", "verification", "issues", "issue-113", "scaffold-output.json"), summary);
  return summary;
}

function createIndex(root, issues) {
  writeJson(join(root, indexPath), { issues });
}

function createIssueEvidence(root, issue) {
  const issuePath = join(root, issueEvidenceRoot, `issue-${issue}`);
  mkdirSync(issuePath, { recursive: true });
  writeFileSync(join(issuePath, "closeout.md"), "closeout\n");
  writeFileSync(join(issuePath, "commands.txt"), "commands\n");
  writeFileSync(join(issuePath, "command-output-map.json"), "{}\n");
  writeFileSync(join(issuePath, "scaffold-output.json"), "{}\n");
  for (const folder of commonEvidenceFolders) {
    const folderPath = join(issuePath, folder);
    mkdirSync(folderPath, { recursive: true });
    writeFileSync(join(folderPath, `${folder}-evidence.txt`), `${folder} output\n`);
  }
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertIncludes(label, values, expected) {
  if (!values.includes(expected)) {
    throw new Error(`${label}: expected ${expected} in ${values.join(", ")}`);
  }
}

function assertThrows(label, fn, pattern) {
  try {
    fn();
  } catch (error) {
    if (pattern.test(error.message)) {
      return;
    }
    throw new Error(`${label}: expected ${pattern}, got ${error.message}`);
  }
  throw new Error(`${label}: expected error matching ${pattern}`);
}

function runCli() {
  const options = parseArgs(process.argv.slice(2));
  if (options.selfTest) {
    const output = runSelfTests(options.root);
    console.log("Issue evidence index scaffolder self-tests pass.");
    console.log(JSON.stringify(output, null, 2));
    return;
  }
  const output = scaffoldIssueEvidenceIndexEntry(options.root, options);
  console.log(JSON.stringify(output, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
