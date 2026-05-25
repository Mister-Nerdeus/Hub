import type { PodBorderViewModel } from "./podBorderViewModel";

export type PodBorderShapeProps = {
  viewModel: PodBorderViewModel;
};

export function PodBorderShape({ viewModel }: PodBorderShapeProps) {
  return (
    <rect
      className="pod-border-shape"
      x={viewModel.rectPixels.xPixels}
      y={viewModel.rectPixels.yPixels}
      width={viewModel.rectPixels.widthPixels}
      height={viewModel.rectPixels.heightPixels}
      rx="0"
      fill="none"
      stroke="#1f2937"
      strokeDasharray="8 4"
      strokeWidth="2"
      aria-label="Generated pod border"
    />
  );
}
