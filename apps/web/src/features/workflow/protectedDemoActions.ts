import type { DemoProtectedActionId } from "@nerdeus/shared";

export function canUseProtectedDemoAction(unlocked: boolean, _actionId: DemoProtectedActionId): boolean {
  return unlocked;
}
