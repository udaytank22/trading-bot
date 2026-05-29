import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { useAppStore } from '../../store/appStore';

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

  const getVariantStyle = (): StyleProp<TextStyle> => {
    switch (variant) {
      case 'h1': return styles.h1;
      case 'h2': return styles.h2;
      case 'h3': return styles.h3;
      case 'subtitle': return isDark ? styles.subtitleDark : styles.subtitleLight;
      case 'bodySemibold': return styles.bodySemibold;
      case 'caption': return isDark ? styles.captionDark : styles.captionLight;
      case 'captionSemibold': return styles.captionSemibold;
      case 'small': return styles.small;
      case 'bold': return styles.bold;
      case 'body':
      default:
        return styles.body;
    }
  };

  // Base text color depends on theme if no color is provided
  const themeColorStyle = color 
    ? { color } 
    : isDark 
      ? { color: '#ffffff' } 
      : { color: '#111827' };

  return (
    <Text
      style={[getVariantStyle(), themeColorStyle, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = ScaledSheet.create({
  h1: {
    fontSize: '24@ms',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: '20@ms',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: '18@ms',
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  subtitleLight: {
    fontSize: '16@ms',
    fontWeight: '500',
    color: '#6b7280',
  },
  subtitleDark: {
    fontSize: '16@ms',
    fontWeight: '500',
    color: '#9ca3af',
  },
  bodySemibold: {
    fontSize: '14@ms',
    fontWeight: '600',
  },
  captionLight: {
    fontSize: '12@ms',
    fontWeight: 'normal',
    color: '#9ca3af',
  },
  captionDark: {
    fontSize: '12@ms',
    fontWeight: 'normal',
    color: '#6b7280',
  },
  captionSemibold: {
    fontSize: '12@ms',
    fontWeight: '600',
  },
  small: {
    fontSize: '11@ms',
    fontWeight: 'normal',
  },
  bold: {
    fontSize: '14@ms',
    fontWeight: 'bold',
  },
  body: {
    fontSize: '14@ms',
    fontWeight: 'normal',
  },
});

export default AppText;
