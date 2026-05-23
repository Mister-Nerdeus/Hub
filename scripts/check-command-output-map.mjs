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
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { checkIssueCommandOutput } from "./check-issue-command-output.mjs";

export const COMMAND_OUTPUT_MAP_REQUIRED_FROM_ISSUE = 112;

export function checkCommandOutputMap(root = process.cwd()) {
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
    const issueNumber = Number(issueName.match(/^issue-(\d{3})$/)?.[1]);
    if (!Number.isFinite(issueNumber) || issueNumber < COMMAND_OUTPUT_MAP_REQUIRED_FROM_ISSUE) {
      continue;
    }
    failures.push(...checkIssueMap(root, issueName, issuePath));
  }

  return failures;
}

export function runSelfTests() {
  const tempRoot = mkdtempSync(join(tmpdir(), "command-output-map-"));
  try {
    createIssue(tempRoot, "112", {
      commands: ["first command", "second command", "third command"],
      outputs: [{ path: "test-output/unrelated.txt", content: "unrelated output\n" }]
    });
    assertPass("old issue output gate accepts unrelated single output", checkIssueCommandOutput(tempRoot));
    assertFailure(
      "missing map fails",
      checkCommandOutputMap(tempRoot),
      /issue-112 requires command-output-map\.json/
    );

    resetDocs(tempRoot);
    createIssue(tempRoot, "112", {
      commands: ["first command", "second command"],
      outputs: [{ path: "test-output/first.txt", content: "first output\n" }],
      map: {
        issue: "112",
        commands: [{ command: "first command", outputs: ["docs/verification/issues/issue-112/test-output/first.txt"] }]
      }
    });
    assertFailure("missing command mapping fails", checkCommandOutputMap(tempRoot), /second command/);

    resetDocs(tempRoot);
    createIssue(tempRoot, "112", {
      commands: ["first command"],
      outputs: [{ path: "test-output/empty.txt", content: "" }],
      map: {
        issue: "112",
        commands: [{ command: "first command", outputs: ["docs/verification/issues/issue-112/test-output/empty.txt"] }]
      }
    });
    assertFailure("empty mapped output fails", checkCommandOutputMap(tempRoot), /mapped output is empty/);

    resetDocs(tempRoot);
    createIssue(tempRoot, "112", {
      commands: ["first command"],
      map: {
        issue: "112",
        commands: [
          { command: "first command", outputs: ["docs/verification/issues/issue-112/test-output/missing.txt"] }
        ]
      }
    });
    assertFailure("missing mapped output fails", checkCommandOutputMap(tempRoot), /missing mapped output/);

    resetDocs(tempRoot);
    createIssue(tempRoot, "112", {
      commands: ["first command", "second command"],
      outputs: [
        { path: "test-output/first.txt", content: "first output\n" },
        { path: "test-output/second.txt", content: "second output\n" }
      ],
      map: {
        issue: "112",
        commands: [
          { command: "first command", outputs: ["docs/verification/issues/issue-112/test-output/first.txt"] },
          { command: "second command", outputs: ["docs/verification/issues/issue-112/test-output/second.txt"] }
        ]
      }
    });
    assertPass("valid mapping passes", checkCommandOutputMap(tempRoot));

    resetDocs(tempRoot);
    createIssue(tempRoot, "111", {
      commands: ["older command"],
      outputs: [{ path: "test-output/older.txt", content: "older output\n" }]
    });
    assertPass("older issues remain grandfathered", checkCommandOutputMap(tempRoot));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function checkIssueMap(root, issueName, issuePath) {
  const failures = [];
  const issueNumber = issueName.match(/^issue-(\d{3})$/)?.[1] ?? "";
  const commandsPath = join(issuePath, "commands.txt");
  const mapPath = join(issuePath, "command-output-map.json");

  if (!existsSync(commandsPath) || !statSync(commandsPath).isFile()) {
    return [`${issueName} requires commands.txt before command-output mapping`];
  }
  if (!existsSync(mapPath) || !statSync(mapPath).isFile()) {
    return [`${issueName} requires command-output-map.json`];
  }
  if (statSync(mapPath).size === 0) {
    return [`${issueName} command-output-map.json is empty`];
  }

  let map;
  try {
    map = JSON.parse(readFileSync(mapPath, "utf8"));
  } catch (error) {
    return [`${issueName} command-output-map.json is invalid JSON: ${error.message}`];
  }

  const commands = readCommands(commandsPath);
  const entries = Array.isArray(map.commands) ? map.commands : [];
  if (map.issue !== issueNumber) {
    failures.push(`${issueName} command-output-map.json issue must be ${issueNumber}`);
  }
  if (entries.length === 0) {
    failures.push(`${issueName} command-output-map.json requires commands array`);
  }

  const mappedCommands = new Map();
  for (const entry of entries) {
    if (entry == null || typeof entry !== "object" || typeof entry.command !== "string") {
      failures.push(`${issueName} command-output-map.json command entries must include command`);
      continue;
    }
    if (mappedCommands.has(entry.command)) {
      failures.push(`${issueName} duplicate command-output mapping: ${entry.command}`);
    }
    mappedCommands.set(entry.command, entry);
  }

  for (const command of commands) {
    if (!mappedCommands.has(command)) {
      failures.push(`${issueName} command lacks output mapping: ${command}`);
    }
  }
  for (const command of mappedCommands.keys()) {
    if (!commands.includes(command)) {
      failures.push(`${issueName} command-output map lists command absent from commands.txt: ${command}`);
    }
  }

  for (const entry of mappedCommands.values()) {
    const outputs = Array.isArray(entry.outputs) ? entry.outputs : [];
    if (outputs.length === 0) {
      failures.push(`${issueName} command has no mapped outputs: ${entry.command}`);
      continue;
    }
    for (const outputPath of outputs) {
      if (typeof outputPath !== "string" || outputPath.length === 0) {
        failures.push(`${issueName} mapped output path must be a non-empty string: ${entry.command}`);
        continue;
      }
      const absoluteOutputPath = join(root, outputPath);
      if (!existsSync(absoluteOutputPath) || !statSync(absoluteOutputPath).isFile()) {
        failures.push(`${issueName} missing mapped output for "${entry.command}": ${outputPath}`);
        continue;
      }
      if (statSync(absoluteOutputPath).size === 0) {
        failures.push(`${issueName} mapped output is empty for "${entry.command}": ${outputPath}`);
      }
      const relativeIssuePath = relative(issuePath, absoluteOutputPath);
      if (relativeIssuePath.startsWith("..")) {
        failures.push(`${issueName} mapped output must stay under the issue evidence folder: ${outputPath}`);
      }
    }
  }

  return failures;
}

function readCommands(commandsPath) {
  return readFileSync(commandsPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function resetDocs(root) {
  rmSync(join(root, "docs"), { recursive: true, force: true });
}

function createIssue(root, issue, options) {
  const issueName = `issue-${issue}`;
  const issuePath = join(root, "docs", "verification", "issues", issueName);
  mkdirSync(issuePath, { recursive: true });
  writeFileSync(join(issuePath, "closeout.md"), "closeout\n");
  writeFileSync(join(issuePath, "commands.txt"), `${options.commands.join("\n")}\n`);
  for (const output of options.outputs ?? []) {
    const outputPath = join(issuePath, output.path);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, output.content);
  }
  if (options.map != null) {
    writeFileSync(join(issuePath, "command-output-map.json"), `${JSON.stringify(options.map, null, 2)}\n`);
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
  const failures = checkCommandOutputMap(process.cwd());
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log("Command output map self-tests pass.");
  console.log("Command output map artifacts pass.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
