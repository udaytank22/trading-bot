import React, { useMemo } from 'react';
import { View, ScrollView, SafeAreaView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppStatusBadge from '../components/common/AppStatusBadge';
import { formatUSD, formatDateString } from '../utils/marginEngine';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/common/AppButton';

type InvoiceDetailScreenRouteProp = RouteProp<RootStackParamList, 'InvoiceDetail'>;

export const InvoiceDetailScreen = () => {
  const route = useRoute<InvoiceDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { invoicesData } = useAppStore();
  const { invoiceId } = route.params;

  const invoice = useMemo(() => {
    return invoicesData.find((item) => item.inquiry_id === invoiceId);
  }, [invoicesData, invoiceId]);

  if (!invoice) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 dark:bg-darkbg">
        <AppText variant="h2">Invoice Not Found</AppText>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} className="mt-4" />
      </SafeAreaView>
    );
  }

  const totalValue = invoice.products.reduce((sum, p) => sum + (p.total_price || 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-darkbg">
      <AppHeader title="Invoice Details" showBack={true} />

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <AppCard variant="bordered" className="mb-4">
          <View className="flex-row justify-between items-center mb-3.5">
            <AppText variant="h2" className="font-mono text-purple-650 dark:text-purple-400">
              {invoice.inquiry_id}
            </AppText>
            <AppStatusBadge status={invoice.invoice_status} />
          </View>

          <View className="space-y-2.5">
            <View>
              <AppText variant="captionSemibold" className="text-gray-400">Buyer / Customer</AppText>
              <AppText variant="bodySemibold" className="mt-0.5">{invoice.buyer_name}</AppText>
              <AppText variant="caption" className="text-gray-500 mt-0.5">{invoice.buyer_email}</AppText>
            </View>

            <View className="flex-row justify-between">
              <View className="w-[48%]">
                <AppText variant="captionSemibold" className="text-gray-400">Cargo Handled</AppText>
                <AppText variant="bodySemibold" className="mt-0.5">{invoice.cargo}</AppText>
              </View>

              <View className="w-[48%]">
                <AppText variant="captionSemibold" className="text-gray-400">Issued Date</AppText>
                <AppText variant="body" className="mt-0.5">
                  {invoice.invoice_date ? formatDateString(invoice.invoice_date) : 'Draft'}
                </AppText>
              </View>
            </View>
          </View>
        </AppCard>

        {/* Breakdown Card */}
        <AppCard variant="glass" className="mb-4">
          <AppText variant="h3" className="font-bold mb-3.5">
            Billing Breakdown
          </AppText>

          {invoice.products.map((p, idx) => (
            <View key={idx} className="pb-3 border-b border-gray-100 dark:border-white/[0.04] last:border-0 last:pb-0">
              <AppText variant="bodySemibold">
                {p.product_name}
              </AppText>
              <View className="flex-row justify-between mt-1.5">
                <AppText variant="caption" className="text-gray-500">
                  Qty: {p.quantity}
                </AppText>
                <AppText variant="bodySemibold" className="text-purple-600 dark:text-purple-400">
                  {formatUSD(p.total_price || 0)}
                </AppText>
              </View>
            </View>
          ))}

          <View className="mt-4 pt-3.5 border-t border-gray-100 dark:border-white/[0.05] flex-row justify-between items-center">
            <AppText variant="bodySemibold" className="font-bold">Total Amount Due</AppText>
            <AppText variant="h2" className="text-purple-600 dark:text-purple-400 font-extrabold">
              {formatUSD(totalValue)}
            </AppText>
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
};
export default InvoiceDetailScreen;
