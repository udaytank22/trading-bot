import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import Stylesheet from '../components/common/Stylesheet';

import { View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppButton from '../components/common/AppButton';
import AppInput from '../components/inputs/AppInput';
import AppCard from '../components/common/AppCard';

export const LoginScreen = () => {
  const {login, employeesData, theme} = useAppStore();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate auth API delay
    setTimeout(() => {
      const emailLower = email.trim().toLowerCase();
      const matchedUser = employeesData.find(emp => emp.email.toLowerCase() === emailLower);
      
      if (matchedUser || emailLower === 'admin@trademind.com') {
        setIsLoading(false);
        const profile = matchedUser || {
          name: 'Administrator',
          role: 'Admin',
          email: 'admin@trademind.com',
          avatar: 'AD'
        };
        login(profile);
      } else {
        setIsLoading(false);
        setError('Invalid credentials. Use quick access buttons below to test.');
      }
    }, 1200);
  };

  const handleQuickLogin = (role: string) => {
    let profile;
    switch (role) {
      case 'ADMIN':
        profile = { name: 'Arjun Sharma', role: 'Admin', email: 'arjun@trademind.com', avatar: 'AS' };
        break;
      case 'EMPLOYEE':
        profile = { name: 'Priya Patel', role: 'Sales Executive', email: 'priya@trademind.com', avatar: 'PP' };
        break;
      case 'TEAM_LEAD':
        profile = { name: 'Rahul Verma', role: 'Sourcing Manager', email: 'rahul@trademind.com', avatar: 'RV' };
        break;
      case 'CLIENT':
      default:
        profile = { name: 'Demo Client', role: 'Client', email: 'client@demo.com', avatar: 'DC' };
        break;
    }
    login(profile);
  };

  const bgStyle = isDark ? 'bg-darkbg' : 'bg-gray-50';

  return (
    <SafeAreaView style={Stylesheet.cls(theme, `flex-1 ${bgStyle}`)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={Stylesheet.cls(theme, "flex-1")}
      >
        <ScrollView 
          style={Stylesheet.cls(theme, "flex-1 px-5")} 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header branding */}
          <View style={Stylesheet.cls(theme, "items-center mb-8")}>
            <View style={Stylesheet.cls(theme, "w-14 h-14 bg-purple-600 rounded-2xl items-center justify-center shadow-lg shadow-purple-500/30 mb-4")}>
              <AppText variant="h1" style={Stylesheet.cls(theme, "text-white font-extrabold")}>T</AppText>
            </View>
            <AppText variant="h1" style={Stylesheet.cls(theme, "font-extrabold text-2xl tracking-tight text-center")}>
              TradeMind
            </AppText>
            <AppText variant="subtitle" style={Stylesheet.cls(theme, "text-center text-xs mt-1")}>
              Quotation & Margin CRM Panel
            </AppText>
          </View>

          {/* Login Card */}
          <AppCard variant="glass" style={Stylesheet.cls(theme, "p-6")}>
            <AppText variant="h2" style={Stylesheet.cls(theme, "font-bold text-lg mb-1")}>
              Welcome Back
            </AppText>
            <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400 dark:text-gray-500 mb-6")}>
              Sign in to manage supplier RFQs & deals
            </AppText>

            {error ? (
              <View style={Stylesheet.cls(theme, "mb-4 p-3 bg-red-100/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl")}>
                <AppText style={Stylesheet.cls(theme, "text-red-500 text-xs font-semibold text-center")}>{error}</AppText>
              </View>
            ) : null}

            <AppInput
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <AppText style={Stylesheet.cls(theme, "text-purple-600 dark:text-purple-400 text-xs font-bold px-2")}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </AppText>
                </TouchableOpacity>
              }
            />

            <AppButton
              title="Sign In"
              onPress={handleSignIn}
              loading={isLoading}
              style={Stylesheet.cls(theme, "mt-4")}
            />

            {/* Quick Access Dev Grid */}
            <View style={Stylesheet.cls(theme, "mt-6 pt-5 border-t border-gray-100 dark:border-white/[0.04]")}>
              <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-450 uppercase tracking-widest text-center mb-3")}>
                Quick Access for Testing
              </AppText>
              
              <View style={Stylesheet.cls(theme, "flex-row flex-wrap justify-between")}>
                {['ADMIN', 'EMPLOYEE', 'TEAM_LEAD', 'CLIENT'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => handleQuickLogin(role)}
                    style={Stylesheet.cls(theme, "w-[48%] py-2.5 mb-2 rounded-xl bg-purple-50 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/30 items-center active:opacity-75")}
                  >
                    <AppText style={Stylesheet.cls(theme, "text-[10px] font-bold text-purple-600 dark:text-purple-450 tracking-wider")}>
                      {role}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default LoginScreen;
