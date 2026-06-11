import { moderateScale } from './responsive';

export const typography = {
  h1: moderateScale(24),
  h2: moderateScale(18),
  h3: moderateScale(16),
  body: moderateScale(14),
  caption: moderateScale(12),
  small: moderateScale(10),

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};
