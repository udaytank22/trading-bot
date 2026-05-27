import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import Stylesheet from '../components/common/Stylesheet';

import { View, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppSearch from '../components/inputs/AppSearch';
import AppStatusBadge from '../components/common/AppStatusBadge';
import AppButton from '../components/common/AppButton';
import AppBottomSheet from '../components/modals/AppBottomSheet';
import AppInput from '../components/inputs/AppInput';
import AppAlert from '../components/modals/AppAlert';
import { SupplyItem } from '../data/activities';

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
        Stylesheet.cls(
          theme,
          `py-2 rounded-full justify-center items-center ${
            isSelected ? 'px-7' : 'bg-transparent px-3'
          }`,
        ),
        isSelected && { backgroundColor: '#4648D4' },
      ]}
    >
      <AppText 
        style={Stylesheet.cls(
          theme,
          `text-[15px] ${
            isSelected ? 'text-white' : 'text-[#4b5563] dark:text-[#9ca3af]'
          }`,
        )}
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
    <SafeAreaView style={Stylesheet.cls(theme, "flex-1 bg-gray-50 dark:bg-darkbg")} edges={["top"]}>
      <AppHeader title="Logistics & Supply" />

      <View style={Stylesheet.cls(theme, "flex-1 p-4")}>
        {/* Search */}
        <AppSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search by supplier, cargo or cargo destination..."
          style={Stylesheet.cls(theme, "mb-3")}
        />

        {/* Categories scrollbar */}
        <View style={Stylesheet.cls(theme, "mb-4")}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={Stylesheet.cls(theme, "gap-6")}
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
              <AppCard variant="glass" style={Stylesheet.cls(theme, "mb-3.5")}>
                <View style={Stylesheet.cls(theme, "flex-row justify-between items-center mb-3")}>
                  <AppText style={Stylesheet.cls(theme, "font-mono text-purple-600 dark:text-purple-400 font-bold text-xs")}>
                    {item.inquiry_id}
                  </AppText>
                  <AppStatusBadge status={item.status} />
                </View>

                <View style={Stylesheet.cls(theme, "space-y-1 mb-3")}>
                  <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Supplier & Cargo</AppText>
                  <AppText variant="bodySemibold">{item.supplier} - {item.cargo} ({item.quantity})</AppText>
                  
                  <View style={Stylesheet.cls(theme, "flex-row justify-between pt-1")}>
                    <View>
                      <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Destination</AppText>
                      <AppText variant="body" style={Stylesheet.cls(theme, "mt-0.5")}>{item.destination}</AppText>
                    </View>
                    
                    {item.vehicle ? (
                      <View style={Stylesheet.cls(theme, "items-end")}>
                        <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Vehicle / Driver</AppText>
                        <AppText variant="body" style={Stylesheet.cls(theme, "mt-0.5")}>{item.vehicle} ({item.driver})</AppText>
                      </View>
                    ) : null}
                  </View>
                </View>

                <AppButton
                  title={nextButtonLabel}
                  onPress={() => handleProgressShipment(item)}
                  style={Stylesheet.cls(theme, "h-[38px] rounded-xl")}
                  variant={item.status === 'DELIVERED' ? 'primary' : 'outline'}
                />
              </AppCard>
            );
          }}
          ListEmptyComponent={
            <View style={Stylesheet.cls(theme, "mt-8")}>
              <AppText variant="subtitle" style={Stylesheet.cls(theme, "text-center text-sm text-gray-500")}>
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
        <AppText style={Stylesheet.cls(theme, "mb-4 text-xs")}>
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
          style={Stylesheet.cls(theme, "mt-4")}
        />
      </AppBottomSheet>

      {/* Invoice Generator Bottom Sheet */}
      <AppBottomSheet
        visible={invoiceOpen}
        onClose={() => { setInvoiceOpen(false); setSelectedItem(null); }}
        title="Invoice Dispatcher"
      >
        <AppText style={Stylesheet.cls(theme, "mb-4 text-xs")}>
          Draft invoice details for customer billing. Pushing this button will send the invoice and close the cargo deal.
        </AppText>

        <View style={Stylesheet.cls(theme, "p-4 bg-gray-150 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.04] rounded-xl mb-4")}>
          <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Bill To:</AppText>
          <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mb-2")}>{selectedItem?.buyer_name} ({selectedItem?.buyer_email})</AppText>
          
          <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Cargo Contents:</AppText>
          <AppText variant="body" style={Stylesheet.cls(theme, "mb-2")}>{selectedItem?.cargo} ({selectedItem?.quantity})</AppText>
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
          style={Stylesheet.cls(theme, "mt-4")}
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
export default SupplyScreen;
