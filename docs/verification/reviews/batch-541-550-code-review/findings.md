# Batch 541-550 Code Review Findings

## Findings Fixed

1. `packages/shared/src/floorplans/splitBayFixtureBridge.ts` failed open for unknown occupancy object IDs by treating them as ordinary patient-care rooms. This could allow future storage, support, hallway, or wall-like fixture IDs to enter ratio or assignment math if a selector was called before the semantic registry was updated.

   Fix: unknown IDs now throw `unsupported canonical occupancy object`, and shared tests prove the selector fails closed.

2. `scripts/check-canonical-hardening-registry.mjs` did not validate a durable registry artifact for the new hardening gates.

   Fix: added `docs/verification/canonical-hardening-gate-registry.json` and hardened the registry gate to validate batch ID, required package-script coverage, and script path shape.

3. `scripts/check-canonical-scenario-preflight.mjs` did not include manual-review packet and canonical-hardening registry status in the final hardening readiness set.

   Fix: scenario preflight now requires `manualReviewPacketStatus` and `canonicalHardeningGateStatus` before the final gate can pass.

## Review Result

No geometry mutation, Dockerfile change, new dependency, simulation behavior, optimizer behavior, PHI field, EHR workflow, or clinical safety certification language was introduced.
