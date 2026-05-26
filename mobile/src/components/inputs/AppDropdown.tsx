import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Modal, SafeAreaView } from 'react-native';
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
  containerClassName?: string;
}

export const AppDropdown: React.FC<AppDropdownProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  error,
  containerClassName = '',
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View className={`w-full mb-4 ${containerClassName}`}>
      {label && (
        <AppText variant="captionSemibold" className="text-gray-500 dark:text-gray-400 mb-1.5 font-medium ml-1">
          {label}
        </AppText>
      )}

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className={`flex-row items-center justify-between h-[46px] rounded-xl px-3 border border-transparent shadow-inner ${
          isDark ? 'bg-[#151821] border-[#2a2d33]' : 'bg-white border-gray-200'
        } ${error ? 'border-red-500' : ''}`}
      >
        <AppText 
          className={`text-[13.5px] font-medium ${
            selectedOption ? '' : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </AppText>
        
        {/* Down Arrow Icon */}
        <View className="w-2.5 h-2.5 border-r border-b border-gray-500 transform rotate-45 mb-1" />
      </TouchableOpacity>

      {error && (
        <AppText className="text-red-500 text-[11px] font-semibold mt-1 ml-1">
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
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)} 
          />
          <SafeAreaView className="bg-gray-50 dark:bg-darkbg rounded-t-3xl max-h-[50%]">
            <View className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.04] flex-row justify-between items-center bg-white dark:bg-[#12141c]">
              <AppText variant="h3" className="font-bold">
                {label || 'Select Option'}
              </AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <AppText className="text-purple-600 dark:text-purple-400 font-bold text-sm">
                  Cancel
                </AppText>
              </TouchableOpacity>
            </View>

            <ScrollView className="p-3">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value.toString()}
                    onPress={() => {
                      onSelect(option.value);
                      setModalVisible(false);
                    }}
                    className={`p-4 rounded-xl flex-row justify-between items-center mb-1.5 ${
                      isSelected 
                        ? 'bg-purple-100/60 dark:bg-purple-950/20' 
                        : 'active:bg-gray-200 dark:active:bg-white/5'
                    }`}
                  >
                    <AppText 
                      className={`text-sm ${
                        isSelected 
                          ? 'text-purple-700 dark:text-purple-400 font-bold' 
                          : 'font-medium'
                      }`}
                    >
                      {option.label}
                    </AppText>
                    {isSelected && (
                      <View className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400" />
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
