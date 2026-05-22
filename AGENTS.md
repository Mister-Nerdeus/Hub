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

## Local-First Verification
For this project stage, local verification artifacts are the source of truth. Do not add, expand, or rely on GitHub Actions unless the user explicitly requests it.

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
- [Local-first verification contract](docs/contracts/local-first-verification-contract.md)
- [Reproducibility contract](docs/contracts/reproducibility-contract.md)
- [Drift traps](docs/codex/drift-traps.md)
- [Codex operating rules](docs/codex/codex-operating-rules.md)
- [Forbidden implementation patterns](docs/codex/forbidden-implementation-patterns.md)
