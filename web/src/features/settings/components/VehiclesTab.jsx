import React, { useState, useMemo, useEffect } from 'react';
import { Select, DataTable, rowStripeClass, ROW_HOVER_CLS, Pagination } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, Field, inputCls, EyeIcon, EditIcon, TrashIcon } from './shared';

export default function VehiclesTab() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const res = await api.vehicles.getVehicles();
      setVehicles(res.data || []);
    } catch (e) {
      console.error('Failed to fetch vehicles:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return vehicles;
    return vehicles.filter(v =>
      (v.vehicle_no && v.vehicle_no.toLowerCase().includes(q)) ||
      (v.driver_name && v.driver_name.toLowerCase().includes(q)) ||
      (v.type && v.type.toLowerCase().includes(q))
    );
  }, [vehicles, search]);

  const totalPages = Math.max(1, Math.ceil((filteredVehicles?.length || 0) / itemsPerPage));
  const currentItems = useMemo(() => {
    return filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredVehicles, currentPage, itemsPerPage]);

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Vehicle?',
      text: "Are you sure you want to delete this vehicle? This action cannot be undone.",
      confirmButtonText: 'Yes, delete it!'
    });

    if (isConfirmed) {
      try {
        await api.vehicles.deleteVehicle(id);
        setVehicles(prev => prev.filter(v => v.id !== id));
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
        await api.vehicles.updateVehicle(editItem.id, data);
        setVehicles(prev => prev.map(v => v.id === editItem.id ? { ...v, ...data } : v));
      } else {
        const res = await api.vehicles.createVehicle(data);
        if (res.success && res.data) {
          setVehicles(prev => [...prev, res.data]);
        } else {
          // fallback if response format is different
          setVehicles(prev => [...prev, { ...data, id: Date.now().toString() }]);
        }
      }
      setIsFormOpen(false);
      setEditItem(null);
    } catch (e) {
      console.error('Failed to save vehicle:', e);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
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

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vehicles List</h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          />

          <button
            onClick={() => setIsFormOpen(true)}
            className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors"
          >
            + Add Vehicle
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        {isLoading ? (
           <div className="flex justify-center items-center h-32 text-gray-500">Loading vehicles...</div>
        ) : (
          <DataTable
            columns={[
              { key: "vehicle_no", label: "Vehicle Number" },
              { key: "type", label: "Type" },
              { key: "capacity", label: "Capacity" },
              { key: "driver_name", label: "Driver Name" },
              { key: "document", label: "Document" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Actions", className: "text-right" },
            ]}
            data={currentItems}
            emptyMessage="No vehicles found."
            renderRow={(vehicle, i) => (
              <tr key={vehicle.id} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{vehicle.vehicle_no}</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{vehicle.type || '-'}</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{vehicle.capacity || '-'}</td>
                <td className="px-5 py-3">{vehicle.driver_name} {vehicle.phone ? `(${vehicle.phone})` : ''}</td>
                <td className="px-5 py-3">
                  {vehicle.documents && vehicle.documents.length > 0 ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs font-bold whitespace-nowrap">{vehicle.documents.length} Uploaded</span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded text-[11px] font-bold ${vehicle.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {vehicle.status || 'Active'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right space-x-3">
                  <button onClick={() => setViewItem(vehicle)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="View"><EyeIcon /></button>
                  <button onClick={() => { setEditItem(vehicle); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit"><EditIcon /></button>
                  <button onClick={() => handleDelete(vehicle.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete"><TrashIcon /></button>
                </td>
              </tr>
            )}
          />
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[#2a2d33]">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredVehicles?.length || 0}
          itemsPerPage={itemsPerPage}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPageChange={(p) => setCurrentPage(p)}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          itemLabel="vehicles"
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

  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState(null);

  const handleAddDocument = () => {
    if (docName && docFile) {
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), { name: docName, file: docFile }]
      }));
      setDocName('');
      setDocFile(null);
      const fileInput = document.getElementById('vehicle-doc-upload');
      if (fileInput) fileInput.value = '';
    }
  };

  const handleRemoveDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 content-start">
        <Field label="Vehicle Registration Number">
          <input type="text" className={inputCls} value={formData.vehicle_no} onChange={set('vehicle_no')} placeholder="e.g. MH-12-AB-1234" required />
        </Field>

        <Field label="Vehicle Type">
          <input type="text" className={inputCls} value={formData.type} onChange={set('type')} placeholder="e.g. Truck, Van" />
        </Field>

        <Field label="Capacity">
          <input type="text" className={inputCls} value={formData.capacity} onChange={set('capacity')} placeholder="e.g. 10 Tons" />
        </Field>

        <Field label="Driver Name">
          <input type="text" className={inputCls} value={formData.driver_name} onChange={set('driver_name')} placeholder="e.g. Rajesh Kumar" />
        </Field>
        
        <Field label="Driver Phone">
          <input type="text" className={inputCls} value={formData.phone} onChange={set('phone')} placeholder="e.g. 9876543210" />
        </Field>

        <Field label="Status">
          <Select
            variant="settings"
            className={inputCls}
            value={formData.status}
            onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" }
            ]}
          />
        </Field>
      </div>

      <div className="border-t border-gray-200 dark:border-[#2a2d33] pt-4 mt-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Documents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <Field label="Document Name" labelClassName="text-[11px] font-bold text-gray-500 uppercase block mb-1">
              <input type="text" className={inputCls} value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. RC Book" />
            </Field>
          </div>
          <div className="sm:col-span-5">
            <Field label="File" labelClassName="text-[11px] font-bold text-gray-500 uppercase block mb-1">
              <input 
                id="vehicle-doc-upload"
                type="file" 
                className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setDocFile(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
                accept=".pdf,.jpg,.jpeg,.png" 
              />
            </Field>
          </div>
          <div className="sm:col-span-2 pb-1">
            <button 
              type="button"
              onClick={handleAddDocument}
              disabled={!docName || !docFile}
              className="w-full h-9 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-bold rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {formData.documents && formData.documents.length > 0 && (
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
            {formData.documents.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#151821] border border-gray-200 dark:border-[#2a2d33] rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{doc.name}</span>
                </div>
                <button type="button" onClick={() => handleRemoveDocument(idx)} className="text-red-500 hover:text-red-600 transition-colors">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
          Cancel
        </button>

        <button onClick={() => onSave(formData)} className="px-5 py-2 text-[13px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors">
          Save Details
        </button>
      </div>
    </div>
  );
}
