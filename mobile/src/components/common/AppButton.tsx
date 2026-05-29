import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { TouchableOpacity, ActivityIndicator, View, TouchableOpacityProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import AppText from './AppText';
import { useAppStore } from '../../store/appStore';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  ...props
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDisableMode = disabled || loading;

  const getButtonStyles = (): StyleProp<ViewStyle> => {
    const list: any[] = [styles.btnBase];

    if (variant === 'secondary') {
      if (isDisableMode) {
        list.push(theme === 'dark' ? styles.btnSecondaryDisabledDark : styles.btnSecondaryDisabled);
      } else {
        list.push(theme === 'dark' ? styles.btnSecondaryDark : styles.btnSecondary);
      }
    } else if (variant === 'outline') {
      if (isDisableMode) {
        list.push(theme === 'dark' ? styles.btnOutlineDisabledDark : styles.btnOutlineDisabled);
      } else {
        list.push(theme === 'dark' ? styles.btnOutlineDark : styles.btnOutline);
      }
    } else if (variant === 'ghost') {
      list.push(styles.btnGhost);
      if (isDisableMode) {
        list.push(styles.btnGhostDisabled);
      }
    } else if (variant === 'danger') {
      if (isDisableMode) {
        list.push(theme === 'dark' ? styles.btnDangerDisabledDark : styles.btnDangerDisabled);
      } else {
        list.push(theme === 'dark' ? styles.btnDangerDark : styles.btnDanger);
      }
    } else { // primary
      if (isDisableMode) {
        list.push(theme === 'dark' ? styles.btnPrimaryDisabledDark : styles.btnPrimaryDisabled);
      } else {
        list.push(theme === 'dark' ? styles.btnPrimaryDark : styles.btnPrimary);
      }
    }
    return list;
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    const list: any[] = [styles.textBase];

    if (variant === 'secondary') {
      list.push(theme === 'dark' ? styles.textSecondaryDark : styles.textSecondary);
    } else if (variant === 'outline') {
      list.push(theme === 'dark' ? styles.textOutlineDark : styles.textOutline);
    } else if (variant === 'ghost') {
      list.push(theme === 'dark' ? styles.textGhostDark : styles.textGhost);
    } else if (variant === 'danger') {
      list.push(styles.textDanger);
    } else { // primary
      list.push(styles.textPrimary);
    }
    return list;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      disabled={isDisableMode}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? '#8b5cf6' : '#ffffff'} />
      ) : (
        <View style={styles.view1}>
          {icon && <View style={styles.view}>{icon}</View>}
          <AppText style={getTextStyle()}>{title}</AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = ScaledSheet.create({
  btnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '10@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '12@ms',
    height: '44@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  btnSecondary: {
    backgroundColor: '#f3f4f6', // bg-gray-100
  },
  btnSecondaryDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // bg-white/10
  },
  btnSecondaryDisabled: {
    backgroundColor: '#e5e7eb', // bg-gray-200
  },
  btnSecondaryDisabledDark: {
    backgroundColor: '#1f2937', // bg-gray-800
  },
  textSecondary: {
    color: '#374151', // text-gray-800
  },
  textSecondaryDark: {
    color: '#ffffff', // text-white
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#7c3aed', // border-purple-500
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnOutlineDark: {
    borderColor: '#c084fc', // border-purple-400
  },
  btnOutlineDisabled: {
    borderWidth: 1,
    borderColor: '#e5e7eb', // border-gray-200
  },
  btnOutlineDisabledDark: {
    borderColor: '#1f2937', // border-gray-850
  },
  textOutline: {
    color: '#7c3aed', // text-purple-650
  },
  textOutlineDark: {
    color: '#c084fc', // text-purple-400
  },
  btnGhost: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnGhostDisabled: {
    opacity: 0.5,
  },
  textGhost: {
    color: '#6b7280', // text-gray-600
  },
  textGhostDark: {
    color: '#9ca3af', // text-gray-400
  },
  btnDanger: {
    backgroundColor: '#b91c1c', // bg-red-650
  },
  btnDangerDark: {
    backgroundColor: '#dc2626', // bg-red-600
  },
  btnDangerDisabled: {
    backgroundColor: '#fca5a5', // bg-red-300
  },
  btnDangerDisabledDark: {
    backgroundColor: 'rgba(69, 10, 10, 0.45)', // bg-red-950/45
  },
  textDanger: {
    color: '#ffffff',
  },
  btnPrimary: {
    backgroundColor: '#8b5cf6', // bg-purple-650
  },
  btnPrimaryDark: {
    backgroundColor: '#7c3aed', // bg-purple-600
  },
  btnPrimaryDisabled: {
    backgroundColor: '#d8b4fe', // bg-purple-300
  },
  btnPrimaryDisabledDark: {
    backgroundColor: 'rgba(59, 7, 100, 0.45)', // bg-purple-950/45
  },
  textPrimary: {
    color: '#ffffff',
  },
  textBase: {
    fontSize: '14@ms',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  view: {
    marginRight: '8@ms',
  },
  view1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppButton;
