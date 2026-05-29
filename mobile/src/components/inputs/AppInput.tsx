import React, { useState } from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { View, TextInput, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';

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

  const textThemeColor = isDark ? '#ffffff' : '#111827';
  const placeholderThemeColor = isDark ? '#6b7280' : '#9ca3af';

  const wrapperStyle = styles.wrapperStyle;
  const labelStyle = [styles.labelStyle, theme === 'dark' && styles.labelStyleDark];
  const innerContainerStyle = [
    styles.innerContainerStyle,
    isDark ? styles.bgDark : styles.bgLight,
    error 
      ? styles.borderError 
      : isFocused 
      ? styles.borderFocused 
      : (isDark ? styles.borderDefaultDark : styles.borderDefault)
  ];
  const inputStyle = styles.inputStyle;
  const errorStyle = styles.errorStyle;

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
        {leftIcon && <View style={styles.view1}>{leftIcon}</View>}
        
        <TextInput
          style={[inputStyle, { color: textThemeColor }]}
          placeholderTextColor={placeholderThemeColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && <View style={styles.view}>{rightIcon}</View>}
      </View>
      
      {error && (
        <AppText style={errorStyle}>
          {error}
        </AppText>
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  errorStyle: {
    color: '#ef4444',
    fontSize: '11@ms',
    fontWeight: '600',
    marginTop: '4@ms',
    marginLeft: '4@ms',
  },
  inputStyle: {
    flex: 1,
    fontSize: '13.5@ms',
    fontWeight: '500',
    height: '100%',
  },
  labelStyle: {
    color: '#4b5563',
    marginBottom: '6@ms',
    fontWeight: '500',
    marginLeft: '4@ms',
  },
  labelStyleDark: {
    color: '#9ca3af',
  },
  innerContainerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '46@vs',
    borderRadius: '12@ms',
    paddingHorizontal: '12@ms',
    borderWidth: 1,
  },
  borderDefault: {
    borderColor: '#e5e7eb',
  },
  borderDefaultDark: {
    borderColor: '#2a2d33',
  },
  borderFocused: {
    borderColor: '#a855f7',
  },
  borderError: {
    borderColor: '#ef4444',
  },
  bgLight: {
    backgroundColor: '#ffffff',
  },
  bgDark: {
    backgroundColor: '#161920',
  },
  view: {
    marginLeft: '8@ms',
  },
  view1: {
    marginRight: '8@ms',
  },
  wrapperStyle: {
    width: '100%',
    marginBottom: '16@ms',
  },
});

export default AppInput;
