import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import {
  findEditableLayoutObject,
  type LayoutSelectionObjectType
} from "./layoutSelectionModel";
import { EDITOR_DETAILS_NORMAL_SECTIONS } from "./inspectorViewModel";
import type { RoomInspectorDimensionField } from "./roomInspectorDimensionEdit";

export type LayoutInspectorField = {
  label: string;
  value: string;
  isEditable: boolean;
  editKey?: RoomInspectorDimensionField;
  valueFeet?: number;
};

export type LayoutInspectorSection = {
  title: string;
  fields: readonly LayoutInspectorField[];
};

export type LayoutInspectorViewModel = {
  status: "empty" | "selected" | "missing";
  title: string;
  objectType: LayoutSelectionObjectType | null;
  objectId: string | null;
  sourceUnits: "feet";
  isReadOnly: boolean;
  lockedGeometry: {
    locked: boolean;
    reason: string | null;
  };
  normalSections: readonly LayoutInspectorSection[];
  advancedSections: readonly LayoutInspectorSection[];
  sections: readonly LayoutInspectorSection[];
};

export type BuildLayoutInspectorViewModelInput = {
  layout: EditableLayoutGeometryContract | null;
  selectedObjectType: LayoutSelectionObjectType | null;
  selectedObjectId: string | null;
};

export function buildLayoutInspectorViewModel(
  input: BuildLayoutInspectorViewModelInput
): LayoutInspectorViewModel {
  const { layout, selectedObjectId, selectedObjectType } = input;
  if (layout == null || selectedObjectId == null || selectedObjectType == null) {
    return emptyInspector();
  }

  const selectedObject = findEditableLayoutObject(layout, selectedObjectType, selectedObjectId);
  if (selectedObject == null) {
    return {
      status: "missing",
      title: "Selection unavailable",
      objectType: selectedObjectType,
      objectId: selectedObjectId,
      sourceUnits: "feet",
      isReadOnly: true,
      lockedGeometry: lockedGeometryMetadata(selectedObjectType, null),
      normalSections: [],
      advancedSections: [],
      sections: []
    };
  }

  const normalSections = buildNormalSections(layout, selectedObject);
  const advancedSections = buildAdvancedSections(selectedObject, selectedObjectType, selectedObjectId);

  return {
    status: "selected",
    title: selectedObject.label,
    objectType: selectedObjectType,
    objectId: selectedObjectId,
    sourceUnits: "feet",
    isReadOnly: !["room", "station", "hallway", "entry_exit"].includes(selectedObject.objectType),
    lockedGeometry: lockedGeometryMetadata(selectedObject.objectType, selectedObject),
    normalSections,
    advancedSections,
    sections: normalSections
  };
}

function emptyInspector(): LayoutInspectorViewModel {
  return {
    status: "empty",
    title: "No selection",
    objectType: null,
    objectId: null,
    sourceUnits: "feet",
    isReadOnly: true,
    lockedGeometry: {
      locked: false,
      reason: null
    },
    normalSections: [],
    advancedSections: [],
    sections: []
  };
}

function lockedGeometryMetadata(
  objectType: LayoutSelectionObjectType | null,
  selectedObject: NonNullable<ReturnType<typeof findEditableLayoutObject>> | null
): LayoutInspectorViewModel["lockedGeometry"] {
  if (objectType === "perimeter_wall") {
    const locked = selectedObject != null &&
      "segments" in selectedObject &&
      selectedObject.segments.every((segment) => segment.locked);
    return {
      locked,
      reason: locked
        ? "This perimeter wall is locked boundary geometry. It blocks route connectivity and can be selected for review, but it cannot be moved or deleted."
        : null
    };
  }
  if (objectType === "outer_wall") {
    return {
      locked: true,
      reason: "This outer wall frames the editor workspace. It is selectable for context, but it cannot be moved or deleted."
    };
  }
  return {
    locked: false,
    reason: null
  };
}

