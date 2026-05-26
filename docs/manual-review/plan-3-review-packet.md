# plan-3 Manual Visual Review Packet

## Scope

- Review is limited to operational layout plausibility.
- Review does not authorize default fixture promotion.
- Review does not approve clinical safety, staffing compliance, or private-source comparison.
- No private source file, source screenshot, source path, or raw source text is included.

## Safe Rendered Evidence

- Rendered image: docs/verification/rendered-plans/plan-3-rendered-review.png
- Rendered image hash: d392f9e9621260299fd65a6d20c7e3a2064aff5effdefab797f43b3ca75be8fe
- Render metadata: docs/verification/rendered-plans/plan-3-rendered-review.metadata.json
- Rendered from corrected saved copy: true
- Private source screenshot stored: false
- Private-source comparison claim made: false

## Draw Count Proof

- Rooms: 4 expected, 4 drawn
- Doors: 4 expected, 4 drawn
- Hallways: 21 expected, 21 drawn
- Path nodes: 9 expected, 9 drawn
- Path edges: 8 expected, 8 drawn

## Route And Export Status

- Source default plan id: default-er-layout-plan-3
- Repaired saved copy: packages/shared/fixtures/source-corrections/plan-3/plan-3-route-repaired-saved-copy.json
- Repaired saved copy hash: c0124c81e0c1d888e54133d39ce4448df0a0c27474817eef289eb287f2066f9a
- Route readiness: ready
- Simulation-ready export: packages/shared/fixtures/source-corrections/plan-3/plan-3-simulation-ready-export.json
- Simulation-ready export hash: 7e3f70544eb781beb3b0175cca4c545e17b6a9690a9fb2e5213305af6ef9c41e
- Simulation-ready export status: simulation_ready

## Reviewer Checklist

- Room placement plausibility
- Door placement plausibility
- Hallway/path connectivity plausibility
- Station placement plausibility
- Labels/readability
- Known limitations accepted

## Allowed Structured Decisions

- manual_review_required
- approved_for_promotion_review
- approved_with_notes
- rejected_needs_correction

## Current Decision State

- manual_review_required
- No reviewer decision artifact is present in this packet.
- Codex has not approved visual correctness.

## Blocking Issues

- None

## Warning Issues

- None

## Limitations

- Generated route links do not claim exact walking route truth.
- No manual visual approval or default fixture promotion is claimed.
- Route repair uses deterministic graph connectivity rules on corrected saved-copy JSON only.
- Simulation-ready validation confirms contract shape and route access only; no clinical safety claim is made.
- The rendered plan is repo-safe evidence for human review only.
- Future promotion review remains blocked until an explicit structured manual decision exists.
