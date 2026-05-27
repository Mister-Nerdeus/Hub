import {
  validateOperationalRuntimeText,
  type EditableZoneGeometry
} from "@nerdeus/shared";

export type SupportMarkerEditorViewModel = {
  status: "missing" | "ready";
  zoneId: string | null;
  label: string;
  markerKindLabel: string;
  presentationVisible: boolean;
  readOnly: boolean;
  validationMessage: string;
};

export function buildSupportMarkerEditorViewModel(input: {
  zone: EditableZoneGeometry | null;
  readOnly: boolean;
}): SupportMarkerEditorViewModel {
  if (input.zone == null) {
    return {
      status: "missing",
      zoneId: null,
      label: "",
      markerKindLabel: "No support marker selected",
      presentationVisible: false,
      readOnly: true,
      validationMessage: "Select a support marker zone."
    };
  }
  return {
    status: "ready",
    zoneId: input.zone.id,
    label: input.zone.label,
    markerKindLabel: input.zone.zoneType === "ems_entry" ? "EMS Entry marker" : "Provider/Pharmacy label",
    presentationVisible: true,
    readOnly: input.readOnly,
    validationMessage: validateSupportMarkerLabel(input.zone.label)
  };
}

export function validateSupportMarkerLabel(value: string): string {
  try {
    validateOperationalRuntimeText(value, "support marker label");
    return "Operational label accepted.";
  } catch {
    return "Label rejected by operational text guard.";
  }
}
