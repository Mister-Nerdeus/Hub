# Operational Map Style Contract

This contract defines the render target for the floorplan editor and presentation map. The map is an operational approximation for ER Pod Shift Simulator. It is not exact CAD/source parity, does not certify clinical or staffing safety, and does not approve visual correctness without structured human review artifacts.

## Modes

### Edit Geometry

- Shows the editable geometry surface, grid, labels, resize handles, selection outlines, inspector, and geometry tools.
- Uses neutral room fills so geometry edits remain legible.
- Door and room edits apply only to editable layouts or saved copies, never default source fixtures.

### Assignment View

- Shows synthetic manual assignment colors on rooms.
- Keeps enough grid and selection affordance for operational review, but mutes debug chrome.
- Highlights unassigned occupied rooms and warning states without implying optimization or recommendations.

### Presentation View

- Shows a clean operational map with minimal inspector chrome and no grid clutter.
- Uses assignment colors, support-zone styling, capsule door markers, hallway arrows, and presentation nurse-station shapes.
- Presents hallway arrows as directional visual aids only, not route-truth claims.

## Room Styling

- Assigned rooms use the synthetic nurse color assigned by manual assignment state.
- Unassigned occupied rooms use a warm highlight fill and label emphasis.
- Warning rooms use a distinct outline and non-animated marker treatment.
- Support/neutral zones use muted operational colors distinct from nurse assignment colors.
- Inactive or unoccupied rooms use a low-contrast neutral fill.
- Labels must remain centered, readable, and independent of viewport-scaled font tricks.

## Door Access Markers

- Door access markers render as capsule/oval markers instead of plain debug rectangles.
- Horizontal doors render as horizontal capsules.
- Vertical doors render as vertical capsules.
- Selected doors remain obvious through a ring or glow.
- Invalid doors use a warning outline without changing the saved geometry contract.

## Hallway And Area Styling

- Hallways use muted open-area styling in edit mode and clearer operational paths in presentation mode.
- Presentation hallway arrows indicate approximate movement direction only.
- EMS and hallway entry labels must remain readable.
- Provider/pharmacy areas remain visually separated from assignment-colored rooms.

## Nurse Station Styling

- Edit mode may render stations as simple editable rectangles.
- Presentation mode renders nurse stations as curved or desk-like operational shapes with clear labels.
- Presentation station styling is render-layer only and must not mutate geometry.

## Non-Claims

- Operational approximation only.
- No exact CAD/source parity claim.
- No clinical safety certification claim.
- No staffing compliance certification claim.
- No manual visual approval claim.
- No fixture promotion.
