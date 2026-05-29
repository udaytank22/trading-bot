import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledSheet } from 'react-native-size-matters';
import { Modal, View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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

  const containerStyle = styles.containerStyle;
  
  const bottomSheetStyle = [
    styles.bottomSheetStyle,
    isDark ? styles.bottomSheetDark : styles.bottomSheetLight,
  ];
  
  const grabContainerStyle = [styles.grabContainerStyle, theme === 'dark' && styles.grabContainerStyleDark];
  const grabHandleStyle = [styles.grabHandleStyle, theme === 'dark' && styles.grabHandleStyleDark];
  
  const headerStyle = [styles.headerStyle, theme === 'dark' && styles.headerStyleDark];
  const titleStyle = styles.titleStyle;
  const doneBtnStyle = [styles.doneBtnStyle, theme === 'dark' && styles.doneBtnStyleDark];
  const doneTextStyle = [styles.doneTextStyle, theme === 'dark' && styles.doneTextStyleDark];
  const scrollStyle = styles.scrollStyle;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={containerStyle}>
          {/* Backdrop */}
          <TouchableOpacity 
            style={styles.touchableOpacity} 
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

const styles = ScaledSheet.create({
  containerStyle: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
  },
  bottomSheetStyle: {
    borderTopLeftRadius: '24@ms',
    borderTopRightRadius: '24@ms',
    borderTopWidth: 1,
  },
  bottomSheetLight: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  bottomSheetDark: {
    backgroundColor: '#0c0e12',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  doneBtnStyle: {
    paddingHorizontal: '8@ms',
    paddingVertical: '4@ms',
    borderRadius: '8@ms',
    backgroundColor: '#f3f4f6',
  },
  doneBtnStyleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  doneTextStyle: {
    color: '#7c3aed',
    fontWeight: 'bold',
    fontSize: '14@ms',
  },
  doneTextStyleDark: {
    color: '#c084fc',
  },
  grabContainerStyle: {
    alignItems: 'center',
    paddingVertical: '8@ms',
    backgroundColor: '#ffffff',
  },
  grabContainerStyleDark: {
    backgroundColor: '#12141c',
  },
  grabHandleStyle: {
    width: '48@s',
    height: '4@vs',
    backgroundColor: '#d1d5db',
    borderRadius: '9999@ms',
  },
  grabHandleStyleDark: {
    backgroundColor: '#374151',
  },
  headerStyle: {
    paddingHorizontal: '20@ms',
    paddingBottom: '12@ms',
    paddingTop: '4@ms',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  headerStyleDark: {
    backgroundColor: '#12141c',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollStyle: {
    padding: '16@ms',
  },
  titleStyle: {
    fontWeight: 'bold',
    flex: 1,
  },
  touchableOpacity: {
    flex: 1,
  },
});

export default AppBottomSheet;
