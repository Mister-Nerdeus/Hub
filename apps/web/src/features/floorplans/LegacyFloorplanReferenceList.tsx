import type { FloorplanLibraryCardViewModel } from "./floorplanLibraryViewModel";

type LegacyFloorplanReferenceListProps = {
  floorplans: FloorplanLibraryCardViewModel[];
};

export function LegacyFloorplanReferenceList({ floorplans }: LegacyFloorplanReferenceListProps) {
  return (
    <section className="legacy-floorplan-reference" aria-labelledby="legacy-floorplan-reference-title">
      <h3 id="legacy-floorplan-reference-title">Legacy Floorplan Fixtures</h3>
      <p>Legacy fixtures are retained for verification only.</p>
      <p>The product uses one canonical floorplan.</p>
      <ul>
        {floorplans.map((floorplan) => (
          <li
            key={floorplan.recordId}
            data-plan-id={floorplan.planId}
            data-default-classification={floorplan.defaultClassification ?? "saved-copy"}
            data-product-visibility={floorplan.productVisibility}
          >
            <span>{floorplan.name}</span>
            <span>{floorplan.planId}</span>
            <span>Legacy fixture - not used for current scenario/ratio comparison workflow.</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
