# Batch 082-096 File Index

This index maps each issue in the simulation execution batch to primary touched files and exact evidence paths. It is an audit artifact only.

## Issue 082 - Simulation Run Contract Foundation

Primary files:
- `packages/shared/src/simulation/simulationRunContract.ts`
- `packages/shared/tests/simulation-run-contract.test.mjs`
- `packages/shared/fixtures/simulation-run-contract-basic.json`
- `packages/shared/src/index.ts`

Evidence:
- `docs/verification/issues/issue-082/closeout.md`
- `docs/verification/issues/issue-082/commands.txt`
- `docs/verification/issues/issue-082/simulation-run-contract-output.json`

Known hardening follow-up:
- Issue 098

## Issue 083 - Deterministic Task Execution Engine V1

Primary files:
- `packages/shared/src/simulation/simulationExecution.ts`
- `packages/shared/src/simulation/simulationRunContract.ts`
- `packages/shared/tests/simulation-execution.test.mjs`
- `packages/shared/fixtures/simulation-run-basic.json`
- `packages/shared/fixtures/simulation-run-surge.json`

Evidence:
- `docs/verification/issues/issue-083/closeout.md`
- `docs/verification/issues/issue-083/commands.txt`
- `docs/verification/issues/issue-083/simulation-output-basic.json`
- `docs/verification/issues/issue-083/simulation-output-surge.json`

Known hardening follow-up:
- Issue 099

## Issue 084 - Nurse Queue and Interrupt Handling

Primary files:
- `packages/shared/src/simulation/nurseQueue.ts`
- `packages/shared/src/simulation/nurseQueueContract.ts`
- `packages/shared/src/simulation/simulationExecution.ts`
- `packages/shared/tests/nurse-queue.test.mjs`
- `packages/shared/fixtures/nurse-queue-output.json`

Evidence:
- `docs/verification/issues/issue-084/closeout.md`
- `docs/verification/issues/issue-084/commands.txt`
- `docs/verification/issues/issue-084/nurse-queue-output.json`

Known hardening follow-up:
- Issue 100

## Issue 085 - Deterministic Path Travel Time Calculator

Primary files:
- `packages/shared/src/pathing/pathTravelContract.ts`
- `packages/shared/src/pathing/pathTravelTime.ts`
- `packages/shared/src/simulation/simulationExecution.ts`
- `packages/shared/tests/path-travel-time.test.mjs`
- `packages/shared/fixtures/path-travel-basic-output.json`

Evidence:
- `docs/verification/issues/issue-085/closeout.md`
- `docs/verification/issues/issue-085/commands.txt`
- `docs/verification/issues/issue-085/path-travel-output.json`

Known hardening follow-up:
- Issue 106

## Issue 086 - Simulation Delay and Burden Scoring

Primary files:
- `packages/shared/src/simulation/simulationScoring.ts`
- `packages/shared/src/simulation/simulationScoringContract.ts`
- `packages/shared/tests/simulation-scoring.test.mjs`
- `packages/shared/fixtures/simulation-score-basic.json`
- `packages/shared/fixtures/simulation-score-surge.json`

Evidence:
- `docs/verification/issues/issue-086/closeout.md`
- `docs/verification/issues/issue-086/commands.txt`
- `docs/verification/issues/issue-086/scoring-output.json`

Known hardening follow-up:
- Issue 099

## Issue 087 - Simulation-Derived Operational Report

Primary files:
- `packages/shared/src/reports/simulationOperationalReport.ts`
- `packages/shared/tests/simulation-operational-report.test.mjs`
- `packages/shared/fixtures/simulation-operational-report-basic.json`
- `packages/shared/fixtures/simulation-operational-report-surge.json`
- `packages/shared/src/index.ts`

Evidence:
- `docs/verification/issues/issue-087/closeout.md`
- `docs/verification/issues/issue-087/commands.txt`
- `docs/verification/issues/issue-087/report-output.json`

Known hardening follow-up:
- Issue 105

## Issue 088 - Web Simulation Timeline Proof Surface

Primary files:
- `apps/web/src/features/simulation/SimulationTimelineProof.tsx`
- `apps/web/src/features/simulation/simulationTimelineViewModel.ts`
- `apps/web/src/features/simulation/simulationTimelineViewModel.test.ts`
- `apps/web/src/fixtures/simulationTimelineProof.ts`
- `apps/web/src/App.tsx`

Evidence:
- `docs/verification/issues/issue-088/closeout.md`
- `docs/verification/issues/issue-088/commands.txt`
- `docs/verification/issues/issue-088/screenshots/simulation-timeline-proof.png`

Known hardening follow-up:
- Issue 105

## Issue 089 - Simulation Scenario Comparison

