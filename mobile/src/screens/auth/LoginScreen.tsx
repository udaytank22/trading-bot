import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { useAppStore } from '../../store/appStore';
import AppText from '../../components/common/AppText';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/inputs/AppInput';
import AppCard from '../../components/common/AppCard';

// Import Theme
import { colors, spacing, typography, scale, globalStyles } from '../../theme';
import { AuthContext } from '../../services/context/authContext';

export const LoginScreen = () => {
  const { theme } = useAppStore();
  const authContext = React.useContext(AuthContext);
  const isDark = theme === 'dark';

  const [mobileNo, setMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSignIn = async () => {
    if (!mobileNo.trim() || !password.trim()) {
      setLocalError('Please fill in all fields.');
      return;
    }

    setLocalError('');

    if (authContext) {
      await authContext.login(mobileNo.trim(), password.trim());
      if (authContext.loginError) {
        setLocalError(authContext.loginError);
      }
    }
  };

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={globalStyles.flex1}
      >
        <ScrollView
          style={{ flex: 1, paddingHorizontal: spacing.paddingHorizontal }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.paddingVertical }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header branding */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <AppText variant="h1" style={styles.logoText}>T</AppText>
            </View>
            <AppText variant="h1" style={styles.brandTitle}>
              TradeMind
            </AppText>
            <AppText variant="subtitle" style={styles.brandSubtitle}>
              Quotation & Margin CRM Panel
            </AppText>
          </View>

          {/* Login Card */}
          <AppCard style={styles.card}>
            <AppText variant="h2" style={styles.welcomeText}>
              Welcome Back
            </AppText>
            <AppText variant="captionSemibold" style={[styles.subtitleText, { color: isDark ? colors.dark.textMuted : colors.light.textMuted }]}>
              Sign in to manage supplier RFQs & deals
            </AppText>

            {localError ? (
              <View style={styles.errorContainer}>
                <AppText style={styles.errorText}>{localError}</AppText>
              </View>
            ) : null}

            <AppInput
              label="Mobile Number"
              placeholder="Enter mobile number"
              value={mobileNo}
              onChangeText={setMobileNo}
              keyboardType="phone-pad"
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
                  <AppText style={[styles.showHideText, { color: isDark ? colors.dark.primaryLight : colors.light.primary }]}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </AppText>
                </TouchableOpacity>
              }
            />

            <AppButton
              title="Sign In"
              onPress={handleSignIn}
              loading={authContext?.isLoading}
              style={styles.signInButton}
            />
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoContainer: {
    width: scale(56),
    height: scale(56),
    backgroundColor: colors.light.primary,
    borderRadius: spacing.borderRadiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  brandTitle: {
    fontWeight: '800',
    fontSize: typography.h1,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  brandSubtitle: {
    textAlign: 'center',
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  card: {
    padding: spacing.xxl,
  },
  welcomeText: {
    fontWeight: 'bold',
    fontSize: typography.h2,
    marginBottom: spacing.xs,
  },
  subtitleText: {
    marginBottom: spacing.xxl,
  },
  errorContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.light.error,
    borderRadius: spacing.borderRadius,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    color: colors.light.error,
    fontSize: typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  showHideText: {
    fontSize: typography.caption,
    fontWeight: 'bold',
    paddingHorizontal: spacing.sm,
  },
  signInButton: {
    marginTop: spacing.lg,
  },
});

export default LoginScreen;
