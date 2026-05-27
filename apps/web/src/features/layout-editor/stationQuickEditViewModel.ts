import type { EditableStationGeometry, EditableStationType } from "@nerdeus/shared";

export type StationQuickEditViewModel = {
  status: "missing" | "ready";
  stationId: string | null;
  label: string;
  stationType: EditableStationType | null;
  presentationStyle: "standard" | "presentation";
  readOnly: boolean;
};

export function buildStationQuickEdit({
  station,
  readOnly,
  presentation
}: {
  station: EditableStationGeometry | null;
  readOnly: boolean;
  presentation: boolean;
}): StationQuickEditViewModel {
  if (station == null) {
    return {
      status: "missing",
      stationId: null,
      label: "No station selected",
      stationType: null,
      presentationStyle: presentation ? "presentation" : "standard",
      readOnly: true
    };
  }
  return {
    status: "ready",
    stationId: station.id,
    label: station.label,
    stationType: station.stationType,
    presentationStyle: presentation ? "presentation" : "standard",
    readOnly
  };
}
