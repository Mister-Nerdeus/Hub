# Workspace UX Foundation Status

Milestone A turns the current proof/workbench layout into a full-page operational workspace shell for floorplan-centered workflow setup.

Current status: repair batch in progress. Local Workspace UX GO/NO-GO previously passed, but Milestone A repair issues 749-764 must pass before durable assignment foundation starts.

Workspace UX repair status:

- Durable assignment foundation remains not started until `docs/verification/workspace-ux-repair-manifest.json` reaches GO status.
- No durable assignment sets, scoring, scenario simulation, optimizer, reports, or clinical claims are implemented by this repair batch.
- Repair evidence is local-first and lives under `docs/verification/issues/issue-749/` through `docs/verification/issues/issue-764/`.

Implemented in Milestone A:

- Shell and full-page workspace frame.
- Compact workflow rail.
- Workflow stepper.
- Active floorplan hub.
- Compact readiness summary.
- Editor layout with canvas-first workspace.
- Bottom selected-object details panel.
- Advanced-only technical and developer evidence surfaces.

Not implemented in Milestone A:

- Durable assignment sets.
- Nurse profile builder.
- Room load editor.
- Scoring (Burden scoring).
- Simulation (Scenario simulation).
- Optimizer.
- Reports (Management reports).
- Clinical safety, staffing compliance, patient outcome, PHI, or EHR claims.

Next milestone: durable assignment foundation, after the repair GO/NO-GO passes.

Entry criteria for the durable assignment foundation:

- Keep the active floorplan as the source context.
- Add durable assignment data without adding scoring, simulation, optimizer, or report readiness claims.
- Preserve Advanced/Evidence as the home for technical proof surfaces.
- Keep non-PHI and no-EHR boundaries active.
