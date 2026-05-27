// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const popoverSource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/layout-editor/CanvasObjectPopover.tsx"),
  "utf8"
);

for (const snippet of [
  'role="dialog"',
  "aria-label",
  "tabIndex={-1}",
  "Escape",
  "stopPropagation",
  "closeAndReturnFocus",
  "focusPopoverAnchor",
  "data-layout-object-type",
  "data-layout-object-id",
  "Close object popover"
]) {
  if (!popoverSource.includes(snippet)) {
    throw new Error(`CanvasObjectPopover accessibility missing ${snippet}`);
  }
}

if (popoverSource.includes('event.key === "Tab"')) {
  throw new Error("popover must not trap Tab navigation");
}

for (const file of ["RoomShape.tsx", "DoorShape.tsx", "StationShape.tsx", "HallwayShape.tsx", "ZoneShape.tsx"]) {
  const source = readFileSync(
    resolve(repoRoot, `apps/web/src/features/layout-editor/${file}`),
    "utf8"
  );
  for (const snippet of [
    "tabIndex={0}",
    "data-layout-object-type",
    "data-layout-object-id",
    "Enter",
    "event.key === \" \"",
    "aria-label"
  ]) {
    if (!source.includes(snippet)) {
      throw new Error(`${file} missing keyboard/focus accessibility marker: ${snippet}`);
    }
  }
}
