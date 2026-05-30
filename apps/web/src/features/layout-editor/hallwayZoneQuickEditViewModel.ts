import {
  isProviderPharmacySupportZone,
  type EditableHallwayGeometry,
  type EditableZoneGeometry
} from "@nerdeus/shared";

export type HallwayZoneQuickEditViewModel = {
  status: "missing" | "hallway" | "zone";
  objectId: string | null;
  label: string;
  zoneType: EditableZoneGeometry["zoneType"] | null;
  arrowDirectionHint: "horizontal" | "vertical" | "compact";
  presentationVisible: boolean;
  validationStatus: string;
  canAddSupportAccessPoint: boolean;
  readOnly: boolean;
};

export function buildHallwayZoneQuickEdit({
  hallway,
  zone,
  readOnly,
  validationWarningCount
}: {
  hallway: EditableHallwayGeometry | null;
  zone: EditableZoneGeometry | null;
  readOnly: boolean;
  validationWarningCount: number;
}): HallwayZoneQuickEditViewModel {
  const selected = hallway ?? zone;
  if (selected == null) {
    return missing(readOnly, validationWarningCount);
  }
  const status = hallway != null ? "hallway" : "zone";
  return {
    status,
    objectId: selected.id,
    label: selected.label,
    zoneType: zone?.zoneType ?? null,
    arrowDirectionHint: selected.widthFeet === selected.heightFeet
      ? "compact"
      : selected.widthFeet > selected.heightFeet ? "horizontal" : "vertical",
    presentationVisible: true,
    validationStatus: validationWarningCount === 0 ? "No validation warnings" : `${validationWarningCount} validation warnings`,
    canAddSupportAccessPoint: isProviderPharmacySupportZone(zone),
    readOnly
  };
}

function missing(readOnly: boolean, validationWarningCount: number): HallwayZoneQuickEditViewModel {
  return {
    status: "missing",
    objectId: null,
    label: "No hallway or zone selected",
    zoneType: null,
    arrowDirectionHint: "compact",
    presentationVisible: false,
    validationStatus: validationWarningCount === 0 ? "No validation warnings" : `${validationWarningCount} validation warnings`,
    canAddSupportAccessPoint: false,
    readOnly
  };
}
