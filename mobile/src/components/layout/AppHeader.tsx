import React from 'react';
import { View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppText from '../common/AppText';
import { useAppStore } from '../../store/appStore';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
  rightAction,
  leftAction,
  className = '',
}) => {
  const navigation = useNavigation();
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView className={isDark ? 'bg-darkbg' : 'bg-gray-50'}>
      <View 
        className={`flex-row items-center justify-between px-4 py-3 border-b ${
          isDark 
            ? 'bg-darkbg border-white/[0.04]' 
            : 'bg-gray-50 border-gray-150'
        } ${className}`}
      >
        <View className="flex-row items-center flex-1">
          {showBack && navigation.canGoBack() ? (
            <TouchableOpacity 
              onPress={handleBack}
              className="mr-3 p-1 rounded-lg active:bg-gray-200 dark:active:bg-white/5"
            >
              {/* Back Arrow SVG */}
              <View className="w-5 h-5 justify-center items-center">
                <View className="w-3.5 h-3.5 border-l-2 border-b-2 border-gray-800 dark:border-white transform rotate-45 ml-1" />
              </View>
            </TouchableOpacity>
          ) : leftAction ? (
            <View className="mr-3">{leftAction}</View>
          ) : null}
          
          <AppText variant="h2" className="font-bold flex-1" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        
        {rightAction ? (
          <View className="ml-3">{rightAction}</View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};
export default AppHeader;
