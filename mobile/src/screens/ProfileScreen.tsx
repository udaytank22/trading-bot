import React, { useState } from 'react';
import { View, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppAvatar from '../components/common/AppAvatar';
import AppInput from '../components/inputs/AppInput';
import AppButton from '../components/common/AppButton';

export const ProfileScreen = () => {
  const { currentUser, login } = useAppStore();

  const [name, setName] = useState(currentUser?.name || 'Administrator');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 99999 88888');
  const [email, setEmail] = useState(currentUser?.email || 'admin@trademind.com');

  const handleSave = () => {
    if (!name.trim()) return;
    
    const updatedUser = {
      ...currentUser,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim()
    };
    
    login(updatedUser);
    Alert.alert('Saved', 'Profile settings updated successfully.');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-darkbg">
      <AppHeader title="My Profile" showBack={true} />

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card Header */}
        <View className="items-center mb-6">
          <AppAvatar name={name} size="lg" />
          <AppText variant="h2" className="mt-3 font-extrabold">{name}</AppText>
          <AppText variant="subtitle" className="text-xs uppercase tracking-wider text-purple-650 dark:text-purple-400 mt-1">
            {currentUser?.role || 'System Manager'}
          </AppText>
        </View>

        {/* Input Fields */}
        <AppCard variant="bordered" className="mb-4">
          <AppInput
            label="Full Profile Name"
            placeholder="e.g. Arjun Sharma"
            value={name}
            onChangeText={setName}
          />

          <AppInput
            label="Contact Email"
            placeholder="e.g. arjun@trademind.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AppInput
            label="Phone Number"
            placeholder="e.g. +91 99887 76655"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </AppCard>

        {/* Business Settings info */}
        <AppCard variant="glass" className="mb-6 p-4">
          <AppText variant="captionSemibold" className="text-gray-400">Business Unit</AppText>
          <AppText variant="bodySemibold" className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
            TradeMind Global Ltd
          </AppText>
          
          <View className="flex-row justify-between items-center py-2.5 border-t border-gray-100 dark:border-white/[0.04] mt-3">
            <AppText variant="captionSemibold" className="text-gray-400">Default Profit Margin</AppText>
            <AppText variant="bodySemibold" className="text-purple-650 dark:text-purple-400">15%</AppText>
          </View>

          <View className="flex-row justify-between items-center py-2.5 border-t border-gray-100 dark:border-white/[0.04]">
            <AppText variant="captionSemibold" className="text-gray-400">System Permissions</AppText>
            <AppText variant="bodySemibold" className="text-emerald-500">Read & Write CRM Access</AppText>
          </View>
        </AppCard>

        <AppButton
          title="Save Profile Settings"
          onPress={handleSave}
          className="rounded-2xl"
        />
      </ScrollView>
    </SafeAreaView>
  );
};
export default ProfileScreen;
