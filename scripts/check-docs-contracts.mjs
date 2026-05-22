import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, normalize } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "AGENTS.md",
  "docs/contracts/codex-global-invariants.md",
  "docs/compliance/non-phi-policy.md",
  "docs/architecture/dependency-decision-matrix.md",
  "docs/contracts/reproducibility-contract.md",
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

const requiredEvidenceGates = [
  {
    label: "Issue 024 Phase 2 evidence",
    paths: [
      "docs/verification/phase-2-plan-builder-evidence.md",
      "docs/verification/phase-2-plan-builder-checklist.md",
      "docs/verification/issues/issue-024/screenshots/recreated-er-pod-plan.png",
      "docs/verification/issues/issue-024/screenshots/reload-proof.png",
      "docs/verification/issues/issue-024/sample-json/exported-er-pod-plan.json",
      "docs/verification/issues/issue-024/validation-output.txt"
    ]
  },
  {
    label: "Issue 038 Phase 3 evidence",
    paths: [
      "docs/verification/phase-3-manual-assignment-evidence.md",
      "docs/verification/phase-3-manual-assignment-checklist.md",
      "docs/verification/issues/issue-038/scoring-output.json",
      "docs/verification/issues/issue-038/warning-output.json",
      "docs/verification/issues/issue-038/screenshots/manual-assignment-proof.png",
      "docs/verification/issues/issue-038/commands.txt",
      "docs/verification/issues/issue-038/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-3-manual-assignment-evidence.md",
        checks: [
          ["Manual assignment", /\bmanual assignment\b/i],
          ["Room burden", /\broom burden\b/i],
          ["Nurse burden", /\bnurse burden\b/i],
          ["Warning output", /\bwarning output\b/i],
          ["No PHI", /\bno\s+phi\b/i],
          ["No full-shift simulation", /\bno\b[\s\S]{0,80}\bfull-shift simulation\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i]
        ]
      },
      {
        path: "docs/verification/phase-3-manual-assignment-checklist.md",
        checks: [
          ["contracts", /\bcontracts?\b/i],
          ["room-load", /\broom-load\b|\broom load\b/i],
          ["room scoring", /\broom scoring\b|\broom workload scoring\b/i],
          ["assignment warnings", /\bassignment warnings\b|\bmanual assignment warnings\b/i],
          ["nurse scoring", /\bnurse scoring\b|\bnurse burden scoring\b/i],
          ["web proof", /\bweb proof\b|\bweb view\b|\bweb screenshot\b/i],
          ["local verifier", /\blocal verifier\b|\blocal verification\b/i]
        ]
      }
    ]
  }
];

const failures = [];

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
