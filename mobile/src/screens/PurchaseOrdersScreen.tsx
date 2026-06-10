import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
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
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}>
      <AppHeader title="Purchase Orders" showBack={true} />

      <FlatList
        data={purchaseOrdersData}
        keyExtractor={(item) => item.po_id}
        contentContainerStyle={styles.contentContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('PurchaseOrderDetail', { poId: item.po_id })}
            activeOpacity={0.8}
            style={styles.style}
          >
            <AppCard variant="glass" style={styles.appCard}>
              <View style={styles.view3}>
                <View style={styles.view2}>
                  <AppText style={[styles.appText4, theme === 'dark' && styles.appText4Dark]}>
                    {item.po_id}
                  </AppText>
                  <AppText variant="caption">
                    {formatDateString(item.date)}
                  </AppText>
                </View>
                
                <AppText variant="bodySemibold" style={styles.appText3} numberOfLines={1}>
                  {item.customer}
                </AppText>
                <AppText variant="caption" style={styles.appText2}>
                  Vessel: {item.vessel}
                </AppText>
              </View>

              <View style={styles.view1}>
                <AppStatusBadge status={item.status} />
                <AppText variant="bodySemibold" style={[styles.appText1, theme === 'dark' && styles.appText1Dark]}>
                  {formatUSD(item.total_amount)}
                </AppText>
              </View>
            </AppCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.view}>
            <AppText variant="subtitle" style={styles.appText}>
              No purchase orders found.
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
  appCard: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  appText1: {
    marginTop: 8,
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  appText1Dark: {
    color: '#c084fc',
  },
  appText2: {
    color: '#6b7280',
    marginTop: 2,
  },
  appText3: {
    marginTop: 4,
  },
  appText4: {
    fontFamily: 'monospace',
    color: '#7c3aed',
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 8,
  },
  appText4Dark: {
    color: '#c084fc',
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeAreaViewDark: {
    backgroundColor: '#0c0e12',
  },
  style: {
    marginBottom: 14,
  },
  view: {
    marginTop: 32,
  },
  view1: {
    alignItems: 'flex-end',
  },
  view2: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  view3: {
    flex: 1,
    paddingRight: 8,
  },
});

export default PurchaseOrdersScreen;
