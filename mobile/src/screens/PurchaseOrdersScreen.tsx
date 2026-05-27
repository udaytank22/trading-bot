import React from 'react';
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

export const PurchaseOrdersScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { purchaseOrdersData } = useAppStore();

  return (
    <SafeAreaView style={Stylesheet.cls(theme, "flex-1 bg-gray-50 dark:bg-darkbg")}>
      <AppHeader title="Purchase Orders" showBack={true} />

      <FlatList
        data={purchaseOrdersData}
        keyExtractor={(item) => item.po_id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('PurchaseOrderDetail', { poId: item.po_id })}
            activeOpacity={0.8}
            style={Stylesheet.cls(theme, "mb-3.5")}
          >
            <AppCard variant="glass" style={Stylesheet.cls(theme, "p-4 flex-row justify-between items-center")}>
              <View style={Stylesheet.cls(theme, "flex-1 pr-2")}>
                <View style={Stylesheet.cls(theme, "flex-row items-center")}>
                  <AppText style={Stylesheet.cls(theme, "font-mono text-purple-600 dark:text-purple-400 font-bold text-xs mr-2")}>
                    {item.po_id}
                  </AppText>
                  <AppText variant="caption">
                    {formatDateString(item.date)}
                  </AppText>
                </View>
                
                <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mt-1")} numberOfLines={1}>
                  {item.customer}
                </AppText>
                <AppText variant="caption" style={Stylesheet.cls(theme, "text-gray-500 mt-0.5")}>
                  Vessel: {item.vessel}
                </AppText>
              </View>

              <View style={Stylesheet.cls(theme, "items-end")}>
                <AppStatusBadge status={item.status} />
                <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mt-2 text-purple-650 dark:text-purple-400 font-bold")}>
                  {formatUSD(item.total_amount)}
                </AppText>
              </View>
            </AppCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={Stylesheet.cls(theme, "mt-8")}>
            <AppText variant="subtitle" style={Stylesheet.cls(theme, "text-center text-sm text-gray-500")}>
              No purchase orders found.
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};
export default PurchaseOrdersScreen;
