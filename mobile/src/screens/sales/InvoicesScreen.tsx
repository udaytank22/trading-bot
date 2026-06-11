import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/appStore';
import AppText from '../../components/common/AppText';
import AppCard from '../../components/common/AppCard';
import AppHeader from '../../components/layout/AppHeader';
import AppStatusBadge from '../../components/common/AppStatusBadge';
import { formatUSD, formatDateString } from '../../utils/marginEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import AppButton from '../../components/common/AppButton';
import AppAlert from '../../components/modals/AppAlert';

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
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}>
      <AppHeader title="Invoices Log" showBack={true} />

      <FlatList
        data={invoicesData}
        keyExtractor={(item) => item.inquiry_id}
        contentContainerStyle={styles.contentContainer}
        renderItem={({ item }) => {
          const totalVal = item.products.reduce((sum, p) => sum + (p.total_price || 0), 0);
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.inquiry_id })}
              activeOpacity={0.8}
              style={styles.style}
            >
              <AppCard variant="glass" style={styles.appCard}>
                <View style={styles.view5}>
                  <View style={styles.view4}>
                    <View style={styles.view3}>
                      <AppText style={[styles.appText4, theme === 'dark' && styles.appText4Dark]}>
                        {item.inquiry_id}
                      </AppText>
                      <AppText variant="caption">
                        {item.invoice_date ? formatDateString(item.invoice_date) : 'Draft Invoice'}
                      </AppText>
                    </View>
                    
                    <AppText variant="bodySemibold" style={styles.appText3} numberOfLines={1}>
                      {item.buyer_name}
                    </AppText>
                    <AppText variant="caption" style={styles.appText2} numberOfLines={1}>
                      Cargo: {item.cargo}
                    </AppText>
                  </View>

                  <View style={styles.view2}>
                    <AppStatusBadge status={item.invoice_status} />
                    <AppText variant="bodySemibold" style={[styles.appText1, theme === 'dark' && styles.appText1Dark]}>
                      {formatUSD(totalVal)}
                    </AppText>
                  </View>
                </View>

                {item.invoice_status === 'DRAFT' && (
                  <View style={[styles.view1, theme === 'dark' && styles.view1Dark]}>
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
          <View style={styles.view}>
            <AppText variant="subtitle" style={styles.appText}>
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

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
  appCard: {
    padding: 16,
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
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
  },
  view1Dark: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  view2: {
    alignItems: 'flex-end',
  },
  view3: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  view4: {
    flex: 1,
    paddingRight: 8,
  },
  view5: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default InvoicesScreen;
