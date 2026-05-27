import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import Stylesheet from '../components/common/Stylesheet';

import { View, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppStatusBadge from '../components/common/AppStatusBadge';
import AppButton from '../components/common/AppButton';
import AppBottomSheet from '../components/modals/AppBottomSheet';
import AppAlert from '../components/modals/AppAlert';
import AppInput from '../components/inputs/AppInput';
import AppDropdown from '../components/inputs/AppDropdown';
import { formatDateString, formatUSD, calculateMargin } from '../utils/marginEngine';
import { RootStackParamList } from '../navigation/types';

type InquiryDetailScreenRouteProp = RouteProp<RootStackParamList, 'InquiryDetail'>;

export const InquiryDetailScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const route = useRoute<InquiryDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { inquiriesData, updateInquiryStatus, updateInquiry, suppliersData } = useAppStore();
  const { inquiryId } = route.params;

  const inquiry = useMemo(() => {
    return inquiriesData.find((inq) => inq.inquiry_id === inquiryId);
  }, [inquiriesData, inquiryId]);

  // Form overlay modal visible states
  const [activeSheet, setActiveSheet] = useState<'NONE' | 'STOCK_CHECK' | 'RFQ' | 'QUOTE_COST' | 'TL_MARGIN' | 'ADMIN_APPROVE' | 'VERIFY_CLIENT_DECISION'>('NONE');

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  // Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [costPriceInput, setCostPriceInput] = useState('100');
  const [marginInput, setMarginInput] = useState('15');
  const [discountInput, setDiscountInput] = useState('0');

  if (!inquiry) {
    return (
      <SafeAreaView style={Stylesheet.cls(theme, "flex-1 justify-center items-center bg-gray-50 dark:bg-darkbg")}>
        <AppText variant="h2">Inquiry Not Found</AppText>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} style={Stylesheet.cls(theme, "mt-4")} />
      </SafeAreaView>
    );
  }

  // Determine label and handler for the status-driven action button
  const getWorkflowActionButton = () => {
    switch (inquiry.status) {
      case 'PENDING':
        return {
          label: 'Run Stock Check',
          onPress: () => {
            setSelectedSupplierId(suppliersData[0]?.id || '');
            setActiveSheet('STOCK_CHECK');
          }
        };
      case 'RFQ_READY':
        return {
          label: 'Send RFQ to Supplier',
          onPress: () => setActiveSheet('RFQ')
        };
      case 'CLIENT_QUOTING':
        return {
          label: 'Input Sourced Cost Prices',
          onPress: () => {
            setCostPriceInput('500');
            setActiveSheet('QUOTE_COST');
          }
        };
      case 'TL_REVIEW':
        return {
          label: 'Set Custom Profit Margins',
          onPress: () => {
            setMarginInput(inquiry.margin_percent.toString());
            setDiscountInput(inquiry.discount_percent.toString());
            setActiveSheet('TL_MARGIN');
          }
        };
      case 'ADMIN_APPROVAL':
        return {
          label: 'Verify & Approve Margin Override',
          onPress: () => setActiveSheet('ADMIN_APPROVE')
        };
      case 'EMPLOYEE_VERIFY':
        return {
          label: 'Send Quotation to Buyer',
          onPress: () => {
            // Automatically advance to client final review stage
            updateInquiryStatus(inquiry.inquiry_id, 'CLIENT_FINAL_APPROVAL');
            showAlert('Quotation Sent', 'Quotation sent to buyer. Awaiting client decision.');
          }
        };
      case 'CLIENT_FINAL_APPROVAL':
        return {
          label: 'Process Client Response',
          onPress: () => setActiveSheet('VERIFY_CLIENT_DECISION')
        };
      case 'QUOTE_SENT':
        return {
          label: 'Confirm Order & Deploy Supply Logistics',
          onPress: () => {
            updateInquiryStatus(inquiry.inquiry_id, 'CONFIRMED');
            showAlert('Deal Confirmed!', 'This order has been verified and sent to the Supply & Logistics division.');
          }
        };
      case 'CONFIRMED':
      case 'CLOSED':
      default:
        return null;
    }
  };

  const actionButton = getWorkflowActionButton();

  // Workflow Handlers
  const handleStockConfirm = () => {
    const supplier = suppliersData.find(s => s.id === selectedSupplierId);
    if (!supplier) return;
    
    const updatedInq = {
      ...inquiry,
      status: 'RFQ_READY',
      seller_quote: {
        seller_name: supplier.name,
        seller_email: supplier.email,
        date_received: '',
        products: inquiry.products.map(p => ({
          product_name: p.product_name,
          seller_unit_price: 0,
          moq: 1,
          lead_time: '3 Days'
        }))
      }
    };
    
    updateInquiry(updatedInq);
    updateInquiryStatus(inquiry.inquiry_id, 'RFQ_READY');
    setActiveSheet('NONE');
  };

  const handleRFQConfirm = () => {
    updateInquiryStatus(inquiry.inquiry_id, 'CLIENT_QUOTING');
    setActiveSheet('NONE');
    showAlert('RFQ Dispatched', `RFQ email sent to ${inquiry.seller_quote?.seller_name}`);
  };

  const handleCostConfirm = () => {
    const cost = parseFloat(costPriceInput) || 0;
    if (!inquiry.seller_quote) return;
    
    const updatedInq = {
      ...inquiry,
      status: 'TL_REVIEW',
      seller_quote: {
        ...inquiry.seller_quote,
        date_received: new Date().toISOString(),
        products: inquiry.seller_quote.products.map(p => ({
          ...p,
          seller_unit_price: cost
        }))
      }
    };

    updateInquiry(updatedInq);
    updateInquiryStatus(inquiry.inquiry_id, 'TL_REVIEW');
    setActiveSheet('NONE');
  };

  const handleMarginConfirm = () => {
    const mPct = parseFloat(marginInput) || 0;
    const dPct = parseFloat(discountInput) || 0;
    
    if (!inquiry.seller_quote) return;

    // Use Margin Engine
    const calculated = calculateMargin(
      inquiry.seller_quote.products.map(p => ({
        product_name: p.product_name,
        seller_unit_price: p.seller_unit_price,
        quantity: inquiry.products[0]?.quantity || 1
      })),
      { default_margin_percent: mPct }
    );

    const updatedInq = {
      ...inquiry,
      status: 'ADMIN_APPROVAL',
      margin_percent: mPct,
      discount_percent: dPct,
      my_quote: {
        products: calculated.products.map(p => ({
          product_name: p.product_name,
          my_unit_price: p.my_unit_price,
          margin_percent: p.applied_margin_percent,
          total_price: p.total_my_price
        }))
      }
    };

    updateInquiry(updatedInq);
    updateInquiryStatus(inquiry.inquiry_id, 'ADMIN_APPROVAL');
    setActiveSheet('NONE');
  };

  const handleAdminApproveConfirm = (approve: boolean) => {
    if (approve) {
      updateInquiryStatus(inquiry.inquiry_id, 'EMPLOYEE_VERIFY');
      showAlert('Approved', 'Margins and prices have been verified by Admin.');
    } else {
      updateInquiryStatus(inquiry.inquiry_id, 'TL_REVIEW');
      showAlert('Rejected', 'Sent back to Team Lead for margin adjustment.');
    }
    setActiveSheet('NONE');
  };

  const handleClientDecisionConfirm = (accept: boolean) => {
    if (accept) {
      updateInquiryStatus(inquiry.inquiry_id, 'QUOTE_SENT');
      showAlert('Accepted', 'Quotation approved by buyer. Move to logistics confirmation.');
    } else {
      updateInquiryStatus(inquiry.inquiry_id, 'CLOSED');
      showAlert('Rejected', 'Deal rejected and closed.');
    }
    setActiveSheet('NONE');
  };

  return (
    <SafeAreaView style={Stylesheet.cls(theme, "flex-1 bg-gray-50 dark:bg-darkbg")}>
      <AppHeader title="Deal Detail" showBack={true} />

      <ScrollView style={Stylesheet.cls(theme, "flex-1 px-4 py-3")} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Main Details Card */}
        <AppCard variant="bordered" style={Stylesheet.cls(theme, "mb-4")}>
          <View style={Stylesheet.cls(theme, "flex-row justify-between items-center mb-3")}>
            <AppText variant="h2" style={Stylesheet.cls(theme, "font-mono text-purple-600 dark:text-purple-400")}>
              {inquiry.inquiry_id}
            </AppText>
            <AppStatusBadge status={inquiry.status} />
          </View>

          <View style={Stylesheet.cls(theme, "space-y-2.5")}>
            <View>
              <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Buyer / Customer</AppText>
              <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-gray-800 dark:text-gray-200 mt-0.5")}>
                {inquiry.buyer_name} ({inquiry.buyer_email})
              </AppText>
            </View>

            <View style={Stylesheet.cls(theme, "flex-row justify-between")}>
              <View style={Stylesheet.cls(theme, "w-[48%]")}>
                <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Vessel</AppText>
                <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-gray-850 dark:text-gray-150 mt-0.5")}>
                  {inquiry.vessel_name || 'N/A'}
                </AppText>
              </View>

              <View style={Stylesheet.cls(theme, "w-[48%]")}>
                <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Ref Code</AppText>
                <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-gray-850 dark:text-gray-150 mt-0.5")}>
                  {inquiry.vessel_ref || 'N/A'}
                </AppText>
              </View>
            </View>

            <View>
              <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Received Date</AppText>
              <AppText variant="body" style={Stylesheet.cls(theme, "text-gray-700 dark:text-gray-300 mt-0.5")}>
                {formatDateString(inquiry.date_received)}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Requirements Card */}
        <AppCard variant="glass" style={Stylesheet.cls(theme, "mb-4")}>
          <AppText variant="h3" style={Stylesheet.cls(theme, "font-bold mb-3")}>
            Buyer Requirements
          </AppText>
          
          {inquiry.products.map((p, idx) => (
            <View key={idx} style={Stylesheet.cls(theme, "pb-3 mb-3 border-b border-gray-100 dark:border-white/[0.04] last:border-0 last:pb-0 last:mb-0")}>
              <View style={Stylesheet.cls(theme, "flex-row justify-between")}>
                <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "flex-1 pr-2")}>
                  {p.product_name}
                </AppText>
                <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-purple-600 dark:text-purple-400")}>
                  {p.quantity} {p.unit}
                </AppText>
              </View>
              <AppText variant="caption" style={Stylesheet.cls(theme, "mt-1 text-gray-500 dark:text-gray-405")}>
                Specs: {p.specs || 'N/A'}
              </AppText>
            </View>
          ))}
        </AppCard>

        {/* Sourcing Cost Card */}
        {inquiry.seller_quote ? (
          <AppCard variant="glass" style={Stylesheet.cls(theme, "mb-4")}>
            <AppText variant="h3" style={Stylesheet.cls(theme, "font-bold mb-1")}>
              Supplier Pricing Details
            </AppText>
            <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400 dark:text-gray-500 mb-3")}>
              Assigned Sourcing Partner: {inquiry.seller_quote.seller_name}
            </AppText>

            {inquiry.seller_quote.products.map((p, idx) => (
              <View key={idx} style={Stylesheet.cls(theme, "flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-white/[0.04] last:border-0")}>
                <AppText variant="body" style={Stylesheet.cls(theme, "flex-1 mr-2 text-gray-700 dark:text-gray-300")}>
                  {p.product_name}
                </AppText>
                <AppText variant="bodySemibold">
                  Cost: {p.seller_unit_price > 0 ? formatUSD(p.seller_unit_price) : 'Awaiting RFQ Reply'}
                </AppText>
              </View>
            ))}
          </AppCard>
        ) : null}

        {/* Quote Calculation Card */}
        {inquiry.my_quote ? (
          <AppCard variant="glass" style={Stylesheet.cls(theme, "mb-4 border-l-4 border-l-purple-500")}>
            <AppText variant="h3" style={Stylesheet.cls(theme, "font-bold mb-1")}>
              Margin Calculation Summary
            </AppText>
            <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400 dark:text-gray-500 mb-3")}>
              Calculations based on {inquiry.margin_percent}% margin & {inquiry.discount_percent}% discount
            </AppText>

            {inquiry.my_quote.products.map((p, idx) => (
              <View key={idx} style={Stylesheet.cls(theme, "pb-3 border-b border-gray-100 dark:border-white/[0.04] last:border-0 last:pb-0")}>
                <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-gray-800 dark:text-gray-250")}>
                  {p.product_name}
                </AppText>
                <View style={Stylesheet.cls(theme, "flex-row justify-between mt-1.5")}>
                  <AppText variant="caption" style={Stylesheet.cls(theme, "text-gray-500")}>
                    Sell Unit Price: {formatUSD(p.my_unit_price)}
                  </AppText>
                  <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-purple-600 dark:text-purple-400")}>
                    Total: {formatUSD(p.total_price)}
                  </AppText>
                </View>
              </View>
            ))}
            
            <View style={Stylesheet.cls(theme, "mt-4 pt-3 border-t border-purple-500/20 flex-row justify-between items-center")}>
              <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "font-bold")}>Total Final Quote</AppText>
              <AppText variant="h2" style={Stylesheet.cls(theme, "text-purple-600 dark:text-purple-400 font-extrabold")}>
                {formatUSD(inquiry.my_quote.products.reduce((sum, p) => sum + p.total_price, 0))}
              </AppText>
            </View>
          </AppCard>
        ) : null}

        {/* Action button */}
        {actionButton && (
          <AppButton
            title={actionButton.label}
            onPress={actionButton.onPress}
            style={Stylesheet.cls(theme, "mt-4 mb-8")}
          />
        )}
      </ScrollView>

      {/* Stock Check / Select Supplier Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'STOCK_CHECK'}
        onClose={() => setActiveSheet('NONE')}
        title="Supplier Stock Check"
      >
        <AppText variant="body" style={Stylesheet.cls(theme, "mb-4")}>
          Select potential suppliers to check stock availability for requirements.
        </AppText>
        
        <AppDropdown
          label="Sourcing Supplier"
          value={selectedSupplierId}
          onSelect={(val) => setSelectedSupplierId(val.toString())}
          options={suppliersData.map(s => ({ value: s.id, label: s.name }))}
        />

        <AppButton
          title="Confirm Supplier & Move to RFQ"
          onPress={handleStockConfirm}
          style={Stylesheet.cls(theme, "mt-4")}
        />
      </AppBottomSheet>

      {/* Send RFQ Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'RFQ'}
        onClose={() => setActiveSheet('NONE')}
        title="Review & Dispatch RFQ"
      >
        <AppText variant="body" style={Stylesheet.cls(theme, "mb-4")}>
          A Request for Quote will be sent to the sourcing supplier.
        </AppText>
        
        <View style={Stylesheet.cls(theme, "p-4 bg-gray-150 dark:bg-white/[0.02] rounded-xl mb-4 border border-gray-200 dark:border-white/[0.04]")}>
          <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>To:</AppText>
          <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mb-2")}>{inquiry.seller_quote?.seller_name} ({inquiry.seller_quote?.seller_email})</AppText>
          
          <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Subject:</AppText>
          <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mb-2")}>RFQ Request - Inquiry #{inquiry.inquiry_id}</AppText>
          
          <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Items:</AppText>
          <AppText variant="body">{inquiry.products.map(p => `${p.product_name} x ${p.quantity}`).join(', ')}</AppText>
        </View>

        <AppButton
          title="Dispatch RFQ Email"
          onPress={handleRFQConfirm}
          style={Stylesheet.cls(theme, "mt-4")}
        />
      </AppBottomSheet>

      {/* Input Sourced Cost prices Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'QUOTE_COST'}
        onClose={() => setActiveSheet('NONE')}
        title="Input Supplier Cost Prices"
      >
        <AppText variant="body" style={Stylesheet.cls(theme, "mb-4")}>
          Enter the cost price per unit quoted by the supplier.
        </AppText>
        
        <AppInput
          label="Unit Cost Price (USD)"
          keyboardType="numeric"
          value={costPriceInput}
          onChangeText={setCostPriceInput}
        />

        <AppButton
          title="Save Cost & Request TL Review"
          onPress={handleCostConfirm}
          style={Stylesheet.cls(theme, "mt-4")}
        />
      </AppBottomSheet>

      {/* Team Lead Margin Config Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'TL_MARGIN'}
        onClose={() => setActiveSheet('NONE')}
        title="Adjust Deal Profit Margins"
      >
        <AppText variant="body" style={Stylesheet.cls(theme, "mb-4")}>
          Apply markup margins and bulk discounts. Margin engine calculations will automatically apply.
        </AppText>
        
        <AppInput
          label="Profit Margin Markup (%)"
          keyboardType="numeric"
          value={marginInput}
          onChangeText={setMarginInput}
        />

        <AppInput
          label="Client Bulk Discount (%)"
          keyboardType="numeric"
          value={discountInput}
          onChangeText={setDiscountInput}
        />

        <AppButton
          title="Compute Quote & Send for Admin Approval"
          onPress={handleMarginConfirm}
          style={Stylesheet.cls(theme, "mt-4")}
        />
      </AppBottomSheet>

      {/* Admin Approval Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'ADMIN_APPROVE'}
        onClose={() => setActiveSheet('NONE')}
        title="Admin Pricing Review"
      >
        <AppText variant="body" style={Stylesheet.cls(theme, "mb-4")}>
          Approve or reject the profit margins set by Sourcing.
        </AppText>
        
        <View style={Stylesheet.cls(theme, "p-4 bg-gray-150 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.04] rounded-xl mb-4")}>
          <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Total Sourced Cost:</AppText>
          <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mb-2")}>
            {formatUSD(inquiry.seller_quote?.products.reduce((sum, p) => sum + (p.seller_unit_price * (inquiry.products[0]?.quantity || 1)), 0))}
          </AppText>
          
          <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Total Client Quote:</AppText>
          <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-purple-600 dark:text-purple-400 mb-2")}>
            {formatUSD(inquiry.my_quote?.products.reduce((sum, p) => sum + p.total_price, 0))}
          </AppText>
          
          <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Estimated Profit Yield:</AppText>
          <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-emerald-500")}>
            {formatUSD(
              (inquiry.my_quote?.products.reduce((sum, p) => sum + p.total_price, 0) || 0) -
              (inquiry.seller_quote?.products.reduce((sum, p) => sum + (p.seller_unit_price * (inquiry.products[0]?.quantity || 1)), 0) || 0)
            )}
          </AppText>
        </View>

        <View style={Stylesheet.cls(theme, "flex-row justify-between")}>
          <AppButton
            title="Reject Quote"
            variant="danger"
            onPress={() => handleAdminApproveConfirm(false)}
            style={Stylesheet.cls(theme, "w-[48%]")}
          />
          <AppButton
            title="Approve margins"
            onPress={() => handleAdminApproveConfirm(true)}
            style={Stylesheet.cls(theme, "w-[48%]")}
          />
        </View>
      </AppBottomSheet>

      {/* Client Decision Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'VERIFY_CLIENT_DECISION'}
        onClose={() => setActiveSheet('NONE')}
        title="Log Client Final Decision"
      >
        <AppText variant="body" style={Stylesheet.cls(theme, "mb-4")}>
          Select whether the client accepted or declined the quotation offer.
        </AppText>

        <View style={Stylesheet.cls(theme, "flex-row justify-between")}>
          <AppButton
            title="Client Declined"
            variant="danger"
            onPress={() => handleClientDecisionConfirm(false)}
            style={Stylesheet.cls(theme, "w-[48%]")}
          />
          <AppButton
            title="Client Accepted"
            onPress={() => handleClientDecisionConfirm(true)}
            style={Stylesheet.cls(theme, "w-[48%]")}
          />
        </View>
      </AppBottomSheet>

      <AppAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  );
};
export default InquiryDetailScreen;
