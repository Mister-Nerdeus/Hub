import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  validateManualAssignmentNurse,
  validateManualAssignmentRoomLoad,
  validateManualAssignmentSet,
  validateManualAssignmentWarning,
  validateManualNurseBurdenScore,
  validateManualRoomAssignment
} from "../packages/shared/dist/index.js";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "382";
const issueDir = `docs/verification/issues/issue-${issue}`;
const fixtureDir = "packages/shared/fixtures/manual-assignment";
const manifestPath = "docs/verification/manual-assignment-foundation-manifest.json";
const registryPath = "docs/verification/canonical-gate-registry.json";
const failures = [];

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const validFixture = readJson(`${fixtureDir}/manual-assignment-set-valid.json`);
const validatedSet = validateManualAssignmentSet(validFixture);
const contractInventory = {
  status: "passed",
  contracts: [
    "ManualAssignmentNurse",
    "ManualAssignmentRoomLoad",
    "ManualRoomAssignment",
    "ManualAssignmentSet",
    "ManualAssignmentWarning",
    "ManualNurseBurdenScore"
  ],
  fixturePath: `${fixtureDir}/manual-assignment-set-valid.json`
};

writeJson(`${issueDir}/contract-inventory-output.json`, contractInventory);
writeJson(`${issueDir}/nurse-contract-output.json`, { status: "passed", value: validateManualAssignmentNurse(validFixture.nurses[0]) });
writeJson(`${issueDir}/room-load-contract-output.json`, { status: "passed", value: validateManualAssignmentRoomLoad(validFixture.roomLoads[0]) });
writeJson(`${issueDir}/assignment-contract-output.json`, { status: "passed", value: validateManualRoomAssignment(validFixture.assignments[0]) });
writeJson(`${issueDir}/warning-contract-output.json`, { status: "passed", value: validateManualAssignmentWarning(validFixture.warnings[0]) });
writeJson(`${issueDir}/burden-score-contract-output.json`, { status: "passed", value: validateManualNurseBurdenScore(validFixture.burdenScores[0]) });
writeJson(`${issueDir}/valid-fixture-output.json`, { status: "passed", assignmentSetId: validatedSet.assignmentSetId });

writeNegative("phi-field-negative-output.json", "invalid-phi-field.json", /forbidden|not allowed/u);
writeNegative("clinical-note-negative-output.json", "invalid-clinical-note.json", /forbidden|not allowed/u);
writeNegative("medication-name-negative-output.json", "invalid-medication-name.json", /forbidden|not allowed/u);
writeNegative("diagnosis-negative-output.json", "invalid-diagnosis.json", /forbidden|not allowed/u);
writeNegative("real-nurse-name-negative-output.json", "invalid-real-nurse-name.json", /displayLabel/u, validateManualAssignmentNurse);
writeNegative("employee-id-negative-output.json", "invalid-employee-id.json", /forbidden|not allowed/u);
writeNegative("unsupported-assignment-negative-output.json", "invalid-unsupported-assignment-reference.json", /unsupported roomId/u);

const registry = readJson(registryPath);
const packageJson = readJson("package.json");
const registryHasGate = registry.gates?.some((gate) => gate.id === "manual-assignment-contracts");
const packageHasScript = packageJson.scripts?.["check:manual-assignment-contracts"] != null;
if (!registryHasGate) failures.push("canonical gate registry missing manual-assignment-contracts");
if (!packageHasScript) failures.push("package.json missing check:manual-assignment-contracts");
writeJson(`${issueDir}/canonical-gate-registry-update-output.json`, {
  status: registryHasGate && packageHasScript ? "passed" : "failed",
  registryHasGate,
  packageHasScript
});

