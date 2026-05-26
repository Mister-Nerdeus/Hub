export type AutoHallwayControlsProps = {
  readOnly: boolean;
  generatedCount: number;
  generationMethod?: "grid_subtraction" | "rectangular_envelope_difference" | "manual_seeded_generation";
  gridCellSizeFeet?: number | null;
  onGenerate: () => void;
};

export function AutoHallwayControls({
  readOnly,
  generatedCount,
  generationMethod = "grid_subtraction",
  gridCellSizeFeet = 4,
  onGenerate
}: AutoHallwayControlsProps) {
  return (
    <section className="auto-hallway-controls" aria-label="Auto hallway controls">
      <button type="button" disabled={readOnly} onClick={onGenerate}>
        Generate public space
      </button>
      <p role="status">{generatedCount} generated hallway/public-space zones</p>
      <p>{generationMethod.split("_").join(" ")} / {gridCellSizeFeet ?? "n/a"} ft grid</p>
    </section>
  );
}
