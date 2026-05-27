import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';
import Stylesheet from '../common/Stylesheet';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [isFocused, setIsFocused] = useState(false);

  // Border styling depending on focus and error states
  let borderStyles = 'border ';
  if (error) {
    borderStyles += 'border-red-500';
  } else if (isFocused) {
    borderStyles += 'border-purple-500';
  } else {
    borderStyles += isDark 
      ? 'border-[#2a2d33]' 
      : 'border-gray-200';
  }

  const bgStyles = isDark ? 'bg-darkcard' : 'bg-white';
  const textThemeColor = isDark ? '#ffffff' : '#111827';
  const placeholderThemeColor = isDark ? '#6b7280' : '#9ca3af';

  const wrapperStyle = Stylesheet.cls(theme, 'w-full mb-4');
  const labelStyle = Stylesheet.cls(theme, 'text-gray-550 dark:text-gray-400 mb-1.5 font-medium ml-1');
  const innerContainerStyle = Stylesheet.cls(theme, `flex-row items-center h-[46px] rounded-xl px-3 shadow-inner ${bgStyles} ${borderStyles}`);
  const inputStyle = Stylesheet.cls(theme, 'flex-1 text-[13.5px] font-medium h-full');
  const errorStyle = Stylesheet.cls(theme, 'text-red-500 text-[11px] font-semibold mt-1 ml-1');

  return (
    <View style={[wrapperStyle, containerStyle]}>
      {label && (
        <AppText variant="captionSemibold" style={labelStyle}>
          {label}
        </AppText>
      )}
      
      <View 
        style={[innerContainerStyle, style]}
      >
        {leftIcon && <View style={Stylesheet.cls(theme, "mr-2")}>{leftIcon}</View>}
        
        <TextInput
          style={[inputStyle, { color: textThemeColor }]}
          placeholderTextColor={placeholderThemeColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && <View style={Stylesheet.cls(theme, "ml-2")}>{rightIcon}</View>}
      </View>
      
      {error && (
        <AppText style={errorStyle}>
          {error}
        </AppText>
      )}
    </View>
  );
};
export default AppInput;