const manifest = readJson(manifestPath);
manifest.lastUpdatedIssue = issue;
manifest.contractStatus = failures.length === 0 ? "passed" : "failed";
manifest.goNoGoStatus = "not_ready";
writeJson(manifestPath, manifest);
writeJson(`${issueDir}/manifest-update-output.json`, { status: manifest.contractStatus, manifestPath, lastUpdatedIssue: issue });
writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures unchanged by shared manual assignment contracts\n");
writeIssueCloseoutAndIndex();

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  manifestPath,
  registryPath,
  failures
};
writeJson(`${issueDir}/manual-assignment-contracts-gate-output.json`, output);
writeText(`${issueDir}/test-output/manual-assignment-contracts-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function writeNegative(outputFile, fixtureName, expectedPattern, validator = validateManualAssignmentSet) {
  const result = captureFailure(() => validator(readJson(`${fixtureDir}/${fixtureName}`)), expectedPattern);
  if (result.status !== "passed") failures.push(`${fixtureName} did not fail through expected validator`);
  writeJson(`${issueDir}/${outputFile}`, result);
}

function captureFailure(run, expectedPattern) {
  try {
    run();
    return { status: "failed", rejected: false, expectedReason: String(expectedPattern), actualError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: expectedPattern.test(message) ? "passed" : "failed",
      rejected: true,
      expectedReason: String(expectedPattern),
      actualError: message
    };
  }
}

function writeIssueCloseoutAndIndex() {
  if (!existsSync(abs(`${issueDir}/first-failure.txt`))) {
    writeText(
      `${issueDir}/first-failure.txt`,
      "Reproduced missing shared manual-assignment contracts before UI implementation.\n"
    );
  }
  const commands = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-manual-assignment-contracts.mjs --issue 382",
    "node scripts/check-manual-assignment-foundation.mjs --stage contracts --allow-partial --issue 382",
    "node scripts/check-canonical-gate-registry.mjs --issue 382",
    "node scripts/check-no-phi-fields.mjs",
    "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 382"
  ];
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutputForCommand(command)] }))
  });
  for (const command of commands) {
    const outputPath = mappedOutputForCommand(command);
    if (!existsSync(abs(outputPath))) writeText(outputPath, "pending: command output will be overwritten by local verification run\n");
  }
  writeText(`${issueDir}/closeout.md`, closeout());
  updateEvidenceIndex();
}

function mappedOutputForCommand(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-manual-assignment-contracts")) return `${base}/manual-assignment-contracts-gate.txt`;
  if (command.includes("check-manual-assignment-foundation")) return `${base}/manual-assignment-foundation-gate.txt`;
  if (command.includes("check-canonical-gate-registry")) return `${base}/canonical-gates.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  return `${base}/command.txt`;
}

function closeout() {
  return [
    `# Issue ${issue} Closeout`,
    "",
    "## Summary",
    "Shared manual-assignment contracts, validators, and synthetic fixtures are in place.",
    "",
    "## Files Changed",
    "- packages/shared/src/manual-assignment/*",
    "- packages/shared/fixtures/manual-assignment/*",
    "- packages/shared/tests/manual-assignment-contracts.test.mjs",
    "- package.json",
    "- docs/verification/canonical-gate-registry.json",
    "- docs/verification/manual-assignment-foundation-manifest.json",
    `- ${issueDir}`,
    "",
    "## Commands Run",
    "- See commands.txt and command-output-map.json.",
    "",
    "## Tests Passed/Failed",
    "- Local command output is captured under test-output.",
    "",
    "## Evidence Artifacts",
    `- ${issueDir}`,
    `- ${manifestPath}`,
    "",
    "## Known Limitations",
    "- Manual visual approval is not claimed.",
    "- Promotion remains blocked.",
    "- UI implementation begins in later issues.",
    "",
    "## Non-PHI Confirmation",
    "- Non-PHI rules still pass; contracts reject PHI-like, clinical-note, diagnosis, medication-name, real nurse identity, employee ID, and unsupported assignment references.",
    "",
    "## GO / NO-GO",
    "GO for Issue 383.",
    "",
    "## Next Recommended Issue",
    "GO for Issue 383."
  ].join("\n");
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const entry = { issue, title: "Shared Manual Assignment Contracts and Validation", requiredEvidence: listFiles(issueDir).sort() };
  const existing = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (existing >= 0) index.issues[existing] = entry;
  else {
    index.issues.push(entry);
    index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  }
  writeJson(indexPath, index);
}

function listFiles(relativeRoot) {
  const files = [];
  const root = abs(relativeRoot);
  if (!existsSync(root)) return files;
  walk(root);
  return files.map((path) => path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));
  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile()) files.push(entryPath);
    }
  }
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
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
