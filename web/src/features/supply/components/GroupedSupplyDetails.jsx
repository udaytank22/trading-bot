import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS, Button } from '@components/ui';
import Swal from 'sweetalert2';
import { useAuth } from '@context';

export default function GroupedSupplyDetails({
  deal,
  formatINR,
  setAllotModalDeal,
  setAllotModalMode,
  setIsAllotModalOpen,
  handleStatusUpdate,
  handleGroupChallanReceived,
  documents,
  handleViewPDF
}) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('suppliers', 'update');

  const formatDate = (d) => {
    if (!d) return '—';
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const customer = deal.client?.name || deal.inquiry?.customer || '—';
  const vessel = deal.inquiry?.vesselName || deal.inquiry?.vessel || '—';

  // Aggregate all products across all sub-shipments
  const items = useMemo(() => {
    const list = [];
      deal.subShipments?.forEach(ship => {
        if (ship.purchaseOrder?.items) {
          ship.purchaseOrder.items.forEach(item => {
            list.push({
              id: item.id,
              description: item.description || item.product?.name || item.product_name || '',
              product: item.product,
              quantity: item.quantity,
              unitPrice: item.unitPrice || item.unit_price || 0,
              totalPrice: item.totalPrice || item.total_price || 0,
              supplier: ship.supplier?.name || ship.supplier || 'Unknown Supplier',
              shipmentId: ship.id
            });
          });
        } else if (ship.inventoryFulfilled && deal.inquiry?.clientQuotations?.[0]?.items?.length > 0) {
          deal.inquiry.clientQuotations[0].items.forEach(cqi => {
            list.push({
              id: cqi.id,
              description: cqi.inquiryItem?.description || 'Internal Product',
              product: null,
              quantity: cqi.quantity,
              unitPrice: parseFloat(cqi.sellingPrice || 0),
              totalPrice: parseFloat(cqi.totalPrice || 0),
              supplier: 'Internal Inventory',
              shipmentId: ship.id
            });
          });
        } else if (ship.cargoDetails) {
          list.push({
            id: Math.random(),
            description: ship.cargoDetails,
            quantity: ship.quantity || '—',
            unitPrice: 0,
            totalPrice: 0,
            supplier: ship.supplier?.name || ship.supplier || 'Internal Inventory',
            shipmentId: ship.id
          });
        }
      });
    return list;
  }, [deal.subShipments, deal.inquiry]);

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.totalPrice ?? item.total_price ?? 0);
    return sum + (isNaN(price) ? 0 : price);
  }, 0);
  const totalAmount = subtotal * 1.18;
  const gstAmount = totalAmount - subtotal;

  const productColumns = [
    { key: 'srno', label: 'Sr. No.' },
    { key: "product", label: "Product" },
    { key: "vendor", label: "Vendor" },
    { key: "unitPrice", label: "Unit Price" },
    { key: "quantity", label: "Quantity" },
    { key: "totalPrice", label: "Total Price", className: "text-right" }
  ];

  const shipmentColumns = [
    { key: 'shipmentNo', label: 'Shipment No.' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'driver', label: 'Driver' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '' }
  ];

  return (
    <div className="w-full animate-in fade-in duration-300 pb-6">
      <div className="max-w-7xl mx-auto py-2 px-2 md:px-4 flex flex-col gap-4">

        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-[#2a2d36] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/supply')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Supply
            </button>
            <span className="text-gray-300 dark:text-[#2a2d36] font-light">|</span>
            <span className="font-mono text-gray-900 dark:text-white text-lg font-bold tracking-wide">{deal.shipmentNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={deal.status} />
            {deal.status === "DELIVERED" && canUpdate && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setAllotModalDeal(deal);
                  setAllotModalMode("group_final_delivery");
                  setIsAllotModalOpen(true);
                }}
              >
                Allot Final Vehicle
              </Button>
            )}
            {(deal.status === "ORDER_PLACED" || deal.status === "ORDER PLACED" || deal.status === "PENDING" || deal.status === "CONFIRMED") && deal.status !== "CLOSED" && deal.subShipments?.every(s => s.inventoryFulfilled) && deal.subShipments?.every(s => s.currentStatus !== "CLOSED" && s.status !== "CLOSED") && canUpdate && (
                <button
                  onClick={() => {
                    setAllotModalDeal(deal);
                    setAllotModalMode("group_initial_delivery");
                    setIsAllotModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-purple-600 dark:text-purple-400 border border-purple-500/30 transition-all shadow-sm"
                >
                  Allot Vehicle
                </button>
            )}
            {((deal.status === "VEHICLE_ALLOTTED" || deal.status === "LOADING") || deal.subShipments?.some(s => s.inventoryFulfilled && (s.currentStatus === 'LOADING' || s.currentStatus === 'VEHICLE_ALLOTTED' || s.status === 'LOADING' || s.status === 'VEHICLE_ALLOTTED'))) && deal.status !== "OUT_FOR_DELIVERY" && deal.status !== "OUT FOR DELIVERY" && deal.status !== "DISPATCHED" && deal.status !== "DELIVERED" && deal.status !== "COMPLETED" && canUpdate && (
                <button
                onClick={async () => {
                  const result = await Swal.fire({
                    title: 'Mark as Dispatched?',
                    text: 'Mark this cargo as dispatched?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#2563eb',
                    cancelButtonColor: '#374151',
                    confirmButtonText: 'Yes, Dispatch',
                    cancelButtonText: 'Cancel',
                    background: '#1a1d23',
                    color: '#fff',
                  });
                  if (result.isConfirmed) {
                    // Update all subshipments to OUT_FOR_DELIVERY
                    deal.subShipments.forEach(sub => handleStatusUpdate(sub.id, "OUT_FOR_DELIVERY"));
                    // We also need to update the grouped deal status
                    handleStatusUpdate(deal.id, "OUT_FOR_DELIVERY");
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Mark Dispatched
              </button>
            )}
            {deal.status === "OUT_FOR_DELIVERY" && canUpdate && (
              <button
                onClick={handleGroupChallanReceived}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Challan Signed
              </button>
            )}
          </div>
        </div>

        {/* METADATA CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Vessel</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{vessel}</p>
          </div>
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Date</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(deal.date)}</p>
          </div>
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Amount</p>
            <p className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">{formatINR(totalAmount)}</p>
          </div>
        </div>

        {/* SHIPMENTS TRACKING SECTION */}
        <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Vendor Shipments Tracking</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
            <DataTable
              columns={shipmentColumns}
              data={deal.subShipments || []}
              emptyMessage="No vendor shipments found."
              renderRow={(shipment, idx) => {
                const shipmentStatus = shipment.currentStatus || shipment.status;
                return (
                  <tr key={shipment.id || idx} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                    <td className="px-6 py-4 font-mono text-sm text-gray-500">
                      SH-{shipment.id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {shipment.supplier?.name || shipment.supplier || 'Unknown Supplier'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {shipment.vehicleDetails || 'Not Allotted'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {shipment.driverDetails || 'Not Assigned'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={shipmentStatus} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(shipmentStatus === "IN_TRANSIT" || shipmentStatus === "DISPATCHED") && canUpdate && (
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: 'Mark as Delivered?',
                              text: `Mark shipment SH-${shipment.id} as delivered?`,
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonColor: '#2563eb',
                              cancelButtonColor: '#374151',
                              confirmButtonText: 'Yes, Delivered',
                              cancelButtonText: 'Cancel',
                              background: '#1a1d23',
                              color: '#fff',
                            });
                            if (result.isConfirmed) {
                              handleStatusUpdate(shipment.id, "DELIVERED");
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }}
            />
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Ordered Products</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
            <DataTable
              columns={productColumns}
              data={items}
              emptyMessage="No products found."
              renderRow={(item, idx) => (
                <tr key={item.id || idx} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                  <td className="px-6 py-4 text-gray-500 text-sm font-medium">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {item.supplier}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-500">
                    {formatINR(parseFloat(item.unitPrice))}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-200">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-purple-600 dark:text-purple-400 text-right">
                    {formatINR(parseFloat(item.totalPrice))}
                  </td>
                </tr>
              )}
            />
          </div>
        </div>


        {/* Order Context & Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Context */}
          <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Order Context</h3>
            <div className="space-y-3">
              <div className="flex flex-col bg-gray-50 dark:bg-[#242830]/30 p-4 rounded-xl border border-gray-200 dark:border-[#2a2d36]">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Customer / Buyer</span>
                <span className="text-gray-900 dark:text-white font-extrabold text-base mt-1">{customer}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col bg-gray-50 dark:bg-[#242830]/30 p-3.5 rounded-xl border border-gray-200 dark:border-[#2a2d36]">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Order ID</span>
                  <span className="font-mono text-gray-900 dark:text-white font-bold text-xs mt-1">{deal.shipmentNumber}</span>
                </div>
                <div className="flex flex-col bg-gray-50 dark:bg-[#242830]/30 p-3.5 rounded-xl border border-gray-200 dark:border-[#2a2d36]">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</span>
                  <span className="text-gray-900 dark:text-white font-bold text-xs mt-1 uppercase">{deal.status?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4">Financial Summary</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subtotal (Excl. Tax)</span>
                <span className="text-gray-900 dark:text-white font-bold font-mono">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">GST (18%)</span>
                <span className="text-gray-900 dark:text-white font-bold font-mono">{formatINR(gstAmount)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-dashed border-gray-200 dark:border-[#2a2d36] pt-4 mt-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total (Incl. Tax)</span>
                <span className="text-purple-600 dark:text-purple-400 font-extrabold font-mono text-base bg-purple-500/10 px-3.5 py-1.5 rounded-xl border border-purple-500/20 shadow-sm">
                  {formatINR(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Associated Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {documents && documents.map((doc, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-[#242830]/30 border border-gray-200 dark:border-[#2a2d36] rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:border-purple-500/40 transition-colors cursor-pointer" onClick={() => handleViewPDF(doc)}>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {doc.type === "PDF" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    )}
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{doc.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{doc.size} • {doc.type}</p>
                </div>
                <button
                  className="mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full hover:bg-purple-500/20 transition-colors w-full"
                >
                  View Document
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
