import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppButton from '../components/common/AppButton';
import AppInput from '../components/inputs/AppInput';
import AppCard from '../components/common/AppCard';
import { authService } from '../services/apiService';
import { API_MESSAGES } from '../constants/apiMessages';
import Toast from 'react-native-toast-message';

export const LoginScreen = () => {
  const { login, theme } = useAppStore();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login({
        email: email.trim(),
        password: password.trim(),
      });

      if (response && response.success) {
        const userData = response.data;
        const user = userData.user;
        const token = userData.accessToken;

        Toast.show({
          type: 'success',
          text1: API_MESSAGES.GENERAL.SUCCESS_TITLE,
          text2: API_MESSAGES.AUTH.LOGIN_SUCCESS,
        });

        login({
          name: user.name || 'User',
          role: user.role?.name || 'Admin',
          email: user.email,
          avatar: user.name
            ? user.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2)
            : 'US',
          token: token,
        });
      } else {
        throw new Error(response?.message || API_MESSAGES.AUTH.LOGIN_ERROR);
      }
    } catch (err: any) {
      const errMsg = err.message || API_MESSAGES.AUTH.LOGIN_ERROR;
      setError(errMsg);
      Toast.show({
        type: 'error',
        text1: API_MESSAGES.GENERAL.ERROR_TITLE,
        text2: errMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <SafeAreaView style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header branding */}
          <View style={styles.view4}>
            <View style={styles.view3}>
              <AppText variant="h1" style={styles.appText8}>T</AppText>
            </View>
            <AppText variant="h1" style={styles.appText7}>
              TradeMind
            </AppText>
            <AppText variant="subtitle" style={styles.appText6}>
              Quotation & Margin CRM Panel
            </AppText>
          </View>

          {/* Login Card */}
          <AppCard style={styles.appCard}>
            <AppText variant="h2" style={styles.appText5}>
              Welcome Back
            </AppText>
            <AppText variant="captionSemibold" style={[styles.appText4, theme === 'dark' && styles.appText4Dark]}>
              Sign in to manage supplier RFQs & deals
            </AppText>

            {error ? (
              <View style={styles.view2}>
                <AppText style={styles.appText3}>{error}</AppText>
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
                  <AppText style={[styles.appText2, theme === 'dark' && styles.appText2Dark]}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </AppText>
                </TouchableOpacity>
              }
            />

            <AppButton
              title="Sign In"
              onPress={handleSignIn}
              loading={isLoading}
              style={styles.style1}
            />


          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appCard: {
    padding: 24,
  },
  appText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7c3aed',
    letterSpacing: 0.5,
  },
  appText1: {
    textAlign: 'center',
    marginBottom: 12,
  },
  appText2: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  appText2Dark: {
    color: '#c084fc',
  },
  appText3: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  appText4: {
    color: '#9ca3af',
    marginBottom: 24,
  },
  appText4Dark: {
    color: '#6b7280',
  },
  appText5: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  appText6: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },
  appText7: {
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  appText8: {
    color: '#ffffff',
    fontWeight: '800',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  style: {
    width: '48%',
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(243, 232, 255, 0.5)',
    alignItems: 'center',
    opacity: 0.75,
  },
  style1: {
    marginTop: 16,
  },
  styleDark: {
    backgroundColor: 'rgba(59, 7, 100, 0.1)',
  },
  view: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  view1: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
  },
  view1Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view2: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  view3: {
    width: 56,
    height: 56,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  view4: {
    alignItems: 'center',
    marginBottom: 32,
  },
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#f9fafb',
  },
  containerDark: {
    backgroundColor: '#0c0e12',
  },
});

export default LoginScreen;
