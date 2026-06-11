import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

import { useAppStore } from '../../store/appStore';
import AppText from '../../components/common/AppText';
import AppCard from '../../components/common/AppCard';
import AppHeader from '../../components/layout/AppHeader';
import AppSearch from '../../components/inputs/AppSearch';
import AppStatusBadge from '../../components/common/AppStatusBadge';
import AppButton from '../../components/common/AppButton';
import AppModal from '../../components/modals/AppModal';
import AppInput from '../../components/inputs/AppInput';
import { formatDateString } from '../../utils/marginEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Inquiry } from '../../data/activities';
import { getInquiriesList } from '../../services/inquiry/inquieryServices';

type TabFilter = 'ALL' | 'PENDING_SOURCING' | 'UNDER_REVIEW' | 'ACTIVE';

interface TabButtonProps {
  tab: TabFilter;
  label: string;
  activeTab: TabFilter;
  onPress: (tab: TabFilter) => void;
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

export const InquiriesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppStore();
  const [inquiriesData, setInquiriesData] = useState<Inquiry[]>([]);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch from server
  const fetchInquiries = useCallback(async () => {
    try {
      const data = await getInquiriesList();
      if (data && Array.isArray(data)) {
        setInquiriesData(data);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    }
  }, [setInquiriesData]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInquiries();
    setRefreshing(false);
  };

  // Add Inquiry Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newVessel, setNewVessel] = useState('');
  const [newVesselRef, setNewVesselRef] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newQty, setNewQty] = useState('1');

