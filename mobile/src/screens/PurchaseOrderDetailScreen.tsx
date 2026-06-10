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

type PurchaseOrderDetailScreenRouteProp = RouteProp<RootStackParamList, 'PurchaseOrderDetail'>;

export const PurchaseOrderDetailScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const route = useRoute<PurchaseOrderDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { purchaseOrdersData } = useAppStore();
  const { poId } = route.params;

  const po = useMemo(() => {
    return purchaseOrdersData.find((item) => item.po_id === poId);
  }, [purchaseOrdersData, poId]);

  if (!po) {
    return (
      <SafeAreaView style={[styles.safeAreaView1, theme === 'dark' && styles.safeAreaView1Dark]}>
        <AppText variant="h2">PO Not Found</AppText>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} style={styles.appButton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}>
      <AppHeader title="PO Contract Details" showBack={true} />

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Info card */}
        <AppCard variant="bordered" style={styles.appCard1}>
          <View style={styles.view5}>
            <AppText variant="h2" style={[styles.appText10, theme === 'dark' && styles.appText10Dark]}>
              {po.po_id}
            </AppText>
            <AppStatusBadge status={po.status} />
          </View>

          <View style={{}}>
            <View>
              <AppText variant="captionSemibold" style={styles.appText9}>Client / Customer</AppText>
              <AppText variant="bodySemibold" style={styles.appText8}>{po.customer}</AppText>
            </View>

            <View style={styles.view4}>
              <View style={styles.view3}>
                <AppText variant="captionSemibold" style={styles.appText7}>Vessel Assigned</AppText>
                <AppText variant="bodySemibold" style={styles.appText6}>{po.vessel}</AppText>
              </View>

              <View style={styles.view2}>
                <AppText variant="captionSemibold" style={styles.appText5}>Order Date</AppText>
                <AppText variant="body" style={styles.appText4}>{formatDateString(po.date)}</AppText>
              </View>
            </View>
          </View>
        </AppCard>

        {/* Products Card */}
        <AppCard variant="glass" style={styles.appCard}>
          <AppText variant="h3" style={styles.appText3}>
            Order Products & Quantities
          </AppText>

          {po.products.map((p, idx) => (
            <View key={idx} style={[styles.view1, theme === 'dark' && styles.view1Dark]}>
              <AppText variant="body" style={[styles.appText2, theme === 'dark' && styles.appText2Dark]}>
                {p.product_name}
              </AppText>
              <AppText variant="bodySemibold">
                {p.quantity} {p.unit || 'units'}
              </AppText>
            </View>
          ))}

          <View style={[styles.view, theme === 'dark' && styles.viewDark]}>
            <AppText variant="bodySemibold" style={styles.appText1}>Contract Total Worth</AppText>
            <AppText variant="h2" style={[styles.appText, theme === 'dark' && styles.appTextDark]}>
              {formatUSD(po.total_amount)}
            </AppText>
          </View>
        </AppCard>
      </ScrollView>
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
    fontFamily: 'monospace',
    color: '#8b5cf6',
  },
  appText10Dark: {
    color: '#c084fc',
  },
  appText2: {
    flex: 1,
    marginRight: 8,
    color: '#374151',
  },
  appText2Dark: {
    color: '#d1d5db',
  },
  appText3: {
    fontWeight: 'bold',
    marginBottom: 14,
  },
  appText4: {
    marginTop: 2,
  },
  appText5: {
    color: '#9ca3af',
  },
  appText6: {
    marginTop: 2,
  },
  appText7: {
    color: '#9ca3af',
  },
  appText8: {
    marginTop: 2,
  },
  appText9: {
    color: '#9ca3af',
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
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  view1Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view2: {
    width: '48%',
  },
  view3: {
    width: '48%',
  },
  view4: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  view5: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewDark: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
});

export default PurchaseOrderDetailScreen;
