# Boundary Door Destination Status

Status: `not_ready` until issues 833-843 pass local evidence.

## Preflight Gap

- The editor did not have a complete layout-owned perimeter wall truth chain.
- Entry/exit points were not consistently modeled as first-class operational geometry.
- Door destinations did not consistently show where doors lead in normal UI.
- Route-readiness cannot be trusted until contract, renderer, inspector, validation, save/reload, browser proof, root scripts, and final GO/NO-GO all pass.

## Scope Boundaries

- Do not implement routing.
- Do not implement simulation.
- Do not implement durable assignment.
- Do not implement scoring, optimizer behavior, nurse profiles, room loads, reports, staffing compliance claims, clinical safety claims, patient outcome claims, EHR integration, or PHI.

## Current Model

- Perimeter walls are saved floorplan geometry with blocking locked segments.
- Entry/exit points are saved selectable geometry with visible destinations.
- Door destinations are operational leads-to labels; unknown destinations are explicit and create warnings.
- Technical destination IDs stay in advanced inspector details.
- The final model must include a layout-owned perimeter wall, entry/exit points, and door destinations before GO.

## Local Proof Chain

1. Preflight gap.
2. Perimeter wall contract.
3. Entry/exit contract.
4. Door destination contract.
5. Renderer.
6. Inspector controls.
7. Validation.
8. Save/reload and JSON import/export.
9. Browser proof.
10. Root scripts and documentation.
11. Final GO/NO-GO.
