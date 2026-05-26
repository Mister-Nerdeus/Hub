# plan-5 Manual Visual Review Packet

## Scope

- Review is limited to operational layout plausibility.
- Review does not authorize default fixture promotion.
- Review does not approve clinical safety, staffing compliance, or private-source comparison.
- No private source file, source screenshot, source path, or raw source text is included.

## Safe Rendered Evidence

- Rendered image: docs/verification/rendered-plans/plan-5-rendered-review.png
- Rendered image hash: b72d9b2bed6da9b80def581f74f2f94c37770c36ce37800f53e7a32289d3bb3e
- Render metadata: docs/verification/rendered-plans/plan-5-rendered-review.metadata.json
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

- Source default plan id: default-er-layout-plan-5
- Repaired saved copy: packages/shared/fixtures/source-corrections/plan-5/plan-5-route-repaired-saved-copy.json
- Repaired saved copy hash: 566e9fb46578feb64cfe9c586514a47670727e3ef41aa11d9d43634deeb28865
- Route readiness: ready
- Simulation-ready export: packages/shared/fixtures/source-corrections/plan-5/plan-5-simulation-ready-export.json
- Simulation-ready export hash: 0839ad8c71788d52510cd266b3e33920c4e7522797be3a43e248db79716828e8
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
