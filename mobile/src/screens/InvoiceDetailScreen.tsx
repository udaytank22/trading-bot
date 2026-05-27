import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import Stylesheet from '../components/common/Stylesheet';

import { View, ScrollView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppStatusBadge from '../components/common/AppStatusBadge';
import { formatUSD, formatDateString } from '../utils/marginEngine';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/common/AppButton';
import AppAlert from '../components/modals/AppAlert';
import { useState } from 'react';

type InvoiceDetailScreenRouteProp = RouteProp<RootStackParamList, 'InvoiceDetail'>;

export const InvoiceDetailScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const route = useRoute<InvoiceDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { invoicesData, updateInvoiceStatus } = useAppStore();
  const { invoiceId } = route.params;

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

  const invoice = useMemo(() => {
    return invoicesData.find((item) => item.inquiry_id === invoiceId);
  }, [invoicesData, invoiceId]);

  if (!invoice) {
    return (
      <SafeAreaView style={Stylesheet.cls(theme, "flex-1 justify-center items-center bg-gray-50 dark:bg-darkbg")}>
        <AppText variant="h2">Invoice Not Found</AppText>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} style={Stylesheet.cls(theme, "mt-4")} />
      </SafeAreaView>
    );
  }

  const totalValue = invoice.products.reduce((sum, p) => sum + (p.total_price || 0), 0);

  return (
    <SafeAreaView style={Stylesheet.cls(theme, "flex-1 bg-gray-50 dark:bg-darkbg")}>
      <AppHeader title="Invoice Details" showBack={true} />

      <ScrollView style={Stylesheet.cls(theme, "flex-1 p-4")} contentContainerStyle={{ paddingBottom: 40 }}>
        <AppCard variant="bordered" style={Stylesheet.cls(theme, "mb-4")}>
          <View style={Stylesheet.cls(theme, "flex-row justify-between items-center mb-3.5")}>
            <AppText variant="h2" style={Stylesheet.cls(theme, "font-mono text-purple-650 dark:text-purple-400")}>
              {invoice.inquiry_id}
            </AppText>
            <AppStatusBadge status={invoice.invoice_status} />
          </View>

          <View style={Stylesheet.cls(theme, "space-y-2.5")}>
            <View>
              <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Buyer / Customer</AppText>
              <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mt-0.5")}>{invoice.buyer_name}</AppText>
              <AppText variant="caption" style={Stylesheet.cls(theme, "text-gray-500 mt-0.5")}>{invoice.buyer_email}</AppText>
            </View>

            <View style={Stylesheet.cls(theme, "flex-row justify-between")}>
              <View style={Stylesheet.cls(theme, "w-[48%]")}>
                <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Cargo Handled</AppText>
                <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mt-0.5")}>{invoice.cargo}</AppText>
              </View>

              <View style={Stylesheet.cls(theme, "w-[48%]")}>
                <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Issued Date</AppText>
                <AppText variant="body" style={Stylesheet.cls(theme, "mt-0.5")}>
                  {invoice.invoice_date ? formatDateString(invoice.invoice_date) : 'Draft'}
                </AppText>
              </View>
            </View>
          </View>
        </AppCard>

        {/* Breakdown Card */}
        <AppCard variant="glass" style={Stylesheet.cls(theme, "mb-4")}>
          <AppText variant="h3" style={Stylesheet.cls(theme, "font-bold mb-3.5")}>
            Billing Breakdown
          </AppText>

          {invoice.products.map((p, idx) => (
            <View key={idx} style={Stylesheet.cls(theme, "pb-3 border-b border-gray-100 dark:border-white/[0.04] last:border-0 last:pb-0")}>
              <AppText variant="bodySemibold">
                {p.product_name}
              </AppText>
              <View style={Stylesheet.cls(theme, "flex-row justify-between mt-1.5")}>
                <AppText variant="caption" style={Stylesheet.cls(theme, "text-gray-500")}>
                  Qty: {p.quantity}
                </AppText>
                <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-purple-600 dark:text-purple-400")}>
                  {formatUSD(p.total_price || 0)}
                </AppText>
              </View>
            </View>
          ))}

          <View style={Stylesheet.cls(theme, "mt-4 pt-3.5 border-t border-gray-100 dark:border-white/[0.05] flex-row justify-between items-center")}>
            <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "font-bold")}>Total Amount Due</AppText>
            <AppText variant="h2" style={Stylesheet.cls(theme, "text-purple-600 dark:text-purple-400 font-extrabold")}>
              {formatUSD(totalValue)}
            </AppText>
          </View>
        </AppCard>

        {invoice.invoice_status === 'DRAFT' && (
          <AppButton
            title="Dispatch Invoice"
            onPress={() => {
              showAlert('Send Invoice', 'Are you sure you want to send this invoice to the buyer?', true, () => {
                updateInvoiceStatus(invoice.inquiry_id, 'SENT');
                showAlert('Success', 'The invoice has been sent.', false, undefined, true);
                setTimeout(() => setAlertConfig(prev => ({ ...prev, visible: false })), 1500);
              });
            }}
            style={Stylesheet.cls(theme, "mt-2 mb-8")}
          />
        )}
        
        {invoice.invoice_status === 'SENT' && (
          <AppButton
            title="Mark as Paid"
            onPress={() => {
              showAlert('Confirm Payment', 'Has this invoice been fully paid by the buyer?', true, () => {
                updateInvoiceStatus(invoice.inquiry_id, 'PAID');
                showAlert('Payment Recorded', 'Invoice successfully marked as paid.', false, undefined, true);
                setTimeout(() => setAlertConfig(prev => ({ ...prev, visible: false })), 1500);
              });
            }}
            style={Stylesheet.cls(theme, "mt-2 mb-8")}
          />
        )}
      </ScrollView>

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
export default InvoiceDetailScreen;
