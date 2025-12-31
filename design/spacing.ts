const BASE = 4;

export const spacing = (multiplier = 1) => BASE * multiplier;

export const spacingScale = {
  xs: spacing(1),
  sm: spacing(2),
  md: spacing(3),
  lg: spacing(4),
  xl: spacing(6),
};
