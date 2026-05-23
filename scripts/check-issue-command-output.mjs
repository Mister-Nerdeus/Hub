import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

export const OUTPUT_REQUIRED_FROM_ISSUE = 104;

export const allowedEvidenceOutputPatterns = [
  "test-output/*.txt",
  "api-responses/*.json",
  "sample-json/*.json",
  "screenshots/*.png"
];

const allowedEvidenceOutputLocations = [
  { directory: "test-output", extension: ".txt" },
  { directory: "api-responses", extension: ".json" },
  { directory: "sample-json", extension: ".json" },
  { directory: "screenshots", extension: ".png" }
];

export function checkIssueCommandOutput(root = process.cwd()) {
  const failures = [];
  const issuesRoot = join(root, "docs", "verification", "issues");
  if (!existsSync(issuesRoot)) {
    return [`Missing issue evidence root: ${issuesRoot}`];
  }

  for (const issueName of readdirSync(issuesRoot).sort()) {
    const issuePath = join(issuesRoot, issueName);
    if (!statSync(issuePath).isDirectory()) {
      continue;
    }
    const issueNumber = Number(issueName.match(/^issue-(\d+)$/)?.[1]);
    if (!Number.isFinite(issueNumber) || issueNumber < OUTPUT_REQUIRED_FROM_ISSUE) {
      continue;
    }

    const outputArtifacts = findOutputArtifacts(issuePath);
    if (outputArtifacts.length === 0) {
      failures.push(
        `${issueName} requires at least one captured output artifact matching ${allowedEvidenceOutputPatterns.join(", ")}`
      );
      continue;
    }

    for (const artifact of outputArtifacts) {
      if (statSync(artifact.absolutePath).size === 0) {
        failures.push(`${issueName} output artifact is empty: ${artifact.relativePath}`);
      }
    }
  }

  return failures;
}

export function runSelfTests() {
  const tempRoot = mkdtempSync(join(tmpdir(), "issue-output-gate-"));
  try {
    createIssue(tempRoot, "issue-104", {
      closeout: true,
      commands: true
    });
    assertFailure(
      "issue 104+ with only commands/closeout fails",
      checkIssueCommandOutput(tempRoot),
      /issue-104 requires at least one captured output artifact/
    );

    rmSync(join(tempRoot, "docs"), { recursive: true, force: true });
    createIssue(tempRoot, "issue-104", {
      closeout: true,
      commands: true,
      outputPath: ["test-output", "empty.txt"],
      outputContent: ""
    });
    assertFailure(
      "issue 104+ with empty output fails",
      checkIssueCommandOutput(tempRoot),
      /issue-104 output artifact is empty/
    );

    rmSync(join(tempRoot, "docs"), { recursive: true, force: true });
    createIssue(tempRoot, "issue-104", {
      closeout: true,
      commands: true,
      outputPath: ["test-output", "gate.txt"],
      outputContent: "captured output\n"
    });
    assertPass("issue 104+ with non-empty output passes", checkIssueCommandOutput(tempRoot));

    rmSync(join(tempRoot, "docs"), { recursive: true, force: true });
    createIssue(tempRoot, "issue-103", {
      closeout: true,
      commands: true
    });
    assertPass("older issues remain grandfathered", checkIssueCommandOutput(tempRoot));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function findOutputArtifacts(issuePath) {
  const artifacts = [];
  for (const location of allowedEvidenceOutputLocations) {
    const outputDirectory = join(issuePath, location.directory);
    if (!existsSync(outputDirectory) || !statSync(outputDirectory).isDirectory()) {
      continue;
    }
    for (const fileName of readdirSync(outputDirectory).sort()) {
      const absolutePath = join(outputDirectory, fileName);
      if (!statSync(absolutePath).isFile() || !fileName.endsWith(location.extension)) {
        continue;
      }
      artifacts.push({
        absolutePath,
        relativePath: `${basename(issuePath)}/${location.directory}/${fileName}`
      });
    }
  }
  return artifacts;
}

function createIssue(root, issueName, options) {
  const issuePath = join(root, "docs", "verification", "issues", issueName);
  mkdirSync(issuePath, { recursive: true });
  writeFileSync(join(issuePath, ".keep"), "", { flag: "w" });
  if (options.closeout) {
    writeFileSync(join(issuePath, "closeout.md"), "closeout\n");
  }
  if (options.commands) {
    writeFileSync(join(issuePath, "commands.txt"), "commands\n");
  }
  if (options.outputPath != null) {
    const [directory, fileName] = options.outputPath;
    const outputDirectory = join(issuePath, directory);
    mkdirSync(outputDirectory, { recursive: true });
    writeFileSync(join(outputDirectory, ".keep"), "", { flag: "w" });
    writeFileSync(join(outputDirectory, fileName), options.outputContent);
  }
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
  const failures = checkIssueCommandOutput(process.cwd());
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log("Issue command output gate self-tests pass.");
  console.log("Issue command output artifacts pass.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
