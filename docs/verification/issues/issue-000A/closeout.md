# Issue 000A Closeout

## Summary
- Created root Codex operating instructions and supporting guardrail docs.
- Added concise seed docs for every required `AGENTS.md` read-before-coding link so the links resolve in this initially empty repository.
- Kept `AGENTS.md` short and delegated detailed rules to deeper docs.

## Files Changed
- `AGENTS.md`
- `docs/codex/codex-operating-rules.md`
- `docs/codex/issue-closeout-format.md`
- `docs/codex/drift-traps.md`
- `docs/codex/forbidden-implementation-patterns.md`
- `docs/contracts/codex-global-invariants.md`
- `docs/compliance/non-phi-policy.md`
- `docs/architecture/dependency-decision-matrix.md`
- `docs/contracts/reproducibility-contract.md`
- `docs/verification/issues/issue-000A/commands.txt`
- `docs/verification/issues/issue-000A/closeout.md`

## Commands Run
```text
git status --short --branch
git clone https://github.com/Mister-Nerdeus/Hub.git .
bash -lc "test -f AGENTS.md && test -f docs/codex/codex-operating-rules.md && test -f docs/codex/issue-closeout-format.md"
$paths = @('AGENTS.md','docs/codex/codex-operating-rules.md','docs/codex/issue-closeout-format.md','docs/codex/drift-traps.md','docs/codex/forbidden-implementation-patterns.md','docs/codex/codex-issue-template-v2.md','.github/ISSUE_TEMPLATE/codex_issue.yml','docs/contracts/codex-global-invariants.md','docs/compliance/non-phi-policy.md','docs/architecture/dependency-decision-matrix.md','docs/contracts/reproducibility-contract.md'); foreach ($path in $paths) { if (-not (Test-Path -Path $path -PathType Leaf)) { throw "Missing $path" } }; 'required and linked files present'
$links = Select-String -Path AGENTS.md -Pattern '\]\(([^)]+)\)' | ForEach-Object { [regex]::Match($_.Line, '\]\(([^)]+)\)').Groups[1].Value }; foreach ($link in $links) { if (-not (Test-Path -Path $link -PathType Leaf)) { throw "Broken AGENTS.md link: $link" } }; 'AGENTS.md links resolve'
git diff --check
```

## Tests Passed
- Required and linked file existence check passed.
- `AGENTS.md` link-target check passed.
- `git diff --check` passed.

## Tests Failed
- Literal Bash acceptance command failed because this Windows environment has only the WSL Bash launcher and no `/bin/bash` distro. The equivalent PowerShell file gate passed.

## Evidence Paths
- `docs/verification/issues/issue-000A/closeout.md`
- `docs/verification/issues/issue-000A/commands.txt`

## Final AGENTS.md
```markdown
# AGENTS.md

## Prime Directive
Build the Nerdeus ER Pod Shift Simulator as an operational simulation tool only.

## Hard Project Boundaries
- No PHI.
- No real patient identity.
- No clinical safety certification language.
- No EHR integration.
- No hidden scoring model.
- No optimizer before scoring.
- No unseeded simulation randomness.
- No major dependency without updating the dependency matrix.

## Required Closeout
Every task must end with:
1. Files changed
2. Commands run
3. Tests passed/failed
4. Evidence artifacts
5. Known limitations
6. Confirmation that non-PHI rules still pass

## Drift Correction
If the user corrects recurring Codex drift, update the relevant guardrail doc under `docs/codex/` before closing the task.

## Read Before Coding
- [Codex global invariants](docs/contracts/codex-global-invariants.md)
- [Non-PHI policy](docs/compliance/non-phi-policy.md)
- [Dependency decision matrix](docs/architecture/dependency-decision-matrix.md)
- [Reproducibility contract](docs/contracts/reproducibility-contract.md)
- [Drift traps](docs/codex/drift-traps.md)
- [Codex operating rules](docs/codex/codex-operating-rules.md)
- [Forbidden implementation patterns](docs/codex/forbidden-implementation-patterns.md)
```

## Link Confirmation
- `AGENTS.md` links to deeper docs under `docs/contracts/`, `docs/compliance/`, `docs/architecture/`, and `docs/codex/`.
- The linked docs exist and resolve locally.

## Project Plan Duplication Check
- `AGENTS.md` does not duplicate the full project plan. It contains only the prime directive, hard boundaries, closeout requirements, drift correction rule, and read-before-coding links.

## Known Limitations
- The non-PHI scanner does not exist yet, so scanner execution was not possible in this issue.

## Non-PHI Confirmation
- Non-PHI rules still pass by inspection: only guardrail docs, an issue template, and verification docs were added. PHI examples appear only as prohibited terms in policy text.

## Next Recommended Issue
- Issue 000B, to standardize future Codex issue structure.
