# Floorplan Geometry Model

## Editable Geometry Layers

Normal editor rendering is classified into grid, reference overlay, locked geometry, editable geometry, selection handles, measurement overlay, label overlay, and popover overlay.

## Reference Overlay Behavior

Reference overlays are locked, toggleable, faded, non-editable, and not assignment targets. Unknown visuals are quarantined as reference overlay or excluded from normal editable geometry.

## Hallway Geometry

Hallways are first-class editable geometry with source IDs, labels, dimensions, orientation, renderer styling, hit testing, and inspector controls.

## Wall Geometry

Outer walls and boundaries are modeled as wall geometry with source IDs and travel-blocking semantics. They render distinctly from rooms and support areas.

## Support And Storage Areas

Provider/pharmacy, storage, staff-only, blocked, and support areas are modeled separately from patient rooms and are not assignment targets.

## Split Rooms

A split room is one physical parent room with two assignable bed positions. Bed positions have stable IDs, labels such as 12A and 12B, relative bounds, and assignmentTarget set to true.

## Assignment Target Generation

Split-room bed positions derive stable assignment targets with targetKind split_room_bed_position and parentRoomId. Durable assignment persistence is still out of scope.

## Known Not-Yet-Implemented Items

- Durable assignment persistence.
- Nurse profile builder.
- Room load editor.
- Burden scoring, scenario simulation, optimizer, and management reports.
- Clinical safety, staffing compliance, or patient outcome claims.