function buildNormalSections(
  layout: EditableLayoutGeometryContract,
  selectedObject: NonNullable<ReturnType<typeof findEditableLayoutObject>>
): readonly LayoutInspectorSection[] {
  switch (selectedObject.objectType) {
    case "room":
      return [
        {
          title: EDITOR_DETAILS_NORMAL_SECTIONS.roomIdentity,
          fields: [
            { label: "Room number", value: selectedObject.roomNumber },
            { label: "Room label", value: selectedObject.label }
          ].map(readOnlyField)
        },
        {
          title: EDITOR_DETAILS_NORMAL_SECTIONS.roomTypeCapacity,
          fields: [
            { label: "Room type", value: formatRoomType(selectedObject.roomType) },
            { label: "Capacity type", value: selectedObject.capacityType }
          ].map(readOnlyField)
        },
        {
          title: EDITOR_DETAILS_NORMAL_SECTIONS.operationalCapabilities,
          fields: [
            { label: "Hall bed", value: formatBoolean(selectedObject.isHallBed) },
            { label: "Trauma adjacent", value: formatBoolean(selectedObject.isTraumaAdjacent) }
          ].map(readOnlyField)
        },
        rectGeometrySection(selectedObject, EDITOR_DETAILS_NORMAL_SECTIONS.geometry, true)
      ];
    case "door":
      return [
        {
          title: "Door location",
          fields: [
            { label: "Connected room", value: connectedOwnerLabel(layout, selectedObject.ownerKind, selectedObject.ownerId) },
            { label: "Wall", value: selectedObject.wall },
            { label: "Offset", value: formatFeet(selectedObject.offsetFeet) },
            { label: "Width", value: formatFeet(selectedObject.widthFeet) }
          ].map(readOnlyField)
        }
      ];
    case "support_access":
      return [
        {
          title: "Door location",
          fields: [
            { label: "Connected room", value: connectedOwnerLabel(layout, selectedObject.ownerKind, selectedObject.ownerId) },
            { label: "Wall", value: selectedObject.wall },
            { label: "Offset", value: formatFeet(selectedObject.offsetFeet) },
            { label: "Width", value: formatFeet(selectedObject.widthFeet) }
          ].map(readOnlyField)
        }
      ];
    case "station":
      return [
        {
          title: "Station metadata",
          fields: [{ label: "Station type", value: selectedObject.stationType }].map(readOnlyField)
        },
        rectGeometrySection(selectedObject, "Station geometry", true)
      ];
    case "hallway":
      return [
        {
          title: "Hallway metadata",
          fields: [readOnlyField({ label: "Hallway label", value: selectedObject.label })]
        },
        rectGeometrySection(selectedObject, "Hallway geometry", true)
      ];
    case "zone":
      return [
        {
          title: "Zone metadata",
          fields: [{ label: "Zone type", value: selectedObject.zoneType }].map(readOnlyField)
        },
        rectGeometrySection(selectedObject)
      ];
    case "perimeter_wall":
      return [
        {
          title: "Perimeter wall",
          fields: [
            { label: "Boundary label", value: selectedObject.label },
            { label: "Blocks travel", value: "Yes" },
            { label: "Locked", value: formatBoolean(selectedObject.segments.every((segment) => segment.locked)) },
            { label: "Segments", value: selectedObject.segments.map((segment) => segment.label).join(" / ") }
          ].map(readOnlyField)
        }
      ];
    case "entry_exit":
      return [
        {
          title: "Entry / exit",
          fields: [
            { label: "Type", value: selectedObject.kind.replaceAll("_", " ") },
            { label: "Destination", value: selectedObject.connectsTo.displayLabel },
            { label: "Blocks travel", value: "No" }
          ].map(readOnlyField)
        },
        rectGeometrySection({
          xFeet: selectedObject.xFeet,
          yFeet: selectedObject.yFeet,
          widthFeet: selectedObject.widthFeet,
          heightFeet: selectedObject.heightFeet
        })
      ];
    case "split_room_parent": {
      const parentRoom = layout.rooms.find((room) => room.id === selectedObject.parentRoomId);
      return [
        {
          title: "Split room parent",
          fields: [
            { label: "Parent room", value: parentRoom == null ? selectedObject.parentRoomId : `${parentRoom.roomNumber} - ${parentRoom.label}` },
            { label: "Divider orientation", value: selectedObject.dividerOrientation },
            { label: "Divider ratio", value: `${Math.round(selectedObject.dividerRatio * 100)} / ${Math.round((1 - selectedObject.dividerRatio) * 100)}` },
            { label: "Bed labels", value: selectedObject.bedPositions.map((bedPosition) => bedPosition.label).join(" / ") }
          ].map(readOnlyField)
        },
        parentRoom == null ? emptyGeometrySection() : rectGeometrySection(parentRoom, "Parent footprint", true)
      ];
    }
    case "bed_position": {
      const splitRoom = (layout.splitRooms ?? []).find((candidate) =>
        candidate.bedPositions.some((bedPosition) => bedPosition.bedPositionId === selectedObject.bedPositionId)
      );
      return [
        {
          title: "Bed position",
          fields: [
            { label: "Operational label", value: selectedObject.label },
            { label: "Parent room", value: selectedObject.parentRoomId },
            { label: "Assignment target", value: formatBoolean(selectedObject.assignmentTarget) },
            { label: "Divider orientation", value: splitRoom?.dividerOrientation ?? "Unavailable" }
          ].map(readOnlyField)
        }
      ];
    }
    case "outer_wall":
      return [
        {
          title: "Wall",
          fields: [
            { label: "Wall label", value: selectedObject.label },
            { label: "Editable", value: "No" },
            { label: "Locked", value: "Yes" }
          ].map(readOnlyField)
        }
      ];
    case "split_bay":
      return [
        {
          title: "Split room pair",
          fields: [
            { label: "Split room pair", value: formatSplitRoomPair(layout, selectedObject.bedPositionRoomIds) },
            { label: "Parent room", value: selectedObject.label },
            { label: "Bed label", value: formatSplitRoomBedLabels(layout, selectedObject.bedPositionRoomIds) },
            { label: "Bed position", value: "A and B" },
            { label: "Divider orientation", value: formatSplitRoomDividerOrientation(selectedObject.dividerStyle) },
            { label: "Divider ratio", value: "50 / 50" },
            { label: "Assignable target", value: "Yes" }
          ].map(readOnlyField)
        },
        rectGeometrySection(selectedObject)
      ];
  }
}

