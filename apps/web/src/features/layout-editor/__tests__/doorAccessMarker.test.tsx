import { buildDoorShapeViewModel } from "../doorShapeViewModel";
import type { LayoutObjectRenderItem } from "../layoutObjectRenderPipeline";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function doorItem(widthPixels: number, heightPixels: number): LayoutObjectRenderItem {
  return {
    objectType: "door",
    objectId: `door-${widthPixels}-${heightPixels}`,
    hitTargetKey: "door-test",
    ariaLabel: "Door test",
    displayRectPixels: { xPixels: 10, yPixels: 20, widthPixels, heightPixels },
    sourceGeometry: {
      objectType: "door",
      id: "door-test",
      label: "Door test",
      ownerKind: "room",
      ownerId: "room-01",
      wall: widthPixels >= heightPixels ? "north" : "east",
      offsetFeet: 1,
      widthFeet: 4
    }
  } as LayoutObjectRenderItem;
}

const horizontal = buildDoorShapeViewModel(doorItem(40, 6));
const vertical = buildDoorShapeViewModel(doorItem(6, 40));

assert(horizontal.orientation === "horizontal", "wide door should render horizontal capsule");
assert(vertical.orientation === "vertical", "tall door should render vertical capsule");
assert(horizontal.hitSlopPixels > 0, "door hit target should preserve selectable slack");
assert(horizontal.markerWidthPixels > horizontal.markerHeightPixels, "horizontal marker dimensions should be horizontal");
assert(vertical.markerHeightPixels > vertical.markerWidthPixels, "vertical marker dimensions should be vertical");
