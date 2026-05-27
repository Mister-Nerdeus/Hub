# Access Gate Identifier Migration Plan

## Current Identifier State

The visible workspace access screen now uses professional copy, but internal paths and code identifiers still retain legacy access-gate names. Those names are implementation details and should not be treated as product copy.

Current internal areas:

- `apps/web/src/features/demo-pin/`
- `packages/shared/src/demo-pin/`
- `scripts/check-demo-pin-gate.mjs`
- Existing tests and browser proof helpers that validate the access gate.

## Future Names

- `WorkspaceAccessGate`
- `WorkspaceAccessEntryScreen`
- `workspaceAccessState`
- `workspaceAccessPolicy`
- `check-workspace-access-gate`

## Safe Migration Order

1. Add compatibility exports for the new workspace access names while preserving existing imports.
2. Rename React components and tests in the web feature folder.
3. Rename shared policy modules and re-export legacy names for one batch.
4. Rename scripts and package scripts after local gates prove parity.
5. Remove compatibility aliases only after a dedicated evidence batch passes.

## Gate Expectation

Visible UI is already clean. Identifier migration is optional future cleanup and must not change unlock behavior, cooldown timing, lockout timing, session storage semantics, fixture data, simulation behavior, optimizer behavior, or non-PHI compliance.
