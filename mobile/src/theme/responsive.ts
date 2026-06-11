import { Dimensions } from 'react-native';
import { scale as matterScale, verticalScale as matterVerticalScale, moderateScale as matterModerateScale } from 'react-native-size-matters';

export const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// Export size-matters utilities for scaling
// scale is for widths, margins, paddings, etc.
export const scale = matterScale;
// verticalScale is for heights
export const verticalScale = matterVerticalScale;
// moderateScale is for fonts (so they don't scale too drastically on tablets)
export const moderateScale = matterModerateScale;
