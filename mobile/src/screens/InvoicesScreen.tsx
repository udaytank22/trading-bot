import React from 'react';
import { View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppStatusBadge from '../components/common/AppStatusBadge';
import { formatUSD, formatDateString } from '../utils/marginEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export const InvoicesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { invoicesData } = useAppStore();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-darkbg">
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
              className="mb-3.5"
            >
              <AppCard variant="glass" className="p-4 flex-row justify-between items-center">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center">
                    <AppText className="font-mono text-purple-600 dark:text-purple-400 font-bold text-xs mr-2">
                      {item.inquiry_id}
                    </AppText>
                    <AppText variant="caption">
                      {item.invoice_date ? formatDateString(item.invoice_date) : 'Draft Invoice'}
                    </AppText>
                  </View>
                  
                  <AppText variant="bodySemibold" className="mt-1" numberOfLines={1}>
                    {item.buyer_name}
                  </AppText>
                  <AppText variant="caption" className="text-gray-500 mt-0.5" numberOfLines={1}>
                    Cargo: {item.cargo}
                  </AppText>
                </View>

                <View className="items-end">
                  <AppStatusBadge status={item.invoice_status} />
                  <AppText variant="bodySemibold" className="mt-2 text-purple-650 dark:text-purple-400 font-bold">
                    {formatUSD(totalVal)}
                  </AppText>
                </View>
              </AppCard>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="mt-8">
            <AppText variant="subtitle" className="text-center text-sm text-gray-500">
              No billed invoices found.
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};
export default InvoicesScreen;
