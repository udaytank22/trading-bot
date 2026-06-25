import { TOAST_MESSAGES } from '../../constants/toastMessages';
import { InquiryDetailsPageSchema1, InquiryDetailsPageSchema2, InquiryDetailsPageSchema3 } from '@config/tableSchemas';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData, useAuth } from '@context';
import { api } from '@services/api';
import { calculateMargin, formatINR } from '@services/marginEngine';
import { CONFIG } from '@/config.js';
import { StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';
import Swal from 'sweetalert2';
import { fetchInventory } from '../../api/inventory';

// Import action step views
import StockCheckModal from './modals/StockCheckModal';
import RFQModal from './modals/RFQModal';
import QuoteModal from './modals/QuoteModal';
import VerificationModal from './modals/VerificationModal';
import AdminApprovalModal from './modals/AdminApprovalModal';
import MultiEmailPreviewModal from './modals/MultiEmailPreviewModal';
import EmailPreviewModal from './modals/EmailPreviewModal';

export default function InquiryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { inquiriesData, refreshAll } = useData();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'action'
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);
  const [localMyQuote, setLocalMyQuote] = useState(null);
  const [narrative, setNarrative] = useState('');

  // RFQ state
  const [pendingRFQs, setPendingRFQs] = useState([]);
  const [isMultiEmailModalOpen, setIsMultiEmailModalOpen] = useState(false);
  const [expandedQuotes, setExpandedQuotes] = useState({});
  const [pendingSelections, setPendingSelections] = useState({});
  const [isConfirmingSource, setIsConfirmingSource] = useState(false);
  const [isEmailPreviewModalOpen, setIsEmailPreviewModalOpen] = useState(false);

  const [inventoryData, setInventoryData] = useState([]);

  useEffect(() => {
    fetchInventory().then(res => setInventoryData(res.data || res)).catch(console.error);
  }, []);

  const toggleQuoteExpand = (quoteId) => {
    setExpandedQuotes(prev => ({ ...prev, [quoteId]: !prev[quoteId] }));
  };

  // Pre-fill pending selections from already-selected items in deal data
  const initPendingFromDeal = (dealData) => {
    if (!dealData?.supplierQuotes) return;
    const init = {};
    for (const quote of dealData.supplierQuotes) {
      for (const item of (quote.items || [])) {
        if (item.isSelected) {
          init[item.inquiryItemId] = {
            quoteItemId: item.id,
            supplierName: quote.supplier?.name || 'Unknown',
            quoteId: quote.id
          };
        }
      }
    }
    setPendingSelections(init);
  };

  useEffect(() => {
    const found = inquiriesData.find(inq => inq.id === id || inq.inquiry_id === id);
    if (found) {
      setDeal(found);
      setLocalMyQuote(found.my_quote || null);
      setNarrative('');
      // Initialise pending selections from existing isSelected flags
      initPendingFromDeal(found);
    } else {
      setLoading(true);
      api.inquiries.getInquiry(id).then(res => {
        if (res.success && res.data) {
          setDeal(res.data);
          setLocalMyQuote(res.data.my_quote || null);
          setNarrative('');
          initPendingFromDeal(res.data);
        }
      }).catch(err => {
        console.error('Failed to fetch inquiry:', err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [id, inquiriesData]);

  // Set default tab if passed in location.state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const confirmAction = async (title, text = "This process cannot be reverted.") => {
    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, proceed",
      cancelButtonText: "Cancel",
      background: "#1a1d23",
      color: "#fff"
    });
    return result.isConfirmed;
  };

  const handleStockConfirm = async (selectedSuppliers) => {
    const confirmed = await confirmAction(
      "Confirm Stock Check",
      "Are you sure you want to proceed with this stock check? This process cannot be reverted."
    );
    if (!confirmed) return;
    try {
      // Filter out internal inventory pseudo-IDs (e.g. 'INTERNAL_INV_1003') — they are not real DB supplier records
      const supplierIds = selectedSuppliers
        .map(s => s.id)
        .filter(id => typeof id === 'number' || (typeof id === 'string' && !String(id).startsWith('INTERNAL_INV_')));
      const res = await api.inquiries.stockCheck(deal.id, supplierIds);
      if (res.success) {
        refreshAll();
        setActiveTab("overview");
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', ...TOAST_MESSAGES.INQUIRIES.STOCK_CHECK, background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to record stock check.', background: '#1a1d23', color: '#fff' });
    }
  };

  const handleVerifyConfirm = async () => {
    setIsEmailPreviewModalOpen(true);
    setActiveTab("overview");
  };

  const handleAdminConfirm = async (adjustedData) => {
    const confirmed = await confirmAction(
      "Confirm Admin Approval",
      "Are you sure you want to approve this pricing layout? This process cannot be reverted."
    );
    if (!confirmed) return;
    try {
      const marginVal = parseFloat(adjustedData.margin_percent) || 0;
      const discountVal = parseFloat(adjustedData.discount_percent) || 0;
      const totalAmount = adjustedData.products.reduce((sum, p) => sum + (p.total_price || 0), 0);
      const finalAmount = totalAmount * 1.18; // 18% tax

      const items = adjustedData.products.map(p => {
        const origItem = deal.items?.find(item => item.description === p.product_name) || {};
        return {
          inquiryItemId: origItem.id || p.inquiryItemId,
          sellingPrice: p.my_unit_price,
          quantity: p.quantity,
          totalPrice: p.total_price
        };
      });

      const res = await api.inquiries.adminApprove(deal.id, {
        approved: true,
        remarks: "Approved by Admin",
        overrideQuote: {
          marginPercentage: marginVal,
          discountPercentage: discountVal,
          totalAmount,
          finalAmount,
          items
        }
      });
      if (res.success) {
        refreshAll();
        setActiveTab("overview");
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', ...TOAST_MESSAGES.INQUIRIES.QUOTE_APPROVED, background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to record Admin approval.', background: '#1a1d23', color: '#fff' });
    }
  };

  const handleQuoteSubmit = async (quoteData) => {
    try {
      if (deal.status === "CLIENT_QUOTING") {
        const confirmed = await confirmAction(
          "Submit Client Quote",
          "Are you sure you want to submit these prices? This process cannot be reverted."
        );
        if (!confirmed) return;

        const items = quoteData.products.map(p => {
          const origItem = deal.items?.find(item => item.description === p.product_name) || {};
          const unitPrice = parseFloat(p.my_unit_price) || 0;
          const qty = parseInt(p.quantity, 10) || 1;
          return {
            inquiryItemId: origItem.id,
            sellingPrice: unitPrice,
            quantity: qty,
            totalPrice: unitPrice * qty
          };
        });
        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

        const res = await api.inquiries.clientQuote(deal.id, {
          marginPercentage: 0,
          taxPercentage: 18,
          totalAmount,
          finalAmount: totalAmount * 1.18,
          items
        });

        if (res.success) {
          refreshAll();
          setActiveTab("overview");
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', ...TOAST_MESSAGES.INQUIRIES.QUOTE_SUBMITTED_TL, background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
        }
      } else if (deal.status === "TL_REVIEW") {
        const confirmed = await confirmAction(
          "Submit Team Lead Review",
          "Are you sure you want to approve this margin structure? This process cannot be reverted."
        );
        if (!confirmed) return;

        const marginVal = parseFloat(quoteData.margin) || 0;
        const discountVal = parseFloat(quoteData.discount) || 0;

        let totalAmount = 0;
        const items = deal.products.map((p, idx) => {
          let cost = 0;
          if (deal.seller_quote?.products?.[idx]) {
            cost = deal.seller_quote.products[idx].seller_unit_price || 0;
          } else if (deal.my_quote?.products?.[idx]) {
            cost = deal.my_quote.products[idx].my_unit_price || 0;
          }
          
          const qty = p.quantity || 1;
          const my_unit_price = cost * (1 + marginVal / 100) * (1 - discountVal / 100);
          const totalPrice = my_unit_price * qty;
          totalAmount += totalPrice;

          const origItem = deal.items?.find(item => item.description === p.product_name) || {};

          return {
            inquiryItemId: origItem.id,
            sellingPrice: my_unit_price,
            quantity: qty,
            totalPrice
          };
        });

        const finalAmount = totalAmount * 1.18; // 18% tax

        const res = await api.inquiries.teamLeadApprove(deal.id, {
          approved: true,
          remarks: quoteData.narrative || "Approved by Team Lead",
          overrideQuote: {
            marginPercentage: marginVal,
            discountPercentage: discountVal,
            totalAmount,
            finalAmount,
            items
          }
        });
        if (res.success) {
          refreshAll();
          setActiveTab("overview");
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', ...TOAST_MESSAGES.INQUIRIES.MARGIN_APPROVED, background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to submit quote.', background: '#1a1d23', color: '#fff' });
    }
  };

  const handleRFQSubmit = (stagedRFQs) => {
    if (stagedRFQs.length > 0) {
      setPendingRFQs(stagedRFQs);
      setIsMultiEmailModalOpen(true);
    }
  };

  const handleMultiEmailClose = () => {
    setIsMultiEmailModalOpen(false);
    refreshAll();
    setActiveTab("overview");
  };

  const triggerClientDecision = () => {
    Swal.fire({
      title: "Final Quotation Decision",
      text: `Do you want to accept the quotation for ${deal.inquiry_id}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Accept Quote",
      cancelButtonText: "Reject Quote",
      background: "#1a1d23",
      color: "#fff",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await api.inquiries.clientDecision(deal.id, true);
        if (res.success) {
          refreshAll();
          setActiveTab("overview");
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', ...TOAST_MESSAGES.INQUIRIES.DEAL_ACCEPTED, background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        const res = await api.inquiries.clientDecision(deal.id, false);
        if (res.success) {
          refreshAll();
          setActiveTab("overview");
          Swal.fire({ icon: 'warning', title: 'Rejected', text: 'Deal rejected and closed.', background: '#1a1d23', color: '#fff' });
        }
      }
    });
  };

  const triggerConfirmDeal = async () => {
    const confirmed = await confirmAction(
      "Confirm Deal",
      "Are you sure you want to confirm this deal and move it to Supply? This process cannot be reverted."
    );
    if (!confirmed) return;
    try {
      const res = await api.inquiries.confirmDeal(deal.id);
      if (res.success) {
        refreshAll();
        setActiveTab("overview");
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', ...TOAST_MESSAGES.INQUIRIES.DEAL_CONFIRMED, background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to confirm deal.', background: '#1a1d23', color: '#fff' });
    }
  };

  const handleCloseRFQ = async () => {
    const confirmed = await confirmAction(
      "Close RFQ",
      "Are you sure you want to close the RFQ? This will stop suppliers from submitting new quotes and transition the status to Team Lead Review."
    );
    if (!confirmed) return;
    try {
      const res = await api.inquiries.closeRFQ(deal.id);
      if (res.success) {
        refreshAll();
        setActiveTab("overview");
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', ...TOAST_MESSAGES.INQUIRIES.RFQ_CLOSED, background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to close RFQ.', background: '#1a1d23', color: '#fff' });
    }
  };

  // Checkbox toggle for per-product supplier selection (local draft state)
  const handleCheckboxToggle = async (item, quote) => {
    const inquiryItemId = item.inquiryItemId;
    const supplierName = quote.supplier?.name || 'Unknown';
    const existing = pendingSelections[inquiryItemId];

    // Uncheck if already this item is checked
    if (existing && existing.quoteItemId === item.id) {
      setPendingSelections(prev => {
        const next = { ...prev };
        delete next[inquiryItemId];
        return next;
      });
      return;
    }

    // Already selected from a DIFFERENT supplier — warn
    if (existing && existing.quoteItemId !== item.id) {
      const productName = deal.items?.find(ii => ii.id === inquiryItemId)?.description || 'this product';
      const ok = await Swal.fire({
        icon: 'warning',
        title: 'Product already selected',
        html: `<b>${productName}</b> is already assigned to <b>${existing.supplierName}</b>.<br/><small style="color:#aaa">Switch sourcing to <b>${supplierName}</b>?</small>`,
        showCancelButton: true,
        confirmButtonText: 'Switch supplier',
        cancelButtonText: 'Keep existing',
        background: '#1a1d23',
        color: '#fff',
        confirmButtonColor: '#7c3aed',
        cancelButtonColor: '#64748b'
      });
      if (!ok.isConfirmed) return;
    }

    setPendingSelections(prev => ({
      ...prev,
      [inquiryItemId]: { quoteItemId: item.id, supplierName, quoteId: quote.id }
    }));
  };

  // Confirm all pending checkbox selections → send to backend
  const handleConfirmSourcing = async () => {
    const selections = Object.values(pendingSelections).map(s => ({ quoteItemId: s.quoteItemId }));
    if (selections.length === 0) {
      Swal.fire({ icon: 'info', title: 'No selections', text: 'Please select at least one product to source.', background: '#1a1d23', color: '#fff' });
      return;
    }
    const ok = await Swal.fire({
      icon: 'question',
      title: `Confirm ${selections.length} sourcing selection${selections.length !== 1 ? 's' : ''}?`,
      text: 'This will update the client quotation draft with the chosen supplier prices.',
      showCancelButton: true,
      confirmButtonText: 'Confirm Sourcing',
      background: '#1a1d23',
      color: '#fff',
      confirmButtonColor: '#7c3aed'
    });
    if (!ok.isConfirmed) return;
    setIsConfirmingSource(true);
    try {
      const res = await api.inquiries.selectSupplierQuoteItems(deal.id, selections);
      if (res.success) {
        setDeal(res.data);
        initPendingFromDeal(res.data);
        // Collapse all expanded quote cards and switch to Review Margin tab
        setExpandedQuotes({});
        setActiveTab('action');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', ...TOAST_MESSAGES.INQUIRIES.SOURCING_CONFIRMED, background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 2000 });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to confirm sourcing selections.', background: '#1a1d23', color: '#fff' });
    } finally {
      setIsConfirmingSource(false);
    }
  };

  const isRoleAllowed = (status, roleName) => {
    const rNameLower = roleName?.toLowerCase();
    if (rNameLower === "admin" || rNameLower === "super admin" || rNameLower === "administrator") return true;
    if (rNameLower === "viewer") return false;

    switch (status) {
      case "PENDING":
      case "RFQ_READY":
      case "RFQ_SENT":
      case "EMPLOYEE_VERIFY":
      case "QUOTE_SENT":
        return rNameLower === "employee" || rNameLower === "team lead";
      case "TL_REVIEW":
        return rNameLower === "team lead";
      case "CLIENT_QUOTING":
      case "CLIENT_FINAL_APPROVAL":
        return rNameLower === "client";
      case "ADMIN_APPROVAL":
        return false;
      default:
        return false;
    }
  };

  const canPerformAction = useMemo(() => {
    if (!deal || !currentUser) return false;
    return isRoleAllowed(deal.status, currentUser.role);
  }, [deal, currentUser]);

  const actionConfig = useMemo(() => {
    if (!deal) return null;
    const map = {
      PENDING: { label: "Check Stock", tabLabel: "Stock Check" },
      RFQ_READY: { label: "Create RFQ", tabLabel: "Prepare RFQ" },
      RFQ_SENT: { label: "Close RFQ", tabLabel: "Close RFQ" },
      CLIENT_QUOTING: { label: "Quote Prices", tabLabel: "Build Quote" },
      TL_REVIEW: { label: "Set Margin", tabLabel: "Review Margin" },
      ADMIN_APPROVAL: { label: "Approve pricing", tabLabel: "Admin Approval" },
      EMPLOYEE_VERIFY: { label: "Verify & Quote", tabLabel: "Final Verification" },
      CLIENT_FINAL_APPROVAL: { label: "Final Decision", tabLabel: "Client Decision" },
      QUOTE_SENT: { label: "Confirm Deal", tabLabel: "Confirm Deal" },
    };
    return map[deal.status] || null;
  }, [deal]);

  const getProductSuppliers = (p) => {
    if (!deal || !deal.suppliers) return [];
    const productCategory = p.category || 'General';
    return deal.suppliers.map(s => s.supplier || s).filter(s =>
      (s.categories || []).some(cat => cat.toLowerCase() === (productCategory || "").toLowerCase())
    );
  };

  const requestTableColumns = useMemo(() => {
    if (deal?.suppliers && deal.suppliers.length > 0) {
      return [
        { key: 'srno', label: 'Sr. No.' },
        { key: "product", label: "Product Name" },
        { key: "category", label: "Category" },
        { key: "qty", label: "Qty" },
        { key: "unit", label: "Unit" },
        { key: "suppliers", label: "Assigned Vendors" }
      ];
    }
    return InquiryDetailsPageSchema1;
  }, [deal]);

  const handleCalculateQuote = () => {
    if (!deal || !deal.seller_quote) return;
    const settings = { default_margin_percent: CONFIG.defaultMargin || 50 };
    const calculated = calculateMargin(deal.seller_quote.products, settings);
    setLocalMyQuote(calculated);
  };

  if (loading || !deal) {
    return (
      <div className="flex flex-col w-full h-full p-8 animate-pulse gap-6">
        <div className="flex items-center justify-between h-10">
          <div className="w-1/3 bg-gray-255 dark:bg-[#242830] rounded-lg h-full opacity-40" />
          <div className="w-32 bg-gray-255 dark:bg-[#242830] rounded-lg h-full opacity-40" />
        </div>
        <div className="h-40 bg-gray-255 dark:bg-[#1a1d23] border border-gray-300 dark:border-[#2a2d33] rounded-xl opacity-40" />
        <div className="flex-1 w-full bg-gray-255 dark:bg-[#1a1d23] border border-gray-350 dark:border-[#2a2d33] rounded-xl opacity-40" />
      </div>
    );
  }

  const steps = [
    { id: "PENDING", label: "Created" },
    { id: "RFQ_READY", label: "Stock Checked" },
    { id: "RFQ_SENT", label: "RFQ Sent" },
    { id: "TL_REVIEW", label: "TL Review" },
    { id: "ADMIN_APPROVAL", label: "Admin Approval" },
    { id: "EMPLOYEE_VERIFY", label: "Employee Verify" },
    { id: "CLIENT_FINAL_APPROVAL", label: "Final Approval" },
    { id: "QUOTE_SENT", label: "Quoted" },
    { id: "CONFIRMED", label: "Confirmed" },
  ];
  const currentStepIdx = steps.findIndex(s => s.id === deal.status);

  const baseQuote = localMyQuote;

  // Enrich my_quote with inventory prices for products sourced from internal inventory
  const dealEnrichedForEmail = (() => {
    if (!deal || !deal.products) return { ...deal, my_quote: baseQuote };

    // Step 1: For each inquiry product, check if it's in inventory
    const enrichedProducts = deal.products.map(p => {
      const pName = p.product_name || p.description || "";
      const invMatch = inventoryData.find(inv =>
        inv.itemName.toLowerCase() === pName.toLowerCase() ||
        (inv.sku && pName.toLowerCase().includes(inv.sku.toLowerCase()))
      );
      const invStock = invMatch ? (invMatch.stocks?.reduce((acc, st) => acc + st.quantity, 0) || 0) : 0;
      if (invMatch && invStock > 0) {
        const sellingPrice = parseFloat(invMatch.sellingPrice) || 0;
        const qty = p.quantity || 0;
        return { ...p, _inv_unit_price: sellingPrice, _inv_total_price: sellingPrice * qty };
      }
      return p;
    });

    // Step 2: Start from existing my_quote products and patch in inventory prices where missing
    const baseProducts = baseQuote?.products || [];
    const mergedQuoteProducts = baseProducts.map(mqp => {
      const enriched = enrichedProducts.find(ep => ep.product_name === mqp.product_name);
      if (enriched && enriched._inv_unit_price && !(mqp.my_unit_price > 0)) {
        return {
          ...mqp,
          my_unit_price: enriched._inv_unit_price,
          total_price: enriched._inv_total_price,
          total_my_price: enriched._inv_total_price,
        };
      }
      return mqp;
    });

    // Step 3: APPEND inventory products that are NOT already in the quote products list
    const quotedNames = new Set(mergedQuoteProducts.map(p => p.product_name.toLowerCase()));
    const missingInvProducts = enrichedProducts
      .filter(ep => ep._inv_unit_price && !quotedNames.has(ep.product_name.toLowerCase()))
      .map(ep => ({
        product_name: ep.product_name,
        quantity: ep.quantity,
        unit: ep.unit,
        supplier_name: 'Internal Inventory',
        my_unit_price: ep._inv_unit_price,
        total_price: ep._inv_total_price,
        total_my_price: ep._inv_total_price,
      }));

    const allQuoteProducts = [...mergedQuoteProducts, ...missingInvProducts];

    return {
      ...deal,
      my_quote: baseQuote
        ? { ...baseQuote, products: allQuoteProducts }
        : (allQuoteProducts.length > 0 ? { products: allQuoteProducts } : null)
    };
  })();

  const displayQuote = dealEnrichedForEmail.my_quote;

  // Financial summary calculations
  let totalDealValue = 0;
  let totalCostValue = 0;

  if (deal && displayQuote) {
    (displayQuote.products || []).forEach((mqp) => {
      totalDealValue += mqp.total_price || mqp.total_my_price || 0;
    });
    // Sum cost from seller_quote (per-product moq × price supports multi-supplier)
    if (deal.seller_quote) {
      deal.seller_quote.products.forEach((sqp) => {
        totalCostValue += (sqp.seller_unit_price || 0) * (sqp.moq || 1);
      });
    }
  }

  const currentDealWithLocalQuote = { ...deal, my_quote: displayQuote };

  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className=" mx-auto flex flex-col gap-4">

        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-[#2a2d36] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/inquiries')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Inquiries
            </button>
            <span className="text-gray-300 dark:text-[#2a2d36] font-light">|</span>
            <span className="font-mono text-gray-950 dark:text-white text-lg font-bold tracking-wide">{deal.inquiry_id}</span>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={deal.status} />
            {canPerformAction && actionConfig && (
              <button
                onClick={() => setActiveTab(activeTab === 'action' ? 'overview' : 'action')}
                className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-205 active:scale-[0.98] shadow-sm ${activeTab === 'action'
                  ? 'bg-gray-200 hover:bg-gray-350 text-gray-800 dark:bg-[#1a1d23] dark:hover:bg-[#242830] dark:text-gray-300 border border-gray-300 dark:border-[#2a2d36]'
                  : 'bg-purple-600 hover:bg-purple-550 text-white shadow-purple-600/10'
                  }`}
              >
                {activeTab === 'action' ? 'Show Details' : actionConfig.label}
              </button>
            )}
          </div>
        </div>


        {/* TABS SELECTOR */}
        {canPerformAction && actionConfig && (
          <div className="flex border-b border-gray-200 dark:border-[#2a2d36]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2.5 font-bold text-sm border-b-2 transition-all duration-200 ${activeTab === 'overview'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('action')}
              className={`px-6 py-2.5 font-bold text-sm border-b-2 transition-all duration-200 ${activeTab === 'action'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              {actionConfig.tabLabel}
            </button>
          </div>
        )}

        {/* DETAILS OVERVIEW VIEW */}
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT SIDE: Products & Quotes */}
            <div className="lg:col-span-2 space-y-6">

              {/* Products Requested */}
              <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Products Requested <a className="font-bold text-gray-500">({deal.products.length} items) </a></h3>
                  {deal.products.length > 4 && (
                    <button
                      onClick={() => setIsTableFullscreen(true)}
                      className="text-[10px] font-bold text-purple-650 dark:text-purple-400 hover:text-purple-500 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      Show All
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-250 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
                  <DataTable
                    columns={requestTableColumns}
                    data={deal.products.slice(0, 4)}
                    emptyMessage="No products requested."
                    renderRow={(p, i) => {
                      const hasSuppliersCol = deal?.suppliers && deal.suppliers.length > 0;
                      // p.supplier_name is set per-product only after a supplier quote is selected.
                      // At RFQ_READY stage, no quotes exist yet — fall back to inquiry-level suppliers.
                      const perProductSupplierName = p.supplier_name || null;

                      const inventoryMatch = inventoryData.find(inv =>
                        inv.itemName.toLowerCase() === p.product_name.toLowerCase() ||
                        (inv.sku && p.product_name.toLowerCase().includes(inv.sku.toLowerCase()))
                      );
                      const inventoryStock = inventoryMatch ? (inventoryMatch.stocks?.reduce((acc, st) => acc + st.quantity, 0) || 0) : 0;

                      return (
                        <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                          <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-bold">
                            {p.product_name}
                            {inventoryStock > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                  ✅ Available in Inventory: {inventoryStock}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-gray-200/50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded">
                              {p.category || 'General'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-medium">{p.quantity}</td>
                          <td className="px-4 py-3 text-gray-450 font-medium">{p.unit}</td>
                          {hasSuppliersCol && (
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {inventoryStock > 0 ? (
                                  // Product is in inventory — show only Internal Inventory badge
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded truncate">
                                    🌟 Internal Inventory
                                  </span>
                                ) : perProductSupplierName ? (
                                  // A specific supplier quote has been selected for this product (later stages)
                                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded truncate" title={perProductSupplierName}>
                                    {perProductSupplierName}
                                  </span>
                                ) : (
                                  // No quote selected yet — show inquiry-level assigned suppliers (RFQ_READY stage)
                                  (() => {
                                    const inquirySuppliers = (deal.suppliers || []).map(s => s.supplier || s).filter(s => s && s.name);
                                    return inquirySuppliers.length > 0 ? inquirySuppliers.map(s => (
                                      <span key={s.id} className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded truncate" title={s.name}>
                                        {s.name}
                                      </span>
                                    )) : (
                                      <span className="text-gray-400 text-xs italic">None</span>
                                    );
                                  })()
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    }}
                  />
                </div>
              </div>

              {/* Seller Quote */}
              <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Supplier Quotations</h3>
                    {deal.status === 'TL_REVIEW' && (() => {
                      const tlRole = currentUser?.role?.toLowerCase();
                      const canAct = tlRole === 'team lead' || tlRole === 'admin' || tlRole === 'super admin' || tlRole === 'administrator';
                      const totalProducts = deal.items?.length || 0;
                      const selectedCount = Object.keys(pendingSelections).length;
                      return canAct && totalProducts > 0 ? (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {selectedCount}/{totalProducts} products sourced
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    {deal.supplierQuotes && deal.supplierQuotes.length > 0 && (
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded">
                        {deal.supplierQuotes.length} Submitted
                      </span>
                    )}
                    {/* Confirm Sourcing button — shown only when in TL_REVIEW and user can act */}
                    {deal.status === 'TL_REVIEW' && (() => {
                      const tlRole = currentUser?.role?.toLowerCase();
                      const canAct = tlRole === 'team lead' || tlRole === 'admin' || tlRole === 'super admin' || tlRole === 'administrator';
                      const pendingCount = Object.keys(pendingSelections).length;
                      return canAct && pendingCount > 0 ? (
                        <button
                          onClick={handleConfirmSourcing}
                          disabled={isConfirmingSource}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                        >
                          {isConfirmingSource ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          Confirm Sourcing ({Object.keys(pendingSelections).length})
                        </button>
                      ) : null;
                    })()}
                  </div>
                </div>

                {!deal.supplierQuotes || deal.supplierQuotes.length === 0 ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-550 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-amber-650 dark:text-amber-500 font-bold text-sm">Awaiting supplier response</span>
                      <span className="text-gray-400 text-xs mt-1">RFQ was dispatched to potential suppliers.</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deal.supplierQuotes.map((quote) => {
                      const quoteTotal = quote.items ? quote.items.reduce((sum, item) => {
                        const inquiryItem = deal.items?.find(ii => ii.id === item.inquiryItemId);
                        const qty = inquiryItem?.quantity || item.quantity || 1;
                        return sum + (parseFloat(item.unitPrice) || 0) * qty;
                      }, 0) : 0;

                      const isExpanded = !!expandedQuotes[quote.id];
                      const tlRole = currentUser?.role?.toLowerCase();
                      const canSelectQuote = deal.status === "TL_REVIEW" && (
                        tlRole === "team lead" || tlRole === "admin" || tlRole === "super admin" || tlRole === "administrator"
                      );
                      // Count how many items from this quote are in pending selections
                      const quotePendingCount = (quote.items || []).filter(i =>
                        pendingSelections[i.inquiryItemId]?.quoteId === quote.id
                      ).length;

                      return (
                        <div
                          key={quote.id}
                          className={`p-4 rounded-xl border transition-all duration-200 ${quotePendingCount > 0
                            ? 'bg-purple-500/5 border-purple-500/40 shadow-sm'
                            : 'bg-gray-50/50 dark:bg-[#242830]/30 border-gray-250 dark:border-[#2a2d36] hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-gray-900 dark:text-white font-bold text-sm">
                                  {quote.supplier?.name || 'N/A'}
                                </span>
                                {quotePendingCount > 0 && (
                                  <span className="px-2 py-0.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[9px] font-extrabold rounded uppercase tracking-wider">
                                    {quotePendingCount} product{quotePendingCount !== 1 ? 's' : ''} selected
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                <span>{quote.supplier?.email || 'N/A'}</span>
                                <span>•</span>
                                <span>Submitted: {new Date(quote.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                              <div className="text-right">
                                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Total Value</span>
                                <span className="font-mono text-gray-950 dark:text-white font-bold text-base">
                                  {formatINR(quoteTotal)}
                                </span>
                              </div>
                              <button
                                onClick={() => toggleQuoteExpand(quote.id)}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#1e2028] dark:hover:bg-[#2a2d36] text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg border border-gray-200 dark:border-[#2a2d36] transition-all flex items-center justify-center gap-1"
                              >
                                {isExpanded ? 'Hide Details' : 'View Details'}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-[#2a2d36] animate-in slide-in-from-top-2 duration-250">
                              {canSelectQuote && (
                                <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Tick the checkbox next to each product you want to source from this supplier, then click <b className="text-emerald-400 ml-0.5">Confirm Sourcing</b>.
                                </p>
                              )}
                              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2d36] bg-white dark:bg-[#1a1d23]">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-gray-50 dark:bg-[#242830] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-[#2a2d36]">
                                      {canSelectQuote && <th className="px-4 py-2.5 w-10"></th>}
                                      <th className="px-4 py-2.5">Product Name</th>
                                      <th className="px-4 py-2.5">Unit Price</th>
                                      <th className="px-4 py-2.5 text-center">Qty</th>
                                      <th className="px-4 py-2.5 text-right">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {quote.items?.map((item, idx) => {
                                      const inquiryItem = deal.items?.find(ii => ii.id === item.inquiryItemId);
                                      const qty = inquiryItem?.quantity || item.quantity || 1;
                                      const price = parseFloat(item.unitPrice) || 0;
                                      const productName = inquiryItem?.description || 'Unknown Product';
                                      // Is this item checked in pending selections?
                                      const isChecked = pendingSelections[item.inquiryItemId]?.quoteItemId === item.id;
                                      // Is this product already picked from a DIFFERENT supplier?
                                      const pickedElsewhere = !isChecked && !!pendingSelections[item.inquiryItemId];
                                      return (
                                        <tr
                                          key={item.id || idx}
                                          onClick={canSelectQuote ? () => handleCheckboxToggle(item, quote) : undefined}
                                          className={`border-b border-gray-100 dark:border-[#2a2d36]/50 last:border-0 transition-colors ${isChecked
                                            ? 'bg-emerald-500/5 dark:bg-emerald-500/10'
                                            : pickedElsewhere
                                              ? 'opacity-40'
                                              : canSelectQuote ? 'hover:bg-purple-500/5 cursor-pointer' : ''
                                            }`}
                                        >
                                          {canSelectQuote && (
                                            <td className="px-4 py-3 w-10" onClick={e => e.stopPropagation()}>
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={pickedElsewhere}
                                                onChange={() => handleCheckboxToggle(item, quote)}
                                                className="w-4 h-4 rounded accent-purple-600 cursor-pointer disabled:cursor-not-allowed"
                                              />
                                            </td>
                                          )}
                                          <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                                            <div className="flex items-center gap-2">
                                              {isChecked && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-600 text-white text-[9px] font-extrabold rounded uppercase tracking-wider shrink-0">
                                                  <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                  Pending
                                                </span>
                                              )}
                                              {item.isSelected && !isChecked && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-extrabold rounded uppercase tracking-wider shrink-0">
                                                  <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                  Confirmed
                                                </span>
                                              )}
                                              {productName}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 font-mono font-medium">{formatINR(price)}</td>
                                          <td className="px-4 py-3 font-mono text-center">{qty}</td>
                                          <td className="px-4 py-3 font-mono text-right font-bold text-gray-900 dark:text-white">
                                            {formatINR(price * qty)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Client Quote */}
              <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quotation Built for Buyer</h3>
                {!displayQuote ? (
                  deal.seller_quote ? (
                    <button
                      onClick={handleCalculateQuote}
                      className="w-full py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-650 dark:text-purple-400 font-bold border border-purple-500/30 rounded-xl transition-all"
                    >
                      Calculate Quotation Layout
                    </button>
                  ) : (
                    <div className="text-center py-6 text-sm text-gray-400 italic bg-gray-50/50 dark:bg-[#1e2028]/50 rounded-xl border border-dashed border-gray-200 dark:border-[#2a2d36]">
                      Quote will be generated once supplier pricing is received.
                    </div>
                  )
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
                    <DataTable
                      columns={InquiryDetailsPageSchema3}
                      data={displayQuote.products || []}
                      emptyMessage="No quote prepared."
                      renderRow={(p, i) => (
                        <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                          <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                          <td className="px-4 py-3 font-semibold">{p.product_name}</td>
                          <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-400 font-bold">{formatINR(p.my_unit_price)}</td>
                          <td className="px-4 py-3 font-mono text-emerald-500 font-semibold">{p.margin_percent || p.applied_margin_percent}%</td>
                          <td className="px-4 py-3 font-mono text-gray-900 dark:text-white text-right font-extrabold">{formatINR(p.total_price || p.total_my_price)}</td>
                        </tr>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* PO and Invoice Details */}
              {(deal.purchaseOrders?.length > 0 || deal.invoices?.length > 0) && (
                <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Post-Confirmation Documents</h3>

                  <div className="space-y-6">
                    {/* Purchase Orders */}
                    {deal.purchaseOrders?.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase mb-3 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Purchase Orders
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2d36]">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-[#242830] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-[#2a2d36]">
                                <th className="px-4 py-2.5">PO Number</th>
                                <th className="px-4 py-2.5">Supplier</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {deal.purchaseOrders.map((po) => (
                                <tr key={po.id} className="border-b border-gray-100 dark:border-[#2a2d36]/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-[#242830]/50">
                                  <td className="px-4 py-3 font-mono font-semibold text-purple-600 dark:text-purple-400">
                                    <button onClick={() => navigate(`/purchase-orders/${po.id}`)} className="hover:underline">{po.poNumber}</button>
                                  </td>
                                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{po.supplier?.name || 'N/A'}</td>
                                  <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                                  <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white text-right">{formatINR(po.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Invoices */}
                    {deal.invoices?.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase mb-3 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Client Invoices & Payments
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2d36]">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-[#242830] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-[#2a2d36]">
                                <th className="px-4 py-2.5">Invoice #</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5 text-right">Total</th>
                                <th className="px-4 py-2.5 text-right">Paid</th>
                                <th className="px-4 py-2.5 text-right">Pending</th>
                              </tr>
                            </thead>
                            <tbody>
                              {deal.invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-gray-100 dark:border-[#2a2d36]/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-[#242830]/50">
                                  <td className="px-4 py-3 font-mono font-semibold text-purple-600 dark:text-purple-400">
                                    <button onClick={() => navigate(`/invoices/${inv.id}`)} className="hover:underline">{inv.invoiceNumber}</button>
                                  </td>
                                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                                  <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white text-right">{formatINR(inv.total)}</td>
                                  <td className="px-4 py-3 font-mono font-bold text-emerald-500 text-right">{formatINR(inv.paidAmount)}</td>
                                  <td className="px-4 py-3 font-mono font-bold text-red-500 text-right">{formatINR(inv.pendingAmount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT SIDE: Context & Financial Summary */}
            <div className="space-y-6">

              {/* Context Card */}
              <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Sourcing Context</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Customer Name</span>
                    <span className="text-gray-900 dark:text-white font-bold text-sm mt-0.5 block">{deal.buyer_name}</span>
                    <span className="text-gray-550 text-xs block">{deal.buyer_email}</span>
                  </div>
                  <div className="border-t border-gray-100 dark:border-[#2a2d36]/80 pt-3.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Vessel Details</span>
                    <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm mt-0.5 block">{deal.vesselName || "—"}</span>
                    <span className="text-gray-500 font-mono text-xs block mt-0.5">Ref: {deal.referenceNumber || "—"}</span>
                  </div>
                  <div className="border-t border-gray-100 dark:border-[#2a2d36]/80 pt-3.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Created On</span>
                    <span className="text-gray-700 dark:text-gray-300 text-xs font-medium block mt-0.5">
                      {new Date(deal.date_received).toLocaleString()}
                    </span>
                  </div>
                  {deal.remarks && (
                    <div className="border-t border-gray-100 dark:border-[#2a2d36]/80 pt-3.5">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Special Remarks</span>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 bg-gray-50 dark:bg-gray-950/20 p-3 rounded-lg border border-gray-200 dark:border-[#2a2d36] leading-relaxed">
                        {deal.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financials Card */}
              {displayQuote && (
                <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm animate-fade-in">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Financial Summary</h3>
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-medium">Total Cost Price:</span>
                      <span className="font-mono text-gray-850 dark:text-gray-250 font-bold">{formatINR(totalCostValue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-medium">Total Selling Price:</span>
                      <span className="font-mono text-purple-650 dark:text-purple-400 font-extrabold">{formatINR(totalDealValue)}</span>
                    </div>
                    <div className="border-t border-gray-100 dark:border-[#2a2d36] pt-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-500 font-bold text-sm">Gross Profit:</span>
                        <span className="font-mono text-emerald-500 dark:text-emerald-400 font-extrabold text-base">{formatINR(totalDealValue - totalCostValue)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-gray-400 font-medium">Net Profit Margin:</span>
                        <span className="font-mono text-emerald-450 dark:text-emerald-400 font-bold">
                          {((totalDealValue - totalCostValue) / totalDealValue * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          /* ACTION STEP PANEL */
          <div className="bg-white dark:bg-[#1e2028] shadow-sm min-h-[300px] animate-fade-in">
            {deal.status === "PENDING" && (
              <StockCheckModal
                isOpen={true}
                isPageMode={true}
                onClose={() => setActiveTab("overview")}
                onConfirm={handleStockConfirm}
                deal={deal}
              />
            )}
            {deal.status === "RFQ_SENT" && (
              <div className="flex flex-col items-center justify-center text-center p-8 gap-4 max-w-md mx-auto">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 text-purple-650 dark:text-purple-400 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="text-gray-900 dark:text-white font-bold text-base">Close RFQ & Review Quotes</h4>
                <p className="text-gray-400 text-xs">This RFQ is currently open and accepting quotes from assigned suppliers. Close it manually to proceed to the review and margin selection phase.</p>
                <div className="w-full mt-3">
                  <button
                    onClick={handleCloseRFQ}
                    className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-600/20 transition-all"
                  >
                    Close RFQ
                  </button>
                </div>
              </div>
            )}
            {deal.status === "RFQ_READY" && (
              <RFQModal
                isOpen={true}
                isPageMode={true}
                onClose={() => setActiveTab("overview")}
                onSubmit={handleRFQSubmit}
                deal={deal}
              />
            )}
            {(deal.status === "CLIENT_QUOTING" || deal.status === "TL_REVIEW") && (
              <QuoteModal
                isOpen={true}
                isPageMode={true}
                onClose={() => setActiveTab("overview")}
                onSubmit={handleQuoteSubmit}
                deal={currentDealWithLocalQuote}
              />
            )}
            {deal.status === "EMPLOYEE_VERIFY" && (
              <VerificationModal
                isOpen={true}
                isPageMode={true}
                onClose={() => setActiveTab("overview")}
                onConfirm={handleVerifyConfirm}
                deal={currentDealWithLocalQuote}
                inventoryData={inventoryData}
              />
            )}
            {deal.status === "ADMIN_APPROVAL" && (
              <AdminApprovalModal
                isOpen={true}
                isPageMode={true}
                onClose={() => setActiveTab("overview")}
                onConfirm={handleAdminConfirm}
                deal={currentDealWithLocalQuote}
                inventoryData={inventoryData}
              />
            )}
            {deal.status === "CLIENT_FINAL_APPROVAL" && (
              <div className="flex flex-col items-center justify-center text-center p-8 gap-4 max-w-md mx-auto">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 text-purple-650 dark:text-purple-400 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-gray-900 dark:text-white font-bold text-base">Final Buyer Decision</h4>
                <p className="text-gray-400 text-xs">The quotation has been dispatched to the client. Please record their final decision (Accept/Reject) to proceed.</p>
                <div className="flex gap-3 w-full mt-3">
                  <button
                    onClick={triggerClientDecision}
                    className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-600/20 transition-all"
                  >
                    Record Decision
                  </button>
                </div>
              </div>
            )}
            {deal.status === "QUOTE_SENT" && (
              <div className="flex flex-col items-center justify-center text-center p-8 gap-4 max-w-md mx-auto">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-650 dark:text-emerald-450 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2500/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-gray-900 dark:text-white font-bold text-base">Confirm Deal & Initiate Supply</h4>
                <p className="text-gray-400 text-xs">The client has accepted the quotation. Confirming the deal will move it to the supply chain pipeline and auto-generate the Purchase Order (PO).</p>
                <div className="w-full mt-3">
                  <button
                    onClick={triggerConfirmDeal}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all"
                  >
                    Confirm Deal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <MultiEmailPreviewModal
        isOpen={isMultiEmailModalOpen}
        onClose={handleMultiEmailClose}
        stagedRFQs={pendingRFQs}
        inquiryDeal={currentDealWithLocalQuote}
        onStatusUpdate={() => { }}
      />

      <EmailPreviewModal
        isOpen={isEmailPreviewModalOpen}
        onClose={() => setIsEmailPreviewModalOpen(false)}
        deal={dealEnrichedForEmail}
        initialEmailType="QUOTE"
        onStatusUpdate={() => {
          refreshAll();
          setActiveTab("overview");
        }}
      />

      {isTableFullscreen && (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-[#15171c] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 p-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-[#2a2d36] pb-4 mb-4 flex-shrink-0">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-gray-950 dark:text-white">Products Requested ({deal.products.length} items)</h2>
              <div className="flex items-center gap-3 text-xs text-gray-550 dark:text-gray-400">
                <span>Client: <strong className="text-gray-900 dark:text-white">{deal?.buyer || 'N/A'}</strong></span>
                <span>•</span>
                <span>Vessel: <strong className="text-gray-900 dark:text-white">{deal?.vesselName || deal?.vessel_name || 'N/A'}</strong></span>
                <span>•</span>
                <span>Ref: <strong className="text-gray-900 dark:text-white">{deal?.referenceNumber || deal?.ref_no || 'N/A'}</strong></span>
              </div>
            </div>
            <button
              onClick={() => setIsTableFullscreen(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#242830] hover:bg-gray-200 dark:hover:bg-[#2a2d36] text-gray-700 dark:text-gray-200 text-xs font-bold transition-all border border-gray-200 dark:border-[#2a2d36] shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close Fullscreen
            </button>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-hidden bg-white dark:bg-[#1e2028] rounded-2xl border border-gray-200 dark:border-[#2a2d36] p-4 shadow-sm flex flex-col">
            <DataTable
              columns={requestTableColumns}
              data={deal.products}
              emptyMessage="No products requested."
              maxHeight="max-h-full"
              className="h-full flex-1"
              renderRow={(p, i) => {
                const hasSuppliersCol = deal?.suppliers && deal.suppliers.length > 0;
                const productSuppliers = hasSuppliersCol ? getProductSuppliers(p) : [];
                return (
                  <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                    <td className="px-5 py-3.5 font-medium text-purple-600 dark:text-purple-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-3.5 text-gray-900 dark:text-white font-bold">{p.product_name}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 bg-gray-200/50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded">
                        {p.category || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold">{p.quantity}</td>
                    <td className="px-4 py-3.5 text-gray-450 font-medium">{p.unit}</td>
                    {hasSuppliersCol && (
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xl">
                          {productSuppliers.map(s => (
                            <span key={s.id} className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded truncate" title={s.name}>
                              {s.name}
                            </span>
                          ))}
                          {productSuppliers.length === 0 && (
                            <span className="text-gray-400 text-xs italic">None</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
