import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/appStore';
import AppText from '../../components/common/AppText';
import AppCard from '../../components/common/AppCard';
import AppHeader from '../../components/layout/AppHeader';
import AppAvatar from '../../components/common/AppAvatar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import AppButton from '../../components/common/AppButton';

export const MoreScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser, logout } = useAppStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]} edges={["top"]}>
      <AppHeader title="More Modules" />

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* User Mini Profile */}
        <AppCard variant="bordered" style={styles.appCard1}>
          <AppAvatar name={currentUser?.name || 'Admin'} size="lg" />
          <View style={styles.view1}>
            <AppText variant="h3" style={styles.appText5}>
              {currentUser?.name || 'Administrator'}
            </AppText>
            <AppText variant="subtitle" style={[styles.appText4, theme === 'dark' && styles.appText4Dark]}>
              {currentUser?.role || 'System Manager'}
            </AppText>
            <AppText variant="caption" style={styles.appText3}>
              {currentUser?.email || 'admin@trademind.com'}
            </AppText>
          </View>
        </AppCard>

        {/* Secondary lists */}
        <AppCard variant="glass" style={[styles.appCard, theme === 'dark' && styles.appCardDark]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={[styles.touchableOpacity1, theme === 'dark' && styles.touchableOpacity1Dark]}
          >
            <AppText variant="bodySemibold">👤 My Profile Settings</AppText>
            <AppText style={styles.appText1}>➔</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={[styles.touchableOpacity, theme === 'dark' && styles.touchableOpacityDark]}
          >
            <AppText variant="bodySemibold">🔔 Notifications Logs</AppText>
            <AppText style={styles.appText}>➔</AppText>
          </TouchableOpacity>
        </AppCard>

        {/* Logout */}
        <AppButton
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          style={styles.appButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appButton: {
    marginTop: 24,
    borderRadius: 16,
    height: 46.0,
  },
  appCard: {
    marginTop: 8,
    padding: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eef2f6',
  },
  appCard1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
  },
  appCard2: {
    padding: 16,
    height: 115.0,
    justifyContent: 'space-between',
  },
  appCardDark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  appText: {
    color: '#9ca3af',
  },
  appText1: {
    color: '#9ca3af',
  },
  appText2: {
    fontWeight: 'bold',
    marginBottom: 14,
    marginLeft: 4,
  },
  appText3: {
    color: '#6b7280',
    marginTop: 2,
  },
  appText4: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
    color: '#7c3aed',
  },
  appText4Dark: {
    color: '#c084fc',
  },
  appText5: {
    fontWeight: '800',
  },
  appText6: {
    fontSize: 10,
    color: '#4b5563',
    marginTop: 2,
  },
  appText7: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  appText7Dark: {
    color: '#ffffff',
  },
  appText8: {
    fontSize: 16,
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeAreaViewDark: {
    backgroundColor: '#0c0e12',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  touchableOpacity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  touchableOpacity1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  touchableOpacity1Dark: {
    borderColor: 'rgba(255, 255, 255, 0.03)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  touchableOpacity2: {
    width: '48%',
    marginBottom: 16,
  },
  touchableOpacityDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  view: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  view1: {
    marginLeft: 16,
    flex: 1,
  },
  view2: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  view2Dark: {
    backgroundColor: 'rgba(59, 7, 100, 0.2)',
  },
});

export default MoreScreen;
