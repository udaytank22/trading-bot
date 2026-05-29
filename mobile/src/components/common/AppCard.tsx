import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useAppStore } from '../../store/appStore';

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

  const getCardStyle = (): StyleProp<ViewStyle> => {
    const isDark = theme === 'dark';
    const list: any[] = [styles.cardBase];
    if (variant === 'glass') {
      list.push(isDark ? styles.glassDark : styles.glassLight);
    } else if (variant === 'bordered') {
      list.push(isDark ? styles.borderedDark : styles.borderedLight);
    } else {
      list.push(isDark ? styles.defaultDark : styles.defaultLight);
    }
    return list;
  };

  return (
    <View
      style={[getCardStyle(), style]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = ScaledSheet.create({
  cardBase: {
    borderRadius: '16@ms',
    padding: '16@ms',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  glassLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(243, 244, 246, 0.5)',
  },
  glassDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  borderedLight: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  borderedDark: {
    backgroundColor: '#151821',
    borderWidth: 1,
    borderColor: '#2a2d33',
  },
  defaultLight: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  defaultDark: {
    backgroundColor: '#12141c',
    borderWidth: 1,
    borderColor: 'transparent',
  },
});

export default AppCard;
