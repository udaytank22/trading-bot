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

type PurchaseOrderDetailScreenRouteProp = RouteProp<RootStackParamList, 'PurchaseOrderDetail'>;

export const PurchaseOrderDetailScreen = () => {
  const route = useRoute<PurchaseOrderDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { purchaseOrdersData } = useAppStore();
  const { poId } = route.params;

  const po = useMemo(() => {
    return purchaseOrdersData.find((item) => item.po_id === poId);
  }, [purchaseOrdersData, poId]);

  if (!po) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 dark:bg-darkbg">
        <AppText variant="h2">PO Not Found</AppText>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} className="mt-4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-darkbg">
      <AppHeader title="PO Contract Details" showBack={true} />

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Info card */}
        <AppCard variant="bordered" className="mb-4">
          <View className="flex-row justify-between items-center mb-3.5">
            <AppText variant="h2" className="font-mono text-purple-650 dark:text-purple-400">
              {po.po_id}
            </AppText>
            <AppStatusBadge status={po.status} />
          </View>

          <View className="space-y-2.5">
            <View>
              <AppText variant="captionSemibold" className="text-gray-400">Client / Customer</AppText>
              <AppText variant="bodySemibold" className="mt-0.5">{po.customer}</AppText>
            </View>

            <View className="flex-row justify-between">
              <View className="w-[48%]">
                <AppText variant="captionSemibold" className="text-gray-400">Vessel Assigned</AppText>
                <AppText variant="bodySemibold" className="mt-0.5">{po.vessel}</AppText>
              </View>

              <View className="w-[48%]">
                <AppText variant="captionSemibold" className="text-gray-400">Order Date</AppText>
                <AppText variant="body" className="mt-0.5">{formatDateString(po.date)}</AppText>
              </View>
            </View>
          </View>
        </AppCard>

        {/* Products Card */}
        <AppCard variant="glass" className="mb-4">
          <AppText variant="h3" className="font-bold mb-3.5">
            Order Products & Quantities
          </AppText>

          {po.products.map((p, idx) => (
            <View key={idx} className="flex-row justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/[0.04] last:border-0">
              <AppText variant="body" className="flex-1 mr-2 text-gray-700 dark:text-gray-300">
                {p.product_name}
              </AppText>
              <AppText variant="bodySemibold">
                {p.quantity} {p.unit || 'units'}
              </AppText>
            </View>
          ))}

          <View className="mt-4 pt-3.5 border-t border-gray-100 dark:border-white/[0.05] flex-row justify-between items-center">
            <AppText variant="bodySemibold" className="font-bold">Contract Total Worth</AppText>
            <AppText variant="h2" className="text-purple-600 dark:text-purple-400 font-extrabold">
              {formatUSD(po.total_amount)}
            </AppText>
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
};
export default PurchaseOrderDetailScreen;
