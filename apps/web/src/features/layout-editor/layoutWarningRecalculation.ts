import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import {
  validateRoomMoveWarnings,
  DEFAULT_LAYOUT_BOUNDS_FEET,
  type LayoutBoundsFeet
} from "./layoutMoveValidation";
import {
  compareLayoutValidationWarnings,
  type LayoutEditorValidationWarning,
  type LayoutValidationWarningSource
} from "./layoutValidationWarningContract";

const GENERATED_RECALCULATION_SOURCES: readonly LayoutValidationWarningSource[] = [
  "bounds",
  "collision"
] as const;

export type RecalculateLayoutWarningsInput = {
  existingWarnings: readonly LayoutEditorValidationWarning[];
  layout: EditableLayoutGeometryContract;
  boundsFeet?: LayoutBoundsFeet;
  includeHallways?: boolean;
};

export type RecalculateWarningsForRoomInput = RecalculateLayoutWarningsInput & {
  roomId: string;
};

export type ReplaceGeneratedWarningsBySourcesInput = {
  existingWarnings: readonly LayoutEditorValidationWarning[];
  replacementWarnings: readonly LayoutEditorValidationWarning[];
  sources: readonly LayoutValidationWarningSource[];
};

export function recalculateLayoutWarnings({
  existingWarnings,
  layout,
  boundsFeet = DEFAULT_LAYOUT_BOUNDS_FEET,
  includeHallways = true
}: RecalculateLayoutWarningsInput): LayoutEditorValidationWarning[] {
  const generatedWarnings = layout.rooms.flatMap((room) =>
    validateRoomMoveWarnings({
      layout,
      roomId: room.id,
      boundsFeet,
      includeHallways
    })
  );

  return replaceGeneratedWarningsBySources({
    existingWarnings,
    replacementWarnings: generatedWarnings,
    sources: GENERATED_RECALCULATION_SOURCES
  });
}

export function recalculateWarningsForRoom({
  existingWarnings,
  layout,
  roomId,
  boundsFeet = DEFAULT_LAYOUT_BOUNDS_FEET,
  includeHallways = true
}: RecalculateWarningsForRoomInput): LayoutEditorValidationWarning[] {
  const generatedWarnings = validateRoomMoveWarnings({
    layout,
    roomId,
    boundsFeet,
    includeHallways
  });

  return replaceGeneratedWarningsBySources({
    existingWarnings,
    replacementWarnings: generatedWarnings,
    sources: GENERATED_RECALCULATION_SOURCES
  });
}

export function replaceGeneratedWarningsBySources({
  existingWarnings,
  replacementWarnings,
  sources
}: ReplaceGeneratedWarningsBySourcesInput): LayoutEditorValidationWarning[] {
  const sourceSet = new Set(sources);
  return [
    ...existingWarnings.filter((warning) => !(warning.isGenerated && sourceSet.has(warning.source))),
    ...replacementWarnings.filter((warning) => warning.isGenerated && sourceSet.has(warning.source))
  ]
    .map((warning) => ({ ...warning }))
    .sort(compareLayoutValidationWarnings);
}
