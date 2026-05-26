import React, { useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppSearch from '../components/inputs/AppSearch';
import AppStatusBadge from '../components/common/AppStatusBadge';
import AppButton from '../components/common/AppButton';
import AppBottomSheet from '../components/modals/AppBottomSheet';
import AppInput from '../components/inputs/AppInput';
import { SupplyItem } from '../data/activities';

type SupplyFilter = 'All' | 'PENDING' | 'LOADING' | 'IN_TRANSIT' | 'DELIVERED';

interface TabSelectorProps {
  status: SupplyFilter;
  label: string;
  currentFilter: SupplyFilter;
  onSelect: (status: SupplyFilter) => void;
}

const TabSelector = ({ status, label, currentFilter, onSelect }: TabSelectorProps) => {
  const isSelected = currentFilter === status;
  return (
    <TouchableOpacity
      onPress={() => onSelect(status)}
      className={`px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/[0.04] mr-2 mb-2 ${
        isSelected ? 'bg-purple-650 dark:bg-purple-600' : 'bg-white dark:bg-white/[0.02]'
      }`}
    >
      <AppText className={isSelected ? 'text-white font-bold' : 'text-gray-550 dark:text-gray-400 font-semibold'}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

export const SupplyScreen = () => {
  const { supplyData, updateSupplyItem, addInvoice } = useAppStore();

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
    Alert.alert('Vehicle Allotted', 'Vehicle registered. Shipment status updated to LOADING.');
  };

  // Process Shipment Progression
  const handleProgressShipment = (item: SupplyItem) => {
    if (item.status === 'PENDING') {
      setSelectedItem(item);
      setAllotOpen(true);
    } else if (item.status === 'LOADING') {
      updateSupplyItem(item.inquiry_id, { status: 'IN_TRANSIT' });
      Alert.alert('In Transit', 'The shipment is now in route.');
    } else if (item.status === 'IN_TRANSIT') {
      updateSupplyItem(item.inquiry_id, { status: 'DELIVERED' });
      Alert.alert('Delivered', 'The cargo has successfully reached its destination.');
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
    Alert.alert('Invoice Sent', `Quotation invoice for ${newInvoice.buyer_name} has been issued and emailed.`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-darkbg">
      <AppHeader title="Logistics & Supply" />

      <View className="flex-1 p-4">
        {/* Search */}
        <AppSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search by supplier, cargo or cargo destination..."
          className="mb-3"
        />

        {/* Categories scrollbar */}
        <View className="flex-row flex-wrap mb-2">
          <TabSelector status="All" label="All" currentFilter={filter} onSelect={setFilter} />
          <TabSelector status="PENDING" label="Pending" currentFilter={filter} onSelect={setFilter} />
          <TabSelector status="LOADING" label="Loading" currentFilter={filter} onSelect={setFilter} />
          <TabSelector status="IN_TRANSIT" label="In Transit" currentFilter={filter} onSelect={setFilter} />
          <TabSelector status="DELIVERED" label="Delivered" currentFilter={filter} onSelect={setFilter} />
        </View>

        {/* Cargo FlatList */}
        <FlatList
          data={filteredSupply}
          keyExtractor={(item) => item.inquiry_id}
          renderItem={({ item }) => {
            const nextButtonLabel = 
              item.status === 'PENDING' ? 'Allot Vehicle' :
              item.status === 'LOADING' ? 'Mark In Transit' :
              item.status === 'IN_TRANSIT' ? 'Confirm Delivery' :
              item.status === 'DELIVERED' ? 'Dispatch Invoice' : 'Done';
            
            return (
              <AppCard variant="glass" className="mb-3.5">
                <View className="flex-row justify-between items-center mb-3">
                  <AppText className="font-mono text-purple-600 dark:text-purple-400 font-bold text-xs">
                    {item.inquiry_id}
                  </AppText>
                  <AppStatusBadge status={item.status} />
                </View>

                <View className="space-y-1 mb-3">
                  <AppText variant="captionSemibold" className="text-gray-400">Supplier & Cargo</AppText>
                  <AppText variant="bodySemibold">{item.supplier} - {item.cargo} ({item.quantity})</AppText>
                  
                  <View className="flex-row justify-between pt-1">
                    <View>
                      <AppText variant="captionSemibold" className="text-gray-400">Destination</AppText>
                      <AppText variant="body" className="mt-0.5">{item.destination}</AppText>
                    </View>
                    
                    {item.vehicle ? (
                      <View className="items-end">
                        <AppText variant="captionSemibold" className="text-gray-400">Vehicle / Driver</AppText>
                        <AppText variant="body" className="mt-0.5">{item.vehicle} ({item.driver})</AppText>
                      </View>
                    ) : null}
                  </View>
                </View>

                <AppButton
                  title={nextButtonLabel}
                  onPress={() => handleProgressShipment(item)}
                  className="h-[38px] rounded-xl"
                  variant={item.status === 'DELIVERED' ? 'primary' : 'outline'}
                />
              </AppCard>
            );
          }}
          ListEmptyComponent={
            <View className="mt-8">
              <AppText variant="subtitle" className="text-center text-sm text-gray-500">
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
        <AppText className="mb-4 text-xs">
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
          className="mt-4"
        />
      </AppBottomSheet>

      {/* Invoice Generator Bottom Sheet */}
      <AppBottomSheet
        visible={invoiceOpen}
        onClose={() => { setInvoiceOpen(false); setSelectedItem(null); }}
        title="Invoice Dispatcher"
      >
        <AppText className="mb-4 text-xs">
          Draft invoice details for customer billing. Pushing this button will send the invoice and close the cargo deal.
        </AppText>

        <View className="p-4 bg-gray-150 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.04] rounded-xl mb-4">
          <AppText variant="captionSemibold" className="text-gray-400">Bill To:</AppText>
          <AppText variant="bodySemibold" className="mb-2">{selectedItem?.buyer_name} ({selectedItem?.buyer_email})</AppText>
          
          <AppText variant="captionSemibold" className="text-gray-400">Cargo Contents:</AppText>
          <AppText variant="body" className="mb-2">{selectedItem?.cargo} ({selectedItem?.quantity})</AppText>
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
          className="mt-4"
        />
      </AppBottomSheet>
    </SafeAreaView>
  );
};
export default SupplyScreen;
