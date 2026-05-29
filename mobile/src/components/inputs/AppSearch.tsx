import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { View,
  TextInput,
  TouchableOpacity,
  StyleProp,
  ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAppStore } from '../../store/appStore';
import AppText from '../common/AppText';

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

  const containerStyle = [
    styles.containerStyle,
    isDark ? styles.containerDark : styles.containerLight,
  ];

  const iconContainerStyle = styles.iconContainerStyle;

  const inputStyle = styles.inputStyle;
  const clearBtnStyle = styles.clearBtnStyle;
  const clearTextStyle = [styles.clearTextStyle, theme === 'dark' && styles.clearTextStyleDark];

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

const styles = ScaledSheet.create({
  clearBtnStyle: {
    padding: '4@ms',
  },
  clearTextStyle: {
    color: '#9ca3af',
    fontSize: '12@ms',
    fontWeight: 'bold',
    paddingHorizontal: '4@ms',
  },
  clearTextStyleDark: {
    color: '#6b7280',
  },
  iconContainerStyle: {
    marginRight: '10@ms',
    marginLeft: '4@ms',
    opacity: 0.7,
  },
  inputStyle: {
    flex: 1,
    fontSize: '15@ms',
    height: '100%',
  },
  containerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '42@vs',
    borderRadius: '12@ms',
    paddingHorizontal: '12@ms',
    borderWidth: 1,
  },
  containerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  containerDark: {
    backgroundColor: '#161920',
    borderColor: '#2a2d33',
  },
});

export default AppSearch;
