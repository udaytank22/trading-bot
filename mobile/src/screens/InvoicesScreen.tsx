import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import Stylesheet from '../components/common/Stylesheet';

import { View, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppStatusBadge from '../components/common/AppStatusBadge';
import { formatUSD, formatDateString } from '../utils/marginEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/common/AppButton';
import AppAlert from '../components/modals/AppAlert';

export const InvoicesScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { invoicesData, updateInvoiceStatus } = useAppStore();

  type AlertConfig = {
    visible: boolean;
    title: string;
    message: string;
    showCancel?: boolean;
    onConfirm?: () => void;
    hideConfirm?: boolean;
  };
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, showCancel?: boolean, onConfirm?: () => void, hideConfirm?: boolean) => {
    setAlertConfig({ visible: true, title, message, showCancel, onConfirm, hideConfirm });
  };

  return (
    <SafeAreaView style={Stylesheet.cls(theme, "flex-1 bg-gray-50 dark:bg-darkbg")}>
      <AppHeader title="Invoices Log" showBack={true} />

      <FlatList
        data={invoicesData}
        keyExtractor={(item) => item.inquiry_id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const totalVal = item.products.reduce((sum, p) => sum + (p.total_price || 0), 0);
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.inquiry_id })}
              activeOpacity={0.8}
              style={Stylesheet.cls(theme, "mb-3.5")}
            >
              <AppCard variant="glass" style={Stylesheet.cls(theme, "p-4")}>
                <View style={Stylesheet.cls(theme, "flex-row justify-between items-center")}>
                  <View style={Stylesheet.cls(theme, "flex-1 pr-2")}>
                    <View style={Stylesheet.cls(theme, "flex-row items-center")}>
                      <AppText style={Stylesheet.cls(theme, "font-mono text-purple-600 dark:text-purple-400 font-bold text-xs mr-2")}>
                        {item.inquiry_id}
                      </AppText>
                      <AppText variant="caption">
                        {item.invoice_date ? formatDateString(item.invoice_date) : 'Draft Invoice'}
                      </AppText>
                    </View>
                    
                    <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mt-1")} numberOfLines={1}>
                      {item.buyer_name}
                    </AppText>
                    <AppText variant="caption" style={Stylesheet.cls(theme, "text-gray-500 mt-0.5")} numberOfLines={1}>
                      Cargo: {item.cargo}
                    </AppText>
                  </View>

                  <View style={Stylesheet.cls(theme, "items-end")}>
                    <AppStatusBadge status={item.invoice_status} />
                    <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mt-2 text-purple-650 dark:text-purple-400 font-bold")}>
                      {formatUSD(totalVal)}
                    </AppText>
                  </View>
                </View>

                {item.invoice_status === 'DRAFT' && (
                  <View style={Stylesheet.cls(theme, "mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.05]")}>
                    <AppButton
                      title="Dispatch Invoice"
                      onPress={() => {
                        showAlert('Send Invoice', 'Are you sure you want to send this invoice to the buyer?', true, () => {
                          updateInvoiceStatus(item.inquiry_id, 'SENT');
                          showAlert('Success', 'The invoice has been sent.', false, undefined, true);
                          setTimeout(() => setAlertConfig(prev => ({ ...prev, visible: false })), 1500);
                        });
                      }}
                    />
                  </View>
                )}
              </AppCard>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={Stylesheet.cls(theme, "mt-8")}>
            <AppText variant="subtitle" style={Stylesheet.cls(theme, "text-center text-sm text-gray-500")}>
              No billed invoices found.
            </AppText>
          </View>
        }
      />

      <AppAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        showCancel={alertConfig.showCancel}
        hideConfirm={alertConfig.hideConfirm}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  );
};
export default InvoicesScreen;
