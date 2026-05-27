import React from 'react';
import { TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
import AppText from '../common/AppText';
import AppCard from '../common/AppCard';
import Stylesheet from '../common/Stylesheet';
import { useAppStore } from '../../store/appStore';

interface AppListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightText?: string;
  badge?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AppListItem: React.FC<AppListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  rightText,
  badge,
  onPress,
  style,
}) => {
  const theme = useAppStore((state) => state.theme);
  const Container = onPress ? TouchableOpacity : View;

  const cardStyle = Stylesheet.cls(theme, 'flex-row items-center justify-between p-3.5');
  const leftContainer = Stylesheet.cls(theme, 'flex-row items-center flex-1 pr-2');
  const leftIconContainer = Stylesheet.cls(theme, 'mr-3');
  const titleContainer = Stylesheet.cls(theme, 'flex-1');
  const titleText = Stylesheet.cls(theme, 'text-gray-900 dark:text-white');
  const subtitleText = Stylesheet.cls(theme, 'text-gray-500 dark:text-gray-400 mt-0.5');
  
  const rightContainer = Stylesheet.cls(theme, 'flex-row items-center');
  const badgeContainer = Stylesheet.cls(theme, 'mr-2');
  const rightTextStyle = Stylesheet.cls(theme, 'text-gray-700 dark:text-gray-300 mr-1.5');
  
  // Chevron styling: border-r border-t border-gray-400 dark:border-gray-600 w-1.5 h-1.5 rotate-45
  const chevronStyle = {
    width: 6,
    height: 6,
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: theme === 'dark' ? '#4b5563' : '#9ca3af',
    transform: [{ rotate: '45deg' }],
    marginLeft: 6,
    marginRight: 2,
  };

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.8}
      style={Stylesheet.cls(theme, "mb-2.5")}
    >
      <AppCard variant="glass" style={[cardStyle, style]}>
        <View style={leftContainer}>
          {leftIcon && <View style={leftIconContainer}>{leftIcon}</View>}
          
          <View style={titleContainer}>
            <AppText variant="bodySemibold" style={titleText} numberOfLines={1}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" style={subtitleText} numberOfLines={1}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={rightContainer}>
          {badge && <View style={badgeContainer}>{badge}</View>}
          
          {rightText ? (
            <AppText variant="bodySemibold" style={rightTextStyle}>
              {rightText}
            </AppText>
          ) : null}

          {rightIcon ? (
            rightIcon
          ) : onPress ? (
            <View style={chevronStyle} />
          ) : null}
        </View>
      </AppCard>
    </Container>
  );
};
export default AppListItem;
