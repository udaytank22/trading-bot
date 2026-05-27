import React from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { useAppStore } from '../../store/appStore';
import Stylesheet from './Stylesheet';

interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'subtitle' | 'body' | 'bodySemibold' | 'caption' | 'captionSemibold' | 'small' | 'bold';
  color?: string; // Custom color string or token
  style?: StyleProp<TextStyle>;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  style,
  children,
  ...props
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  let defaultStyles = '';
  switch (variant) {
    case 'h1':
      defaultStyles = 'text-2xl font-bold tracking-tight';
      break;
    case 'h2':
      defaultStyles = 'text-xl font-bold tracking-tight';
      break;
    case 'h3':
      defaultStyles = 'text-lg font-semibold tracking-tight';
      break;
    case 'subtitle':
      defaultStyles = 'text-base font-medium text-gray-500 dark:text-gray-400';
      break;
    case 'bodySemibold':
      defaultStyles = 'text-sm font-semibold';
      break;
    case 'caption':
      defaultStyles = 'text-xs font-normal text-gray-400 dark:text-gray-500';
      break;
    case 'captionSemibold':
      defaultStyles = 'text-xs font-semibold';
      break;
    case 'small':
      defaultStyles = 'text-[11px] font-normal';
      break;
    case 'bold':
      defaultStyles = 'text-sm font-bold';
      break;
    case 'body':
    default:
      defaultStyles = 'text-sm font-normal';
      break;
  }

  // Base text color depends on theme if no color is provided
  const themeColorStyle = color 
    ? { color } 
    : isDark 
      ? { color: '#ffffff' } 
      : { color: '#111827' };

  const parsedDefault = Stylesheet.cls(theme, defaultStyles);

  return (
    <Text
      style={[parsedDefault, themeColorStyle, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

export default AppText;
