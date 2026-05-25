import React, { useState, useEffect } from 'react';
import { mockSettings } from '../data/mockSettings';
import { refreshConfig } from '../config';
import Toast from '../components/ui/toast';
import { useToast } from '../hooks/useToast';
import { Select } from '../components/ui';
import { confirmAction } from '../utils/swal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AccountPage from './accountPage';

const DEFAULT_FORM = {
  business_name: mockSettings.business_name,
  business_email: mockSettings.business_email,
  seller_email: mockSettings.seller_email,
  seller_name: 'Default Supplier Inc.',
  default_margin_percent: mockSettings.default_margin_percent,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── UI Components ───────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-300 font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-[36px] px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50';

function RightDrawer({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#1a1d23] shadow-2xl flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-[#2a2d33] animate-fade-in">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            {title}
          </h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

function CenterModal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[95vw] xl:max-w-[1400px] bg-white dark:bg-[#1a1d23] shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-[#2a2d33]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2d33] flex items-center justify-between bg-gray-50 dark:bg-[#1a1d23]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[85vh] overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

function ViewDetails({ item, onClose }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-4">
        {Object.entries(item).map(([key, value]) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 border-b border-gray-50 dark:border-[#2a2d33]/50 pb-3 last:border-0 last:pb-0">
            <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider w-1/3">
              {key}
            </span>
            <span className="text-[14px] text-gray-900 dark:text-white font-medium flex-1">
              {value}
            </span>
          </div>
        ))}
      </div>
      {/* <div className="mt-8 flex justify-end">
        <button onClick={onClose} className="px-5 py-2 text-[13px] font-bold text-gray-700 bg-gray-100 dark:bg-[#2a2d36] dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
          Close
        </button>
      </div> */}
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────────────────── */
const EyeIcon = () => <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EditIcon = () => <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

/* ── Main page ───────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    // { id: 'general', label: 'General' },
    { id: 'products', label: 'Products' },
    { id: 'clients', label: 'Clients' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'documents', label: 'Documents' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'accounts', label: 'Accounts' },
  ];

  return (
    <div className="flex flex-col w-full h-full pb-4">
      <div className="w-full flex-1 flex flex-col mt-4">

        {/* Tab Bar */}
        {/* Tab Bar */}
        <div className="bg-white dark:bg-[#1a1d23] rounded-2xl shadow-sm p-2 border border-gray-100 dark:border-[#2a2d33] mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none min-w-[120px] px-4 py-2.5 text-[13px] font-semibold rounded-xl whitespace-nowrap transition-all duration-200 border
          ${activeTab === tab.id
                    ? 'bg-[#edf5ff] text-[#0070f3] border-[#bfdbfe] dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 shadow-sm'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-white'
                  }
        `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {/* {activeTab === 'general' && <GeneralSettingsTab />} */}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'vendors' && <VendorsTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'reporting' && <ReportingTab />}
        {activeTab === 'accounts' && <AccountPage />}
      </div>
    </div>
  );
}

/* ── General Settings ────────────────────────────────────────────── */
function GeneralSettingsTab() {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const { toast, showToast } = useToast(2500);

  useEffect(() => {
    const stored = localStorage.getItem('settings');
    if (!stored) return;
    try {
      const s = JSON.parse(stored);
      setFormData({
        business_name: s.businessName ?? DEFAULT_FORM.business_name,
        business_email: s.businessEmail ?? DEFAULT_FORM.business_email,
        seller_email: s.sellerEmail ?? DEFAULT_FORM.seller_email,
        seller_name: s.sellerName ?? DEFAULT_FORM.seller_name,
        default_margin_percent: s.defaultMargin ?? DEFAULT_FORM.default_margin_percent,
      });
    } catch { }
  }, []);

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    const margin = Number(formData.default_margin_percent);
    if (isNaN(margin) || margin < 1 || margin > 100) {
      showToast('Margin must be between 1 and 100.', 'error'); return;
    }
    if (!EMAIL_REGEX.test(formData.business_email) || !EMAIL_REGEX.test(formData.seller_email)) {
      showToast('Please enter a valid email address.', 'error'); return;
    }
    localStorage.setItem('settings', JSON.stringify({
      businessName: formData.business_name,
      businessEmail: formData.business_email,
      sellerEmail: formData.seller_email,
      sellerName: formData.seller_name,
      defaultMargin: formData.default_margin_percent,
    }));
    await refreshConfig();
    showToast('Settings saved!', 'success');
  };

  const handleReset = async () => {
    const isConfirmed = await confirmAction({
      title: 'Reset Settings?',
      text: "Are you sure? This cannot be undone.",
      confirmButtonText: 'Yes, reset them!'
    });
    if (!isConfirmed) return;

    localStorage.removeItem('settings');
    setFormData(DEFAULT_FORM);
    await refreshConfig();
    showToast('Settings reset to defaults', 'success');
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm p-6 flex flex-col gap-6 transition-colors duration-300 animate-fade-in flex-1">
      <Toast message={toast.message} type={toast.type} />

      <section>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Business Information</h3>
        <div className="flex flex-col gap-5">
          <Field label="Business Name">
            <input type="text" className={inputCls} value={formData.business_name} onChange={set('business_name')} />
          </Field>
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1">
              <Field label="Your Email Address">
                <input type="email" className={inputCls} value={formData.business_email} onChange={set('business_email')} />
              </Field>
            </div>
            <div className="sm:w-[150px]">
              <Field label="Default Margin %">
                <div className="relative">
                  <input
                    type="number" min="1" max="100"
                    className={inputCls + ' pr-9'}
                    value={formData.default_margin_percent}
                    onChange={set('default_margin_percent')}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">%</span>
                </div>
              </Field>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-100 dark:bg-[#2a2d36]" />

      <section>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Seller Configuration</h3>
        <div className="flex flex-col gap-5">
          <Field label="Seller Name / Company">
            <input type="text" className={inputCls} value={formData.seller_name} onChange={set('seller_name')} />
          </Field>
          <Field label="Seller Email Address">
            <input type="email" className={inputCls} value={formData.seller_email} onChange={set('seller_email')} />
          </Field>
        </div>
      </section>

      <div className="h-px bg-[#2a2d36]" />

      <section>
        <h3 className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-4">Danger Zone</h3>
        <button onClick={handleReset} className="w-full h-[36px] border-2 border-red-500/40 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/10 hover:border-red-500 hover:text-red-300 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/30 tracking-wide">
          Reset All Settings
        </button>
      </section>

      <button id="save-settings-btn" onClick={handleSave} className="w-full h-[36px] bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wide rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-purple-500/40 shadow-sm active:scale-[0.99] mt-2">
        Save Settings
      </button>
    </div>
  );
}

/* ── Products Tab & Form ─────────────────────────────────────────── */
function ProductsTab() {
  const [products, setProducts] = useState([
    { id: 'PROD-001', name: 'Industrial Widget A', category: 'Widgets', price: '$120.00', stock: 450 },
    { id: 'PROD-002', name: 'Heavy Duty Bearing', category: 'Mechanical', price: '$45.50', stock: 1200 },
    { id: 'PROD-003', name: 'Conveyor Belt 5m', category: 'Handling', price: '$350.00', stock: 15 },
    { id: 'PROD-004', name: 'Sensor Array Module', category: 'Electronics', price: '$85.00', stock: 85 },
  ]);

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Product?',
      text: "Are you sure you want to delete this product? This action cannot be undone.",
      confirmButtonText: 'Yes, delete it!'
    });
    if (isConfirmed) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSave = (formData) => {
    if (editItem) {
      setProducts(products.map(p => p.id === editItem.id ? { ...p, ...formData } : p));
    } else {
      setProducts([...products, { id: `PROD-00${products.length + 1}`, ...formData }]);
    }
    setIsFormOpen(false);
    setEditItem(null);
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Product Details" onClose={() => setViewItem(null)}>
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
      </RightDrawer>

      <RightDrawer isOpen={isFormOpen} title={editItem ? 'Edit Product' : 'Add New Product'} onClose={() => { setIsFormOpen(false); setEditItem(null); }}>
        <ProductForm initialData={editItem} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditItem(null); }} />
      </RightDrawer>

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Products List</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input type="text" placeholder="Search products..." className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors" />
          <button onClick={() => setIsFormOpen(true)} className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors">
            + Add Product
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 dark:bg-[#0f1117]/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-[#2a2d33] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3">Product ID</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33] text-gray-700 dark:text-gray-300">
            {products.map(prod => (
              <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400">{prod.id}</td>
                <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{prod.name}</td>
                <td className="px-5 py-3"><span className="px-2 py-1 bg-gray-100 dark:bg-[#2a2d36] rounded text-[11px] font-bold text-gray-600 dark:text-gray-400">{prod.category}</span></td>
                <td className="px-5 py-3">{prod.price}</td>
                <td className="px-5 py-3">{prod.stock}</td>
                <td className="px-5 py-3 text-right space-x-3">
                  <button onClick={() => setViewItem(prod)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="View"><EyeIcon /></button>
                  <button onClick={() => { setEditItem(prod); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit"><EditIcon /></button>
                  <button onClick={() => handleDelete(prod.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete"><TrashIcon /></button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(initialData || { name: '', category: '', price: '', stock: '' });
  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex-1 flex flex-col gap-5">
        <Field label="Name"><input type="text" className={inputCls} value={formData.name} onChange={set('name')} placeholder="e.g. Industrial Widget A" /></Field>
        <Field label="Category"><input type="text" className={inputCls} value={formData.category} onChange={set('category')} placeholder="e.g. Mechanical" /></Field>
        <Field label="Price"><input type="text" className={inputCls} value={formData.price} onChange={set('price')} placeholder="e.g. $120.00" /></Field>
        <Field label="Stock"><input type="number" className={inputCls} value={formData.stock} onChange={set('stock')} placeholder="e.g. 450" /></Field>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
        <button onClick={() => onSave(formData)} className="px-5 py-2 text-[13px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors">Save Details</button>
      </div>
    </div>
  );
}

/* ── Clients Tab & Form ──────────────────────────────────────────── */
function ClientsTab() {
  const [clients, setClients] = useState([
    { id: 'CLI-001', name: 'Acme Corp', contact: 'John Doe', email: 'john@acme.com', status: 'Active' },
    { id: 'CLI-002', name: 'Global Logistics Ltd', contact: 'Sarah Connor', email: 'sarah@global.com', status: 'Active' },
    { id: 'CLI-003', name: 'Initech', contact: 'Bill Lumbergh', email: 'bill@initech.com', status: 'Inactive' },
    { id: 'CLI-004', name: 'Umbrella Corporation', contact: 'Albert Wesker', email: 'albert@umbrella.com', status: 'Active' },
  ]);

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Client?',
      text: "Are you sure you want to delete this client? This action cannot be undone.",
      confirmButtonText: 'Yes, delete it!'
    });
    if (isConfirmed) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  const handleSave = (formData) => {
    if (editItem) {
      setClients(clients.map(c => c.id === editItem.id ? { ...c, ...formData } : c));
    } else {
      setClients([...clients, { id: `CLI-00${clients.length + 1}`, ...formData }]);
    }
    setIsFormOpen(false);
    setEditItem(null);
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Client Details" onClose={() => setViewItem(null)}>
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
      </RightDrawer>

      <RightDrawer isOpen={isFormOpen} title={editItem ? 'Edit Client' : 'Add New Client'} onClose={() => { setIsFormOpen(false); setEditItem(null); }}>
        <ClientForm initialData={editItem} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditItem(null); }} />
      </RightDrawer>

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Clients List</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input type="text" placeholder="Search clients..." className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors" />
          <button onClick={() => setIsFormOpen(true)} className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors">
            + Add Client
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 dark:bg-[#0f1117]/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-[#2a2d33] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3">Client ID</th>
              <th className="px-5 py-3">Company Name</th>
              <th className="px-5 py-3">Contact Person</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33] text-gray-700 dark:text-gray-300">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400">{client.id}</td>
                <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{client.name}</td>
                <td className="px-5 py-3">{client.contact}</td>
                <td className="px-5 py-3">{client.email}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded text-[11px] font-bold ${client.status === 'Active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>{client.status}</span>
                </td>
                <td className="px-5 py-3 text-right space-x-3">
                  <button onClick={() => setViewItem(client)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="View"><EyeIcon /></button>
                  <button onClick={() => { setEditItem(client); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit"><EditIcon /></button>
                  <button onClick={() => handleDelete(client.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete"><TrashIcon /></button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No clients found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VendorsTab() {
  const [vendors, setVendors] = useState([
    { id: 'VEN-001', name: 'Ocean Supplies LLC', contact: 'Ahmed Khan', email: 'ahmed@oceansupplies.com', status: 'Active' },
    { id: 'VEN-002', name: 'Marine Parts Co.', contact: 'Robert Smith', email: 'robert@marineparts.com', status: 'Active' },
    { id: 'VEN-003', name: 'Global Ship Chandlers', contact: 'Ali Hassan', email: 'ali@globalship.com', status: 'Inactive' },
    { id: 'VEN-004', name: 'Portside Traders', contact: 'James Miller', email: 'james@portside.com', status: 'Active' },
  ]);

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Vendor?',
      text: "Are you sure you want to delete this vendor? This action cannot be undone.",
      confirmButtonText: 'Yes, delete it!'
    });

    if (isConfirmed) {
      setVendors(vendors.filter(v => v.id !== id));
    }
  };

  const handleSave = (formData) => {
    if (editItem) {
      setVendors(vendors.map(v => v.id === editItem.id ? { ...v, ...formData } : v));
    } else {
      setVendors([
        ...vendors,
        { id: `VEN-${String(vendors.length + 1).padStart(3, '0')}`, ...formData }
      ]);
    }

    setIsFormOpen(false);
    setEditItem(null);
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Vendor Details" onClose={() => setViewItem(null)}>
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
      </RightDrawer>

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

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vendors List</h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search vendors..."
            className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          />

          <button
            onClick={() => setIsFormOpen(true)}
            className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors"
          >
            + Add Vendor
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 dark:bg-[#0f1117]/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-[#2a2d33] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3">Vendor ID</th>
              <th className="px-5 py-3">Company Name</th>
              <th className="px-5 py-3">Contact Person</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33] text-gray-700 dark:text-gray-300">
            {vendors.map(vendor => (
              <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400">{vendor.id}</td>
                <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{vendor.name}</td>
                <td className="px-5 py-3">{vendor.contact}</td>
                <td className="px-5 py-3">{vendor.email}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded text-[11px] font-bold ${vendor.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {vendor.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right space-x-3">
                  <button onClick={() => setViewItem(vendor)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="View"><EyeIcon /></button>
                  <button onClick={() => { setEditItem(vendor); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit"><EditIcon /></button>
                  <button onClick={() => handleDelete(vendor.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete"><TrashIcon /></button>
                </td>
              </tr>
            ))}

            {vendors.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">No vendors found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VendorForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(
    initialData || { name: '', contact: '', email: '', status: 'Active' }
  );

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex-1 flex flex-col gap-5">
        <Field label="Vendor Company Name">
          <input type="text" className={inputCls} value={formData.name} onChange={set('name')} placeholder="e.g. Ocean Supplies LLC" />
        </Field>

        <Field label="Contact Person">
          <input type="text" className={inputCls} value={formData.contact} onChange={set('contact')} placeholder="e.g. Ahmed Khan" />
        </Field>

        <Field label="Email Address">
          <input type="email" className={inputCls} value={formData.email} onChange={set('email')} placeholder="e.g. vendor@example.com" />
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

function ClientForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(initialData || { name: '', contact: '', email: '', status: 'Active' });
  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex-1 flex flex-col gap-5">
        <Field label="Company Name"><input type="text" className={inputCls} value={formData.name} onChange={set('name')} placeholder="e.g. Acme Corp" /></Field>
        <Field label="Contact Person"><input type="text" className={inputCls} value={formData.contact} onChange={set('contact')} placeholder="e.g. John Doe" /></Field>
        <Field label="Email Address"><input type="email" className={inputCls} value={formData.email} onChange={set('email')} placeholder="e.g. john@acme.com" /></Field>
        <Field label="Status">
          <Select variant="settings"
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
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
        <button onClick={() => onSave(formData)} className="px-5 py-2 text-[13px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors">Save Details</button>
      </div>
    </div>
  );
}

/* ── Reporting Tab ───────────────────────────────────────────────── */
function ReportingTab() {
  const [clientFilter, setClientFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activeSubTab, setActiveSubTab] = useState('clients');
  const [detailTarget, setDetailTarget] = useState(null);

  const pipelineData = [
    {
      id: 'INQ-1001',
      client: 'Acme Corp',
      employee: 'John Doe',
      received: '24/01/2026 09:00 AM',
      rfqSent: '24/01/2026 10:00 AM',
      supplierResponse: '25/01/2026 01:30 PM',
      quotationSent: '25/01/2026 02:00 PM',
      clientResponse: '25/01/2026 10:00 PM',
      poReceived: '26/01/2026 09:15 AM',
      status: 'Approved'
    },
    {
      id: 'INQ-1002',
      client: 'Global Logistics Ltd',
      employee: 'Sarah Connor',
      received: '26/01/2026 11:30 AM',
      rfqSent: '26/01/2026 01:15 PM',
      supplierResponse: '27/01/2026 08:30 AM',
      quotationSent: '27/01/2026 09:45 AM',
      clientResponse: '28/01/2026 04:20 PM',
      poReceived: '-',
      status: 'Pending'
    },
    {
      id: 'INQ-1003',
      client: 'Umbrella Corporation',
      employee: 'John Doe',
      received: '27/01/2026 08:00 AM',
      rfqSent: '27/01/2026 09:30 AM',
      supplierResponse: '28/01/2026 10:00 AM',
      quotationSent: '28/01/2026 11:00 AM',
      clientResponse: '29/01/2026 01:00 PM',
      poReceived: '-',
      status: 'Rejected'
    },
    {
      id: 'INQ-1004',
      client: 'Acme Corp',
      employee: 'Sarah Connor',
      received: '29/01/2026 10:15 AM',
      rfqSent: '29/01/2026 12:00 PM',
      supplierResponse: '30/01/2026 09:30 AM',
      quotationSent: '30/01/2026 11:00 AM',
      clientResponse: '30/01/2026 04:30 PM',
      poReceived: '31/01/2026 09:00 AM',
      status: 'Approved'
    },
    {
      id: 'INQ-1005',
      client: 'Acme Corp',
      employee: 'John Doe',
      received: '30/01/2026 02:45 PM',
      rfqSent: '30/01/2026 03:30 PM',
      supplierResponse: '31/01/2026 09:00 AM',
      quotationSent: '31/01/2026 10:15 AM',
      clientResponse: '31/01/2026 02:00 PM',
      poReceived: '-',
      status: 'Rejected'
    },
    {
      id: 'INQ-1006',
      client: 'Global Logistics Ltd',
      employee: 'John Doe',
      received: '31/01/2026 09:20 AM',
      rfqSent: '31/01/2026 10:10 AM',
      supplierResponse: '01/02/2026 08:45 AM',
      quotationSent: '01/02/2026 09:50 AM',
      clientResponse: '01/02/2026 05:20 PM',
      poReceived: '02/02/2026 10:10 AM',
      status: 'Approved'
    }
  ];

  const parseReceivedDate = (value) => {
    if (!value) return null;
    const [datePart, timePart, ampm] = value.split(' ');
    if (!datePart || !timePart) return null;
    const [day, month, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    let hour = Number(hours);
    const minute = Number(minutes);
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return new Date(Number(year), Number(month) - 1, Number(day), hour, minute);
  };

  const inDateRange = (item) => {
    const itemDate = parseReceivedDate(item.received);
    if (!itemDate) return true;
    if (dateRange.start) {
      const start = new Date(`${dateRange.start}T00:00:00`);
      if (itemDate < start) return false;
    }
    if (dateRange.end) {
      const end = new Date(`${dateRange.end}T23:59:59`);
      if (itemDate > end) return false;
    }
    return true;
  };

  const filteredData = pipelineData.filter(d =>
    (clientFilter === 'All' || d.client === clientFilter) &&
    (employeeFilter === 'All' || d.employee === employeeFilter) &&
    inDateRange(d)
  );

  const summaryData = Object.values(
    filteredData.reduce((acc, item) => {
      const key = activeSubTab === 'clients' ? item.client : item.employee;
      if (!acc[key]) acc[key] = { key, completed: 0, failed: 0, total: 0 };
      acc[key].total += 1;
      if (item.status === 'Approved') acc[key].completed += 1;
      if (item.status === 'Rejected') acc[key].failed += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const detailHistory = detailTarget
    ? filteredData.filter(item =>
      detailTarget.type === 'clients'
        ? item.client === detailTarget.key
        : item.employee === detailTarget.key
    )
    : [];

  const entityLabel = activeSubTab === 'clients' ? 'Client' : 'Employee';

  const handleDownloadPDF = () => {
    if (filteredData.length === 0) {
      alert('No data available to export.');
      return;
    }

    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text('Detailed Pipeline Timeline Report', 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Filters: Client = ${clientFilter} | Employee = ${employeeFilter}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [['ID', 'Client Name', 'Employee', 'Inquiry Received', 'RFQ Sent', 'Supplier Resp.', 'Quotation Sent', 'Client Resp.', 'Status']],
      body: filteredData.map(d => [
        d.id,
        d.client,
        d.employee,
        d.received,
        d.rfqSent,
        d.supplierResponse,
        d.quotationSent,
        d.clientResponse,
        d.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246], fontSize: 9 },
      bodyStyles: { fontSize: 8 }
    });

    doc.save(`Pipeline_Timeline_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reporting Overview</h2>
          <button
            type="button"
            onClick={() => setActiveSubTab('clients')}
            className={`px-4 py-2 rounded-lg font-bold text-[13px] ${activeSubTab === 'clients' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-[#16191f] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2a2d33]'}`}
          >
            Clients
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('employees')}
            className={`px-4 py-2 rounded-lg font-bold text-[13px] ${activeSubTab === 'employees' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-[#16191f] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2a2d33]'}`}
          >
            Employees
          </button>
        </div>
        <button onClick={handleDownloadPDF} className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download PDF
        </button>
      </div>

      <div className="p-5 border-b border-gray-100 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#0f1117]/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Filter by Client">
            <Select
              variant="settings"
              className={inputCls}
              value={clientFilter}
              onChange={(val) => setClientFilter(val)}
              options={[
                { value: 'All', label: 'All Clients' },
                { value: 'Acme Corp', label: 'Acme Corp' },
                { value: 'Global Logistics Ltd', label: 'Global Logistics Ltd' },
                { value: 'Umbrella Corporation', label: 'Umbrella Corporation' }
              ]}
            />
          </Field>
          <Field label="Filter by Employee">
            <Select
              variant="settings"
              className={inputCls}
              value={employeeFilter}
              onChange={(val) => setEmployeeFilter(val)}
              options={[
                { value: 'All', label: 'All Employees' },
                { value: 'John Doe', label: 'John Doe' },
                { value: 'Sarah Connor', label: 'Sarah Connor' }
              ]}
            />
          </Field>
          <Field label="Start Date (Inquiry Received)">
            <input
              type="date"
              className={inputCls}
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </Field>
          <Field label="End Date">
            <input
              type="date"
              className={inputCls}
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </Field>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-[13px] whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-[#0f1117]/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-[#2a2d33] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3">{entityLabel}</th>
              <th className="px-4 py-3">Completed Deals</th>
              <th className="px-4 py-3">Failed Deals</th>
              <th className="px-4 py-3">Total Inquiries</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33] text-gray-700 dark:text-gray-300">
            {summaryData.map(item => (
              <tr key={item.key} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{item.key}</td>
                <td className="px-4 py-3">{item.completed}</td>
                <td className="px-4 py-3">{item.failed}</td>
                <td className="px-4 py-3">{item.total}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setDetailTarget({ type: activeSubTab, key: item.key })}
                    className="text-purple-600 dark:text-purple-300 font-semibold hover:underline"
                  >
                    View history
                  </button>
                </td>
              </tr>
            ))}
            {summaryData.length === 0 && (
              <tr><td colSpan="5" className="text-center py-8 text-gray-500">No data found for the selected filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <CenterModal
        isOpen={!!detailTarget}
        title={detailTarget ? `${detailTarget.key} History` : 'History'}
        onClose={() => setDetailTarget(null)}
      >
        {detailTarget && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{detailTarget.key} inquiry history</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Showing all inquiries for this {detailTarget.type === 'clients' ? 'client' : 'employee'}.</p>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {detailHistory.length} record{detailHistory.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-[#0f1117]/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-[#2a2d33] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Inquiry ID</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Inquiry Received</th>
                    <th className="px-4 py-3">RFQ Sent</th>
                    <th className="px-4 py-3">Supplier Resp.</th>
                    <th className="px-4 py-3">Quotation Sent</th>
                    <th className="px-4 py-3">Client Resp.</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33] text-gray-700 dark:text-gray-300">
                  {detailHistory.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-purple-600 dark:text-purple-400">{item.id}</td>
                      <td className="px-4 py-3">{item.client}</td>
                      <td className="px-4 py-3">{item.employee}</td>
                      <td className="px-4 py-3">{item.received}</td>
                      <td className="px-4 py-3">{item.rfqSent}</td>
                      <td className="px-4 py-3">{item.supplierResponse}</td>
                      <td className="px-4 py-3">{item.quotationSent}</td>
                      <td className="px-4 py-3">{item.clientResponse}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          item.status === 'Pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {detailHistory.length === 0 && (
                    <tr><td colSpan="9" className="text-center py-8 text-gray-500">No history records.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CenterModal>
    </div>
  );
}

function DocumentsTab() {
  const [documents, setDocuments] = useState([
    {
      id: 'DOC-001',
      name: 'Invoice.pdf',
      category: 'Invoice',
      type: 'PDF',
      uploadedBy: 'Admin',
      uploadedDate: '23/05/2026',
      status: 'Active'
    },
    {
      id: 'DOC-002',
      name: 'Quotation.xlsx',
      category: 'Quotation',
      type: 'Excel',
      uploadedBy: 'John Doe',
      uploadedDate: '22/05/2026',
      status: 'Active'
    },
    {
      id: 'DOC-003',
      name: 'Purchase Order.docx',
      category: 'PO',
      type: 'Word',
      uploadedBy: 'Sarah Connor',
      uploadedDate: '21/05/2026',
      status: 'Inactive'
    }
  ]);

  const [viewItem, setViewItem] = useState(null);

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Document?',
      text: 'Are you sure you want to delete this document?',
      confirmButtonText: 'Yes, delete it!'
    });

    if (isConfirmed) {
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
      <RightDrawer
        isOpen={!!viewItem}
        title="Document Details"
        onClose={() => setViewItem(null)}
      >
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
      </RightDrawer>

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Documents List
        </h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          />

          <button className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors">
            + Add Document
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 dark:bg-[#0f1117]/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-[#2a2d33] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3">Document ID</th>
              <th className="px-5 py-3">Document Name</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Uploaded By</th>
              <th className="px-5 py-3">Uploaded Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33] text-gray-700 dark:text-gray-300">
            {documents.map(doc => (
              <tr
                key={doc.id}
                className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400">
                  {doc.id}
                </td>

                <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">
                  {doc.name}
                </td>

                <td className="px-5 py-3">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-[#2a2d36] rounded text-[11px] font-bold text-gray-600 dark:text-gray-400">
                    {doc.category}
                  </span>
                </td>

                <td className="px-5 py-3">{doc.type}</td>
                <td className="px-5 py-3">{doc.uploadedBy}</td>
                <td className="px-5 py-3">{doc.uploadedDate}</td>

                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-1 rounded text-[11px] font-bold ${doc.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                  >
                    {doc.status}
                  </span>
                </td>

                <td className="px-5 py-3 text-right space-x-3">
                  <button
                    onClick={() => setViewItem(doc)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="View"
                  >
                    <EyeIcon />
                  </button>

                  <button
                    className="text-blue-500 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <EditIcon />
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}

            {documents.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}