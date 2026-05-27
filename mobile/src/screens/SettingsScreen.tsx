import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import Stylesheet from '../components/common/Stylesheet';

import { View, ScrollView, Alert } from 'react-native';
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
    <SafeAreaView style={Stylesheet.cls(theme, "flex-1 bg-gray-50 dark:bg-darkbg")}>
      <AppHeader title="System Settings" showBack={true} />

      <ScrollView style={Stylesheet.cls(theme, "flex-1 p-4")} contentContainerStyle={{ paddingBottom: 40 }}>
        <AppText variant="h3" style={Stylesheet.cls(theme, "font-bold mb-3 ml-1")}>Quotation Configurations</AppText>
        
        <AppCard variant="bordered" style={Stylesheet.cls(theme, "mb-4")}>
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
        <AppCard variant="glass" style={Stylesheet.cls(theme, "mb-6 p-4")}>
          <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Margin Logic Rule 1</AppText>
          <AppText style={Stylesheet.cls(theme, "text-xs text-gray-500 mt-1")}>
            Category markups automatically override default values (e.g., Fasteners at 18%, Pipes at 12%).
          </AppText>

          <View style={Stylesheet.cls(theme, "pt-3 mt-3 border-t border-gray-100 dark:border-white/[0.04]")}>
            <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Margin Logic Rule 2</AppText>
            <AppText style={Stylesheet.cls(theme, "text-xs text-gray-500 mt-1")}>
              Price-tiers apply high markups on low unit prices (e.g., 25% margin below $100).
            </AppText>
          </View>
        </AppCard>

        <AppButton
          title="Save Configurations"
          onPress={handleSaveSettings}
          style={Stylesheet.cls(theme, "rounded-2xl")}
        />
      </ScrollView>
    </SafeAreaView>
  );
};
export default SettingsScreen;
