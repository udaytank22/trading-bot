import React from 'react';
import { Modal, View, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';
import Stylesheet from '../common/Stylesheet';

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

  const overlayStyle = Stylesheet.cls(theme, 'flex-1 justify-center items-center bg-black/60 p-4');
  
  const modalBg = isDark ? 'bg-[#161920] border-white/[0.08]' : 'bg-white border-gray-100';
  const containerStyle = Stylesheet.cls(theme, `w-[85%] max-w-sm rounded-2xl p-6 shadow-2xl border ${modalBg}`);

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
              <AppText variant="h3" style={Stylesheet.cls(theme, "mb-3 font-bold")}>
                {title}
              </AppText>
          <AppText style={Stylesheet.cls(theme, "text-gray-600 dark:text-gray-400 text-[15px] mb-8 leading-relaxed")}>
            {message}
          </AppText>
          
          <View style={Stylesheet.cls(theme, "flex-row justify-end gap-3")}>
            {showCancel && (
              <TouchableOpacity onPress={onClose} style={Stylesheet.cls(theme, "px-5 py-2.5 bg-gray-100 dark:bg-white/[0.05] rounded-xl")}>
                <AppText style={Stylesheet.cls(theme, "text-gray-700 dark:text-gray-300 font-bold text-[14px]")}>
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
                style={Stylesheet.cls(theme, "px-5 py-2.5 bg-[#4F46E5] dark:bg-[#4F46E5] rounded-xl")}
              >
                <AppText style={Stylesheet.cls(theme, "text-white font-bold text-[14px]")}>
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

export default AppAlert;
