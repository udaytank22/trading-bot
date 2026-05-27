import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Modal, View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';
import Stylesheet from '../common/Stylesheet';

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

  const containerStyle = Stylesheet.cls(theme, 'flex-1 justify-end bg-black/60');
  
  const bottomSheetBg = isDark ? 'bg-darkbg border-white/[0.05]' : 'bg-gray-50 border-gray-200';
  const bottomSheetStyle = Stylesheet.cls(theme, `rounded-t-3xl border-t shadow-2xl ${bottomSheetBg}`);
  
  const grabContainerStyle = Stylesheet.cls(theme, 'items-center py-2 bg-white dark:bg-[#12141c] rounded-t-3xl');
  const grabHandleStyle = Stylesheet.cls(theme, 'w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full');
  
  const headerStyle = Stylesheet.cls(theme, 'px-5 pb-3 pt-1 flex-row justify-between items-center bg-white dark:bg-[#12141c] border-b border-gray-100 dark:border-white/[0.04]');
  const titleStyle = Stylesheet.cls(theme, 'font-bold flex-1');
  const doneBtnStyle = Stylesheet.cls(theme, 'px-2 py-1 rounded-lg active:bg-gray-100 dark:active:bg-white/5');
  const doneTextStyle = Stylesheet.cls(theme, 'text-purple-600 dark:text-purple-400 font-bold text-sm');
  const scrollStyle = Stylesheet.cls(theme, 'p-4');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={Stylesheet.cls(theme, "flex-1")}
      >
        <View style={containerStyle}>
          {/* Backdrop */}
          <TouchableOpacity 
            style={Stylesheet.cls(theme, "flex-1")} 
            activeOpacity={1} 
            onPress={onClose} 
          />
          
          <SafeAreaView 
            style={[{ maxHeight: `${maxHeightPercent * 100}%` }, bottomSheetStyle]}
          >
            {/* Grab handle indicator */}
            <View style={grabContainerStyle}>
              <View style={grabHandleStyle} />
            </View>
            
            {/* Header */}
            <View style={headerStyle}>
              <AppText variant="h3" style={titleStyle} numberOfLines={1}>
                {title}
              </AppText>
              
              <TouchableOpacity 
                onPress={onClose}
                style={doneBtnStyle}
              >
                <AppText style={doneTextStyle}>
                  Done
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Scrollable contents */}
            <ScrollView style={scrollStyle} contentContainerStyle={{ paddingBottom: 40 }}>
              {children}
            </ScrollView>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
export default AppBottomSheet;
