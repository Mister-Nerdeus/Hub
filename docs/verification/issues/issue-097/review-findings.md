# Issue 097 Review Findings

Issue 097 is audit-only. It records review findings for Issues 082-096 without changing simulator, API, optimizer, UI, or persistence behavior.

## Failure Reproduction

Finding: the current batch cannot be reviewed issue-by-issue from a single deterministic index.

Failure condition:

- `docs/verification/issues/issue-097/batch-082-096-file-index.md` did not exist before this issue.
- The existing docs gate grouped Issues 082-096 under the broad `Phase Simulation Execution evidence` label.
- Reviewers had to inspect each issue folder and infer primary touched files from broad phase evidence instead of using a deterministic issue-level index.

Follow-up:

- Issue 105 creates the durable issue-level evidence index gate for Issues 082+.

## Findings

### 1. TypeScript/Python simulation contract parity

Risk: TypeScript shared validation and Python API schema validation can drift for equivalent payloads.

Follow-up: Issue 098

Required proof:

- Shared and API validators run the same canonical fixtures.
- Valid fixture passes both validators.
- Invalid identity-like and claim-wording fixtures fail both validators.
- Parity output records expected and actual result for every fixture.

### 2. Missed-task semantics are ambiguous

Risk: a task outside the shift window can be read as attempted or not started unless the miss reason is finite and explicit.

Follow-up: Issue 099

Required proof:

- Ambiguous legacy miss reason is rejected.
- V1 not-started miss reason is accepted.
- Not-started missed tasks emit no start events and consume no nurse busy minutes.

### 3. Queue contract overclaims pause/resume

Risk: queue contracts may accept pause/resume actions that the engine does not implement.

Follow-up: Issue 100

Required proof:

- Pause/resume actions are rejected by current validators.
- Existing queue actions still validate.
- Deterministic queue output remains byte-stable.

### 4. Optimizer candidate constraints are incomplete

Risk: generated candidate assignments can include unknown task or nurse references, or alter tasks that should remain unassigned.

Follow-up: Issue 101

Required proof:

- Constraint adapter rejects unknown task IDs.
- Constraint adapter rejects unknown nurse IDs.
- Base unassigned tasks remain unassigned.
- Candidates still run through shared variant and scoring paths.

### 5. Optimizer assignment source can be misread

Risk: optimizer-generated candidate assignments can be confused with manually entered coverage.

Follow-up: Issue 102

Required proof:

- Manual assignment reason remains unchanged.
- Optimizer-generated assignments use a distinct auditable reason.
- Variant runner accepts both supported assignment sources.

### 6. Persistence reads and listing need hardening

Risk: list responses are not explicitly bounded and persisted JSON may be returned without read-time validation.

Follow-up: Issue 103

Required proof:

- List endpoint has default and max limits.
- Offset is supported.
- Get endpoint validates persisted JSON before returning it.
- Invalid persisted JSON returns deterministic error content.

### 7. Command output evidence is weak

Risk: closeout can list commands without durable captured output.

Follow-up: Issue 104

Required proof:

- Issues 104+ require at least one non-empty output artifact.
- Empty output artifacts fail.
- `commands.txt` alone does not satisfy closeout proof.

### 8. Batch evidence mapping is broad

Risk: phase-level gates do not report missing evidence by exact issue number.

Follow-up: Issue 105

Required proof:

- Issues 082+ map to exact required evidence paths.
- Missing or empty evidence reports the exact issue number.
- Index ordering and duplicates are checked.

### 9. Determinism cleanup is not locked

Risk: deterministic simulation and optimizer output can rely on broad tests without byte-stable cleanup tests.

Follow-up: Issue 106

Required proof:

- Repeated simulation output is byte-stable.
- Repeated optimizer output is byte-stable.
- Cleanup removes dead/no-op code without feature changes.

## Source Boundary Confirmation

The review findings keep the simulator as an operational ER pod modeling tool only. No PHI, EHR integration, clinical certification wording, hidden scoring path, or unseeded simulation randomness is introduced.
