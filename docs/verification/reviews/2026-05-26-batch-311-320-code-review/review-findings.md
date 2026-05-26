# Batch 311-320 Code Review Findings

## Finding 1: Fresh path sync and matrix readiness omitted some audit blockers

Severity: high

`isFreshPathSyncEligible` and the cross-plan route/export matrix did not require empty orphan path nodes, invalid path edges, or blocked required edge lists. The matrix also did not include `roomsMissingDoor` or `exactParityClaimMade` in its ready/export proof.

Fix: fresh path sync and route/export matrix readiness now require every recomputed audit blocker class to be clear before a plan can be classified ready. Tests cover dangling, orphan, blocked, and missing-door matrix negatives.

## Finding 2: Protocol stage could write a passed status after collecting failures

Severity: medium

`scripts/check-corrected-plan-route-repair.mjs --stage protocol` accumulated failures for missing protocol requirements but still wrote `routeRepairProtocolStatus: "passed"`.

Fix: protocol status now reflects the stage-local failure count, and the protocol evidence output uses the computed status.

## Finding 3: Path repair metadata should stay optional for non-repair plans

Severity: low

The route-repair metadata tag is required for generated/repaired path nodes and edges, but ordinary path graph fixtures must remain valid without route-repair metadata.

Fix: the plan contract now names that validation path explicitly with `requireOnlyKeys` for path nodes/edges while the route-repair audit and evidence tests continue to enforce generated/repaired tags.
