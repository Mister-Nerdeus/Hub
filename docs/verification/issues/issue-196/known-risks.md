# Issue 196 Known Risks

Date: 2026-05-24

## P0 Risks

None open in the audited Issues 187-195 evidence.

## Deferred Non-P0 Risks

| Risk | Severity | Follow-up |
| --- | --- | --- |
| Runtime no-PHI text guards are deterministic guardrails, not exhaustive identity detection. | P2 | `FOLLOW-UP-196-A` |
| Production Dockerfiles are build-shape proof only and do not add auth, secret management, domain routing, monitoring, or deployment operations. | P2 | `FOLLOW-UP-196-B` |
| Evidence scaffolding can create compliant placeholders; issue closeout still depends on replacing placeholders with real command output. | P2 | `FOLLOW-UP-196-C` |
| The web build can still report bundle-size warnings; this is not a current correctness blocker. | P3 | `FOLLOW-UP-196-D` |

## Non-Claims

This audit does not add product behavior, clinical safety certification, production readiness certification, legal staffing compliance, PHI support, EHR integration, or optimizer behavior.
