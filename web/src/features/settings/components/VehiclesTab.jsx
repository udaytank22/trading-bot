import { TOAST_MESSAGES } from '../../../constants/toastMessages';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Select, DataTable, rowStripeClass, ROW_HOVER_CLS, Pagination, ExcelImportModal } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, Field, inputCls, EyeIcon, EditIcon, TrashIcon, HeaderButton } from './shared';
import * as XLSX from 'xlsx';
import { useToast } from '@hooks/useToast';
import { useAuth } from '@context';
import { usePaginatedFetch } from '@hooks/usePaginatedFetch';
import Button from '@components/ui/button';

export default function VehiclesTab() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { showToast } = useToast();

  const canCreate = hasPermission('vehicles', 'create');
  const canUpdate = hasPermission('vehicles', 'update');
  const canDelete = hasPermission('vehicles', 'delete');

  const {
    data: vehiclesData,
    meta,
    loading: isLoading,
    handlePageChange,
    handlePageSizeChange,
    refresh
  } = usePaginatedFetch(api.vehicles.getVehicles, 1, 50, {
    search
  });

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Vehicle?',
      text: "Are you sure you want to delete this vehicle? This action cannot be undone.",
      confirmButtonText: 'Yes, delete it!'
    });

    if (isConfirmed) {
      try {
        const res = await api.vehicles.deleteVehicle(id);
        if (res.success) {
          refresh();
        }
      } catch (e) {
        console.error('Failed to delete vehicle:', e);
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      const data = {
        vehicle_no: formData.vehicle_no,
        type: formData.type,
        capacity: formData.capacity,
        driver_name: formData.driver_name,
        phone: formData.phone,
        documents: formData.documents,
        status: formData.status
      };

      if (editItem) {
        const res = await api.vehicles.updateVehicle(editItem.id, data);
        if (res.success) refresh();
      } else {
        const res = await api.vehicles.createVehicle(data);
        if (res.success) refresh();
      }
      setIsFormOpen(false);
      setEditItem(null);
    } catch (e) {
      console.error('Failed to save vehicle:', e);
    }
  };

  const handleDownloadSample = () => {
    const list = vehiclesData || [];
    const dataToExport = list.length > 0
      ? list.map(v => ({
        ID: v.id,
        'Vehicle Number': v.vehicle_no || '',
        Type: v.type || '',
        Capacity: v.capacity || '',
        'Driver Name': v.driver_name || '',
        Phone: v.phone || '',
        Status: v.status || 'Active'
      }))
      : [{
        ID: '',
        'Vehicle Number': 'MH-12-AB-1234',
        Type: 'Truck',
        Capacity: '10 Tons',
        'Driver Name': 'Rajesh Kumar',
        Phone: '9876543210',
        Status: 'Active'
      }];
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
    XLSX.writeFile(wb, 'Vehicles_Data.xlsx');
  };

  const handleImport = async (jsonData) => {
    let failCount = 0;
    const validVehicles = [];
    for (const rawRow of jsonData) {
      const row = Object.keys(rawRow).reduce((acc, key) => {
        acc[key.trim()] = rawRow[key];
        return acc;
      }, {});

      if (!row['Vehicle Number']) { failCount++; continue; }
      const rawId = parseInt(row.ID || row.id);
      validVehicles.push({
        id: rawId > 0 ? rawId : undefined,
        vehicle_no: row['Vehicle Number'],
        type: row.Type || '',
        capacity: row.Capacity || '',
        driver_name: row['Driver Name'] || '',
        phone: String(row.Phone || ''),
        status: row.Status === 'Inactive' ? 'Inactive' : 'Active'
      });
    }
    if (validVehicles.length > 0) {
      try {
        const res = await api.vehicles.bulkImport(validVehicles);
        if (res.success) {
          refresh();
          if (res.data?.errors && res.data.errors.length > 0) {
            console.error('Import errors:', res.data.errors);
            showToast(`Import completed with errors. Successfully imported ${res.data.successCount} vehicles. Check console for details.`, 'warning');
          } else {
            showToast(TOAST_MESSAGES.SETTINGS.IMPORT.SUCCESS(res.data?.successCount ?? validVehicles.length, failCount, 'vehicles'), 'success');
          }
        } else {
          showToast(TOAST_MESSAGES.COMMON.IMPORT_FAILED, 'error');
        }
      } catch (err) {
        console.error(err);
        showToast(TOAST_MESSAGES.COMMON.IMPORT_ERROR, 'error');
      }
    } else {
      showToast(TOAST_MESSAGES.SETTINGS.IMPORT.NO_VALID_ROWS(failCount), 'info');
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] shadow-sm animate-fade-in flex-1 flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Vehicle Details" onClose={() => setViewItem(null)}>
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
      </RightDrawer>

      <RightDrawer
        isOpen={isFormOpen}
        title={editItem ? 'Edit Vehicle' : 'Add New Vehicle'}
        onClose={() => {
          setIsFormOpen(false);
          setEditItem(null);
        }}
      >
        <VehicleForm
          initialData={editItem}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setEditItem(null);
          }}
        />
      </RightDrawer>

      <div className="pb-4 border-b border-[#eee8dd] dark:border-[#2a2d33] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-[#faf8f5] dark:bg-[#1a1d23] border border-[#e6e0d2] dark:border-[#2a2d33] rounded-xl h-10 px-3.5 text-sm text-[#1e293b] dark:text-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0d6e6e] transition-colors shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
          <HeaderButton onClick={handleDownloadSample}>
            Download sample
          </HeaderButton>

          {canCreate && (
            <>
              <HeaderButton onClick={() => setIsImportModalOpen(true)}>
                Import
              </HeaderButton>

              <Button
                variant="primary"
                onClick={() => setIsFormOpen(true)}
              >
                + Add Vehicle
              </Button>
            </>
          )}
        </div>

      </div>

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        expectedColumns={['ID', 'Vehicle Number', 'Type', 'Capacity', 'Driver Name', 'Phone', 'Status']}
      />

      <DataTable
        columns={[
          { key: "srno", label: "#" },
          { key: "vehicle_no", label: "Vehicle Number" },
          { key: "type", label: "Type" },
          { key: "capacity", label: "Capacity" },
          { key: "driver_name", label: "Driver Name" },
          { key: "document", label: "Document" },
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions", className: "text-right" },
        ]}
        data={vehiclesData}
        isLoading={isLoading}
        emptyMessage="No vehicles found."
        renderRow={(vehicle, i) => (
          <tr key={vehicle.id} className={`${rowStripeClass(i, vehicle)} ${ROW_HOVER_CLS}`}>
            <td className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">{(meta.currentPage - 1) * meta.pageSize + i + 1}</td>
            <td className="px-5 py-3.5 font-bold text-[#1e293b] dark:text-white">{vehicle.vehicle_no}</td>
            <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{vehicle.type || '-'}</td>
            <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{vehicle.capacity || '-'}</td>
            <td className="px-5 py-3.5 font-medium">{vehicle.driver_name} {vehicle.phone ? `(${vehicle.phone})` : ''}</td>
            <td className="px-5 py-3.5">
              {vehicle.documents && vehicle.documents.length > 0 ? (
                <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs font-bold whitespace-nowrap">{vehicle.documents.length} Uploaded</span>
              ) : (
                <span className="text-gray-400 text-xs font-medium">-</span>
              )}
            </td>
            <td className="px-5 py-3.5">
              <span className={`px-2 py-1 rounded text-[11px] font-bold ${vehicle.status === 'Active'
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {vehicle.status || 'Active'}
              </span>
            </td>
            <td className="px-5 py-3.5 text-right space-x-3">
              <button onClick={() => setViewItem(vehicle)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="View"><EyeIcon /></button>
              {canUpdate && <button onClick={() => { setEditItem(vehicle); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit"><EditIcon /></button>}
              {canDelete && <button onClick={() => handleDelete(vehicle.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete"><TrashIcon /></button>}
            </td>
          </tr>
        )}
      />

      <div className="p-4 border-t border-gray-200 dark:border-[#2a2d33]">
        <Pagination
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={meta.pageSize}
          onItemsPerPageChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}

function VehicleForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(
    initialData ? {
      ...initialData,
      documents: initialData.documents || [],
      status: initialData.status || 'Active',
    } : { vehicle_no: '', type: '', capacity: '', driver_name: '', phone: '', documents: [], status: 'Active' }
  );

  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: 'Basic Info' },
    { label: 'Driver Details' },
    { label: 'Documents' },
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) setActiveStep(s => s + 1);
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep(s => s - 1);
  };

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          documents: [...(prev.documents || []), { name: file.name, file: reader.result }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveDoc = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, idx) => idx !== index)
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
      {/* Stepper */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === idx
              ? 'bg-purple-600 text-white'
              : activeStep > idx
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-150 text-gray-500 dark:bg-gray-800'
              }`}>
              {idx + 1}
            </div>
            <span className={`text-[12px] font-bold ${activeStep === idx ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
              {step.label}
            </span>
            {idx < steps.length - 1 && <span className="text-gray-300 dark:text-gray-700 mx-2">&rarr;</span>}
          </div>
        ))}
      </div>

      {activeStep === 0 && (
        <div className="space-y-4">
          <Field label="Vehicle Number">
            <input
              type="text"
              required
              placeholder="e.g. MH-12-AB-1234"
              value={formData.vehicle_no}
              onChange={(e) => setFormData(p => ({ ...p, vehicle_no: e.target.value.toUpperCase() }))}
              className={inputCls}
            />
          </Field>
          <Field label="Vehicle Type">
            <select
              value={formData.type}
              onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
              className={inputCls}
            >
              <option value="">Select Type</option>
              <option value="Truck">Truck</option>
              <option value="Container">Container</option>
              <option value="Dumper">Dumper</option>
              <option value="Trailer">Trailer</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Capacity (Tons/Kgs)">
            <input
              type="text"
              placeholder="e.g. 10 Tons"
              value={formData.capacity}
              onChange={(e) => setFormData(p => ({ ...p, capacity: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <select
              value={formData.status}
              onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
              className={inputCls}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
        </div>
      )}

      {activeStep === 1 && (
        <div className="space-y-4">
          <Field label="Driver Name">
            <input
              type="text"
              placeholder="Driver's Full Name"
              value={formData.driver_name}
              onChange={(e) => setFormData(p => ({ ...p, driver_name: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Driver Phone Number">
            <input
              type="text"
              placeholder="Driver's Contact Number"
              value={formData.phone}
              onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {activeStep === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 font-medium mb-1.5">Vehicle Documents</label>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="w-full h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-gray-500 font-medium">Click to upload vehicle license, insurance, RC etc.</span>
            </button>
          </div>

          {formData.documents && formData.documents.length > 0 && (
            <div className="space-y-2 mt-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded Documents ({formData.documents.length})</span>
              <div className="grid grid-cols-1 gap-2">
                {formData.documents.map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-150/50 dark:border-gray-800">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[80%]">{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(idx)}
                      className="text-red-500 hover:text-red-600 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-150/50 dark:border-gray-850">
        <button
          type="button"
          onClick={handleBack}
          disabled={activeStep === 0}
          className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
        >
          Back
        </button>

        {activeStep < steps.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 bg-[#0d6e6e] hover:bg-[#0b5c5c] text-white text-xs font-bold rounded-xl shadow-sm"
          >
            Next
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0d6e6e] hover:bg-[#0b5c5c] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Save Vehicle
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
