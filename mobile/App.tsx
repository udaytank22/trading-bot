/**
 * TradeMind Mobile Client Entry Point
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { useAppStore } from './src/store/appStore';

function App() {
  const theme = useAppStore((state) => state.theme);
  const isDarkMode = theme === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#0c0e12' : '#f9fafb'}
      />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
