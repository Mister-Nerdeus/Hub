import { migrateGeometryLayout } from "@nerdeus/shared";

export type FloorplanMigrationResult<TLayout extends Record<string, unknown>> = ReturnType<
  typeof migrateGeometryLayout<TLayout>
>;

export function migrateFloorplanForEditor<TLayout extends Record<string, unknown>>(
  layout: TLayout
): FloorplanMigrationResult<TLayout> {
  return migrateGeometryLayout(layout);
}

export function floorplanMigrationKeepsExistingLayout<TLayout extends Record<string, unknown>>(
  layout: TLayout
): TLayout {
  return migrateFloorplanForEditor(layout).layout;
}
