# Batch 391-400 Post-Review Findings

## Findings

1. Live runtime misdeployment: `https://hub.nerdeus.com/` initially served Vite development runtime fragments (`/@vite/client`, `/@react-refresh`, `/src/main.tsx`) instead of built production assets.
   - Evidence: `test-output/live-site-runtime.txt`
   - Resolution: stopped the local Hub dev compose stack and started `docker-compose.production.yml` on `WEB_HOST_PORT=5180`, then ran migrations.
   - Post-fix evidence: `test-output/live-site-runtime-after-production-deploy.txt`

2. No batch source regression found in the reviewed floorplan/editor UX scope.
   - Shared tests, web tests, web build, floorplan/editor UX gates, assignment overlay gate, door authoring gate, presentation rendering gate, default fixture immutability gate, no-PHI scan, docs contract gate, private-source artifact gate, product naming gate, and production Docker smoke all passed.

## Review Boundary

This review did not claim manual visual approval, exact CAD/source parity, clinical safety certification, staffing compliance certification, fixture promotion, optimizer readiness, or full-shift simulation readiness.
