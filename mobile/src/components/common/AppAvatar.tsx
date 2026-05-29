import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { View, Image, StyleProp, ViewStyle } from 'react-native';
import AppText from './AppText';
import { useAppStore } from '../../store/appStore';

interface AppAvatarProps {
  name: string;
  imageUri?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  statusColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const AppAvatar: React.FC<AppAvatarProps> = ({
  name,
  imageUri,
  size = 'md',
  showStatus = false,
  statusColor = 'bg-emerald-500',
  style,
}) => {
  const theme = useAppStore((state) => state.theme);
  let containerSize = 40;
  let textVariant: 'small' | 'bodySemibold' | 'h2' = 'bodySemibold';

  switch (size) {
    case 'sm':
      containerSize = 30;
      textVariant = 'small';
      break;
    case 'lg':
      containerSize = 60;
      textVariant = 'h2';
      break;
    case 'md':
    default:
      containerSize = 40;
      textVariant = 'bodySemibold';
      break;
  }

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, Math.min(fullName.length, 2)).toUpperCase();
  };

  const baseAvatarStyle = [styles.baseAvatarStyle, theme === 'dark' && styles.baseAvatarStyleDark];
  const imageStyle = styles.imageStyle;
  const textStyle = styles.textStyle;
  const statusStyle = [
    styles.statusIndicator,
    size === 'sm' ? styles.statusSm : styles.statusMd,
    theme === 'dark' && (size === 'sm' ? styles.statusSmDark : styles.statusMdDark),
  ];

  return (
    <View 
      style={[{ width: containerSize, height: containerSize }, baseAvatarStyle, style]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[{ width: containerSize, height: containerSize }, imageStyle]}
        />
      ) : (
        <AppText variant={textVariant} style={textStyle}>
          {getInitials(name)}
        </AppText>
      )}
      {showStatus && (
        <View 
          style={statusStyle}
        />
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  baseAvatarStyle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999@ms',
    backgroundColor: '#8b5cf6',
  },
  baseAvatarStyleDark: {
    backgroundColor: '#7c3aed',
  },
  imageStyle: {
    borderRadius: '9999@ms',
  },
  textStyle: {
    color: '#ffffff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: '9999@ms',
    backgroundColor: '#10b981',
  },
  statusSm: {
    width: '8@s',
    height: '8@vs',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  statusSmDark: {
    borderColor: '#0c0e12',
  },
  statusMd: {
    width: '14@s',
    height: '14@vs',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  statusMdDark: {
    borderColor: '#0c0e12',
  },
});

export default AppAvatar;