function buildAdvancedSections(
  selectedObject: NonNullable<ReturnType<typeof findEditableLayoutObject>>,
  objectType: LayoutSelectionObjectType,
  objectId: string
): readonly LayoutInspectorSection[] {
  const fields: LayoutInspectorField[] = [
    readOnlyField({ label: "Object ID", value: objectId }),
    readOnlyField({ label: "Object type", value: objectType }),
    readOnlyField({ label: "Source units", value: "feet" }),
    readOnlyField({ label: "Raw validation state", value: "selected" })
  ];

  if ("ownerId" in selectedObject) {
    fields.push(
      readOnlyField({ label: "Owner ID", value: selectedObject.ownerId }),
      readOnlyField({ label: "Owner kind", value: selectedObject.ownerKind })
    );
  }
  if ("perimeterWallId" in selectedObject) {
    fields.push(
      readOnlyField({ label: "perimeterWallId", value: selectedObject.perimeterWallId }),
      readOnlyField({ label: "segmentIds", value: selectedObject.segments.map((segment) => segment.segmentId).join(" / ") })
    );
  }
  if ("entryExitId" in selectedObject) {
    fields.push(
      readOnlyField({ label: "entryExitId", value: selectedObject.entryExitId }),
      readOnlyField({ label: "destinationKind", value: selectedObject.connectsTo.destinationKind }),
      readOnlyField({ label: "destinationId", value: selectedObject.connectsTo.destinationId ?? "none" })
    );
  }
  if ("splitBayId" in selectedObject) {
    fields.push(
      readOnlyField({ label: "splitRoomId", value: selectedObject.splitBayId }),
      readOnlyField({ label: "bedPositionId", value: selectedObject.bedPositionRoomIds.map((roomId, index) => `${roomId}:bed-${index === 0 ? "a" : "b"}`).join(" / ") }),
      readOnlyField({ label: "parentRoomId", value: selectedObject.splitBayId }),
      readOnlyField({ label: "relativeBounds", value: "stored on bed positions" })
    );
  }
  if ("splitRoomId" in selectedObject) {
    fields.push(
      readOnlyField({ label: "splitRoomId", value: selectedObject.splitRoomId }),
      readOnlyField({ label: "parentRoomId", value: selectedObject.parentRoomId }),
      readOnlyField({ label: "bedPositionIds", value: selectedObject.bedPositions.map((bedPosition) => bedPosition.bedPositionId).join(" / ") })
    );
  }
  if ("bedPositionId" in selectedObject) {
    fields.push(
      readOnlyField({ label: "bedPositionId", value: selectedObject.bedPositionId }),
      readOnlyField({ label: "parentRoomId", value: selectedObject.parentRoomId })
    );
  }

  return [{ title: "Technical metadata", fields }];
}

