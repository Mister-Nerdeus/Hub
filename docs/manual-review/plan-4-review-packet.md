# plan-4 Manual Visual Review Packet

## Scope

- Review is limited to operational layout plausibility.
- Review does not authorize default fixture promotion.
- Review does not approve clinical safety, staffing compliance, or private-source comparison.
- No private source file, source screenshot, source path, or raw source text is included.

## Safe Rendered Evidence

- Rendered image: docs/verification/rendered-plans/plan-4-rendered-review.png
- Rendered image hash: b41e41b5f7a84dcf009783f9206ace82da5ff0bc1fbac9fdbe80fa0e8b81a583
- Render metadata: docs/verification/rendered-plans/plan-4-rendered-review.metadata.json
- Rendered from corrected saved copy: true
- Private source screenshot stored: false
- Private-source comparison claim made: false

## Draw Count Proof

- Rooms: 5 expected, 5 drawn
- Doors: 5 expected, 5 drawn
- Hallways: 23 expected, 23 drawn
- Path nodes: 10 expected, 10 drawn
- Path edges: 9 expected, 9 drawn

## Route And Export Status

- Source default plan id: default-er-layout-plan-4
- Repaired saved copy: packages/shared/fixtures/source-corrections/plan-4/plan-4-route-repaired-saved-copy.json
- Repaired saved copy hash: b770537770866239f0fec0371ea542678f0b7de60493abd9ed795160e9820d40
- Route readiness: ready
- Simulation-ready export: packages/shared/fixtures/source-corrections/plan-4/plan-4-simulation-ready-export.json
- Simulation-ready export hash: 5c647d9e40c4cc631f37a0c563bc2290c521e7a2a6d745f48ea9d4774e719744
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
