type DemoRelockButtonProps = {
  onRelock: () => void;
};

export function DemoRelockButton({ onRelock }: DemoRelockButtonProps) {
  return (
    <button className="demo-relock-button" type="button" onClick={onRelock}>
      Lock Workspace
    </button>
  );
}
