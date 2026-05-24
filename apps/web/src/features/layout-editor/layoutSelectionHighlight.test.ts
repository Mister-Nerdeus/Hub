import {
  isLayoutObjectSelected,
  selectedClassName
} from "./layoutSelectionHighlight";
import type { LayoutSelectionObjectType } from "./layoutSelectionModel";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  }
};

const objectTypes: LayoutSelectionObjectType[] = ["room", "door", "station", "hallway", "zone"];

for (const objectType of objectTypes) {
  assert.equal(
    isLayoutObjectSelected({
      objectType,
      objectId: `${objectType}-01`,
      selectedObjectType: objectType,
      selectedObjectId: `${objectType}-01`
    }),
    true
  );
  assert.equal(
    isLayoutObjectSelected({
      objectType,
      objectId: `${objectType}-01`,
      selectedObjectType: objectType,
      selectedObjectId: `${objectType}-02`
    }),
    false
  );
}

assert.equal(selectedClassName("shape", true), "shape shape--selected");
assert.equal(selectedClassName("shape", false), "shape");
