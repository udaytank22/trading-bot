import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { ScaledSheet } from 'react-native-size-matters';
import { View, ScrollView, Alert } from 'react-native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppAvatar from '../components/common/AppAvatar';
import AppInput from '../components/inputs/AppInput';
import AppButton from '../components/common/AppButton';

export const ProfileScreen = () => {
  const theme = useAppStore((state) => state.theme);
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
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}>
      <AppHeader title="My Profile" showBack={true} />

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card Header */}
        <View style={styles.view2}>
          <AppAvatar name={name} size="lg" />
          <AppText variant="h2" style={styles.appText7}>{name}</AppText>
          <AppText variant="subtitle" style={[styles.appText6, theme === 'dark' && styles.appText6Dark]}>
            {currentUser?.role || 'System Manager'}
          </AppText>
        </View>

        {/* Input Fields */}
        <AppCard variant="bordered" style={styles.appCard1}>
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
        <AppCard variant="glass" style={styles.appCard}>
          <AppText variant="captionSemibold" style={styles.appText5}>Business Unit</AppText>
          <AppText variant="bodySemibold" style={[styles.appText4, theme === 'dark' && styles.appText4Dark]}>
            TradeMind Global Ltd
          </AppText>
          
          <View style={[styles.view1, theme === 'dark' && styles.view1Dark]}>
            <AppText variant="captionSemibold" style={styles.appText3}>Default Profit Margin</AppText>
            <AppText variant="bodySemibold" style={[styles.appText2, theme === 'dark' && styles.appText2Dark]}>15%</AppText>
          </View>

          <View style={[styles.view, theme === 'dark' && styles.viewDark]}>
            <AppText variant="captionSemibold" style={styles.appText1}>System Permissions</AppText>
            <AppText variant="bodySemibold" style={styles.appText}>Read & Write CRM Access</AppText>
          </View>
        </AppCard>

        <AppButton
          title="Save Profile Settings"
          onPress={handleSave}
          style={styles.appButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  appButton: {
    borderRadius: '16@ms',
  },
  appCard: {
    marginBottom: '24@ms',
    padding: '16@ms',
  },
  appCard1: {
    marginBottom: '16@ms',
  },
  appText: {
    color: '#10b981',
  },
  appText1: {
    color: '#9ca3af',
  },
  appText2: {
    color: '#8b5cf6',
  },
  appText2Dark: {
    color: '#c084fc',
  },
  appText3: {
    color: '#9ca3af',
  },
  appText4: {
    fontSize: '16@ms',
    fontWeight: 'bold',
    color: '#111827',
    marginTop: '2@ms',
  },
  appText4Dark: {
    color: '#ffffff',
  },
  appText5: {
    color: '#9ca3af',
  },
  appText6: {
    fontSize: '12@ms',
    letterSpacing: 0.5,
    color: '#8b5cf6',
    marginTop: '4@ms',
  },
  appText6Dark: {
    color: '#c084fc',
  },
  appText7: {
    marginTop: '12@ms',
    fontWeight: '800',
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
  view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '10@ms',
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
  },
  view1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '10@ms',
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    marginTop: '12@ms',
  },
  view1Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view2: {
    alignItems: 'center',
    marginBottom: '24@ms',
  },
  viewDark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
});

export default ProfileScreen;
