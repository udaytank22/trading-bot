import React from 'react';
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center bg-black/70 p-4">
          {/* Backdrop close */}
          <TouchableOpacity 
            className="absolute inset-0" 
            activeOpacity={1} 
            onPress={onClose} 
          />
          
          <View 
            className={`w-full max-h-[80%] rounded-3xl overflow-hidden shadow-2xl border ${
              isDark ? 'bg-[#161920] border-white/[0.08]' : 'bg-white border-gray-200'
            }`}
          >
            {/* Modal Header */}
            <View className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.04] flex-row justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
              <AppText variant="h3" className="font-bold">
                {title}
              </AppText>
              <TouchableOpacity 
                onPress={onClose}
                className="p-1 rounded-lg active:bg-gray-250 dark:active:bg-white/5"
              >
                <AppText className="text-gray-400 dark:text-gray-500 font-bold text-sm">
                  ✕
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 24 }}>
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
export default AppModal;
