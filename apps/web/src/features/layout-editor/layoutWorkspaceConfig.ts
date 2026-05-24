export type LayoutWorkspaceBoundsFeet = {
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
};

export type LayoutStageViewportPixels = {
  widthPixels: number;
  heightPixels: number;
};

export const DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET: LayoutWorkspaceBoundsFeet = {
  xFeet: 0,
  yFeet: 0,
  widthFeet: 180,
  heightFeet: 120
};

export const DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS: LayoutStageViewportPixels = {
  widthPixels: 1080,
  heightPixels: 720
};

export const DEFAULT_LAYOUT_STAGE_PIXELS_PER_FOOT = 12;

export const DEFAULT_LAYOUT_MINOR_GRID_FEET = 1;

export const DEFAULT_LAYOUT_MAJOR_GRID_FEET = 5;
