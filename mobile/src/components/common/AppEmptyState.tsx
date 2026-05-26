import React from 'react';
import { View } from 'react-native';
import AppText from './AppText';
import AppButton from './AppButton';

interface AppEmptyStateProps {
  title?: string;
  description?: string;
  iconName?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  className?: string;
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are no items to display right now.',
  actionTitle,
  onActionPress,
  className = '',
}) => {
  return (
    <View className={`items-center justify-center p-8 rounded-2xl bg-white dark:bg-[#12141c] border border-gray-100 dark:border-white/[0.03] ${className}`}>
      {/* Reusable nice SVG icon placeholder */}
      <View className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-950/20 items-center justify-center mb-4">
        <View className="w-6 h-6 border-2 border-purple-500 rounded-lg border-dashed items-center justify-center" />
      </View>
      
      <AppText variant="h3" className="font-bold text-center mb-1">
        {title}
      </AppText>
      
      <AppText variant="subtitle" className="text-center text-xs mb-6 px-4">
        {description}
      </AppText>
      
      {actionTitle && onActionPress && (
        <AppButton 
          title={actionTitle} 
          onPress={onActionPress} 
          variant="outline"
          className="h-[38px] px-6"
        />
      )}
    </View>
  );
};
export default AppEmptyState;
