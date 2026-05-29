import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { Modal, View, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';

interface AppAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  showCancel?: boolean;
  hideConfirm?: boolean;
}

export const AppAlert: React.FC<AppAlertProps> = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  showCancel = false,
  hideConfirm = false,
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const overlayStyle = styles.overlayStyle;
  
  const containerStyle = [
    styles.containerStyle,
    isDark ? styles.containerDark : styles.containerLight,
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={overlayStyle}>
          <TouchableWithoutFeedback>
            <View style={containerStyle}>
              <AppText variant="h3" style={styles.appText3}>
                {title}
              </AppText>
          <AppText style={[styles.appText2, theme === 'dark' && styles.appText2Dark]}>
            {message}
          </AppText>
          
          <View style={styles.view}>
            {showCancel && (
              <TouchableOpacity onPress={onClose} style={[styles.touchableOpacity, theme === 'dark' && styles.touchableOpacityDark]}>
                <AppText style={[styles.appText1, theme === 'dark' && styles.appText1Dark]}>
                  Cancel
                </AppText>
              </TouchableOpacity>
            )}
            {!hideConfirm && (
              <TouchableOpacity 
                onPress={() => {
                  if (onConfirm) {
                    onConfirm();
                  } else {
                    onClose();
                  }
                }} 
                style={[styles.style, theme === 'dark' && styles.styleDark]}
              >
                <AppText style={styles.appText}>
                  OK
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};


const styles = ScaledSheet.create({
  appText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '14@ms',
  },
  appText1: {
    color: '#374151',
    fontWeight: 'bold',
    fontSize: '14@ms',
  },
  appText1Dark: {
    color: '#d1d5db',
  },
  appText2: {
    fontSize: '15@ms',
    marginBottom: '32@ms',
  },
  appText2Dark: {
    color: '#9ca3af',
  },
  appText3: {
    marginBottom: '12@ms',
    fontWeight: 'bold',
  },
  overlayStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    padding: '16@ms',
  },
  containerStyle: {
    width: '85%',
    maxWidth: '384@s',
    borderRadius: '16@ms',
    padding: '24@ms',
    borderWidth: 1,
  },
  containerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#f3f4f6',
  },
  containerDark: {
    backgroundColor: '#161920',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  style: {
    paddingHorizontal: '20@ms',
    paddingVertical: '10@ms',
    backgroundColor: '#4F46E5',
    borderRadius: '12@ms',
  },
  styleDark: {
    backgroundColor: '#4F46E5',
  },
  touchableOpacity: {
    paddingHorizontal: '20@ms',
    paddingVertical: '10@ms',
    backgroundColor: '#f3f4f6',
    borderRadius: '12@ms',
  },
  touchableOpacityDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  view: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: '12@ms',
  },
});

export default AppAlert;
