# Active Floorplan Workflow Status

Batch 694-703 converts the workspace toward one user-facing active floorplan.

Current UX problem recorded at Issue 694:

- Normal floorplan review exposed too many visible saved floorplan copies.
- Draft, save, reload proof, recovery draft, record ID, and JSON backup language competed with the actual floorplan workflow.
- Editor state could be separate from the selected saved floorplan.
- Manual Assignment could rely on editor-captured layout state instead of the selected floorplan.
- Scenario comparison used static canonical context instead of active floorplan context.

Boundary status:

- Door authoring regression scripts remain wired.
- Split-room authoring regression scripts remain wired.
- No simulation expansion is in scope.
- No optimizer, assignment recommendation, collaboration, clinical safety scoring, staffing compliance certification, patient outcome prediction, PHI, or EHR integration is in scope.

Workflow status remains not_ready until Issue 703 passes the final GO / NO-GO audit.
