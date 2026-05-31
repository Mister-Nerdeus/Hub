type ReferenceOverlayToggleProps = {
  visible: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function ReferenceOverlayToggle({
  visible,
  disabled = false,
  onToggle
}: ReferenceOverlayToggleProps) {
  return (
    <button
      type="button"
      data-reference-overlay-toggle="true"
      data-reference-overlay-visible={visible ? "true" : "false"}
      aria-pressed={visible}
      disabled={disabled}
      onClick={onToggle}
    >
      {visible ? "Hide Reference" : "Show Reference"}
    </button>
  );
}
