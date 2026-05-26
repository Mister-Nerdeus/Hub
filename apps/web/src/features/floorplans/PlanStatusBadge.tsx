import type { PlanStatusBadgeViewModel } from "./planStatusViewModel";

type PlanStatusBadgeProps = {
  badge: PlanStatusBadgeViewModel;
};

export function PlanStatusBadge({ badge }: PlanStatusBadgeProps) {
  return <span className={`plan-status-badge plan-status-badge--${badge.tone}`}>{badge.label}</span>;
}