Primary files:
- `packages/shared/src/comparison/simulationScenarioComparison.ts`
- `packages/shared/tests/simulation-scenario-comparison.test.mjs`
- `packages/shared/fixtures/simulation-comparison-basic-vs-surge.json`
- `packages/shared/src/index.ts`

Evidence:
- `docs/verification/issues/issue-089/closeout.md`
- `docs/verification/issues/issue-089/commands.txt`
- `docs/verification/issues/issue-089/comparison-output.json`

Known hardening follow-up:
- Issue 105

## Issue 090 - Assignment Variant Runner

Primary files:
- `packages/shared/src/simulation/assignmentVariantRunner.ts`
- `packages/shared/src/simulation/assignmentVariantRunContract.ts`
- `packages/shared/tests/assignment-variant-runner.test.mjs`
- `packages/shared/fixtures/assignment-variant-run-output.json`
- `packages/shared/src/index.ts`

Evidence:
- `docs/verification/issues/issue-090/closeout.md`
- `docs/verification/issues/issue-090/commands.txt`
- `docs/verification/issues/issue-090/variant-run-output.json`

Known hardening follow-up:
- Issue 102

## Issue 091 - Optimizer Contract Boundary Only

Primary files:
- `packages/shared/src/optimization/optimizationContract.ts`
- `packages/shared/tests/optimization-contract.test.mjs`
- `packages/shared/src/index.ts`
- `docs/contracts/optimization-contract.md`

Evidence:
- `docs/verification/issues/issue-091/closeout.md`
- `docs/verification/issues/issue-091/commands.txt`
- `docs/verification/issues/issue-091/optimization-contract-output.json`

Known hardening follow-up:
- Issue 101

## Issue 092 - Baseline Assignment Optimizer V1

Primary files:
- `packages/shared/src/optimization/baselineAssignmentOptimizer.ts`
- `packages/shared/src/optimization/optimizationContract.ts`
- `packages/shared/tests/baseline-assignment-optimizer.test.mjs`
- `packages/shared/fixtures/baseline-optimizer-output.json`
- `packages/shared/src/index.ts`

Evidence:
- `docs/verification/issues/issue-092/closeout.md`
- `docs/verification/issues/issue-092/commands.txt`
- `docs/verification/issues/issue-092/optimizer-output.json`

Known hardening follow-up:
- Issue 101

## Issue 093 - Optimizer Audit Trail

Primary files:
- `packages/shared/src/optimization/optimizerAuditContract.ts`
- `packages/shared/src/optimization/optimizerAuditTrail.ts`
- `packages/shared/tests/optimizer-audit-trail.test.mjs`
- `packages/shared/fixtures/optimizer-audit-output.json`
- `packages/shared/src/index.ts`

Evidence:
- `docs/verification/issues/issue-093/closeout.md`
- `docs/verification/issues/issue-093/commands.txt`
- `docs/verification/issues/issue-093/optimizer-audit-output.json`

Known hardening follow-up:
- Issue 102

## Issue 094 - Optimizer Web Proof Surface

Primary files:
- `apps/web/src/features/optimization/OptimizerProof.tsx`
- `apps/web/src/features/optimization/optimizerProofViewModel.ts`
- `apps/web/src/features/optimization/optimizerProofViewModel.test.ts`
- `apps/web/src/fixtures/optimizerProof.ts`
- `apps/web/src/App.tsx`

Evidence:
- `docs/verification/issues/issue-094/closeout.md`
- `docs/verification/issues/issue-094/commands.txt`
- `docs/verification/issues/issue-094/screenshots/optimizer-proof.png`

Known hardening follow-up:
- Issue 102

## Issue 095 - Simulation API Validation Endpoint

Primary files:
- `apps/api/app/routes/simulation.py`
- `apps/api/app/schemas/simulation.py`
- `apps/api/app/main.py`
- `apps/api/tests/test_simulation_contract.py`
- `docs/contracts/api-simulation-contract.md`

Evidence:
- `docs/verification/issues/issue-095/closeout.md`
- `docs/verification/issues/issue-095/commands.txt`
- `docs/verification/issues/issue-095/api-responses/simulation-validate-response.json`

Known hardening follow-up:
- Issue 098

## Issue 096 - Simulation Run Persistence

Primary files:
- `apps/api/alembic/versions/0003_simulation_runs.py`
- `apps/api/app/models.py`
- `apps/api/app/repositories/simulation_runs.py`
- `apps/api/app/routes/simulation.py`
- `apps/api/app/schemas/simulation.py`
- `apps/api/tests/test_simulation_persistence.py`

Evidence:
- `docs/verification/issues/issue-096/closeout.md`
- `docs/verification/issues/issue-096/commands.txt`
- `docs/verification/issues/issue-096/api-responses/create-simulation-run-response.json`

Known hardening follow-up:
- Issue 103
