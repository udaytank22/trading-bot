import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { Modal, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const modalOverlayStyle = styles.modalOverlayStyle;
  
  // Backdrop touchable needs absolute layout to cover screen
  const backdropStyle = {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  const modalWrapperStyle = [
    styles.modalWrapperStyle,
    isDark ? styles.modalWrapperDark : styles.modalWrapperLight,
  ];
  
  const headerStyle = [
    styles.headerStyle,
    isDark ? styles.headerStyleDark : styles.headerStyleLight,
  ];
  const titleStyle = styles.titleStyle;
  const closeBtnStyle = [styles.closeBtnStyle, theme === 'dark' && styles.closeBtnStyleDark];
  const closeTextStyle = [styles.closeTextStyle, theme === 'dark' && styles.closeTextStyleDark];
  const contentStyle = styles.contentStyle;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={modalOverlayStyle}>
          {/* Backdrop close */}
          <TouchableOpacity 
            style={backdropStyle} 
            activeOpacity={1} 
            onPress={onClose} 
          />
          
          <View 
            style={modalWrapperStyle}
          >
            {/* Modal Header */}
            <View style={headerStyle}>
              <AppText variant="h3" style={titleStyle}>
                {title}
              </AppText>
              <TouchableOpacity 
                onPress={onClose}
                style={closeBtnStyle}
              >
                <AppText style={closeTextStyle}>
                  ✕
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView style={contentStyle} contentContainerStyle={{ paddingBottom: 24 }}>
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = ScaledSheet.create({
  closeBtnStyle: {
    padding: '4@ms',
    borderRadius: '8@ms',
    backgroundColor: '#e5e7eb',
  },
  closeBtnStyleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  closeTextStyle: {
    color: '#9ca3af',
    fontWeight: 'bold',
    fontSize: '14@ms',
  },
  closeTextStyleDark: {
    color: '#6b7280',
  },
  contentStyle: {
    padding: '20@ms',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlayStyle: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    padding: '16@ms',
  },
  modalWrapperStyle: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: '24@ms',
    overflow: 'hidden',
    borderWidth: 1,
  },
  modalWrapperLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  modalWrapperDark: {
    backgroundColor: '#161920',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerStyle: {
    paddingHorizontal: '20@ms',
    paddingVertical: '16@ms',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerStyleLight: {
    borderColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  headerStyleDark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: '#1a1d23',
  },
  titleStyle: {
    fontWeight: 'bold',
  },
});

export default AppModal;
