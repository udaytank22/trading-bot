import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import AppText from './AppText';
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

  const getBadgeStyle = (): StyleProp<ViewStyle> => {
    const isDark = theme === 'dark';
    const list: any[] = [styles.badgeBase];
    switch (variant) {
      case 'success': list.push(isDark ? styles.successDark : styles.successLight); break;
      case 'warning': list.push(isDark ? styles.warningDark : styles.warningLight); break;
      case 'danger': list.push(isDark ? styles.dangerDark : styles.dangerLight); break;
      case 'info': list.push(isDark ? styles.infoDark : styles.infoLight); break;
      case 'gray': list.push(isDark ? styles.grayDark : styles.grayLight); break;
      case 'primary':
      default:
        list.push(isDark ? styles.primaryDark : styles.primaryLight);
        break;
    }
    return list;
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    const isDark = theme === 'dark';
    const list: any[] = [styles.textBase];
    switch (variant) {
      case 'success': list.push(isDark ? styles.textSuccessDark : styles.textSuccessLight); break;
      case 'warning': list.push(isDark ? styles.textWarningDark : styles.textWarningLight); break;
      case 'danger': list.push(isDark ? styles.textDangerDark : styles.textDangerLight); break;
      case 'info': list.push(isDark ? styles.textInfoDark : styles.textInfoLight); break;
      case 'gray': list.push(isDark ? styles.textGrayDark : styles.textGrayLight); break;
      case 'primary':
      default:
        list.push(isDark ? styles.textPrimaryDark : styles.textPrimaryLight);
        break;
    }
    return list;
  };

  return (
    <View style={[getBadgeStyle(), style]}>
      <AppText style={getTextStyle()}>{label}</AppText>
    </View>
  );
};

const styles = ScaledSheet.create({
  badgeBase: {
    paddingHorizontal: '8@ms',
    paddingVertical: '2@ms',
    borderRadius: '9999@ms',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBase: {
    fontSize: '11@ms',
    fontWeight: 'bold',
  },
  successLight: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  successDark: {
    backgroundColor: 'rgba(6, 78, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(6, 95, 70, 0.5)',
  },
  textSuccessLight: {
    color: '#059669',
  },
  textSuccessDark: {
    color: '#34d399',
  },
  warningLight: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningDark: {
    backgroundColor: 'rgba(120, 53, 4, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(146, 64, 14, 0.5)',
  },
  textWarningLight: {
    color: '#d97706',
  },
  textWarningDark: {
    color: '#fbbf24',
  },
  dangerLight: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerDark: {
    backgroundColor: 'rgba(127, 29, 29, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(153, 27, 27, 0.5)',
  },
  textDangerLight: {
    color: '#b91c1c',
  },
  textDangerDark: {
    color: '#f87171',
  },
  infoLight: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoDark: {
    backgroundColor: 'rgba(23, 37, 84, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 138, 0.5)',
  },
  textInfoLight: {
    color: '#2563eb',
  },
  textInfoDark: {
    color: '#60a5fa',
  },
  grayLight: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  grayDark: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  textGrayLight: {
    color: '#4b5563',
  },
  textGrayDark: {
    color: '#9ca3af',
  },
  primaryLight: {
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  primaryDark: {
    backgroundColor: 'rgba(59, 7, 100, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(88, 28, 135, 0.5)',
  },
  textPrimaryLight: {
    color: '#7c3aed',
  },
  textPrimaryDark: {
    color: '#c084fc',
  },
});

export default AppBadge;
