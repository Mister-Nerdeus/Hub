import type { GeometryLayer } from "./geometryLayerContract.js";

export const EDITABLE_GEOMETRY_KINDS = [
  "room",
  "split_room_parent",
  "bed_position",
  "door",
  "nurse_station",
  "hallway",
  "outer_wall",
  "solid_wall",
  "support_area",
  "storage_area",
  "provider_pharmacy",
  "reference_overlay",
  "measurement_label"
] as const;

export type EditableGeometryKind = (typeof EDITABLE_GEOMETRY_KINDS)[number];

export type EditableGeometryRegistryEntry = {
  kind: EditableGeometryKind;
  layer: GeometryLayer;
  sourceKind: "editable" | "locked" | "reference" | "measurement" | "label";
  selectable: boolean;
  editable: boolean;
  removable: boolean;
  assignmentEligible: boolean;
  reasonLocked?: string;
};

export const EDITABLE_GEOMETRY_REGISTRY: readonly EditableGeometryRegistryEntry[] = [
  editable("room", true),
  editable("split_room_parent", false),
  editable("bed_position", true),
  editable("door", false),
  editable("nurse_station", false),
  editable("hallway", false),
  editable("outer_wall", false),
  editable("solid_wall", false),
  editable("support_area", false),
  editable("storage_area", false),
  editable("provider_pharmacy", false),
  {
    kind: "reference_overlay",
    layer: "reference_overlay",
    sourceKind: "reference",
    selectable: true,
    editable: false,
    removable: false,
    assignmentEligible: false,
    reasonLocked: "Reference overlays are locked and toggleable background evidence."
  },
  {
    kind: "measurement_label",
    layer: "measurement_overlay",
    sourceKind: "measurement",
    selectable: false,
    editable: false,
    removable: false,
    assignmentEligible: false,
    reasonLocked: "Measurement labels annotate geometry but are not saved geometry."
  }
];

export function editableGeometryRegistryEntryFor(
  kind: EditableGeometryKind
): EditableGeometryRegistryEntry {
  const entry = EDITABLE_GEOMETRY_REGISTRY.find((candidate) => candidate.kind === kind);
  if (entry == null) {
    throw new Error(`missing editable geometry registry entry for ${kind}`);
  }
  return entry;
}

export function isEditableGeometryKind(value: unknown): value is EditableGeometryKind {
  return typeof value === "string" && EDITABLE_GEOMETRY_KINDS.includes(value as EditableGeometryKind);
}

export function validateEditableGeometryRegistry(
  registry: readonly EditableGeometryRegistryEntry[] = EDITABLE_GEOMETRY_REGISTRY
): readonly EditableGeometryRegistryEntry[] {
  const kinds = registry.map((entry) => entry.kind);
  for (const kind of EDITABLE_GEOMETRY_KINDS) {
    if (!kinds.includes(kind)) {
      throw new Error(`editable geometry registry missing ${kind}`);
    }
  }
  if (new Set(kinds).size !== kinds.length) {
    throw new Error("editable geometry registry kinds must be unique");
  }
  for (const entry of registry) {
    if (!isEditableGeometryKind(entry.kind)) {
      throw new Error("editable geometry registry contains unknown kind");
    }
    if ((entry.editable || entry.removable) && entry.sourceKind !== "editable") {
      throw new Error("editable or removable registry entries must use editable sourceKind");
    }
    if (!entry.editable && entry.sourceKind !== "editable" && entry.reasonLocked == null) {
      throw new Error("locked registry entries require reasonLocked");
    }
  }
  return registry;
}

function editable(kind: EditableGeometryKind, assignmentEligible: boolean): EditableGeometryRegistryEntry {
  return {
    kind,
    layer: "editable_geometry",
    sourceKind: "editable",
    selectable: true,
    editable: true,
    removable: true,
    assignmentEligible
  };
}
