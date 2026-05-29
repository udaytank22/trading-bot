import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { ScaledSheet } from 'react-native-size-matters';
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
          <AppCard variant="glass" style={styles.appCard}>
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

            {/* Quick Access Dev Grid */}
            <View style={[styles.view1, theme === 'dark' && styles.view1Dark]}>
              <AppText variant="captionSemibold" style={styles.appText1}>
                Quick Access for Testing
              </AppText>
              
              <View style={styles.view}>
                {['ADMIN', 'EMPLOYEE', 'TEAM_LEAD', 'CLIENT'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => handleQuickLogin(role)}
                    style={[styles.style, theme === 'dark' && styles.styleDark]}
                  >
                    <AppText style={styles.appText}>
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

const styles = ScaledSheet.create({
  appCard: {
    padding: '24@ms',
  },
  appText: {
    fontSize: '10@ms',
    fontWeight: 'bold',
    color: '#7c3aed',
    letterSpacing: 0.5,
  },
  appText1: {
    textAlign: 'center',
    marginBottom: '12@ms',
  },
  appText2: {
    color: '#7c3aed',
    fontSize: '12@ms',
    fontWeight: 'bold',
    paddingHorizontal: '8@ms',
  },
  appText2Dark: {
    color: '#c084fc',
  },
  appText3: {
    color: '#ef4444',
    fontSize: '12@ms',
    fontWeight: '600',
    textAlign: 'center',
  },
  appText4: {
    color: '#9ca3af',
    marginBottom: '24@ms',
  },
  appText4Dark: {
    color: '#6b7280',
  },
  appText5: {
    fontWeight: 'bold',
    fontSize: '18@ms',
    marginBottom: '4@ms',
  },
  appText6: {
    textAlign: 'center',
    fontSize: '12@ms',
    marginTop: '4@ms',
  },
  appText7: {
    fontWeight: '800',
    fontSize: '24@ms',
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
    paddingHorizontal: '20@ms',
  },
  style: {
    width: '48%',
    paddingVertical: '10@ms',
    marginBottom: '8@ms',
    borderRadius: '12@ms',
    borderWidth: 1,
    borderColor: 'rgba(243, 232, 255, 0.5)',
    alignItems: 'center',
    opacity: 0.75,
  },
  style1: {
    marginTop: '16@ms',
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
    marginTop: '24@ms',
    paddingTop: '20@ms',
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
  },
  view1Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view2: {
    marginBottom: '16@ms',
    padding: '12@ms',
    borderWidth: 1,
    borderRadius: '12@ms',
  },
  view3: {
    width: '56@s',
    height: '56@vs',
    backgroundColor: '#7c3aed',
    borderRadius: '16@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16@ms',
  },
  view4: {
    alignItems: 'center',
    marginBottom: '32@ms',
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
