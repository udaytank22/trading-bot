import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAppStore } from '../../store/appStore';
import AppText from '../common/AppText';
import Stylesheet from '../common/Stylesheet';

interface AppSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AppSearch: React.FC<AppSearchProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  style,
}) => {
  const theme = useAppStore(state => state.theme);
  const isDark = theme === 'dark';

  const textThemeColor = isDark ? '#ffffff' : '#111827';
  const placeholderThemeColor = isDark ? '#6b7280' : '#9ca3af';

  const searchBg = isDark
    ? 'bg-darkcard border-darkborder'
    : 'bg-white border-gray-200';
  const containerStyle = Stylesheet.cls(
    theme,
    `flex-row items-center h-[42px] rounded-xl px-3 border border-transparent shadow-inner ${searchBg}`,
  );

  const iconContainerStyle = Stylesheet.cls(theme, 'mr-2.5 ml-1 opacity-70');

  const inputStyle = Stylesheet.cls(theme, 'flex-1 text-[15px] h-full');
  const clearBtnStyle = Stylesheet.cls(theme, 'p-1');
  const clearTextStyle = Stylesheet.cls(
    theme,
    'text-gray-400 dark:text-gray-500 text-xs font-bold px-1',
  );

  return (
    <View style={[containerStyle, style]}>
      <View style={iconContainerStyle}>
        <Icon name="search" size={19} color={placeholderThemeColor} />
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderThemeColor}
        style={[inputStyle, { color: textThemeColor }]}
      />

      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
          style={clearBtnStyle}
        >
          <AppText style={clearTextStyle}>✕</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};
export default AppSearch;
