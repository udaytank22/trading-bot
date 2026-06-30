import { TOAST_MESSAGES } from '../../../constants/toastMessages';
import React, { useState, useMemo, useEffect } from 'react';
import { Select, DataTable, rowStripeClass, ROW_HOVER_CLS, Pagination, ExcelImportModal } from '@components/ui';
import { confirmAction } from '@utils/swal';
import Swal from 'sweetalert2';
import { useAuth } from '@context';
import { useProducts } from '@hooks/queries';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, Field, inputCls, EyeIcon, EditIcon, TrashIcon, CenterModal, HeaderButton } from './shared';
import * as XLSX from 'xlsx';
import { useToast } from '@hooks/useToast';
import { VendorsTabSchema1 } from '@config/tableSchemas';
import { usePaginatedFetch } from '@hooks/usePaginatedFetch';
import Button from '@components/ui/button';

export default function VendorsTab() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [grantAccessVendor, setGrantAccessVendor] = useState(null);
  const [grantPassword, setGrantPassword] = useState('');
  const [showGrantPassword, setShowGrantPassword] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [updatePasswordVendor, setUpdatePasswordVendor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [vendorUser, setVendorUser] = useState(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const { showToast } = useToast();

  const canCreate = hasPermission('suppliers', 'create');
  const canUpdate = hasPermission('suppliers', 'update');
  const canDelete = hasPermission('suppliers', 'delete');

  useEffect(() => {
    if (viewItem && viewItem.email) {
      setIsCheckingUser(true);
      api.users.getUsers({ limit: 1000 })
        .then(res => {
          const matchedUser = res.data?.find(u => u.email === viewItem.email);
          setVendorUser(matchedUser || null);
        })
        .catch(console.error)
        .finally(() => setIsCheckingUser(false));
    } else {
      setVendorUser(null);
    }
  }, [viewItem]);

  const handleToggleUserAccess = async (user, activate) => {
    try {
      const res = await api.users.updateUser(user.id, { isActive: activate });
      if (res.success || res.id) {
        Swal.fire({
          toast: true, position: 'top-end', icon: 'success', title: activate ? TOAST_MESSAGES.SETTINGS.VENDORS.ACCESS_REACTIVATED : TOAST_MESSAGES.SETTINGS.VENDORS.ACCESS_REVOKED, showConfirmButton: false, timer: 2000,
          background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff', color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
        });
        setVendorUser({ ...vendorUser, isActive: activate });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to update access.', background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff', color: document.documentElement.classList.contains('dark') ? '#fff' : '#000' });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update access.';
      Swal.fire({ icon: 'error', title: 'Error', text: errorMessage, background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff', color: document.documentElement.classList.contains('dark') ? '#fff' : '#000' });
    }
  };

  const {
    data: suppliersData,
    meta,
    loading,
    handlePageChange,
    handlePageSizeChange,
    refresh
  } = usePaginatedFetch(api.suppliers.getSuppliers, 1, 10, {
    search
  });

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Vendor?',
      text: "Are you sure you want to delete this vendor? This action cannot be undone.",
      confirmButtonText: 'Yes, delete it!'
    });

    if (isConfirmed) {
      try {
        const res = await api.suppliers.deleteSupplier(id);
        if (res.success) {
          refresh();
        }
      } catch (e) {
        console.error('Failed to delete supplier:', e);
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      const data = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        company: formData.company || '',
        address: formData.address || '',
        categories: formData.categories || [],
        isActive: formData.status === 'Active'
      };
      if (editItem) {
        const res = await api.suppliers.updateSupplier(editItem.id, data);
        if (res.success) refresh();
      } else {
        const res = await api.suppliers.createSupplier(data);
        if (res.success) refresh();
      }
      setIsFormOpen(false);
      setEditItem(null);
    } catch (e) {
      console.error('Failed to save supplier:', e);
    }
  };

  const handleDownloadSample = async () => {
    let dataToExport = [];
    const res = await api.suppliers.getSuppliers({ paginate: 'false' });
    const allSuppliers = res.data || [];
    if (allSuppliers && allSuppliers.length > 0) {
      dataToExport = allSuppliers.map(vendor => ({
        ID: vendor.id,
        Name: vendor.name || "",
        Email: vendor.email || "",
        Phone: vendor.phone || "",
        Company: vendor.company || "",
        Address: vendor.address || "",
        Status: vendor.isActive ? "Active" : "Inactive",
        Categories: (vendor.categories || []).join(", ")
      }));
    } else {
      dataToExport = [{
        ID: "",
        Name: "Ocean Supplies LLC",
        Email: "vendor@example.com",
        Phone: "+91 9988776655",
        Company: "Ahmed Khan",
        Address: "London, UK",
        Status: "Active",
        Categories: "Chemical, General"
      }];
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendors");
    XLSX.writeFile(wb, "Vendors_Data.xlsx");
  };

  const handleImport = async (jsonData) => {
    const suppliersToImport = [];
    let failCount = 0;

    for (const rawRow of jsonData) {
      const row = Object.keys(rawRow).reduce((acc, key) => {
        acc[key.trim()] = rawRow[key];
        return acc;
      }, {});

      if (!row.Name || !row.Email) {
        failCount++;
        continue;
      }

      const rawId = parseInt(row.ID || row.id);
      const data = {
        id: rawId > 0 ? rawId : undefined,
        name: row.Name,
        email: row.Email,
        phone: String(row.Phone || ''),
        company: row.Company || '',
        address: row.Address || '',
        isActive: row.Status !== 'Inactive',
        categories: row.Categories ? String(row.Categories).split(',').map(c => c.trim()).filter(Boolean) : []
      };
      suppliersToImport.push(data);
    }

    if (suppliersToImport.length > 0) {
      try {
        const res = await api.suppliers.bulkImportSuppliers(suppliersToImport);
        if (res.success) {
          refresh();
          if (res.data?.errors && res.data.errors.length > 0) {
            console.error('Import errors:', res.data.errors);
            showToast(`Import completed with errors. Successfully imported ${res.data.successCount} vendors. Check console for details.`, 'warning');
          } else {
            showToast(TOAST_MESSAGES.SETTINGS.IMPORT.SUCCESS(res.data?.successCount ?? suppliersToImport.length, failCount), 'success');
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

  const handleGrantAccess = (vendor) => {
    if (!vendor.email) {
      showToast(TOAST_MESSAGES.SETTINGS.VENDORS.REQUIRE_EMAIL, 'warning');
      return;
    }
    setGrantAccessVendor(vendor);
    setGrantPassword('');
    setShowGrantPassword(false);
  };

  const submitGrantAccess = async () => {
    if (!grantPassword || grantPassword.length < 6) {
      showToast(TOAST_MESSAGES.AUTH.PASSWORD_MIN_LENGTH, 'warning');
      return;
    }

    setIsGranting(true);
    try {
      const rolesRes = await api.roles.getRoles();
      const clientRole = rolesRes.data.find(r => r.name === 'Client');
      
      if (!clientRole) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Client role not found in the backend.', background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff', color: document.documentElement.classList.contains('dark') ? '#fff' : '#000' });
        setIsGranting(false);
        return;
      }

      const res = await api.users.createUser({
        email: grantAccessVendor.email,
        password: grantPassword,
        roleId: clientRole.id,
        isActive: true
      });

      if (res.success || res.id) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Access Granted',
          text: 'Vendor can now login with their email.',
          showConfirmButton: false,
          timer: 2000,
          background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
        });
        setGrantAccessVendor(null);
        if (viewItem && viewItem.email === grantAccessVendor.email) {
          setVendorUser(res.data || res);
        }
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to grant access.', background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff', color: document.documentElement.classList.contains('dark') ? '#fff' : '#000' });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to grant access.';
      Swal.fire({ icon: 'error', title: 'Error', text: errorMessage, background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff', color: document.documentElement.classList.contains('dark') ? '#fff' : '#000' });
    } finally {
      setIsGranting(false);
    }
  };

  const handleUpdatePassword = (vendor) => {
    setUpdatePasswordVendor(vendor);
    setNewPassword('');
    setShowNewPassword(false);
  };

  const submitUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.users.updateUser(vendorUser.id, {
        password: newPassword
      });

      if (res.success || res.id) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Password Updated',
          text: 'Vendor password has been successfully updated.',
          showConfirmButton: false,
          timer: 2000,
          background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
        });
        setUpdatePasswordVendor(null);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to update password.', background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff', color: document.documentElement.classList.contains('dark') ? '#fff' : '#000' });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update password.';
      Swal.fire({ icon: 'error', title: 'Error', text: errorMessage, background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff', color: document.documentElement.classList.contains('dark') ? '#fff' : '#000' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Vendor Details" onClose={() => setViewItem(null)}>
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
        {viewItem && (
          <div className="mt-6 border-t border-gray-200 dark:border-[#2a2d33] pt-6 flex justify-end">
            {isCheckingUser ? (
              <div className="text-sm text-gray-500 font-medium">Checking access...</div>
            ) : vendorUser ? (
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdatePassword(viewItem)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Update Password
                </button>
                {vendorUser.isActive ? (
                  <button
                    onClick={() => handleToggleUserAccess(vendorUser, false)}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-[13px] font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Revoke Access
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleUserAccess(vendorUser, true)}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-[13px] font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Reactivate Access
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleGrantAccess(viewItem)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-5.257A6 6 0 0115 9zm1-4v.01M16 5h.01" />
                </svg>
                Grant Access
              </button>
            )}
          </div>
        )}
      </RightDrawer>

      <CenterModal isOpen={!!grantAccessVendor} title="Grant Vendor Access" onClose={() => !isGranting && setGrantAccessVendor(null)} className="max-w-[450px]">
        {grantAccessVendor && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Enter a password for <strong>{grantAccessVendor.email}</strong>
            </p>
            <div className="relative">
              <input
                type={showGrantPassword ? "text" : "password"}
                className={inputCls}
                placeholder="Enter password"
                value={grantPassword}
                onChange={(e) => setGrantPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setShowGrantPassword(!showGrantPassword)}
              >
                {showGrantPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.29c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 dark:border-[#2a2d33] pt-4">
              <button
                onClick={() => setGrantAccessVendor(null)}
                className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitGrantAccess}
                disabled={isGranting}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isGranting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        )}
      </CenterModal>

      <CenterModal isOpen={!!updatePasswordVendor} title="Update Password" onClose={() => !isUpdatingPassword && setUpdatePasswordVendor(null)} className="max-w-[450px]">
        {updatePasswordVendor && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Enter a new password for <strong>{updatePasswordVendor.email}</strong>
            </p>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                className={inputCls}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.29c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 dark:border-[#2a2d33] pt-4">
              <button
                onClick={() => setUpdatePasswordVendor(null)}
                className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitUpdatePassword}
                disabled={isUpdatingPassword}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </CenterModal>

      <RightDrawer
        isOpen={isFormOpen}
        title={editItem ? 'Edit Vendor' : 'Add New Vendor'}
        onClose={() => {
          setIsFormOpen(false);
          setEditItem(null);
        }}
      >
        <VendorForm
          initialData={editItem}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setEditItem(null);
          }}
        />
      </RightDrawer>

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        {/* Left Side - Search */}
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Right Side - Buttons */}
        <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
          <HeaderButton
            onClick={handleDownloadSample}
            color="gray"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
          >
            Sample
          </HeaderButton>

          {canCreate && (
            <>
              <HeaderButton
                onClick={() => setIsImportModalOpen(true)}
                color="emerald"
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
              >
                Import
              </HeaderButton>

              <Button
                onClick={() => setIsFormOpen(true)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Add Vendor
              </Button>
            </>
          )}
        </div>

      </div>

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        expectedColumns={['ID', 'Name', 'Email', 'Phone', 'Company', 'Address', 'Status', 'Categories']}
      />

      <DataTable
        maxHeight="max-h-none"
        columns={[
          { key: "srno", label: "#", className: "w-12 text-center" },
          { key: "id", label: "Vendor ID", className: "w-32" },
          { key: "name", label: "Company Name" },
          { key: "company", label: "Contact / Company" },
          { key: "email", label: "Email" },
          { key: "status", label: "Status", className: "w-28 text-center" },
          { key: "actions", label: "Actions", className: "w-28 text-center" },
        ]}
        data={suppliersData || []}
        isLoading={loading}
        emptyMessage="No vendors found."
        renderRow={(vendor, i) => (
          <tr key={vendor.id} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
            <td className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">{((meta.currentPage ? meta.currentPage : 1) - 1) * (meta.pageSize ? meta.pageSize : 10) + i + 1}</td>
            <td className="px-4 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{String(vendor.id).slice(-8)}</td>
            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{vendor.name}</td>
            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{vendor.company || '-'}</td>
            <td className="px-4 py-3">{vendor.email}</td>
            <td className="px-4 py-3 text-center">
              <span className={`px-2 py-1 rounded text-[11px] font-bold ${vendor.isActive
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {vendor.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-4 py-3 text-center space-x-3">
              <button onClick={() => setViewItem(vendor)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="View"><EyeIcon /></button>
              {canUpdate && <button onClick={() => { setEditItem(vendor); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit"><EditIcon /></button>}
              {canDelete && <button onClick={() => handleDelete(vendor.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete"><TrashIcon /></button>}
            </td>
          </tr>
        )}
        paginationProps={{
          currentPage: meta.currentPage,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          itemsPerPage: meta.pageSize,
          onPrev: () => handlePageChange(meta.currentPage - 1),
          onNext: () => handlePageChange(meta.currentPage + 1),
          onPageChange: handlePageChange,
          onItemsPerPageChange: handlePageSizeChange,
          itemLabel: "vendors"
        }}
      />
    </div>
  );
}

function VendorForm({ initialData, onSave, onClose }) {
  const { data: productsData } = useProducts();
  const [catSearch, setCatSearch] = useState('');
  const [formData, setFormData] = useState(
    initialData ? {
      ...initialData,
      status: initialData.isActive ? 'Active' : 'Inactive',
      categories: initialData.categories || []
    } : { name: '', company: '', email: '', phone: '', address: '', status: 'Active', categories: [] }
  );

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const availableCategories = useMemo(() => {
    const cats = (productsData || [])
      .map(p => p.category)
      .filter(Boolean);
    return [...new Set(cats)].sort();
  }, [productsData]);

  const filteredCats = useMemo(() => {
    const q = catSearch.toLowerCase().trim();
    if (!q) return availableCategories;
    return availableCategories.filter(cat => cat.toLowerCase().includes(q));
  }, [availableCategories, catSearch]);

  const toggleCategory = (catName) => {
    setFormData(prev => {
      const current = prev.categories || [];
      const updated = current.includes(catName)
        ? current.filter(c => c !== catName)
        : [...current, catName];
      return { ...prev, categories: updated };
    });
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 content-start">
        <Field label="Vendor Company Name">
          <input type="text" className={inputCls} value={formData.name} onChange={set('name')} placeholder="e.g. Ocean Supplies LLC" />
        </Field>

        <Field label="Contact / Company">
          <input type="text" className={inputCls} value={formData.company} onChange={set('company')} placeholder="e.g. Ahmed Khan" />
        </Field>

        <Field label="Email Address">
          <input type="email" className={inputCls} value={formData.email} onChange={set('email')} placeholder="e.g. vendor@example.com" />
        </Field>

        <Field label="Phone">
          <input type="text" className={inputCls} value={formData.phone} onChange={set('phone')} placeholder="e.g. +91 9988776655" />
        </Field>

        <Field label="Address">
          <input type="text" className={inputCls} value={formData.address} onChange={set('address')} placeholder="e.g. London, UK" />
        </Field>

        <Field label="Status">
          <Select
            variant="settings"
            className={inputCls}
            value={formData.status || (formData.isActive ? 'Active' : 'Inactive')}
            onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" }
            ]}
          />
        </Field>

        <div className="sm:col-span-2 flex flex-col gap-2 mt-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Supplied Categories</label>
          {availableCategories.length === 0 ? (
            <div className="border border-dashed border-gray-200 dark:border-[#2a2d36] rounded-xl p-5 flex flex-col items-center justify-center gap-2 bg-gray-50/50 dark:bg-[#0f1117]/30 text-center">
              <svg className="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">No product categories available</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">Add products with categories first to link them here.</p>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search categories to link..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors mb-2 animate-all"
              />
              <div className="border border-gray-200 dark:border-[#2a2d36] rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50/50 dark:bg-[#0f1117]/30">
                {filteredCats.map(cat => {
                  const isSelected = (formData.categories || []).includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all text-left ${isSelected
                        ? "bg-purple-600/10 border-purple-500 text-purple-700 dark:text-white"
                        : "bg-white dark:bg-[#1a1d23] border-gray-200 dark:border-[#2a2d36] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-purple-500 border-purple-500" : "border-gray-400 dark:border-gray-600"
                        }`}>
                        {isSelected && (
                          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-semibold truncate">{cat}</span>
                    </button>
                  );
                })}
                {filteredCats.length === 0 && (
                  <div className="sm:col-span-2 text-center py-4 text-xs text-gray-500 italic">No categories match your search.</div>
                )}
              </div>
            </>
          )}
        </div>
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
