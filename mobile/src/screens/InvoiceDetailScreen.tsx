import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { View, ScrollView, StyleSheet } from 'react-native';
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
      <SafeAreaView style={[styles.safeAreaView1, theme === 'dark' && styles.safeAreaView1Dark]}>
        <AppText variant="h2">Invoice Not Found</AppText>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} style={styles.appButton} />
      </SafeAreaView>
    );
  }

  const totalValue = invoice.products.reduce((sum, p) => sum + (p.total_price || 0), 0);

  return (
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}>
      <AppHeader title="Invoice Details" showBack={true} />

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
        <AppCard variant="bordered" style={styles.appCard1}>
          <View style={styles.view6}>
            <AppText variant="h2" style={[styles.appText12, theme === 'dark' && styles.appText12Dark]}>
              {invoice.inquiry_id}
            </AppText>
            <AppStatusBadge status={invoice.invoice_status} />
          </View>

          <View style={{}}>
            <View>
              <AppText variant="captionSemibold" style={styles.appText11}>Buyer / Customer</AppText>
              <AppText variant="bodySemibold" style={styles.appText10}>{invoice.buyer_name}</AppText>
              <AppText variant="caption" style={styles.appText9}>{invoice.buyer_email}</AppText>
            </View>

            <View style={styles.view5}>
              <View style={styles.view4}>
                <AppText variant="captionSemibold" style={styles.appText8}>Cargo Handled</AppText>
                <AppText variant="bodySemibold" style={styles.appText7}>{invoice.cargo}</AppText>
              </View>

              <View style={styles.view3}>
                <AppText variant="captionSemibold" style={styles.appText6}>Issued Date</AppText>
                <AppText variant="body" style={styles.appText5}>
                  {invoice.invoice_date ? formatDateString(invoice.invoice_date) : 'Draft'}
                </AppText>
              </View>
            </View>
          </View>
        </AppCard>

        {/* Breakdown Card */}
        <AppCard variant="glass" style={styles.appCard}>
          <AppText variant="h3" style={styles.appText4}>
            Billing Breakdown
          </AppText>

          {invoice.products.map((p, idx) => (
            <View key={idx} style={[styles.view2, theme === 'dark' && styles.view2Dark]}>
              <AppText variant="bodySemibold">
                {p.product_name}
              </AppText>
              <View style={styles.view1}>
                <AppText variant="caption" style={styles.appText3}>
                  Qty: {p.quantity}
                </AppText>
                <AppText variant="bodySemibold" style={[styles.appText2, theme === 'dark' && styles.appText2Dark]}>
                  {formatUSD(p.total_price || 0)}
                </AppText>
              </View>
            </View>
          ))}

          <View style={[styles.view, theme === 'dark' && styles.viewDark]}>
            <AppText variant="bodySemibold" style={styles.appText1}>Total Amount Due</AppText>
            <AppText variant="h2" style={[styles.appText, theme === 'dark' && styles.appTextDark]}>
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
            style={styles.style1}
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
            style={styles.style}
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

const styles = StyleSheet.create({
  appButton: {
    marginTop: 16,
  },
  appCard: {
    marginBottom: 16,
  },
  appCard1: {
    marginBottom: 16,
  },
  appText: {
    color: '#7c3aed',
    fontWeight: '800',
  },
  appText1: {
    fontWeight: 'bold',
  },
  appText10: {
    marginTop: 2,
  },
  appText11: {
    color: '#9ca3af',
  },
  appText12: {
    fontFamily: 'monospace',
    color: '#8b5cf6',
  },
  appText12Dark: {
    color: '#c084fc',
  },
  appText2: {
    color: '#7c3aed',
  },
  appText2Dark: {
    color: '#c084fc',
  },
  appText3: {
    color: '#6b7280',
  },
  appText4: {
    fontWeight: 'bold',
    marginBottom: 14,
  },
  appText5: {
    marginTop: 2,
  },
  appText6: {
    color: '#9ca3af',
  },
  appText7: {
    marginTop: 2,
  },
  appText8: {
    color: '#9ca3af',
  },
  appText9: {
    color: '#6b7280',
    marginTop: 2,
  },
  appTextDark: {
    color: '#c084fc',
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeAreaView1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  safeAreaView1Dark: {
    backgroundColor: '#0c0e12',
  },
  safeAreaViewDark: {
    backgroundColor: '#0c0e12',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  style: {
    marginTop: 8,
    marginBottom: 32,
  },
  style1: {
    marginTop: 8,
    marginBottom: 32,
  },
  view: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  view1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  view2: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  view2Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view3: {
    width: '48%',
  },
  view4: {
    width: '48%',
  },
  view5: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  view6: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewDark: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
});

export default InvoiceDetailScreen;
