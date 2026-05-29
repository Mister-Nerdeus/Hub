import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import {
  findEditableLayoutObject,
  type LayoutSelectionObjectType
} from "./layoutSelectionModel";
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
      sections: []
    };
  }

  return {
    status: "selected",
    title: selectedObject.label,
    objectType: selectedObjectType,
    objectId: selectedObjectId,
    sourceUnits: "feet",
    isReadOnly: selectedObject.objectType !== "room",
    sections: buildSections(selectedObject)
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
    sections: []
  };
}

function buildSections(
  selectedObject: NonNullable<ReturnType<typeof findEditableLayoutObject>>
): readonly LayoutInspectorSection[] {
  switch (selectedObject.objectType) {
    case "room":
      return [
        {
          title: "Room metadata",
          fields: [
            { label: "Room number", value: selectedObject.roomNumber },
            { label: "Room type", value: formatRoomType(selectedObject.roomType) },
            { label: "Capacity type", value: selectedObject.capacityType },
            { label: "Hall bed", value: formatBoolean(selectedObject.isHallBed) },
            { label: "Trauma adjacent", value: formatBoolean(selectedObject.isTraumaAdjacent) }
          ].map(readOnlyField)
        },
        rectGeometrySection(selectedObject, "Geometry", true)
      ];
    case "door":
      return [
        {
          title: "Door geometry",
          fields: [
            { label: "Owner kind", value: selectedObject.ownerKind },
            { label: "Owner ID", value: selectedObject.ownerId },
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
        rectGeometrySection(selectedObject)
      ];
    case "hallway":
      return [rectGeometrySection(selectedObject, "Hallway geometry")];
    case "zone":
      return [
        {
          title: "Zone metadata",
          fields: [{ label: "Zone type", value: selectedObject.zoneType }].map(readOnlyField)
        },
        rectGeometrySection(selectedObject)
      ];
  }
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
