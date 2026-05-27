import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { View, TouchableOpacity, ScrollView, Modal, StyleProp, ViewStyle } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';
import Stylesheet from '../common/Stylesheet';

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

  const wrapperStyle = Stylesheet.cls(theme, 'w-full mb-4');
  const labelStyle = Stylesheet.cls(theme, 'text-gray-550 dark:text-gray-400 mb-1.5 font-medium ml-1');
  
  let dropdownBtnClass = `flex-row items-center justify-between h-[46px] rounded-xl px-3 border border-transparent shadow-inner ${
    isDark ? 'bg-darkcard border-darkborder' : 'bg-white border-gray-200'
  }`;
  if (error) dropdownBtnClass += ' border-red-500';
  
  const dropdownBtnStyle = Stylesheet.cls(theme, dropdownBtnClass);
  
  const selectedTextClass = `text-[13.5px] font-medium ${
    selectedOption ? '' : 'text-gray-400 dark:text-gray-500'
  }`;
  const selectedTextStyle = Stylesheet.cls(theme, selectedTextClass);
  
  // Down Arrow Styling: border-r border-b border-gray-500 w-2.5 h-2.5 rotate-45
  const arrowStyle = {
    width: 10,
    height: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#6b7280',
    transform: [{ rotate: '45deg' }],
    marginBottom: 4,
  };

  const errorStyle = Stylesheet.cls(theme, 'text-red-500 text-[11px] font-semibold mt-1 ml-1');

  // Modal styling
  const modalContainerStyle = Stylesheet.cls(theme, 'flex-1 justify-end bg-black/60');
  const modalContentStyle = Stylesheet.cls(theme, 'bg-gray-50 dark:bg-darkbg rounded-t-3xl max-h-[50%]');
  const modalHeaderStyle = Stylesheet.cls(theme, 'px-5 py-4 border-b border-gray-100 dark:border-white/[0.04] flex-row justify-between items-center bg-white dark:bg-[#12141c]');
  const modalTitleStyle = Stylesheet.cls(theme, 'font-bold');
  const modalCancelTextStyle = Stylesheet.cls(theme, 'text-purple-600 dark:text-purple-400 font-bold text-sm');
  const modalScrollStyle = Stylesheet.cls(theme, 'p-3');

  return (
    <View style={[wrapperStyle, containerStyle]}>
      {label && (
        <AppText variant="captionSemibold" style={labelStyle}>
          {label}
        </AppText>
      )}

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={dropdownBtnStyle}
      >
        <AppText style={selectedTextStyle}>
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
            style={Stylesheet.cls(theme, "flex-1")} 
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
                
                let optionClass = 'p-4 rounded-xl flex-row justify-between items-center mb-1.5';
                if (isSelected) optionClass += ' bg-purple-100/60 dark:bg-purple-950/20';
                else optionClass += ' active:bg-gray-200 dark:active:bg-white/5';
                
                let textClass = 'text-sm';
                if (isSelected) textClass += ' text-purple-700 dark:text-purple-400 font-bold';
                else textClass += ' font-medium';

                const optionStyle = Stylesheet.cls(theme, optionClass);
                const textOptionStyle = Stylesheet.cls(theme, textClass);
                const dotStyle = Stylesheet.cls(theme, 'w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400');

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
export default AppDropdown;
