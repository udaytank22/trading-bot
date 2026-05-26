import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import AppText from './AppText';

interface AppLoaderProps {
  label?: string;
  className?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({
  label = 'Loading...',
  className = '',
}) => {
  return (
    <View className={`flex-1 items-center justify-center bg-gray-50 dark:bg-darkbg p-6 ${className}`}>
      <ActivityIndicator size="large" color="#8b5cf6" />
      {label ? (
        <AppText variant="subtitle" className="mt-3 text-center text-sm">
          {label}
        </AppText>
      ) : null}
    </View>
  );
};

export const AppSkeletonItem: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <View className={`w-full rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse h-16 mb-3 ${className}`} />
  );
};

export default AppLoader;
