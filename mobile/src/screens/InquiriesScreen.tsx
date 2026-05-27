import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

import Stylesheet from '../components/common/Stylesheet';
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
        style={Stylesheet.cls(theme, 'mb-3 mx-4')}
      >
        <AppCard
          style={Stylesheet.cls(
            theme,
            'p-4 border border-gray-100 dark:border-white/[0.05] rounded-xl bg-white dark:bg-darkcard',
          )}
        >
          {item.status && item.status !== 'QUOTE_SENT' && (
            <View
              style={Stylesheet.cls(
                theme,
                'flex-row justify-between items-start mb-3',
              )}
            >
              <View>
                <AppText
                  style={Stylesheet.cls(
                    theme,
                    'text-[#4F46E5] dark:text-[#818cf8] text-[11px] font-bold uppercase tracking-wider',
                  )}
                >
                  {item.inquiry_id}
                </AppText>
                <AppText
                  style={Stylesheet.cls(
                    theme,
                    'text-gray-500 dark:text-gray-400 mt-0.5 text-[11px]',
                  )}
                >
                  {formatDateString(item.date_received)}
                </AppText>
              </View>
              <AppStatusBadge status={item.status} />
            </View>
          )}

          <AppText
            style={Stylesheet.cls(
              theme,
              'text-gray-900 dark:text-white text-[15px] font-bold mt-1',
            )}
          >
            {item.buyer_name}
          </AppText>

          <View
            style={Stylesheet.cls(
              theme,
              'flex-row items-center mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.04]',
            )}
          >
            <View style={Stylesheet.cls(theme, 'flex-1 pr-2')}>
              <AppText
                style={Stylesheet.cls(
                  theme,
                  'text-gray-400 dark:text-gray-500 text-[11px] mb-1',
                )}
              >
                Products
              </AppText>
              <AppText
                style={Stylesheet.cls(
                  theme,
                  'text-gray-700 dark:text-gray-300 text-[13px]',
                )}
                numberOfLines={1}
              >
                {item.products[0]?.product_name}
                {item.products.length > 1
                  ? ` (+${item.products.length - 1} more)`
                  : ''}
              </AppText>
            </View>

            <View style={Stylesheet.cls(theme, 'items-end pl-2')}>
              <AppText
                style={Stylesheet.cls(
                  theme,
                  'text-gray-400 dark:text-gray-500 text-[11px] mb-1',
                )}
              >
                Vessel
              </AppText>
              <AppText
                style={Stylesheet.cls(
                  theme,
                  'text-gray-900 dark:text-white text-[13px] font-bold',
                )}
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
      style={Stylesheet.cls(theme, 'flex-1 bg-[#f8f9fc] dark:bg-darkbg')}
      edges={['top']}
    >
      <AppHeader
        title=""
        style={Stylesheet.cls(
          theme,
          'bg-white dark:bg-[#12141c] border-b-0 px-4',
        )}
        leftAction={
          <View style={Stylesheet.cls(theme, 'flex-row items-center')}>
            <View
              style={Stylesheet.cls(
                theme,
                'w-8 h-8 rounded-full bg-[#1e293b] dark:bg-gray-800 justify-center items-center mr-2.5',
              )}
            >
              <Icon name="user" size={16} color="#38bdf8" />
            </View>
            <AppText
              style={Stylesheet.cls(
                theme,
                'text-[#4F46E5] dark:text-[#818cf8] font-bold text-lg',
              )}
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
            style={Stylesheet.cls(
              theme,
              'h-[38px] px-5 rounded-full bg-[#A855F7] shadow-none',
            )}
          />
        }
      />

      <View
        style={Stylesheet.cls(
          theme,
          'bg-white dark:bg-[#12141c] px-4 py-3 border-b-0',
        )}
      >
        <AppSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search by buyer, vessel or product..."
          style={Stylesheet.cls(
            theme,
            'bg-[#f8f9fc] dark:bg-darkcard border border-[#e5e7eb] dark:border-white/[0.05] rounded-[18px] h-[50px]',
          )}
        />
      </View>

      <View style={Stylesheet.cls(theme, 'bg-white dark:bg-[#12141c]')}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={Stylesheet.cls(theme, 'px-4 py-3 gap-6')}
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
        contentContainerStyle={Stylesheet.cls(theme, 'pt-4 pb-24')}
        ListEmptyComponent={
          <View style={Stylesheet.cls(theme, 'mt-8')}>
            <AppText
              variant="subtitle"
              style={Stylesheet.cls(theme, 'text-center text-sm text-gray-500')}
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
          style={Stylesheet.cls(theme, 'mt-4')}
        />
      </AppModal>
    </SafeAreaView>
  );
};
export default InquiriesScreen;
