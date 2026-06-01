# Floorplan Door Exit Destination Model

This model makes boundary geometry operationally visible without adding route calculation, assignment behavior, scoring, simulation, or optimizer behavior.

## Perimeter Walls

`PerimeterWallContract` stores layout-owned perimeter wall segments in feet. Segments are labeled, locked if needed, and always block travel unless interrupted by entry/exit geometry.

## Entry / Exit Points

`EntryExitContract` stores first-class entries and exits such as main entry, EMS entry, staff entry, hallway connections, and external exits. Each object has a destination label and does not represent a patient-care room.

## Door Destinations

`DoorDestinationContract` stores where a room door or door-like support access point leads using operational labels such as hallway, room, zone, entry/exit, external, or unknown. Unknown is explicit and produces warnings.

## Validation

Door destination validation warns on unknown destinations and blocks references to deleted layout objects. The TypeScript shared contract and Python API contract both accept the saved boundary, entry/exit, support access, and door-destination fields. This is geometry readiness validation only. It does not certify staffing, clinical safety, patient outcomes, or route accuracy.
