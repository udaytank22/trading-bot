import React from 'react';
import Toast from 'react-native-toast-message';
import { View, Dimensions, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAppStore } from '../../store/appStore';
import AppText from './AppText';
import { colors, spacing, scale, typography } from '../../theme';

const { width } = Dimensions.get('window');

interface ToastCardProps {
  title?: string;
  message?: string;
  iconName: string;
  iconColor: string;
  borderColor: string;
}

const ToastCard: React.FC<ToastCardProps> = ({ 
  title, 
  message, 
  iconName, 
  iconColor, 
  borderColor 
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <View style={[
      styles.toastContainer, 
      isDark ? styles.toastDark : styles.toastLight,
      { borderColor }
    ]}>
      <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}15` }]}>
        <Icon name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.textWrapper}>
        {title ? (
          <AppText variant="bold" style={[styles.titleText, isDark ? styles.textDark : styles.textLight]}>
            {title}
          </AppText>
        ) : null}
        {message ? (
          <AppText variant="captionSemibold" style={[styles.messageText, isDark ? styles.descDark : styles.descLight]}>
            {message}
          </AppText>
        ) : null}
      </View>
    </View>
  );
};

export const toastConfig = {
  success: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <ToastCard 
      title={text1} 
      message={text2} 
      iconName="check-circle" 
      iconColor="#10b981" 
      borderColor="#10b98140" 
    />
  ),
  error: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <ToastCard 
      title={text1} 
      message={text2} 
      iconName="alert-circle" 
      iconColor="#ef4444" 
      borderColor="#ef444440" 
    />
  ),
  info: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <ToastCard 
      title={text1} 
      message={text2} 
      iconName="info" 
      iconColor="#3b82f6" 
      borderColor="#3b82f640" 
    />
  ),
};

export const showToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
  Toast.show({
    type,
    text1: title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'),
    text2: message,
  });
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.9,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginTop: scale(10),
  },
  toastLight: {
    backgroundColor: colors.light.surface,
  },
  toastDark: {
    backgroundColor: colors.dark.surface,
  },
  iconWrapper: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: typography.body,
    marginBottom: scale(2),
  },
  messageText: {
    fontSize: typography.caption,
  },
  textLight: {
    color: colors.light.text,
  },
  textDark: {
    color: colors.dark.text,
  },
  descLight: {
    color: colors.light.textSecondary,
  },
  descDark: {
    color: colors.dark.textSecondary,
  },
});
