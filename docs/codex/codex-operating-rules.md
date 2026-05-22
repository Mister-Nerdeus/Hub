# Codex Operating Rules

Codex work in this repository must preserve the project as an operational ER pod shift simulator. It must not become a clinical safety tool, EHR product, patient record system, or hidden optimization engine.

## Before Coding

1. Read `AGENTS.md` and the guardrail docs linked from it.
2. Confirm the issue has explicit dependencies, non-goals, commands, acceptance gates, and evidence requirements.
3. Start from a clean checkpoint when possible. If the tree is dirty, identify user-owned changes and do not revert them.
4. Reproduce failing behavior first when the issue fixes or validates behavior.

## Implementation Rules

- Use existing repo patterns before adding abstractions.
- Keep dependencies minimal. A major dependency requires a dependency matrix update.
- Keep contracts explicit across TypeScript, Python, API payloads, fixtures, and persisted JSON.
- Validate exported or imported plan JSON with `node scripts/validate-plan-contract.mjs <path>` before using it as evidence.
- Use deterministic ordering for exported plans, fixtures, reports, and proof artifacts.
- Use seeded randomness only. The same plan, scenario, assumption set, and seed must reproduce the same simulation output.
- Use operational terms such as `occupied room`, `room load`, `abstract patient load`, and `operational burden`.
- Do not introduce PHI fields, real patient identity, diagnoses, clinical notes, EHR imports, or safety certification claims.
- Treat local verification artifacts as the closeout authority for this project stage.
- Do not add, expand, or rely on GitHub Actions unless the user explicitly requests it.

## Evidence Rules

Every issue must write:

```text
docs/verification/issues/issue-XXX/closeout.md
docs/verification/issues/issue-XXX/commands.txt
```

Use `commands.txt`, `test-output.txt`, `screenshots/`, `api-responses/`, and `sample-json/` under the same issue folder when they are relevant.
Issue folders from Issue 015 forward are checked by `node scripts/check-docs-contracts.mjs`; missing closeouts, missing command logs, and missing issue-specific required evidence must fail the docs gate.
When an issue creates a phase-level evidence gate, wire the required phase evidence files into `node scripts/check-docs-contracts.mjs` before closing the issue so the documentation claim and local checker behavior stay aligned.
Phase 3 manual assignment evidence is docs-gated by `node scripts/check-docs-contracts.mjs`; the gate requires the Phase 3 evidence doc, checklist, Issue 038 scoring output, warning output, screenshot, commands, and closeout artifacts to exist and remain non-empty.
Command evidence must come from local commands. The full local verifier must be run from a stopped Docker state when an issue changes runtime, API, web, shared contracts, or local verification behavior.
Use `npm run evidence:local` when a task needs a consolidated local evidence pack for the current repository state.

## Do Not Close Unless

The issue may not be marked complete unless:

1. Required files exist.
2. Required tests pass or failures are documented.
3. Required evidence artifact exists.
4. Non-PHI scanner passes when present.
5. Dependency matrix is unchanged or intentionally updated.
6. Closeout evidence is written to `docs/verification/issues/issue-XXX/closeout.md`.
7. Local command evidence is written to `docs/verification/issues/issue-XXX/commands.txt`.

## Guardrail Maintenance

When the user corrects repeated drift, update the closest guardrail document in `docs/codex/`. If no existing document fits, create a concise one and link it from `AGENTS.md`.
