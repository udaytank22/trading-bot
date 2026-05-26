import React from 'react';
import { View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
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

const MenuItem = ({ title, desc, icon, onPress }: MenuItemProps) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.8}
    className="w-[48%] mb-4"
  >
    <AppCard variant="glass" className="p-4 h-[115px] justify-between">
      <View className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/20 items-center justify-center">
        <AppText className="text-base">{icon}</AppText>
      </View>
      
      <View>
        <AppText variant="bodySemibold" className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" className="text-[10px] text-gray-550 mt-0.5" numberOfLines={1}>
          {desc}
        </AppText>
      </View>
    </AppCard>
  </TouchableOpacity>
);

export const MoreScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser, logout } = useAppStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-darkbg">
      <AppHeader title="More Modules" />

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* User Mini Profile */}
        <AppCard variant="bordered" className="flex-row items-center mb-5 p-4">
          <AppAvatar name={currentUser?.name || 'Admin'} size="lg" />
          <View className="ml-4 flex-1">
            <AppText variant="h3" className="font-extrabold">
              {currentUser?.name || 'Administrator'}
            </AppText>
            <AppText variant="subtitle" className="text-xs font-semibold mt-0.5 uppercase tracking-wider text-purple-600 dark:text-purple-400">
              {currentUser?.role || 'System Manager'}
            </AppText>
            <AppText variant="caption" className="text-gray-500 mt-0.5">
              {currentUser?.email || 'admin@trademind.com'}
            </AppText>
          </View>
        </AppCard>

        {/* Modular Grid */}
        <AppText variant="h3" className="font-bold mb-3.5 ml-1">Administration & Finance</AppText>
        <View className="flex-row flex-wrap justify-between">
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
            onPress={() => navigation.navigate('Invoices')} 
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
        <AppCard variant="glass" className="mt-2 p-1 border-t border-b border-gray-150 dark:border-white/[0.04]">
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')}
            className="flex-row justify-between items-center p-3.5 border-b border-gray-100 dark:border-white/[0.03] active:bg-gray-100 dark:active:bg-white/5 rounded-t-xl"
          >
            <AppText variant="bodySemibold">👤 My Profile Settings</AppText>
            <AppText className="text-gray-400">➔</AppText>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')}
            className="flex-row justify-between items-center p-3.5 active:bg-gray-100 dark:active:bg-white/5 rounded-b-xl"
          >
            <AppText variant="bodySemibold">🔔 Notifications Logs</AppText>
            <AppText className="text-gray-400">➔</AppText>
          </TouchableOpacity>
        </AppCard>

        {/* Logout */}
        <AppButton 
          title="Sign Out" 
          variant="danger" 
          onPress={handleLogout}
          className="mt-6 rounded-2xl h-[46px]"
        />
      </ScrollView>
    </SafeAreaView>
  );
};
export default MoreScreen;
