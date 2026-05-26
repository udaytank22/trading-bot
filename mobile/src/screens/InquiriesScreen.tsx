import React, { useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppSearch from '../components/inputs/AppSearch';
import AppStatusBadge from '../components/common/AppStatusBadge';
import AppButton from '../components/common/AppButton';
import AppModal from '../components/modals/AppModal';
import AppInput from '../components/inputs/AppInput';
import { formatDateString } from '../utils/marginEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Inquiry } from '../data/activities';

type TabFilter = 'ALL' | 'PENDING_SOURCING' | 'UNDER_REVIEW' | 'ACTIVE';

interface TabButtonProps {
  tab: TabFilter;
  label: string;
  activeTab: TabFilter;
  onPress: (tab: TabFilter) => void;
}

const TabButton = ({ tab, label, activeTab, onPress }: TabButtonProps) => {
  const isSelected = activeTab === tab;
  return (
    <TouchableOpacity
      onPress={() => onPress(tab)}
      className={`flex-1 py-2 items-center border-b-2 ${
        isSelected ? 'border-purple-600 dark:border-purple-400' : 'border-transparent'
      }`}
    >
      <AppText 
        className={`text-[12px] ${
          isSelected 
            ? 'text-purple-600 dark:text-purple-450 font-bold' 
            : 'text-gray-500 dark:text-gray-400 font-semibold'
        }`}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

export const InquiriesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { inquiriesData, addInquiry } = useAppStore();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  
  // Add Inquiry Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newVessel, setNewVessel] = useState('');
  const [newVesselRef, setNewVesselRef] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newQty, setNewQty] = useState('1');

  // Filter inquiries
  const filteredInquiries = useMemo(() => {
    let result = inquiriesData.filter((inq) => {
      // 1. Tab segment filter
      if (activeTab === 'PENDING_SOURCING') {
        if (!['PENDING', 'RFQ_SENT', 'CLIENT_QUOTING'].includes(inq.status)) return false;
      } else if (activeTab === 'UNDER_REVIEW') {
        if (!['TL_REVIEW', 'ADMIN_APPROVAL', 'EMPLOYEE_VERIFY', 'RFQ_READY'].includes(inq.status)) return false;
      } else if (activeTab === 'ACTIVE') {
        if (!['QUOTE_SENT', 'CLIENT_FINAL_APPROVAL', 'CONFIRMED'].includes(inq.status)) return false;
      }

      // 2. Text search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          inq.buyer_name.toLowerCase().includes(q) ||
          inq.buyer_email.toLowerCase().includes(q) ||
          (inq.vessel_name && inq.vessel_name.toLowerCase().includes(q)) ||
          (inq.vessel_ref && inq.vessel_ref.toLowerCase().includes(q)) ||
          inq.products.some((p) => p.product_name.toLowerCase().includes(q));
        if (!hit) return false;
      }

      return true;
    });

    // Sort by latest date first
    return result.sort((a, b) => new Date(b.date_received).getTime() - new Date(a.date_received).getTime());
  }, [inquiriesData, search, activeTab]);

  const handleAddInquiry = () => {
    if (!newCustomer.trim() || !newProduct.trim()) return;

    const tempInquiry: Inquiry = {
      inquiry_id: `OM-ENQ-26-0${2132 + inquiriesData.length}`,
      buyer_name: newCustomer.trim(),
      buyer_email: `${newCustomer.toLowerCase().replace(/\s+/g, '')}@buyer.com`,
      vessel_name: newVessel.trim() || 'MV Star Pride',
      vessel_ref: newVesselRef.trim() || 'REF-99-88',
      date_received: new Date().toISOString(),
      status: 'PENDING',
      margin_percent: 15,
      discount_percent: 0,
      admin_approved: false,
      tl_approved: false,
      products: [
        {
          product_name: newProduct.trim(),
          quantity: parseInt(newQty, 10) || 1,
          unit: 'pcs',
          specs: 'Standard specs'
        }
      ],
      seller_quote: null,
      my_quote: null
    };

    addInquiry(tempInquiry);
    
    // reset form
    setNewCustomer('');
    setNewVessel('');
    setNewVesselRef('');
    setNewProduct('');
    setNewQty('1');
    setIsAddModalOpen(false);
  };

  const renderInquiryCard = ({ item }: { item: Inquiry }) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('InquiryDetail', { inquiryId: item.inquiry_id })}
        activeOpacity={0.8}
        className="mb-3"
      >
        <AppCard variant="glass" className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <AppText className="font-mono text-purple-600 dark:text-purple-400 text-xs font-bold">
                {item.inquiry_id}
              </AppText>
              <AppText variant="caption" className="text-gray-500 dark:text-gray-400 mt-0.5">
                {formatDateString(item.date_received)}
              </AppText>
            </View>
            <AppStatusBadge status={item.status} />
          </View>

          <AppText variant="bodySemibold" className="text-gray-900 dark:text-white text-base">
            {item.buyer_name}
          </AppText>

          <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100 dark:border-white/[0.04]">
            <View className="flex-1">
              <AppText variant="captionSemibold" className="text-gray-400">Products</AppText>
              <AppText variant="body" className="text-gray-700 dark:text-gray-300 mt-0.5" numberOfLines={1}>
                {item.products[0]?.product_name}
                {item.products.length > 1 ? ` (+${item.products.length - 1} more)` : ''}
              </AppText>
            </View>

            <View className="items-end">
              <AppText variant="captionSemibold" className="text-gray-400">Vessel</AppText>
              <AppText variant="bodySemibold" className="text-gray-800 dark:text-gray-200 mt-0.5">
                {item.vessel_name || 'N/A'}
              </AppText>
            </View>
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-darkbg">
      <AppHeader 
        title="Inquiries" 
        rightAction={
          <AppButton
            title="+ Add"
            variant="primary"
            onPress={() => setIsAddModalOpen(true)}
            className="h-[34px] px-3.5"
          />
        }
      />

      {/* Tab filter bar */}
      <View className="flex-row bg-white dark:bg-[#12141c] border-b border-gray-150 dark:border-white/[0.03] px-2">
        <TabButton tab="ALL" label="All" activeTab={activeTab} onPress={setActiveTab} />
        <TabButton tab="PENDING_SOURCING" label="Sourcing" activeTab={activeTab} onPress={setActiveTab} />
        <TabButton tab="UNDER_REVIEW" label="Review" activeTab={activeTab} onPress={setActiveTab} />
        <TabButton tab="ACTIVE" label="Active" activeTab={activeTab} onPress={setActiveTab} />
      </View>

      <View className="flex-1 p-4">
        {/* Search */}
        <AppSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search by buyer, vessel or product..."
          className="mb-4"
        />

        <FlatList
          data={filteredInquiries}
          keyExtractor={(item) => item.inquiry_id}
          renderItem={renderInquiryCard}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="mt-8">
              <AppText variant="subtitle" className="text-center text-sm text-gray-500">
                No inquiries match your filters.
              </AppText>
            </View>
          }
        />
      </View>

      {/* Add Inquiry Modal */}
      <AppModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Inquiry"
      >
        <AppInput
          label="Buyer / Customer Name"
          placeholder="e.g. HK Shipping"
          value={newCustomer}
          onChangeText={setNewCustomer}
        />
        <AppInput
          label="Vessel Name"
          placeholder="e.g. HAPPY FOUNDER"
          value={newVessel}
          onChangeText={setNewVessel}
        />
        <AppInput
          label="Vessel Reference Code"
          placeholder="e.g. HKL-09"
          value={newVesselRef}
          onChangeText={setNewVesselRef}
        />
        <AppInput
          label="Product / Requirement"
          placeholder="e.g. Cylinder Liner Yanmar"
          value={newProduct}
          onChangeText={setNewProduct}
        />
        <AppInput
          label="Quantity Needed"
          placeholder="e.g. 5"
          value={newQty}
          onChangeText={setNewQty}
          keyboardType="numeric"
        />

        <AppButton
          title="Save Inquiry"
          onPress={handleAddInquiry}
          className="mt-4"
        />
      </AppModal>
    </SafeAreaView>
  );
};
export default InquiriesScreen;
