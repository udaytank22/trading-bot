import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import AppText from './AppText';
import Stylesheet from './Stylesheet';
import { useAppStore } from '../../store/appStore';

interface AppBadgeProps {
  label: string | number;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  style?: StyleProp<ViewStyle>;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  variant = 'primary',
  style,
}) => {
  const theme = useAppStore((state) => state.theme);
  let badgeStyles = 'px-2 py-0.5 rounded-full items-center justify-center ';
  let textStyles = 'text-[11px] font-bold ';

  switch (variant) {
    case 'success':
      badgeStyles += 'bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50';
      textStyles += 'text-emerald-600 dark:text-emerald-400';
      break;
    case 'warning':
      badgeStyles += 'bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50';
      textStyles += 'text-amber-600 dark:text-amber-400';
      break;
    case 'danger':
      badgeStyles += 'bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50';
      textStyles += 'text-red-650 dark:text-red-450';
      break;
    case 'info':
      badgeStyles += 'bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50';
      textStyles += 'text-blue-600 dark:text-blue-450';
      break;
    case 'gray':
      badgeStyles += 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
      textStyles += 'text-gray-650 dark:text-gray-400';
      break;
    case 'primary':
    default:
      badgeStyles += 'bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50';
      textStyles += 'text-purple-600 dark:text-purple-400';
      break;
  }

  const parsedBadgeStyle = Stylesheet.cls(theme, badgeStyles);
  const parsedTextStyle = Stylesheet.cls(theme, textStyles);

  return (
    <View style={[parsedBadgeStyle, style]}>
      <AppText style={parsedTextStyle}>{label}</AppText>
    </View>
  );
};
export default AppBadge;
