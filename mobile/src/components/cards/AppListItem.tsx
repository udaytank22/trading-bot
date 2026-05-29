import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
import AppText from '../common/AppText';
import AppCard from '../common/AppCard';
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

  const cardStyle = styles.cardStyle;
  const leftContainer = styles.leftContainerStyle;
  const leftIconContainer = styles.leftIconContainerStyle;
  const titleContainer = styles.titleContainerStyle;
  const titleText = [styles.titleTextStyle, theme === 'dark' && styles.titleTextStyleDark];
  const subtitleText = [styles.subtitleTextStyle, theme === 'dark' && styles.subtitleTextStyleDark];
  
  const rightContainer = styles.rightContainerStyle;
  const badgeContainer = styles.badgeContainerStyle;
  const rightTextStyle = [styles.rightTextStyle, theme === 'dark' && styles.rightTextStyleDark];
  
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
      style={styles.container}
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

const styles = ScaledSheet.create({
  badgeContainerStyle: {
    marginRight: '8@ms',
  },
  cardStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14@ms',
  },
  container: {
    marginBottom: '10@ms',
  },
  leftContainerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: '8@ms',
  },
  leftIconContainerStyle: {
    marginRight: '12@ms',
  },
  rightContainerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightTextStyle: {
    color: '#374151',
    marginRight: '6@ms',
  },
  rightTextStyleDark: {
    color: '#d1d5db',
  },
  subtitleTextStyle: {
    color: '#6b7280',
    marginTop: '2@ms',
  },
  subtitleTextStyleDark: {
    color: '#9ca3af',
  },
  titleContainerStyle: {
    flex: 1,
  },
  titleTextStyle: {
    color: '#111827',
  },
  titleTextStyleDark: {
    color: '#ffffff',
  },
});

export default AppListItem;
