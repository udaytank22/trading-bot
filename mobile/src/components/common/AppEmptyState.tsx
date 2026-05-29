import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { View, StyleProp, ViewStyle } from 'react-native';
import AppText from './AppText';
import AppButton from './AppButton';
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

  const containerStyle = [styles.containerStyle, theme === 'dark' && styles.containerStyleDark];
  const iconContainerStyle = [styles.iconContainerStyle, theme === 'dark' && styles.iconContainerStyleDark];
  const iconPlaceholderStyle = styles.iconPlaceholderStyle;
  const titleStyle = styles.titleStyle;
  const descStyle = styles.descStyle;
  const btnStyle = styles.btnStyle;

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

const styles = ScaledSheet.create({
  btnStyle: {
    height: '38.0@vs',
    paddingHorizontal: '24@ms',
  },
  containerStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32@ms',
    borderRadius: '16@ms',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  containerStyleDark: {
    backgroundColor: '#161920',
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  descStyle: {
    textAlign: 'center',
    fontSize: '12@ms',
    marginBottom: '24@ms',
    paddingHorizontal: '16@ms',
  },
  iconContainerStyle: {
    width: '56@s',
    height: '56@vs',
    borderRadius: '9999@ms',
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16@ms',
  },
  iconContainerStyleDark: {
    backgroundColor: 'rgba(59, 7, 100, 0.2)',
  },
  iconPlaceholderStyle: {
    width: '24@s',
    height: '24@vs',
    borderColor: '#a855f7',
    borderRadius: '8@ms',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '4@ms',
  },
});

export default AppEmptyState;
