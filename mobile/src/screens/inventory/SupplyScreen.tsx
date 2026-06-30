import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { View, FlatList, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useAppStore } from '../../store/appStore';
import AppText from '../../components/common/AppText';
import AppCard from '../../components/common/AppCard';
import AppHeader from '../../components/layout/AppHeader';
import AppSearch from '../../components/inputs/AppSearch';
import AppStatusBadge from '../../components/common/AppStatusBadge';
import AppButton from '../../components/common/AppButton';
import AppBottomSheet from '../../components/modals/AppBottomSheet';
import AppInput from '../../components/inputs/AppInput';
import AppAlert from '../../components/modals/AppAlert';
import { SupplyItem } from '../../data/activities';

type SupplyFilter = 'All' | 'PENDING' | 'LOADING' | 'IN_TRANSIT' | 'DELIVERED';

interface TabButtonProps {
  tab: SupplyFilter;
  label: string;
  activeTab: SupplyFilter;
  onPress: (tab: SupplyFilter) => void;
}

const TabButton = ({ tab, label, activeTab, onPress }: TabButtonProps) => {
  const theme = useAppStore(state => state.theme);
  const isSelected = activeTab === tab;
  return (
    <TouchableOpacity
      onPress={() => onPress(tab)}
      style={[
        styles.tabButton,
        isSelected ? styles.tabButtonSelected : styles.tabButtonUnselected,
      ]}
    >
      <AppText 
        style={[
          styles.tabText,
          isSelected ? styles.tabTextSelected : (theme === 'dark' ? styles.tabTextUnselectedDark : styles.tabTextUnselected),
        ]}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

export const SupplyScreen = () => {
  const { supplyData, updateSupplyItem, addInvoice, theme } = useAppStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SupplyFilter>('All');
  
  // Selection states
  const [selectedItem, setSelectedItem] = useState<SupplyItem | null>(null);
  
  // Allot Modal State
  const [allotOpen, setAllotOpen] = useState(false);
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Invoice Modal State
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('50000');

  type AlertConfig = {
    visible: boolean;
    title: string;
    message: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  };

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, showCancel?: boolean, onConfirm?: () => void) => {
    setAlertConfig({ visible: true, title, message, showCancel, onConfirm });
  };

  // Filter supply list
  const filteredSupply = useMemo(() => {
    let result = supplyData.filter((item) => {
      if (filter !== 'All' && item.status !== filter) return false;

      const q = search.toLowerCase();
      return (
        item.supplier.toLowerCase().includes(q) ||
        item.cargo.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q) ||
        item.inquiry_id.toLowerCase().includes(q)
      );
    });

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [supplyData, search, filter]);

  // Allot Vehicle confirm
  const handleAllotConfirm = () => {
    if (!selectedItem || !vehicleNo.trim()) return;

    updateSupplyItem(selectedItem.inquiry_id, {
      status: 'LOADING',
      vehicle: vehicleNo.trim(),
      driver: driverName.trim() || 'Unassigned Driver',
      driverPhone: driverPhone.trim() || 'N/A'
    });

    setVehicleNo('');
    setDriverName('');
    setDriverPhone('');
    setAllotOpen(false);
    setSelectedItem(null);
    showAlert('Vehicle Allotted', 'Vehicle registered. Shipment status updated to LOADING.');
  };

  // Process Shipment Progression
  const handleProgressShipment = (item: SupplyItem) => {
    if (item.status === 'PENDING') {
      setSelectedItem(item);
      setAllotOpen(true);
    } else if (item.status === 'LOADING') {
      showAlert(
        'Mark In Transit', 
        'Are you sure you want to mark this shipment as in-route?', 
        true, 
        () => {
          updateSupplyItem(item.inquiry_id, { status: 'IN_TRANSIT' });
          setAlertConfig(prev => ({ ...prev, visible: false }));
        }
      );
    } else if (item.status === 'IN_TRANSIT') {
      showAlert(
        'Confirm Delivery', 
        'Has the cargo successfully reached its destination?', 
        true, 
        () => {
          updateSupplyItem(item.inquiry_id, { status: 'DELIVERED' });
          setAlertConfig(prev => ({ ...prev, visible: false }));
        }
      );
    } else if (item.status === 'DELIVERED') {
      setSelectedItem(item);
      setInvoiceAmount('85000');
      setInvoiceOpen(true);
    }
  };

  // Generate and send invoice
  const handleSendInvoiceConfirm = () => {
    if (!selectedItem) return;

    const amt = parseFloat(invoiceAmount) || 0;

    // 1. Remove from supply list
    const remainingSupply = supplyData.filter(i => i.inquiry_id !== selectedItem.inquiry_id);
    useAppStore.setState({ supplyData: remainingSupply });

    // 2. Add to Invoices store
    const newInvoice = {
      inquiry_id: `INV-${Date.now().toString().slice(-4)}`,
      buyer_name: selectedItem.buyer_name,
      buyer_email: selectedItem.buyer_email,
      cargo: selectedItem.cargo,
      invoice_date: new Date().toISOString(),
      invoice_status: 'SENT',
      products: [
        { product_name: selectedItem.cargo, quantity: selectedItem.quantity, total_price: amt }
      ]
    };
    addInvoice(newInvoice);

    setInvoiceOpen(false);
    setSelectedItem(null);
    showAlert('Invoice Sent', `Quotation invoice for ${newInvoice.buyer_name} has been issued and emailed.`);
  };

  return (
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]} edges={["top"]}>
      <AppHeader title="Logistics & Supply" />

      <View style={styles.view7}>
        {/* Search */}
        <AppSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search by supplier, cargo or cargo destination..."
          style={styles.style2}
        />

        {/* Categories scrollbar */}
        <View style={styles.view6}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.style1}
          >
            <TabButton tab="All" label="All" activeTab={filter} onPress={setFilter} />
            <TabButton tab="PENDING" label="Pending" activeTab={filter} onPress={setFilter} />
            <TabButton tab="LOADING" label="Loading" activeTab={filter} onPress={setFilter} />
            <TabButton tab="IN_TRANSIT" label="In Transit" activeTab={filter} onPress={setFilter} />
            <TabButton tab="DELIVERED" label="Delivered" activeTab={filter} onPress={setFilter} />
          </ScrollView>
        </View>

        {/* Cargo FlatList */}
        <FlatList
          data={filteredSupply}
          keyExtractor={(item) => item.inquiry_id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const nextButtonLabel = 
              item.status === 'PENDING' ? 'Allot Vehicle' :
              item.status === 'LOADING' ? 'Mark In Transit' :
              item.status === 'IN_TRANSIT' ? 'Confirm Delivery' :
              item.status === 'DELIVERED' ? 'Dispatch Invoice' : 'Done';
            
            return (
              <AppCard variant="glass" style={styles.appCard}>
                <View style={styles.view5}>
                  <AppText style={[styles.appText12, theme === 'dark' && styles.appText12Dark]}>
                    {item.inquiry_id}
                  </AppText>
                  <AppStatusBadge status={item.status} />
                </View>

                <View style={styles.view4}>
                  <AppText variant="captionSemibold" style={styles.appText11}>Supplier & Cargo</AppText>
                  <AppText variant="bodySemibold">{item.supplier} - {item.cargo} ({item.quantity})</AppText>
                  
                  <View style={styles.view3}>
                    <View>
                      <AppText variant="captionSemibold" style={styles.appText10}>Destination</AppText>
                      <AppText variant="body" style={styles.appText9}>{item.destination}</AppText>
                    </View>
                    
                    {item.vehicle ? (
                      <View style={styles.view2}>
                        <AppText variant="captionSemibold" style={styles.appText8}>Vehicle / Driver</AppText>
                        <AppText variant="body" style={styles.appText7}>{item.vehicle} ({item.driver})</AppText>
                      </View>
                    ) : null}
                  </View>
                </View>

                <AppButton
                  title={nextButtonLabel}
                  onPress={() => handleProgressShipment(item)}
                  style={styles.style}
                  variant={item.status === 'DELIVERED' ? 'primary' : 'outline'}
                />
              </AppCard>
            );
          }}
          ListEmptyComponent={
            <View style={styles.view1}>
              <AppText variant="subtitle" style={styles.appText6}>
                No active cargo supplies matching filters.
              </AppText>
            </View>
          }
        />
      </View>

      {/* Allot Vehicle Bottom Sheet */}
      <AppBottomSheet
        visible={allotOpen}
        onClose={() => { setAllotOpen(false); setSelectedItem(null); }}
        title="Vehicle & Driver Allotment"
      >
        <AppText style={styles.appText5}>
          Input transportation and driver details to process loading operations.
        </AppText>

        <AppInput
          label="Vehicle License Plate No."
          placeholder="e.g. MH-12-PQ-9988"
          value={vehicleNo}
          onChangeText={setVehicleNo}
        />

        <AppInput
          label="Driver Full Name"
          placeholder="e.g. Sukhwinder Singh"
          value={driverName}
          onChangeText={setDriverName}
        />

        <AppInput
          label="Driver Contact Phone"
          placeholder="e.g. +91 99887 66554"
          value={driverPhone}
          onChangeText={text => setDriverPhone(text)}
          keyboardType="phone-pad"
        />

        <AppButton
          title="Save & Progress Sourcing"
          onPress={handleAllotConfirm}
          style={styles.appButton1}
        />
      </AppBottomSheet>

      {/* Invoice Generator Bottom Sheet */}
      <AppBottomSheet
        visible={invoiceOpen}
        onClose={() => { setInvoiceOpen(false); setSelectedItem(null); }}
        title="Invoice Dispatcher"
      >
        <AppText style={styles.appText4}>
          Draft invoice details for customer billing. Pushing this button will send the invoice and close the cargo deal.
        </AppText>

        <View style={[styles.view, theme === 'dark' && styles.viewDark]}>
          <AppText variant="captionSemibold" style={styles.appText3}>Bill To:</AppText>
          <AppText variant="bodySemibold" style={styles.appText2}>{selectedItem?.buyer_name} ({selectedItem?.buyer_email})</AppText>
          
          <AppText variant="captionSemibold" style={styles.appText1}>Cargo Contents:</AppText>
          <AppText variant="body" style={styles.appText}>{selectedItem?.cargo} ({selectedItem?.quantity})</AppText>
        </View>

        <AppInput
          label="Invoice Amount (USD)"
          value={invoiceAmount}
          onChangeText={setInvoiceAmount}
          keyboardType="numeric"
        />

        <AppButton
          title="Email Invoice & Close Deal"
          onPress={handleSendInvoiceConfirm}
          style={styles.appButton}
        />
      </AppBottomSheet>

      <AppAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        showCancel={alertConfig.showCancel}
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
  appButton1: {
    marginTop: 16,
  },
  appCard: {
    marginBottom: 14,
  },
  appText: {
    marginBottom: 8,
  },
  appText1: {
    color: '#9ca3af',
  },
  appText10: {
    color: '#9ca3af',
  },
  appText11: {
    color: '#9ca3af',
  },
  appText12: {
    fontFamily: 'monospace',
    color: '#7c3aed',
    fontWeight: 'bold',
    fontSize: 12,
  },
  appText12Dark: {
    color: '#c084fc',
  },
  appText2: {
    marginBottom: 8,
  },
  appText3: {
    color: '#9ca3af',
  },
  appText4: {
    marginBottom: 16,
    fontSize: 12,
  },
  appText5: {
    marginBottom: 16,
    fontSize: 12,
  },
  appText6: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  appText7: {
    marginTop: 2,
  },
  appText8: {
    color: '#9ca3af',
  },
  appText9: {
    marginTop: 2,
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeAreaViewDark: {
    backgroundColor: '#0c0e12',
  },
  style: {
    height: 38.0,
    borderRadius: 12,
  },
  style1: {
    gap: 24,
  },
  style2: {
    marginBottom: 12,
  },
  view: {
    padding: 16,
    backgroundColor: '#eef2f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 16,
  },
  view1: {
    marginTop: 32,
  },
  view2: {
    alignItems: 'flex-end',
  },
  view3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  view4: {
    marginBottom: 12,
  },
  view5: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  view6: {
    marginBottom: 16,
  },
  view7: {
    flex: 1,
    padding: 16,
  },
  viewDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabButton: {
    paddingVertical: 8,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonSelected: {
    paddingHorizontal: 28,
    backgroundColor: '#4648D4',
  },
  tabButtonUnselected: {
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
  },
  tabTextSelected: {
    color: '#ffffff',
  },
  tabTextUnselected: {
    color: '#4b5563',
  },
  tabTextUnselectedDark: {
    color: '#9ca3af',
  },
});

export default SupplyScreen;
