import React from 'react';
import { Modal, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';
import Stylesheet from '../common/Stylesheet';

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

  const modalOverlayStyle = Stylesheet.cls(theme, 'flex-1 justify-center bg-black/70 p-4');
  
  // Backdrop touchable needs absolute layout to cover screen
  const backdropStyle = {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  const modalBg = isDark ? 'bg-[#161920] border-white/[0.08]' : 'bg-white border-gray-200';
  const modalWrapperStyle = Stylesheet.cls(theme, `w-full max-h-[80%] rounded-3xl overflow-hidden shadow-2xl border ${modalBg}`);
  
  const headerBg = isDark ? 'bg-darkbg dark:bg-[#1a1d23]' : 'bg-gray-50';
  const headerStyle = Stylesheet.cls(theme, `px-5 py-4 border-b border-gray-100 dark:border-white/[0.04] flex-row justify-between items-center ${headerBg}`);
  const titleStyle = Stylesheet.cls(theme, 'font-bold');
  const closeBtnStyle = Stylesheet.cls(theme, 'p-1 rounded-lg active:bg-gray-200 dark:active:bg-white/5');
  const closeTextStyle = Stylesheet.cls(theme, 'text-gray-400 dark:text-gray-500 font-bold text-sm');
  const contentStyle = Stylesheet.cls(theme, 'p-5');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={Stylesheet.cls(theme, "flex-1")}
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
export default AppModal;
