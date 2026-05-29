import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { ScaledSheet } from 'react-native-size-matters';
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
      <SafeAreaView style={[styles.safeAreaView1, theme === 'dark' && styles.safeAreaView1Dark]}>
        <AppText variant="h2">Inquiry Not Found</AppText>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} style={styles.appButton4} />
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
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}>
      <AppHeader title="Deal Detail" showBack={true} />

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Main Details Card */}
        <AppCard variant="bordered" style={styles.appCard3}>
          <View style={styles.view13}>
            <AppText variant="h2" style={[styles.appText39, theme === 'dark' && styles.appText39Dark]}>
              {inquiry.inquiry_id}
            </AppText>
            <AppStatusBadge status={inquiry.status} />
          </View>

          <View style={{}}>
            <View>
              <AppText variant="captionSemibold" style={styles.appText38}>Buyer / Customer</AppText>
              <AppText variant="bodySemibold" style={[styles.appText37, theme === 'dark' && styles.appText37Dark]}>
                {inquiry.buyer_name} ({inquiry.buyer_email})
              </AppText>
            </View>

            <View style={styles.view12}>
              <View style={styles.view11}>
                <AppText variant="captionSemibold" style={styles.appText36}>Vessel</AppText>
                <AppText variant="bodySemibold" style={[styles.appText35, theme === 'dark' && styles.appText35Dark]}>
                  {inquiry.vessel_name || 'N/A'}
                </AppText>
              </View>

              <View style={styles.view10}>
                <AppText variant="captionSemibold" style={styles.appText34}>Ref Code</AppText>
                <AppText variant="bodySemibold" style={[styles.appText33, theme === 'dark' && styles.appText33Dark]}>
                  {inquiry.vessel_ref || 'N/A'}
                </AppText>
              </View>
            </View>

            <View>
              <AppText variant="captionSemibold" style={styles.appText32}>Received Date</AppText>
              <AppText variant="body" style={[styles.appText31, theme === 'dark' && styles.appText31Dark]}>
                {formatDateString(inquiry.date_received)}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Requirements Card */}
        <AppCard variant="glass" style={styles.appCard2}>
          <AppText variant="h3" style={styles.appText30}>
            Buyer Requirements
          </AppText>
          
          {inquiry.products.map((p, idx) => (
            <View key={idx} style={[styles.view9, theme === 'dark' && styles.view9Dark]}>
              <View style={styles.view8}>
                <AppText variant="bodySemibold" style={styles.appText29}>
                  {p.product_name}
                </AppText>
                <AppText variant="bodySemibold" style={[styles.appText28, theme === 'dark' && styles.appText28Dark]}>
                  {p.quantity} {p.unit}
                </AppText>
              </View>
              <AppText variant="caption" style={styles.appText27}>
                Specs: {p.specs || 'N/A'}
              </AppText>
            </View>
          ))}
        </AppCard>

        {/* Sourcing Cost Card */}
        {inquiry.seller_quote ? (
          <AppCard variant="glass" style={styles.appCard1}>
            <AppText variant="h3" style={styles.appText26}>
              Supplier Pricing Details
            </AppText>
            <AppText variant="captionSemibold" style={[styles.appText25, theme === 'dark' && styles.appText25Dark]}>
              Assigned Sourcing Partner: {inquiry.seller_quote.seller_name}
            </AppText>

            {inquiry.seller_quote.products.map((p, idx) => (
              <View key={idx} style={[styles.view7, theme === 'dark' && styles.view7Dark]}>
                <AppText variant="body" style={[styles.appText24, theme === 'dark' && styles.appText24Dark]}>
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
          <AppCard variant="glass" style={styles.appCard}>
            <AppText variant="h3" style={styles.appText23}>
              Margin Calculation Summary
            </AppText>
            <AppText variant="captionSemibold" style={[styles.appText22, theme === 'dark' && styles.appText22Dark]}>
              Calculations based on {inquiry.margin_percent}% margin & {inquiry.discount_percent}% discount
            </AppText>

            {inquiry.my_quote.products.map((p, idx) => (
              <View key={idx} style={[styles.view6, theme === 'dark' && styles.view6Dark]}>
                <AppText variant="bodySemibold" style={styles.appText21}>
                  {p.product_name}
                </AppText>
                <View style={styles.view5}>
                  <AppText variant="caption" style={styles.appText20}>
                    Sell Unit Price: {formatUSD(p.my_unit_price)}
                  </AppText>
                  <AppText variant="bodySemibold" style={[styles.appText19, theme === 'dark' && styles.appText19Dark]}>
                    Total: {formatUSD(p.total_price)}
                  </AppText>
                </View>
              </View>
            ))}
            
            <View style={styles.view4}>
              <AppText variant="bodySemibold" style={styles.appText18}>Total Final Quote</AppText>
              <AppText variant="h2" style={[styles.appText17, theme === 'dark' && styles.appText17Dark]}>
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
            style={styles.appButton3}
          />
        )}
      </ScrollView>

      {/* Stock Check / Select Supplier Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'STOCK_CHECK'}
        onClose={() => setActiveSheet('NONE')}
        title="Supplier Stock Check"
      >
        <AppText variant="body" style={styles.appText16}>
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
          style={styles.appButton2}
        />
      </AppBottomSheet>

      {/* Send RFQ Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'RFQ'}
        onClose={() => setActiveSheet('NONE')}
        title="Review & Dispatch RFQ"
      >
        <AppText variant="body" style={styles.appText15}>
          A Request for Quote will be sent to the sourcing supplier.
        </AppText>
        
        <View style={[styles.view3, theme === 'dark' && styles.view3Dark]}>
          <AppText variant="captionSemibold" style={styles.appText14}>To:</AppText>
          <AppText variant="bodySemibold" style={styles.appText13}>{inquiry.seller_quote?.seller_name} ({inquiry.seller_quote?.seller_email})</AppText>
          
          <AppText variant="captionSemibold" style={styles.appText12}>Subject:</AppText>
          <AppText variant="bodySemibold" style={styles.appText11}>RFQ Request - Inquiry #{inquiry.inquiry_id}</AppText>
          
          <AppText variant="captionSemibold" style={styles.appText10}>Items:</AppText>
          <AppText variant="body">{inquiry.products.map(p => `${p.product_name} x ${p.quantity}`).join(', ')}</AppText>
        </View>

        <AppButton
          title="Dispatch RFQ Email"
          onPress={handleRFQConfirm}
          style={styles.appButton1}
        />
      </AppBottomSheet>

      {/* Input Sourced Cost prices Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'QUOTE_COST'}
        onClose={() => setActiveSheet('NONE')}
        title="Input Supplier Cost Prices"
      >
        <AppText variant="body" style={styles.appText9}>
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
          style={styles.appButton}
        />
      </AppBottomSheet>

      {/* Team Lead Margin Config Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'TL_MARGIN'}
        onClose={() => setActiveSheet('NONE')}
        title="Adjust Deal Profit Margins"
      >
        <AppText variant="body" style={styles.appText8}>
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
          style={styles.style4}
        />
      </AppBottomSheet>

      {/* Admin Approval Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'ADMIN_APPROVE'}
        onClose={() => setActiveSheet('NONE')}
        title="Admin Pricing Review"
      >
        <AppText variant="body" style={styles.appText7}>
          Approve or reject the profit margins set by Sourcing.
        </AppText>
        
        <View style={[styles.view2, theme === 'dark' && styles.view2Dark]}>
          <AppText variant="captionSemibold" style={styles.appText6}>Total Sourced Cost:</AppText>
          <AppText variant="bodySemibold" style={styles.appText5}>
            {formatUSD(inquiry.seller_quote?.products.reduce((sum, p) => sum + (p.seller_unit_price * (inquiry.products[0]?.quantity || 1)), 0))}
          </AppText>
          
          <AppText variant="captionSemibold" style={styles.appText4}>Total Client Quote:</AppText>
          <AppText variant="bodySemibold" style={[styles.appText3, theme === 'dark' && styles.appText3Dark]}>
            {formatUSD(inquiry.my_quote?.products.reduce((sum, p) => sum + p.total_price, 0))}
          </AppText>
          
          <AppText variant="captionSemibold" style={styles.appText2}>Estimated Profit Yield:</AppText>
          <AppText variant="bodySemibold" style={styles.appText1}>
            {formatUSD(
              (inquiry.my_quote?.products.reduce((sum, p) => sum + p.total_price, 0) || 0) -
              (inquiry.seller_quote?.products.reduce((sum, p) => sum + (p.seller_unit_price * (inquiry.products[0]?.quantity || 1)), 0) || 0)
            )}
          </AppText>
        </View>

        <View style={styles.view1}>
          <AppButton
            title="Reject Quote"
            variant="danger"
            onPress={() => handleAdminApproveConfirm(false)}
            style={styles.style3}
          />
          <AppButton
            title="Approve margins"
            onPress={() => handleAdminApproveConfirm(true)}
            style={styles.style2}
          />
        </View>
      </AppBottomSheet>

      {/* Client Decision Bottom Sheet */}
      <AppBottomSheet
        visible={activeSheet === 'VERIFY_CLIENT_DECISION'}
        onClose={() => setActiveSheet('NONE')}
        title="Log Client Final Decision"
      >
        <AppText variant="body" style={styles.appText}>
          Select whether the client accepted or declined the quotation offer.
        </AppText>

        <View style={styles.view}>
          <AppButton
            title="Client Declined"
            variant="danger"
            onPress={() => handleClientDecisionConfirm(false)}
            style={styles.style1}
          />
          <AppButton
            title="Client Accepted"
            onPress={() => handleClientDecisionConfirm(true)}
            style={styles.style}
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

const styles = ScaledSheet.create({
  appButton: {
    marginTop: '16@ms',
  },
  appButton1: {
    marginTop: '16@ms',
  },
  appButton2: {
    marginTop: '16@ms',
  },
  appButton3: {
    marginTop: '16@ms',
    marginBottom: '32@ms',
  },
  appButton4: {
    marginTop: '16@ms',
  },
  appCard: {
    marginBottom: '16@ms',
    borderLeftWidth: 4,
  },
  appCard1: {
    marginBottom: '16@ms',
  },
  appCard2: {
    marginBottom: '16@ms',
  },
  appCard3: {
    marginBottom: '16@ms',
  },
  appText: {
    marginBottom: '16@ms',
  },
  appText1: {
    color: '#10b981',
  },
  appText10: {
    color: '#9ca3af',
  },
  appText11: {
    marginBottom: '8@ms',
  },
  appText12: {
    color: '#9ca3af',
  },
  appText13: {
    marginBottom: '8@ms',
  },
  appText14: {
    color: '#9ca3af',
  },
  appText15: {
    marginBottom: '16@ms',
  },
  appText16: {
    marginBottom: '16@ms',
  },
  appText17: {
    color: '#7c3aed',
    fontWeight: '800',
  },
  appText17Dark: {
    color: '#c084fc',
  },
  appText18: {
    fontWeight: 'bold',
  },
  appText19: {
    color: '#7c3aed',
  },
  appText19Dark: {
    color: '#c084fc',
  },
  appText2: {
    color: '#9ca3af',
  },
  appText20: {
    color: '#6b7280',
  },
  appText21: {
    color: '#1f2937',
  },
  appText22: {
    color: '#9ca3af',
    marginBottom: '12@ms',
  },
  appText22Dark: {
    color: '#6b7280',
  },
  appText23: {
    fontWeight: 'bold',
    marginBottom: '4@ms',
  },
  appText24: {
    flex: 1,
    marginRight: '8@ms',
    color: '#374151',
  },
  appText24Dark: {
    color: '#d1d5db',
  },
  appText25: {
    color: '#9ca3af',
    marginBottom: '12@ms',
  },
  appText25Dark: {
    color: '#6b7280',
  },
  appText26: {
    fontWeight: 'bold',
    marginBottom: '4@ms',
  },
  appText27: {
    marginTop: '4@ms',
    color: '#6b7280',
  },
  appText28: {
    color: '#7c3aed',
  },
  appText28Dark: {
    color: '#c084fc',
  },
  appText29: {
    flex: 1,
    paddingRight: '8@ms',
  },
  appText3: {
    color: '#7c3aed',
    marginBottom: '8@ms',
  },
  appText30: {
    fontWeight: 'bold',
    marginBottom: '12@ms',
  },
  appText31: {
    color: '#374151',
    marginTop: '2@ms',
  },
  appText31Dark: {
    color: '#d1d5db',
  },
  appText32: {
    color: '#9ca3af',
  },
  appText33: {
    color: '#1f2937',
    marginTop: '2@ms',
  },
  appText33Dark: {
    color: '#eef2f6',
  },
  appText34: {
    color: '#9ca3af',
  },
  appText35: {
    color: '#1f2937',
    marginTop: '2@ms',
  },
  appText35Dark: {
    color: '#eef2f6',
  },
  appText36: {
    color: '#9ca3af',
  },
  appText37: {
    color: '#1f2937',
    marginTop: '2@ms',
  },
  appText37Dark: {
    color: '#e5e7eb',
  },
  appText38: {
    color: '#9ca3af',
  },
  appText39: {
    fontFamily: 'monospace',
    color: '#7c3aed',
  },
  appText39Dark: {
    color: '#c084fc',
  },
  appText3Dark: {
    color: '#c084fc',
  },
  appText4: {
    color: '#9ca3af',
  },
  appText5: {
    marginBottom: '8@ms',
  },
  appText6: {
    color: '#9ca3af',
  },
  appText7: {
    marginBottom: '16@ms',
  },
  appText8: {
    marginBottom: '16@ms',
  },
  appText9: {
    marginBottom: '16@ms',
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
    paddingHorizontal: '16@ms',
    paddingVertical: '12@ms',
  },
  style: {
    width: '48%',
  },
  style1: {
    width: '48%',
  },
  style2: {
    width: '48%',
  },
  style3: {
    width: '48%',
  },
  style4: {
    marginTop: '16@ms',
  },
  view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  view1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  view10: {
    width: '48%',
  },
  view11: {
    width: '48%',
  },
  view12: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  view13: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@ms',
  },
  view2: {
    padding: '16@ms',
    backgroundColor: '#eef2f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: '12@ms',
    marginBottom: '16@ms',
  },
  view2Dark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view3: {
    padding: '16@ms',
    backgroundColor: '#eef2f6',
    borderRadius: '12@ms',
    marginBottom: '16@ms',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  view3Dark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view4: {
    marginTop: '16@ms',
    paddingTop: '12@ms',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  view5: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '6@ms',
  },
  view6: {
    paddingBottom: '12@ms',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  view6Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view7: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '8@ms',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  view7Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view8: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  view9: {
    paddingBottom: '12@ms',
    marginBottom: '12@ms',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  view9Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
});

export default InquiryDetailScreen;
