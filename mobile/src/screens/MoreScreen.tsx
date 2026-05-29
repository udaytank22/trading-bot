import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { ScaledSheet } from 'react-native-size-matters';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppAvatar from '../components/common/AppAvatar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/common/AppButton';

interface MenuItemProps {
  title: string;
  desc: string;
  icon: string;
  onPress: () => void;
}

const MenuItem = ({ title, desc, icon, onPress }: MenuItemProps) => {
  const theme = useAppStore((state) => state.theme);
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.touchableOpacity2}
    >
      <AppCard variant="glass" style={styles.appCard2}>
        <View style={[styles.view2, theme === 'dark' && styles.view2Dark]}>
          <AppText style={styles.appText8}>{icon}</AppText>
        </View>
        
        <View>
          <AppText variant="bodySemibold" style={[styles.appText7, theme === 'dark' && styles.appText7Dark]} numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" style={styles.appText6} numberOfLines={1}>
            {desc}
          </AppText>
        </View>
      </AppCard>
    </TouchableOpacity>
  );
};

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

        {/* Modular Grid */}
        <AppText variant="h3" style={styles.appText2}>Administration & Finance</AppText>
        <View style={styles.view}>
          <MenuItem 
            title="Purchase Orders" 
            desc="Manage buyer PO contracts" 
            icon="📄" 
            onPress={() => navigation.navigate('PurchaseOrders')} 
          />
          <MenuItem 
            title="Invoices" 
            desc="Billings & draft invoices" 
            icon="💰" 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Invoices' })} 
          />
          <MenuItem 
            title="Inventory" 
            desc="Stock levels & warehouse A/B" 
            icon="📦" 
            onPress={() => navigation.navigate('Inventory')} 
          />
          <MenuItem 
            title="Employees" 
            desc="Team directory & roles" 
            icon="👥" 
            onPress={() => navigation.navigate('Employees')} 
          />
          <MenuItem 
            title="Bank Accounts" 
            desc="Liquid cash balances" 
            icon="🏦" 
            onPress={() => navigation.navigate('Accounts')} 
          />
          <MenuItem 
            title="Settings & Defaults" 
            desc="Margins & defaults setup" 
            icon="⚙️" 
            onPress={() => navigation.navigate('Settings')} 
          />
        </View>

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

const styles = ScaledSheet.create({
  appButton: {
    marginTop: '24@ms',
    borderRadius: '16@ms',
    height: '46.0@vs',
  },
  appCard: {
    marginTop: '8@ms',
    padding: '4@ms',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eef2f6',
  },
  appCard1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '20@ms',
    padding: '16@ms',
  },
  appCard2: {
    padding: '16@ms',
    height: '115.0@vs',
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
    marginBottom: '14@ms',
    marginLeft: '4@ms',
  },
  appText3: {
    color: '#6b7280',
    marginTop: '2@ms',
  },
  appText4: {
    fontSize: '12@ms',
    fontWeight: '600',
    marginTop: '2@ms',
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
    fontSize: '10@ms',
    color: '#4b5563',
    marginTop: '2@ms',
  },
  appText7: {
    fontSize: '14@ms',
    fontWeight: 'bold',
    color: '#111827',
  },
  appText7Dark: {
    color: '#ffffff',
  },
  appText8: {
    fontSize: '16@ms',
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
    padding: '16@ms',
  },
  touchableOpacity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14@ms',
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: '12@ms',
    borderBottomRightRadius: '12@ms',
  },
  touchableOpacity1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14@ms',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: '12@ms',
    borderTopRightRadius: '12@ms',
  },
  touchableOpacity1Dark: {
    borderColor: 'rgba(255, 255, 255, 0.03)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  touchableOpacity2: {
    width: '48%',
    marginBottom: '16@ms',
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
    marginLeft: '16@ms',
    flex: 1,
  },
  view2: {
    width: '36@s',
    height: '36@vs',
    borderRadius: '12@ms',
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  view2Dark: {
    backgroundColor: 'rgba(59, 7, 100, 0.2)',
  },
});

export default MoreScreen;
