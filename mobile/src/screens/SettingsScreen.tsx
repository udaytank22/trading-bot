import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppInput from '../components/inputs/AppInput';
import AppButton from '../components/common/AppButton';

export const SettingsScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const { settings, updateSettings } = useAppStore();

  const [margin, setMargin] = useState(settings.default_margin_percent.toString());
  const [email, setEmail] = useState(settings.seller_email);
  const [businessName, setBusinessName] = useState(settings.business_name);

  const handleSaveSettings = () => {
    const marginPct = parseFloat(margin) || 15;
    
    updateSettings({
      default_margin_percent: marginPct,
      seller_email: email.trim(),
      business_name: businessName.trim()
    });

    Alert.alert('Saved', 'Global configuration settings updated.');
  };

  return (
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}>
      <AppHeader title="System Settings" showBack={true} />

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
        <AppText variant="h3" style={styles.appText4}>Quotation Configurations</AppText>
        
        <AppCard variant="bordered" style={styles.appCard1}>
          <AppInput
            label="Default Profit Markup (%)"
            placeholder="e.g. 15"
            value={margin}
            onChangeText={setMargin}
            keyboardType="numeric"
          />

          <AppInput
            label="Business Designation"
            placeholder="e.g. TradeMind Ltd"
            value={businessName}
            onChangeText={setBusinessName}
          />

          <AppInput
            label="Outgoing Quotations Sender Email"
            placeholder="e.g. admin@trademind.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </AppCard>

        {/* Informative tips */}
        <AppCard variant="glass" style={styles.appCard}>
          <AppText variant="captionSemibold" style={styles.appText3}>Margin Logic Rule 1</AppText>
          <AppText style={styles.appText2}>
            Category markups automatically override default values (e.g., Fasteners at 18%, Pipes at 12%).
          </AppText>

          <View style={[styles.view, theme === 'dark' && styles.viewDark]}>
            <AppText variant="captionSemibold" style={styles.appText1}>Margin Logic Rule 2</AppText>
            <AppText style={styles.appText}>
              Price-tiers apply high markups on low unit prices (e.g., 25% margin below $100).
            </AppText>
          </View>
        </AppCard>

        <AppButton
          title="Save Configurations"
          onPress={handleSaveSettings}
          style={styles.appButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appButton: {
    borderRadius: 16,
  },
  appCard: {
    marginBottom: 24,
    padding: 16,
  },
  appCard1: {
    marginBottom: 16,
  },
  appText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  appText1: {
    color: '#9ca3af',
  },
  appText2: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  appText3: {
    color: '#9ca3af',
  },
  appText4: {
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 4,
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
  view: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
  },
  viewDark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
});

export default SettingsScreen;
