import React from 'react';
import { TouchableOpacity, ActivityIndicator, View, TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';
import AppText from './AppText';
import Stylesheet from './Stylesheet';
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

  let btnStyles = 'flex-row items-center justify-center py-2.5 px-4 rounded-xl shadow-sm transition-all h-[44px]';
  let textStyles = 'text-sm font-bold text-center';

  switch (variant) {
    case 'secondary':
      btnStyles += isDisableMode 
        ? ' bg-gray-200 dark:bg-gray-800' 
        : ' bg-gray-100 dark:bg-white/10 active:opacity-80';
      textStyles += ' text-gray-800 dark:text-white';
      break;
    case 'outline':
      btnStyles += isDisableMode 
        ? ' border border-gray-200 dark:border-gray-850' 
        : ' border border-purple-500 dark:border-purple-400 active:bg-purple-50 dark:active:bg-purple-950/20';
      textStyles += ' text-purple-600 dark:text-purple-400';
      break;
    case 'ghost':
      btnStyles += isDisableMode 
        ? ' opacity-50' 
        : ' active:bg-gray-100 dark:active:bg-white/5 shadow-none';
      textStyles += ' text-gray-600 dark:text-gray-400';
      break;
    case 'danger':
      btnStyles += isDisableMode 
        ? ' bg-red-300 dark:bg-red-950/45' 
        : ' bg-red-650 dark:bg-red-600 active:opacity-90';
      textStyles += ' text-white';
      break;
    case 'primary':
    default:
      btnStyles += isDisableMode 
        ? ' bg-purple-300 dark:bg-purple-950/45' 
        : ' bg-purple-650 dark:bg-purple-600 active:opacity-95';
      textStyles += ' text-white';
      break;
  }

  const parsedBtnStyle = Stylesheet.cls(theme, btnStyles);
  const parsedTextStyle = Stylesheet.cls(theme, textStyles);

  return (
    <TouchableOpacity
      style={[parsedBtnStyle, style]}
      disabled={isDisableMode}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? '#8b5cf6' : '#ffffff'} />
      ) : (
        <View style={Stylesheet.cls(theme, "flex-row items-center justify-center")}>
          {icon && <View style={Stylesheet.cls(theme, "mr-2")}>{icon}</View>}
          <AppText style={parsedTextStyle}>{title}</AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};
export default AppButton;
