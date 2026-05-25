export type AutoHallwayControlsProps = {
  readOnly: boolean;
  generatedCount: number;
  onGenerate: () => void;
};

export function AutoHallwayControls({
  readOnly,
  generatedCount,
  onGenerate
}: AutoHallwayControlsProps) {
  return (
    <section className="auto-hallway-controls" aria-label="Auto hallway controls">
      <button type="button" disabled={readOnly} onClick={onGenerate}>
        Generate public space
      </button>
      <p role="status">{generatedCount} generated hallway/public-space zones</p>
    </section>
  );
}
