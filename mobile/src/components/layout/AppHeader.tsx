import React from 'react';
import { View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';
import Icon from 'react-native-vector-icons/Feather';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
  rightAction,
  leftAction,
  style,
}) => {
  const navigation = useNavigation();
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const bgColor = isDark ? '#0c0e12' : '#f4f5fb';
  const borderBottom = isDark ? '#23262f' : '#e9eaf0';
  const titleColor = isDark ? '#f1f5f9' : '#111827';
  const iconColor = isDark ? '#e5e7eb' : '#374151';
  const iconBg = isDark ? '#23262f' : '#ececf1';

  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: bgColor,
      borderBottomWidth: 1,
      borderBottomColor: borderBottom,
    }, style as any]}>
      {/* Left side */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showBack && navigation.canGoBack() ? (
          <TouchableOpacity
            onPress={handleBack}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={18} color={iconColor} />
          </TouchableOpacity>
        ) : leftAction ? (
          <View style={{ marginRight: 10 }}>{leftAction}</View>
        ) : null}

        <AppText style={{
          fontSize: 17,
          fontWeight: '700',
          color: titleColor,
          flex: 1,
        }} numberOfLines={1}>
          {title}
        </AppText>
      </View>

      {/* Right side */}
      {rightAction ? (
        <View style={{ marginLeft: 10 }}>{rightAction}</View>
      ) : null}
    </View>
  );
};

export default AppHeader;
