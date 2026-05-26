import React from 'react';
import { View, Image } from 'react-native';
import AppText from './AppText';

interface AppAvatarProps {
  name: string;
  imageUri?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  statusColor?: string;
  className?: string;
}

export const AppAvatar: React.FC<AppAvatarProps> = ({
  name,
  imageUri,
  size = 'md',
  showStatus = false,
  statusColor = 'bg-emerald-500',
  className = '',
}) => {
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

  const ringStyles = size === 'sm' ? 'w-2 h-2 border border-white dark:border-[#0c0e12]' : 'w-3.5 h-3.5 border-2 border-white dark:border-[#0c0e12]';

  return (
    <View 
      style={{ width: containerSize, height: containerSize }}
      className={`relative items-center justify-center rounded-full bg-purple-650 dark:bg-purple-600 ${className}`}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: containerSize, height: containerSize }}
          className="rounded-full"
        />
      ) : (
        <AppText variant={textVariant} className="text-white">
          {getInitials(name)}
        </AppText>
      )}
      {showStatus && (
        <View 
          className={`absolute bottom-0 right-0 rounded-full ${statusColor} ${ringStyles}`}
        />
      )}
    </View>
  );
};
export default AppAvatar;
