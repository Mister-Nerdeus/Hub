type DemoRelockButtonProps = {
  onRelock: () => void;
};

export function DemoRelockButton({ onRelock }: DemoRelockButtonProps) {
  return (
    <button
      className="demo-relock-button"
      type="button"
      aria-label="Lock workspace and return to access screen"
      onClick={onRelock}
    >
      Lock Workspace
    </button>
  );
}
