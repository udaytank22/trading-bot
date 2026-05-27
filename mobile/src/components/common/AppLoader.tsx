import React from 'react';
import { View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import AppText from './AppText';
import Stylesheet from './Stylesheet';
import { useAppStore } from '../../store/appStore';

interface AppLoaderProps {
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export const AppLoader: React.FC<AppLoaderProps> = ({
  label = 'Loading...',
  style,
}) => {
  const theme = useAppStore((state) => state.theme);
  const containerStyle = Stylesheet.cls(theme, 'flex-1 items-center justify-center bg-gray-50 dark:bg-darkbg p-6');
  const labelStyle = Stylesheet.cls(theme, 'mt-3 text-center text-sm');

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator size="large" color="#8b5cf6" />
      {label ? (
        <AppText variant="subtitle" style={labelStyle}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
};

export const AppSkeletonItem: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const theme = useAppStore((state) => state.theme);
  const itemStyle = Stylesheet.cls(theme, 'w-full rounded-2xl bg-gray-200 dark:bg-gray-800 h-16 mb-3');

  return (
    <View style={[itemStyle, style]} />
  );
};

export default AppLoader;
