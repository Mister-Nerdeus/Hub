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
  },
  {
    label: "Issue 047 Phase 4 evidence",
    paths: [
      "docs/verification/phase-4-task-generation-evidence.md",
      "docs/verification/phase-4-task-generation-checklist.md",
      "docs/verification/issues/issue-047/generated-tasks-output.json",
      "docs/verification/issues/issue-047/random-output.json",
      "docs/verification/issues/issue-047/validation-output.txt",
      "docs/verification/issues/issue-047/commands.txt",
      "docs/verification/issues/issue-047/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-4-task-generation-evidence.md",
        checks: [
          ["Assumptions register", /\bassumptions register\b/i],
          ["Task templates", /\btask templates\b/i],
          ["Day profiles", /\bday profiles\b/i],
          ["Shift scenario", /\bshift scenario\b/i],
          ["Seeded randomness", /\bseeded randomness\b/i],
          ["Generated operational tasks", /\bgenerated operational tasks\b/i],
          ["No PHI", /\bno\s+phi\b/i],
          ["No full-shift simulation", /\bno\b[\s\S]{0,80}\bfull-shift simulation\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i]
        ]
      },
      {
        path: "docs/verification/phase-4-task-generation-checklist.md",
        checks: [
          ["assumptions", /\bassumptions register\b/i],
          ["templates", /\btask templates\b/i],
          ["day profiles", /\bday profiles\b/i],
          ["shift scenario", /\bshift scenario\b/i],
          ["seeded randomness", /\bseeded randomness\b/i],
          ["generated tasks", /\bgenerated operational tasks\b/i],
          ["local verifier", /\blocal verifier\b|\blocal verification\b/i]
        ]
      }
    ]
  },
  {
    label: "Issue 053 Phase 5 evidence",
    paths: [
      "docs/verification/phase-5-task-assignment-evidence.md",
      "docs/verification/phase-5-task-assignment-checklist.md",
      "docs/verification/issues/issue-053/parity-output.json",
      "docs/verification/issues/issue-053/timeline-output.json",
      "docs/verification/issues/issue-053/assignment-output.json",
      "docs/verification/issues/issue-053/validation-output.txt",
      "docs/verification/issues/issue-053/commands.txt",
      "docs/verification/issues/issue-053/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-5-task-assignment-evidence.md",
        checks: [
          ["Assumptions-driven scoring", /\bassumptions-driven scoring\b/i],
          ["Generated task validation", /\bgenerated task validation\b/i],
          ["Task timeline aggregation", /\btask timeline aggregation\b/i],
          ["Nurse task assignment contract", /\bnurse task assignment contract\b/i],
          ["Manual room coverage assignment", /\bmanual room coverage assignment\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No task completion simulation", /\bno\b[\s\S]{0,80}\btask completion simulation\b/i],
          ["No walking route calculation", /\bno\b[\s\S]{0,80}\bwalking route calculation\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      },
      {
        path: "docs/verification/phase-5-task-assignment-checklist.md",
        checks: [
          ["Assumptions-driven scoring", /\bassumptions-driven scoring\b/i],
          ["Generated task validation", /\bgenerated task validation\b/i],
          ["Task timeline aggregation", /\btask timeline aggregation\b/i],
          ["Nurse task assignment contract", /\bnurse task assignment contract\b/i],
          ["Manual room coverage assignment", /\bmanual room coverage assignment\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No task completion simulation", /\bno\b[\s\S]{0,80}\btask completion simulation\b/i],
          ["No walking route calculation", /\bno\b[\s\S]{0,80}\bwalking route calculation\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      }
    ]
  },
  {
    label: "Issue 058 Phase 6 evidence",
    paths: [
      "docs/verification/phase-6-reporting-evidence.md",
      "docs/verification/phase-6-reporting-checklist.md",
      "docs/verification/issues/issue-058/report-output.json",
      "docs/verification/issues/issue-058/screenshots/report-proof.png",
      "docs/verification/issues/issue-058/validation-output.txt",
      "docs/verification/issues/issue-058/commands.txt",
      "docs/verification/issues/issue-058/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-6-reporting-evidence.md",
        checks: [
          ["Operational report contract", /\boperational report contract\b/i],
          ["Operational summary report", /\boperational summary report\b/i],
          ["Nurse workload report", /\bnurse workload report\b/i],
          ["Unassigned task report", /\bunassigned task report\b/i],
          ["Warning report", /\bwarning report\b/i],
          ["API-free web proof", /\bapi-free web proof\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No task completion simulation", /\bno\b[\s\S]{0,80}\btask completion simulation\b/i],
          ["No walking route calculation", /\bno\b[\s\S]{0,80}\bwalking route calculation\b/i],
          ["No delay calculation", /\bno\b[\s\S]{0,80}\bdelay calculation\b/i],
          ["No clinical safety claims", /\bno\b[\s\S]{0,80}\bclinical safety claims\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      },
      {
        path: "docs/verification/phase-6-reporting-checklist.md",
        checks: [
          ["Operational report contract", /\boperational report contract\b/i],
          ["Operational summary report", /\boperational summary report\b/i],
          ["Nurse workload report", /\bnurse workload report\b/i],
          ["Unassigned task report", /\bunassigned task report\b/i],
          ["Warning report", /\bwarning report\b/i],
          ["API-free web proof", /\bapi-free web proof\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No task completion simulation", /\bno\b[\s\S]{0,80}\btask completion simulation\b/i],
          ["No walking route calculation", /\bno\b[\s\S]{0,80}\bwalking route calculation\b/i],
          ["No delay calculation", /\bno\b[\s\S]{0,80}\bdelay calculation\b/i],
          ["No clinical safety claims", /\bno\b[\s\S]{0,80}\bclinical safety claims\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      }
    ]
  },
  {
    label: "Issue 063 Phase 7 evidence",
    paths: [
      "docs/verification/phase-7-comparison-export-evidence.md",
      "docs/verification/phase-7-comparison-export-checklist.md",
      "docs/verification/issues/issue-063/comparison-output.json",
      "docs/verification/issues/issue-063/export-bundle-output.json",
      "docs/verification/issues/issue-063/screenshots/comparison-proof.png",
      "docs/verification/issues/issue-063/validation-output.txt",
      "docs/verification/issues/issue-063/commands.txt",
      "docs/verification/issues/issue-063/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-7-comparison-export-evidence.md",
        checks: [
          ["Scenario comparison contract", /\bscenario comparison contract\b/i],
          ["Manual scenario comparison", /\bmanual scenario comparison\b/i],
          ["Report export JSON bundle", /\breport export JSON bundle\b/i],
          ["Report export JSON bundle builder", /\breport export JSON bundle builder\b/i],
          ["API-free comparison proof", /\bapi-free comparison proof\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No recommendation", /\bno\b[\s\S]{0,80}\brecommendation\b/i],
          ["No clinical safety claims", /\bno\b[\s\S]{0,80}\bclinical safety claims\b/i],
          ["No API endpoints", /\bno\b[\s\S]{0,80}\bapi endpoints\b/i],
          ["No persistence", /\bno\b[\s\S]{0,80}\bpersistence\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      },
      {
        path: "docs/verification/phase-7-comparison-export-checklist.md",
        checks: [
          ["Scenario comparison contract", /\bscenario comparison contract\b/i],
          ["Manual scenario comparison", /\bmanual scenario comparison\b/i],
          ["Report export JSON bundle", /\breport export JSON bundle\b/i],
          ["Report export JSON bundle builder", /\breport export JSON bundle builder\b/i],
          ["API-free comparison proof", /\bapi-free comparison proof\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No recommendation", /\bno\b[\s\S]{0,80}\brecommendation\b/i],
          ["No clinical safety claims", /\bno\b[\s\S]{0,80}\bclinical safety claims\b/i],
          ["No API endpoints", /\bno\b[\s\S]{0,80}\bapi endpoints\b/i],
          ["No persistence", /\bno\b[\s\S]{0,80}\bpersistence\b/i],
          ["No PHI", /\bno\s+phi\b/i]
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
