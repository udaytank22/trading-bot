/**
 * TradeMind Mobile Client Entry Point
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import RootNavigator from './src/navigation/RootNavigator';
import { useAppStore } from './src/store/appStore';
import { toastConfig } from './src/components/common/CustomToast';
import { AuthProvider } from './src/services/context/authContext';

function App() {
  const theme = useAppStore((state) => state.theme);
  const isDarkMode = theme === 'dark';

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#0c0e12' : '#f9fafb'}
        />
        <RootNavigator />
        <Toast config={toastConfig} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
