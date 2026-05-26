import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { useAppStore } from '../../store/appStore';
import AppText from '../common/AppText';

interface AppSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export const AppSearch: React.FC<AppSearchProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  className = '',
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const textThemeColor = isDark ? '#ffffff' : '#111827';
  const placeholderThemeColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <View 
      className={`flex-row items-center h-[42px] rounded-xl px-3 border border-transparent shadow-inner ${
        isDark ? 'bg-[#151821] border-[#2a2d33]' : 'bg-white border-gray-200'
      } ${className}`}
    >
      {/* Reusable inline magnifying glass SVG */}
      <View className="mr-2 opacity-50">
        <View className="w-3.5 h-3.5 border-2 border-gray-500 rounded-full items-center justify-center relative">
          <View className="absolute -bottom-1 -right-1 w-1.5 h-[2px] bg-gray-500 transform rotate-45" />
        </View>
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderThemeColor}
        className="flex-1 text-[13px] font-medium h-full"
        style={{ color: textThemeColor }}
      />

      {value.length > 0 && (
        <TouchableOpacity 
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
          className="p-1"
        >
          <AppText className="text-gray-400 dark:text-gray-500 text-xs font-bold px-1">
            ✕
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};
export default AppSearch;
