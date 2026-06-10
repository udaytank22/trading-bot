import React from 'react';
import { View, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAppStore } from '../../store/appStore';
import AppText from './AppText';
import { ScaledSheet } from 'react-native-size-matters';

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

const styles = ScaledSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.9,
    padding: '12@ms',
    borderRadius: '16@ms',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginTop: '10@ms',
  },
  toastLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  toastDark: {
    backgroundColor: 'rgba(18, 20, 28, 0.95)',
  },
  iconWrapper: {
    width: '36@ms',
    height: '36@ms',
    borderRadius: '18@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@ms',
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: '13@ms',
    marginBottom: '2@ms',
  },
  messageText: {
    fontSize: '11@ms',
  },
  textLight: {
    color: '#1f2937',
  },
  textDark: {
    color: '#f3f4f6',
  },
  descLight: {
    color: '#6b7280',
  },
  descDark: {
    color: '#9ca3af',
  },
});
