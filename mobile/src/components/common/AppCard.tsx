import React from 'react';
import { View, ViewProps } from 'react-native';
import { useAppStore } from '../../store/appStore';

interface AppCardProps extends ViewProps {
  variant?: 'default' | 'glass' | 'bordered';
  className?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  variant = 'default',
  className = '',
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

  return (
    <View
      className={`${cardStyles} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
export default AppCard;
