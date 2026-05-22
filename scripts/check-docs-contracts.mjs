import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

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

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    failures.push(`Missing required doc: ${file}`);
  }
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
for (const issue of [
  "000A",
  "000B",
  "001",
  "002",
  "003",
  "004",
  "005",
  "006",
  "007",
  "008",
  "009",
  "010",
  "011",
  "012",
  "013",
  "014",
  "014B"
]) {
  const issuePath = join(closeoutRoot, `issue-${issue}`, "closeout.md");
  if (!existsSync(issuePath)) {
    failures.push(`Missing closeout artifact: ${issuePath}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Docs and contract guardrails pass.");
