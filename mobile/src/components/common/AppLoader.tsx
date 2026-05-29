import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import AppText from './AppText';
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
  const containerStyle = [styles.containerStyle, theme === 'dark' && styles.containerStyleDark];
  const labelStyle = styles.labelStyle;

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
  const itemStyle = [styles.itemStyle, theme === 'dark' && styles.itemStyleDark];

  return (
    <View style={[itemStyle, style]} />
  );
};


const styles = ScaledSheet.create({
  containerStyle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '24@ms',
  },
  containerStyleDark: {
    backgroundColor: '#0c0e12',
  },
  itemStyle: {
    width: '100%',
    borderRadius: '16@ms',
    backgroundColor: '#e5e7eb',
    height: '64@vs',
    marginBottom: '12@ms',
  },
  itemStyleDark: {
    backgroundColor: '#1f2937',
  },
  labelStyle: {
    marginTop: '12@ms',
    textAlign: 'center',
    fontSize: '14@ms',
  },
});

export default AppLoader;
