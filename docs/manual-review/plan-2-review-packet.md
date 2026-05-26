# plan-2 Manual Visual Review Packet

## Scope

- Review is limited to operational layout plausibility.
- Review does not authorize default fixture promotion.
- Review does not approve clinical safety, staffing compliance, or private-source comparison.
- No private source file, source screenshot, source path, or raw source text is included.

## Safe Rendered Evidence

- Rendered image: docs/verification/rendered-plans/plan-2-rendered-review.png
- Rendered image hash: 9829500cb5f82337181accb73b942eb8692d83b3dc4ef3c8dd187707a25f5641
- Render metadata: docs/verification/rendered-plans/plan-2-rendered-review.metadata.json
- Rendered from corrected saved copy: true
- Private source screenshot stored: false
- Private-source comparison claim made: false

## Draw Count Proof

- Rooms: 6 expected, 6 drawn
- Doors: 6 expected, 6 drawn
- Hallways: 18 expected, 18 drawn
- Path nodes: 12 expected, 12 drawn
- Path edges: 11 expected, 11 drawn

## Route And Export Status

- Source default plan id: default-er-layout-plan-2
- Repaired saved copy: packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repaired-saved-copy.json
- Repaired saved copy hash: b6e89c13f433f1dfb04304e301fd0f765f04603900d51f2cc15968ee25556c52
- Route readiness: ready
- Simulation-ready export: packages/shared/fixtures/source-corrections/plan-2/plan-2-simulation-ready-export.json
- Simulation-ready export hash: e2a8ef83794d364764bc19bb56ec40c2ab7a5982c53f7d0b6ba42bf581da333f
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
