# Walking Baseline Contract

Walking baseline V1 summarizes groups of route preview outputs for a default plan.

## Baseline Shape

```ts
{
  schemaVersion: "1.0.0";
  baselineId: string;
  planId: string;
  routeGroupSummaries: WalkingBaselineRouteGroupSummary[];
  totalRouteCount: number;
  reachableRouteCount: number;
  unreachableRouteCount: number;
  invalidRouteCount: number;
  totalDistanceFeet: number;
  totalTravelSeconds: number;
  warnings: WalkingBaselineWarning[];
  limitations: string[];
}
```

Each route group contains deterministic route summaries with origin path node, destination path node, status, distance, travel seconds, and warning codes.

## Validation Rules

- Total route count must equal the sum of group route counts.
- Reachable, unreachable, and invalid route counts must equal the sum of group counts.
- Total distance and total travel seconds must equal the sum of group totals.
- Limitations are required.
- Warnings must be coded and deterministic.

## Default Fixture Groups

Default walking baseline fixtures include:

- EMS entry to trauma route when those nodes exist.
- Primary nurse station to room door routes.
- Provider pharmacy station to room routes when the station exists.

## Non-Claims

Walking baselines are derived from route preview outputs over approximate fixture graph edges. They do not claim measured walking truth, clinical accuracy, assignment scoring, optimizer output, or simulation behavior.
