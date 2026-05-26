import React, { useState } from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
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

  const bgStyles = isDark ? 'bg-[#151821]' : 'bg-white';
  const textThemeColor = isDark ? '#ffffff' : '#111827';
  const placeholderThemeColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <View className={`w-full mb-4 ${containerClassName}`}>
      {label && (
        <AppText variant="captionSemibold" className="text-gray-500 dark:text-gray-400 mb-1.5 font-medium ml-1">
          {label}
        </AppText>
      )}
      
      <View 
        className={`flex-row items-center h-[46px] rounded-xl px-3 shadow-inner ${bgStyles} ${borderStyles} ${className}`}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        
        <TextInput
          className="flex-1 text-[13.5px] font-medium h-full"
          style={{ color: textThemeColor }}
          placeholderTextColor={placeholderThemeColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      
      {error && (
        <AppText className="text-red-500 text-[11px] font-semibold mt-1 ml-1">
          {error}
        </AppText>
      )}
    </View>
  );
};
export default AppInput;
