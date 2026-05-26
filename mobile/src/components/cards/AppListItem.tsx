import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import AppText from '../common/AppText';
import AppCard from '../common/AppCard';

interface AppListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightText?: string;
  badge?: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export const AppListItem: React.FC<AppListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  rightText,
  badge,
  onPress,
  className = '',
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.8}
      className="mb-2.5"
    >
      <AppCard variant="glass" className={`flex-row items-center justify-between p-3.5 ${className}`}>
        <View className="flex-row items-center flex-1 pr-2">
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          
          <View className="flex-1">
            <AppText variant="bodySemibold" className="text-gray-900 dark:text-white" numberOfLines={1}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" className="text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center">
          {badge && <View className="mr-2">{badge}</View>}
          
          {rightText ? (
            <AppText variant="bodySemibold" className="text-gray-700 dark:text-gray-300 mr-1.5">
              {rightText}
            </AppText>
          ) : null}

          {rightIcon ? (
            rightIcon
          ) : onPress ? (
            // Chevron arrow right
            <View className="w-1.5 h-1.5 border-r border-t border-gray-400 dark:border-gray-600 transform rotate-45 ml-1.5 mr-0.5" />
          ) : null}
        </View>
      </AppCard>
    </Container>
  );
};
export default AppListItem;