  // Filter inquiries
  const filteredInquiries = useMemo(() => {
    let result = inquiriesData.filter(inq => {
      // 1. Tab segment filter
      if (activeTab === 'PENDING_SOURCING') {
        if (!['PENDING', 'RFQ_SENT', 'RFQ_RECEIVED'].includes(inq.status))
          return false;
      } else if (activeTab === 'UNDER_REVIEW') {
        if (
          ![
            'TL_REVIEW',
            'ADMIN_APPROVAL',
            'EMPLOYEE_VERIFY',
            'RFQ_READY',
          ].includes(inq.status)
        )
          return false;
      } else if (activeTab === 'ACTIVE') {
        if (
          !['CLIENT_QUOTING', 'QUOTE_SENT', 'CLIENT_FINAL_APPROVAL', 'CONFIRMED'].includes(
            inq.status,
          )
        )
          return false;
      }

      // 2. Text search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          inq.buyer_name.toLowerCase().includes(q) ||
          inq.buyer_email.toLowerCase().includes(q) ||
          (inq.vessel_name && inq.vessel_name.toLowerCase().includes(q)) ||
          (inq.vessel_ref && inq.vessel_ref.toLowerCase().includes(q)) ||
          inq.products.some(p => p.product_name.toLowerCase().includes(q));
        if (!hit) return false;
      }

      return true;
    });

    // Sort by latest date first
    return result.sort(
      (a, b) =>
        new Date(b.date_received).getTime() -
        new Date(a.date_received).getTime(),
    );
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
          specs: 'Standard specs',
        },
      ],
      seller_quote: null,
      my_quote: null,
    };

    setInquiriesData(prev => [tempInquiry, ...prev]);

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
        onPress={() =>
          navigation.navigate('InquiryDetail', { inquiryId: item.inquiry_id })
        }
        activeOpacity={0.8}
        style={styles.style3}
      >
        <AppCard
          style={[styles.appCard, theme === 'dark' && styles.appCardDark]}
        >
          {item.status && item.status !== 'QUOTE_SENT' && (
            <View
              style={styles.view8}
            >
              <View>
                <AppText
                  style={[styles.appText8, theme === 'dark' && styles.appText8Dark]}
                >
                  {item.inquiry_id}
                </AppText>
                <AppText
                  style={[styles.appText7, theme === 'dark' && styles.appText7Dark]}
                >
                  {formatDateString(item.date_received)}
                </AppText>
              </View>
              <AppStatusBadge status={item.status} />
            </View>
          )}

          <AppText
            style={[styles.appText6, theme === 'dark' && styles.appText6Dark]}
          >
            {item.buyer_name}
          </AppText>

          <View
            style={[styles.view7, theme === 'dark' && styles.view7Dark]}
          >
            <View style={styles.view6}>
              <AppText
                style={[styles.appText5, theme === 'dark' && styles.appText5Dark]}
              >
                Products
              </AppText>
              <AppText
                style={[styles.appText4, theme === 'dark' && styles.appText4Dark]}
                numberOfLines={1}
              >
                {item.products[0]?.product_name}
                {item.products.length > 1
                  ? ` (+${item.products.length - 1} more)`
                  : ''}
              </AppText>
            </View>

            <View style={styles.view5}>
              <AppText
                style={[styles.appText3, theme === 'dark' && styles.appText3Dark]}
              >
                Vessel
              </AppText>
              <AppText
                style={[styles.appText2, theme === 'dark' && styles.appText2Dark]}
              >
                {item.vessel_name || 'N/A'}
              </AppText>
            </View>
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}
      edges={['top']}
    >
      <AppHeader
        title=""
        style={[styles.appHeader, theme === 'dark' && styles.appHeaderDark]}
        leftAction={
          <View style={styles.view4}>
            <View
              style={[styles.view3, theme === 'dark' && styles.view3Dark]}
            >
              <Icon name="user" size={16} color="#38bdf8" />
            </View>
            <AppText
              style={[styles.appText1, theme === 'dark' && styles.appText1Dark]}
            >
              Inquiries
            </AppText>
          </View>
        }
        rightAction={
          <AppButton
            title="+ Add"
            variant="primary"
            onPress={() => setIsAddModalOpen(true)}
            style={styles.style2}
            textStyle={{ fontSize: 15 }}
          />
        }
      />

      <View
        style={[styles.view2, theme === 'dark' && styles.view2Dark]}
      >
        <AppSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search by buyer, vessel or product..."
          style={[styles.style1, theme === 'dark' && styles.style1Dark]}
        />
      </View>

      <View style={[styles.view1, theme === 'dark' && styles.view1Dark]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollView}
        >
          <TabButton
            tab="ALL"
            label="All"
            activeTab={activeTab}
            onPress={setActiveTab}
          />
          <TabButton
            tab="PENDING_SOURCING"
            label="Sourcing"
            activeTab={activeTab}
            onPress={setActiveTab}
          />
          <TabButton
            tab="UNDER_REVIEW"
            label="Review"
            activeTab={activeTab}
            onPress={setActiveTab}
          />
          <TabButton
            tab="ACTIVE"
            label="Active"
            activeTab={activeTab}
            onPress={setActiveTab}
          />
        </ScrollView>
      </View>

      <FlatList
        data={filteredInquiries}
        keyExtractor={item => item.inquiry_id}
        renderItem={renderInquiryCard}
        contentContainerStyle={styles.style}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.view}>
            <AppText
              variant="subtitle"
              style={styles.appText}
            >
              No inquiries match your filters.
            </AppText>
          </View>
        }
      />

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
          style={styles.appButton}
        />
      </AppModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appButton: {
    marginTop: 16,
  },
  appCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  appCardDark: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#161920',
  },
  appHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  appHeaderDark: {
    backgroundColor: '#12141c',
  },
  appText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  appText1: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 18,
  },
  appText1Dark: {
    color: '#818cf8',
  },
  appText2: {
    color: '#111827',
    fontSize: 13,
    fontWeight: 'bold',
  },
  appText2Dark: {
    color: '#ffffff',
  },
  appText3: {
    color: '#9ca3af',
    fontSize: 11,
    marginBottom: 4,
  },
  appText3Dark: {
    color: '#6b7280',
  },
  appText4: {
    color: '#374151',
    fontSize: 13,
  },
  appText4Dark: {
    color: '#d1d5db',
  },
  appText5: {
    color: '#9ca3af',
    fontSize: 11,
    marginBottom: 4,
  },
  appText5Dark: {
    color: '#6b7280',
  },
  appText6: {
    color: '#111827',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 4,
  },
  appText6Dark: {
    color: '#ffffff',
  },
  appText7: {
    color: '#6b7280',
    marginTop: 2,
    fontSize: 11,
  },
  appText7Dark: {
    color: '#9ca3af',
  },
  appText8: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  appText8Dark: {
    color: '#818cf8',
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  safeAreaViewDark: {
    backgroundColor: '#0c0e12',
  },
  scrollView: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 24,
  },
  style: {
    paddingTop: 16,
    paddingBottom: 96,
  },
  style1: {
    backgroundColor: '#f8f9fc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 40.0,
  },
  style1Dark: {
    backgroundColor: '#161920',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  style2: {
    height: 25,
    paddingVertical: 0,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: '#A855F7',
  },
  style3: {
    marginBottom: 12,
    marginHorizontal: 16,
  },
  view: {
    marginTop: 32,
  },
  view1: {
    backgroundColor: '#ffffff',
  },
  view1Dark: {
    backgroundColor: '#12141c',
  },
  view2: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  view2Dark: {
    backgroundColor: '#12141c',
  },
  view3: {
    width: 30,
    height: 30,
    borderRadius: 9999,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  view3Dark: {
    backgroundColor: '#1f2937',
  },
  view4: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  view5: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  view6: {
    flex: 1,
    paddingRight: 8,
  },
  view7: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
  },
  view7Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view8: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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

export default InquiriesScreen;
