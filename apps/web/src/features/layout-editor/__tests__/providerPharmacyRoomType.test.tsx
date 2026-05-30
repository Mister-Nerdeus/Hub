import {
  authoringRoomTypeToEditableRoomType,
  authoringRoomTypeToPlanRoomType,
  editableRoomTypeToAuthoringRoomType,
  getRoomTypeRule,
  isDoorEligibleRoomType,
  isRoomLoadEligibleRoomType,
  isTravelBlockingRoomType
} from "@nerdeus/shared";

import { buildAddRoomAction } from "../addRoomTool";
import { buildAddObjectMenuViewModel, isRoomPlacementMenuItem, roomTypeForPlacementMenuItem } from "../addObjectMenuViewModel";
import { buildRoomQuickEdit } from "../roomQuickEditViewModel";
import { getRoomPresentationStyle } from "../roomPresentationStyles";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
  },
  ok(value: unknown, message: string): void {
    if (!value) throw new Error(message);
  }
};

assert.equal(authoringRoomTypeToEditableRoomType("provider_pharmacy"), "provider_pharmacy");
assert.equal(editableRoomTypeToAuthoringRoomType("provider_pharmacy"), "provider_pharmacy");
assert.equal(authoringRoomTypeToPlanRoomType("provider_pharmacy"), "provider_pharmacy");

const rule = getRoomTypeRule("provider_pharmacy");
assert.equal(rule.patientCareEligible, false);
assert.equal(rule.nurseAssignable, false);
assert.equal(rule.roomLoadEligible, false);
assert.equal(rule.ratioCountEligible, false);
assert.equal(rule.burdenScoreEligible, false);
assert.equal(rule.doorEligible, true);
assert.equal(rule.travelBlocking, false);
assert.equal(isRoomLoadEligibleRoomType("provider_pharmacy"), false);
assert.equal(isDoorEligibleRoomType("provider_pharmacy"), true);
assert.equal(isTravelBlockingRoomType("provider_pharmacy"), false);

const menu = buildAddObjectMenuViewModel();
assert.ok(menu.items.some((item) => item.id === "provider_pharmacy"), "provider/pharmacy placement item exists");
assert.equal(isRoomPlacementMenuItem("provider_pharmacy"), true);
assert.equal(roomTypeForPlacementMenuItem("provider_pharmacy"), "provider_pharmacy");

const addAction = buildAddRoomAction({
  sequence: 7,
  draft: {
    selectedRoomType: "provider_pharmacy",
    defaultWidthFeet: 10,
    defaultHeightFeet: 8
  },
  xFeet: 20,
  yFeet: 12
});
assert.equal(addAction.roomType, "provider_pharmacy");
assert.ok(addAction.label.includes("Provider Pharmacy"), "provider/pharmacy label is distinct");

const style = getRoomPresentationStyle("provider_pharmacy");
assert.equal(style.muted, true);
assert.equal(style.legendLabel, "Provider / pharmacy support");

const quickEdit = buildRoomQuickEdit({
  readOnly: false,
  room: {
    objectType: "room",
    id: "provider-room",
    label: "Provider Pharmacy",
    roomNumber: "provider-room",
    roomType: "provider_pharmacy",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet: 0,
    yFeet: 0,
    widthFeet: 12,
    heightFeet: 10
  }
});
assert.equal(quickEdit.addDoorDisabled, true);
assert.equal(quickEdit.addDoorDisabledReason, "Provider/pharmacy areas use support access point tooling.");