function emptyGeometrySection(): LayoutInspectorSection {
  return {
    title: "Geometry",
    fields: [readOnlyField({ label: "Status", value: "Parent room unavailable" })]
  };
}

function readOnlyField(field: Omit<LayoutInspectorField, "isEditable">): LayoutInspectorField {
  return {
    ...field,
    isEditable: false
  };
}

function rectGeometrySection(
  value: {
    xFeet: number;
    yFeet: number;
    widthFeet: number;
    heightFeet: number;
  },
  title = "Geometry",
  isEditable = false
): LayoutInspectorSection {
  return {
    title,
    fields: [
      geometryField("X", "xFeet", value.xFeet, isEditable),
      geometryField("Y", "yFeet", value.yFeet, isEditable),
      geometryField("Width", "widthFeet", value.widthFeet, isEditable),
      geometryField("Height", "heightFeet", value.heightFeet, isEditable)
    ]
  };
}

function geometryField(
  label: string,
  editKey: RoomInspectorDimensionField,
  valueFeet: number,
  isEditable: boolean
): LayoutInspectorField {
  return {
    label,
    value: formatFeet(valueFeet),
    isEditable,
    ...(isEditable ? { editKey, valueFeet } : {})
  };
}

function formatFeet(value: number): string {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)} ft`;
}

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

function formatRoomType(roomType: string): string {
  if (roomType === "storage") return "Storage (non-patient)";
  if (roomType === "provider_pharmacy") return "Provider / pharmacy support (non-patient)";
  if (roomType === "solid_wall") return "Solid wall / blocked area";
  return roomType.replaceAll("_", " ");
}

function connectedOwnerLabel(
  layout: EditableLayoutGeometryContract,
  ownerKind: string,
  ownerId: string
): string {
  if (ownerKind === "room") {
    const room = layout.rooms.find((entry) => entry.id === ownerId);
    return room == null ? "Room connection unavailable" : `${room.roomNumber} - ${room.label}`;
  }
  if (ownerKind === "hallway") {
    const hallway = layout.hallways.find((entry) => entry.id === ownerId);
    return hallway == null ? "Hallway connection unavailable" : hallway.label;
  }
  return "Layout boundary";
}

function formatSplitRoomPair(layout: EditableLayoutGeometryContract, roomIds: readonly string[]): string {
  const labels = roomIds.map((roomId) => {
    const room = layout.rooms.find((entry) => entry.id === roomId);
    return room == null ? "Room unavailable" : room.roomNumber;
  });
  return labels.join(" / ");
}

function formatSplitRoomBedLabels(layout: EditableLayoutGeometryContract, roomIds: readonly string[]): string {
  const labels = roomIds.map((roomId, index) => {
    const room = layout.rooms.find((entry) => entry.id === roomId);
    const suffix = index === 0 ? "A" : "B";
    return `${room?.roomNumber ?? "Room"}${suffix}`;
  });
  return labels.join(" / ");
}

function formatSplitRoomDividerOrientation(dividerStyle: string): string {
  return dividerStyle === "horizontal" ? "horizontal" : "vertical";
}
