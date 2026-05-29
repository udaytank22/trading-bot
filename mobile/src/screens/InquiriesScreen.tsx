import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

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
  const { inquiriesData, addInquiry, theme } = useAppStore();

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
    let result = inquiriesData.filter(inq => {
      // 1. Tab segment filter
      if (activeTab === 'PENDING_SOURCING') {
        if (!['PENDING', 'RFQ_SENT', 'CLIENT_QUOTING'].includes(inq.status))
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
          !['QUOTE_SENT', 'CLIENT_FINAL_APPROVAL', 'CONFIRMED'].includes(
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

const styles = ScaledSheet.create({
  appButton: {
    marginTop: '16@ms',
  },
  appCard: {
    padding: '16@ms',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: '12@ms',
    backgroundColor: '#ffffff',
  },
  appCardDark: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#161920',
  },
  appHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: '16@ms',
  },
  appHeaderDark: {
    backgroundColor: '#12141c',
  },
  appText: {
    textAlign: 'center',
    fontSize: '14@ms',
    color: '#6b7280',
  },
  appText1: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: '18@ms',
  },
  appText1Dark: {
    color: '#818cf8',
  },
  appText2: {
    color: '#111827',
    fontSize: '13@ms',
    fontWeight: 'bold',
  },
  appText2Dark: {
    color: '#ffffff',
  },
  appText3: {
    color: '#9ca3af',
    fontSize: '11@ms',
    marginBottom: '4@ms',
  },
  appText3Dark: {
    color: '#6b7280',
  },
  appText4: {
    color: '#374151',
    fontSize: '13@ms',
  },
  appText4Dark: {
    color: '#d1d5db',
  },
  appText5: {
    color: '#9ca3af',
    fontSize: '11@ms',
    marginBottom: '4@ms',
  },
  appText5Dark: {
    color: '#6b7280',
  },
  appText6: {
    color: '#111827',
    fontSize: '15@ms',
    fontWeight: 'bold',
    marginTop: '4@ms',
  },
  appText6Dark: {
    color: '#ffffff',
  },
  appText7: {
    color: '#6b7280',
    marginTop: '2@ms',
    fontSize: '11@ms',
  },
  appText7Dark: {
    color: '#9ca3af',
  },
  appText8: {
    color: '#4F46E5',
    fontSize: '11@ms',
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
    paddingHorizontal: '16@ms',
    paddingVertical: '12@ms',
    gap: '24@ms',
  },
  style: {
    paddingTop: '16@ms',
    paddingBottom: '96@ms',
  },
  style1: {
    backgroundColor: '#f8f9fc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: '50.0@vs',
  },
  style1Dark: {
    backgroundColor: '#161920',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  style2: {
    height: '38.0@vs',
    paddingHorizontal: '20@ms',
    borderRadius: '9999@ms',
    backgroundColor: '#A855F7',
  },
  style3: {
    marginBottom: '12@ms',
    marginHorizontal: '16@ms',
  },
  view: {
    marginTop: '32@ms',
  },
  view1: {
    backgroundColor: '#ffffff',
  },
  view1Dark: {
    backgroundColor: '#12141c',
  },
  view2: {
    backgroundColor: '#ffffff',
    paddingHorizontal: '16@ms',
    paddingVertical: '12@ms',
  },
  view2Dark: {
    backgroundColor: '#12141c',
  },
  view3: {
    width: '32@s',
    height: '32@vs',
    borderRadius: '9999@ms',
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '10@ms',
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
    paddingLeft: '8@ms',
  },
  view6: {
    flex: 1,
    paddingRight: '8@ms',
  },
  view7: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '12@ms',
    paddingTop: '12@ms',
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
    marginBottom: '12@ms',
  },
  tabButton: {
    paddingVertical: '8@ms',
    borderRadius: '9999@ms',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonSelected: {
    paddingHorizontal: '28@ms',
    backgroundColor: '#4648D4',
  },
  tabButtonUnselected: {
    paddingHorizontal: '12@ms',
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: '15@ms',
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
