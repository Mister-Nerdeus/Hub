# Layout Editor Architecture

## Purpose
The layout editor will let a local user change ER pod geometry and compare measurable operational deltas after the shared geometry, path, and simulation contracts exist.

This is an architecture contract only. It does not add draggable UI, resize handles, persistence changes, path recalculation, or simulation reruns from edited layout.

## Source Of Truth
- Feet are source of truth.
- Pixels are display only.
- Persisted geometry must store real-world feet values, not canvas or DOM pixel values.
- Zoom and pan may change rendering transforms only; they must not mutate source geometry.

## Editable Objects
Editable objects must have stable IDs and feet-based geometry:
- rooms
- doors
- nurse stations/desks
- hallways
- EMS entry
- trauma zone
- provider/pharmacy zone

Stable IDs are required so selection, validation, path graph references, and future simulation delta integration can address the same object across edits.

## Component Boundaries
- Shared geometry contract: owns persisted feet-based layout data, object kinds, stable IDs, and validation result shape.
- Editor state: owns selected IDs, draft edit proposals, snap mode, validation warnings, and dirty state.
- Renderer: projects feet geometry into pixels for display only.
- Validator: accepts proposed feet geometry and returns either valid geometry or deterministic validation warnings.
- Path sync checker: verifies that path graph references still resolve after edits and reports deterministic warnings when references would break.
- Simulation delta integration: named future dependency that consumes validated geometry and rerun output to compare operational metrics.

## Edit Flow
1. Load validated feet-based geometry.
2. Render objects through a feet-to-pixels coordinate transform.
3. Create an edit proposal in feet.
4. Apply snap rules in feet.
5. Validate geometry and path graph references.
6. Commit the draft only when geometry is valid, or keep deterministic validation warnings attached to the proposal.
7. Defer simulation delta integration until a later issue adds rerun and comparison behavior.

## Path Graph Contract
Path graph references must not silently break. Any edit that moves, removes, or changes an object referenced by path nodes or path edges must either keep the reference valid or produce deterministic validation warnings.

## Operational Boundary
Layout editor outputs are operational layout-friction inputs. They do not represent clinical claims, staffing certification, patient sentiment, staff sentiment, or recommendations.
