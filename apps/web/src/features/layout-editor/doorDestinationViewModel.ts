import type { DoorDestinationContract, EditableDoorGeometry } from "@nerdeus/shared";

import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";

export type DoorDestinationViewModel = {
  doorId: string;
  label: string;
  leadsToKind: DoorDestinationContract["leadsToKind"];
  travelRole: DoorDestinationContract["travelRole"];
  isUnknown: boolean;
  xPixels: number;
  yPixels: number;
};

export function buildDoorDestinationViewModel(input: {
  item: LayoutObjectRenderItem;
  destination: DoorDestinationContract | null;
}): DoorDestinationViewModel {
  const door = input.item.sourceGeometry as EditableDoorGeometry;
  const destination = input.destination ?? {
    doorId: door.id,
    ownerKind: "room" as const,
    ownerId: door.ownerId,
    leadsToKind: "unknown" as const,
    leadsToLabel: "Unknown destination",
    travelRole: "unknown" as const
  };
  return {
    doorId: door.id,
    label: destination.leadsToLabel,
    leadsToKind: destination.leadsToKind,
    travelRole: destination.travelRole,
    isUnknown: destination.leadsToKind === "unknown",
    xPixels: input.item.displayRectPixels.xPixels + input.item.displayRectPixels.widthPixels / 2,
    yPixels: input.item.displayRectPixels.yPixels - 6
  };
}
