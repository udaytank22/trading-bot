import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import AppText from './AppText';
import AppButton from './AppButton';
import Stylesheet from './Stylesheet';
import { useAppStore } from '../../store/appStore';

interface AppEmptyStateProps {
  title?: string;
  description?: string;
  iconName?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are no items to display right now.',
  actionTitle,
  onActionPress,
  style,
}) => {
  const theme = useAppStore((state) => state.theme);

  const containerStyle = Stylesheet.cls(theme, 'items-center justify-center p-8 rounded-2xl bg-white dark:bg-darkcard border border-gray-100 dark:border-white/[0.03]');
  const iconContainerStyle = Stylesheet.cls(theme, 'w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-950/20 items-center justify-center mb-4');
  const iconPlaceholderStyle = Stylesheet.cls(theme, 'w-6 h-6 border-2 border-purple-500 rounded-lg border-dashed items-center justify-center');
  const titleStyle = Stylesheet.cls(theme, 'font-bold text-center mb-1');
  const descStyle = Stylesheet.cls(theme, 'text-center text-xs mb-6 px-4');
  const btnStyle = Stylesheet.cls(theme, 'h-[38px] px-6');

  return (
    <View style={[containerStyle, style]}>
      {/* Reusable nice SVG icon placeholder */}
      <View style={iconContainerStyle}>
        <View style={iconPlaceholderStyle} />
      </View>
      
      <AppText variant="h3" style={titleStyle}>
        {title}
      </AppText>
      
      <AppText variant="subtitle" style={descStyle}>
        {description}
      </AppText>
      
      {actionTitle && onActionPress && (
        <AppButton 
          title={actionTitle} 
          onPress={onActionPress} 
          variant="outline"
          style={btnStyle}
        />
      )}
    </View>
  );
};
export default AppEmptyState;
