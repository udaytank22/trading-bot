import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useAppStore } from '../../store/appStore';
import Stylesheet from './Stylesheet';

interface AppCardProps extends ViewProps {
  variant?: 'default' | 'glass' | 'bordered';
  style?: StyleProp<ViewStyle>;
}

export const AppCard: React.FC<AppCardProps> = ({
  variant = 'default',
  style,
  children,
  ...props
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  let cardStyles = 'rounded-2xl p-4 shadow-sm ';

  if (isDark) {
    switch (variant) {
      case 'glass':
        cardStyles += 'bg-white/[0.03] border border-white/[0.08]';
        break;
      case 'bordered':
        cardStyles += 'bg-[#151821] border border-[#2a2d33]';
        break;
      case 'default':
      default:
        cardStyles += 'bg-[#12141c] border border-transparent';
        break;
    }
  } else {
    switch (variant) {
      case 'glass':
        cardStyles += 'bg-white/70 border border-gray-100/50';
        break;
      case 'bordered':
        cardStyles += 'bg-white border border-gray-200';
        break;
      case 'default':
      default:
        cardStyles += 'bg-white border border-transparent';
        break;
    }
  }

  const parsedCardStyle = Stylesheet.cls(theme, cardStyles);

  return (
    <View
      style={[parsedCardStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
};
export default AppCard;
