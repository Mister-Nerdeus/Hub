import test from "node:test";
import assert from "node:assert/strict";

import {
  FORBIDDEN_PRODUCT_DISPLAY_NAME,
  OPERATIONAL_DEMO_PRODUCT_DISPLAY_NAME,
  PRODUCT_DISPLAY_NAME,
  REPORT_EXPORT_BUNDLE_METADATA
} from "../dist/index.js";

test("shared product identity is the only product-facing display name", () => {
  assert.equal(PRODUCT_DISPLAY_NAME, "ER Pod Shift Simulator");
  assert.equal(OPERATIONAL_DEMO_PRODUCT_DISPLAY_NAME, PRODUCT_DISPLAY_NAME);
  assert.equal(REPORT_EXPORT_BUNDLE_METADATA.appName, PRODUCT_DISPLAY_NAME);
  assert.equal(FORBIDDEN_PRODUCT_DISPLAY_NAME, "Nerdeus ER Pod Shift Simulator");
});
