import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledSheet } from 'react-native-size-matters';
import { View, TouchableOpacity, ScrollView, Modal, StyleProp, ViewStyle } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface AppDropdownProps {
  label?: string;
  value: string | number;
  options: DropdownOption[];
  onSelect: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const AppDropdown: React.FC<AppDropdownProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  error,
  containerStyle,
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const wrapperStyle = styles.wrapperStyle;
  const labelStyle = [styles.labelStyle, theme === 'dark' && styles.labelStyleDark];
  
  // Down Arrow Styling: border-r border-b border-gray-500 w-2.5 h-2.5 rotate-45
  const arrowStyle = {
    width: 10,
    height: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#6b7280',
    transform: [{ rotate: '45deg' } as const],
    marginBottom: 4,
  };

  const errorStyle = styles.errorStyle;

  // Modal styling
  const modalContainerStyle = styles.modalContainerStyle;
  const modalContentStyle = [styles.modalContentStyle, theme === 'dark' && styles.modalContentStyleDark];
  const modalHeaderStyle = [styles.modalHeaderStyle, theme === 'dark' && styles.modalHeaderStyleDark];
  const modalTitleStyle = styles.modalTitleStyle;
  const modalCancelTextStyle = [styles.modalCancelTextStyle, theme === 'dark' && styles.modalCancelTextStyleDark];
  const modalScrollStyle = styles.modalScrollStyle;

  return (
    <View style={[wrapperStyle, containerStyle]}>
      {label && (
        <AppText variant="captionSemibold" style={labelStyle}>
          {label}
        </AppText>
      )}

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[
          styles.dropdownBtn,
          isDark && styles.dropdownBtnDark,
          !!error && styles.dropdownBtnError,
        ]}
      >
        <AppText style={[
          styles.selectedText,
          isDark && styles.selectedTextDark,
          !selectedOption && (isDark ? styles.selectedTextPlaceholderDark : styles.selectedTextPlaceholder)
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </AppText>
        
        {/* Down Arrow Icon */}
        <View style={arrowStyle} />
      </TouchableOpacity>

      {error && (
        <AppText style={errorStyle}>
          {error}
        </AppText>
      )}

      {/* Options Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalContainerStyle}>
          <TouchableOpacity 
            style={styles.touchableOpacity} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)} 
          />
          <SafeAreaView style={modalContentStyle}>
            <View style={modalHeaderStyle}>
              <AppText variant="h3" style={modalTitleStyle}>
                {label || 'Select Option'}
              </AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <AppText style={modalCancelTextStyle}>
                  Cancel
                </AppText>
              </TouchableOpacity>
            </View>

            <ScrollView style={modalScrollStyle}>
              {options.map((option) => {
                const isSelected = option.value === value;

                const optionStyle = [
                  styles.optionItem,
                  isDark && styles.optionItemDark,
                  isSelected && (isDark ? styles.optionItemSelectedDark : styles.optionItemSelected)
                ];

                const textOptionStyle = [
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                  isSelected && isDark && styles.optionTextSelectedDark
                ];
                const dotStyle = [styles.dotStyle, theme === 'dark' && styles.dotStyleDark];

                return (
                  <TouchableOpacity
                    key={option.value.toString()}
                    onPress={() => {
                      onSelect(option.value);
                      setModalVisible(false);
                    }}
                    style={optionStyle}
                  >
                    <AppText style={textOptionStyle}>
                      {option.label}
                    </AppText>
                    {isSelected && (
                      <View style={dotStyle} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = ScaledSheet.create({
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '46@vs',
    borderRadius: '12@ms',
    paddingHorizontal: '12@ms',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  dropdownBtnDark: {
    backgroundColor: '#161920',
    borderColor: '#2a2d33',
  },
  dropdownBtnError: {
    borderColor: '#ef4444',
  },
  selectedText: {
    fontSize: '13.5@ms',
    fontWeight: '500',
  },
  selectedTextDark: {
    color: '#ffffff',
  },
  selectedTextPlaceholder: {
    color: '#9ca3af',
  },
  selectedTextPlaceholderDark: {
    color: '#6b7280',
  },
  optionItem: {
    padding: '16@ms',
    borderRadius: '12@ms',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6@ms',
    backgroundColor: '#e5e7eb',
  },
  optionItemDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionItemSelected: {
    backgroundColor: 'rgba(243, 232, 255, 0.60)',
  },
  optionItemSelectedDark: {
    backgroundColor: 'rgba(59, 7, 100, 0.20)',
  },
  optionText: {
    fontSize: '14@ms',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#6d28d9',
    fontWeight: 'bold',
  },
  optionTextSelectedDark: {
    color: '#c084fc',
  },
  dotStyle: {
    width: '8@s',
    height: '8@vs',
    borderRadius: '9999@ms',
    backgroundColor: '#7c3aed',
  },
  dotStyleDark: {
    backgroundColor: '#c084fc',
  },
  errorStyle: {
    color: '#ef4444',
    fontSize: '11@ms',
    fontWeight: '600',
    marginTop: '4@ms',
    marginLeft: '4@ms',
  },
  labelStyle: {
    color: '#4b5563',
    marginBottom: '6@ms',
    fontWeight: '500',
    marginLeft: '4@ms',
  },
  labelStyleDark: {
    color: '#9ca3af',
  },
  modalCancelTextStyle: {
    color: '#7c3aed',
    fontWeight: 'bold',
    fontSize: '14@ms',
  },
  modalCancelTextStyleDark: {
    color: '#c084fc',
  },
  modalContainerStyle: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
  },
  modalContentStyle: {
    backgroundColor: '#f9fafb',
  },
  modalContentStyleDark: {
    backgroundColor: '#0c0e12',
  },
  modalHeaderStyle: {
    paddingHorizontal: '20@ms',
    paddingVertical: '16@ms',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  modalHeaderStyleDark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: '#12141c',
  },
  modalScrollStyle: {
    padding: '12@ms',
  },
  modalTitleStyle: {
    fontWeight: 'bold',
  },
  touchableOpacity: {
    flex: 1,
  },
  wrapperStyle: {
    width: '100%',
    marginBottom: '16@ms',
  },
});

export default AppDropdown;
