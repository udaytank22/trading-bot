import React from 'react';
import { Modal, View, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';

interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeightPercent?: number; // e.g. 0.8 for 80%
}

export const AppBottomSheet: React.FC<AppBottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  maxHeightPercent = 0.85,
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/60">
          {/* Backdrop */}
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1} 
            onPress={onClose} 
          />
          
          <SafeAreaView 
            style={{ maxHeight: `${maxHeightPercent * 100}%` }}
            className={`rounded-t-3xl border-t shadow-2xl ${
              isDark ? 'bg-darkbg border-white/[0.05]' : 'bg-gray-50 border-gray-200'
            }`}
          >
            {/* Grab handle indicator */}
            <View className="items-center py-2 bg-white dark:bg-[#12141c] rounded-t-3xl">
              <View className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </View>
            
            {/* Header */}
            <View className="px-5 pb-3 pt-1 flex-row justify-between items-center bg-white dark:bg-[#12141c] border-b border-gray-100 dark:border-white/[0.04]">
              <AppText variant="h3" className="font-bold flex-1" numberOfLines={1}>
                {title}
              </AppText>
              
              <TouchableOpacity 
                onPress={onClose}
                className="px-2 py-1 rounded-lg active:bg-gray-100 dark:active:bg-white/5"
              >
                <AppText className="text-purple-600 dark:text-purple-400 font-bold text-sm">
                  Done
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Scrollable contents */}
            <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 40 }}>
              {children}
            </ScrollView>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
export default AppBottomSheet;
