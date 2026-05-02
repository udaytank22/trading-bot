import React, { useState, useEffect } from 'react';
import { mockSettings } from '../data/mockSettings';
import { refreshConfig } from '../config';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    business_name: mockSettings.business_name,
    business_email: mockSettings.business_email,
    seller_email: mockSettings.seller_email,
    seller_name: 'Default Supplier Inc.',
    default_margin_percent: mockSettings.default_margin_percent,
    n8n_webhook_url: mockSettings.n8n_webhook_url
  });

  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      if (window.electronStore) {
        const stored = await window.electronStore.get('settings');
        if (stored) {
          setFormData({
            business_name: stored.businessName || mockSettings.business_name,
            business_email: stored.businessEmail || mockSettings.business_email,
            seller_email: stored.sellerEmail || mockSettings.seller_email,
            seller_name: stored.sellerName || 'Default Supplier Inc.',
            default_margin_percent: stored.defaultMargin || mockSettings.default_margin_percent,
            n8n_webhook_url: stored.n8nBaseUrl || mockSettings.n8n_webhook_url
          });
        }
      }
    }
    loadSettings();
  }, []);

  const resetSettings = async () => {
    if (window.confirm("Are you sure? This cannot be undone.")) {
      if (window.electronStore) {
        await window.electronStore.reset();
      }
      setFormData({
        business_name: mockSettings.business_name,
        business_email: mockSettings.business_email,
        seller_email: mockSettings.seller_email,
        seller_name: 'Default Supplier Inc.',
        default_margin_percent: mockSettings.default_margin_percent,
        n8n_webhook_url: mockSettings.n8n_webhook_url
      });
      await refreshConfig();
      showToast("Settings reset to defaults");
    }
  };

  const handleSave = async () => {
    const margin = Number(formData.default_margin_percent);
    if (isNaN(margin) || margin < 1 || margin > 100) {
      showToast("Margin must be between 1 and 100.");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.business_email) || !emailRegex.test(formData.seller_email)) {
      showToast("Please enter a valid email address.");
      return;
    }

    if (window.electronStore) {
      await window.electronStore.set('settings', {
        businessName: formData.business_name,
        businessEmail: formData.business_email,
        sellerEmail: formData.seller_email,
        sellerName: formData.seller_name,
        defaultMargin: formData.default_margin_percent,
        n8nBaseUrl: formData.n8n_webhook_url
      });
    }

    await refreshConfig();
    showToast("Settings saved!");
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  return (
    <div className="flex flex-col w-full h-full pb-8">
      <div className="flex-1 w-full max-w-[600px] mx-auto mt-6">
        <div className="bg-[#1a1d23] border border-[#2a2d33] rounded-xl shadow-lg p-8">
          
          {/* SECTION 1 - Business Info */}
          <div className="mb-8">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Business Information</h3>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm text-gray-300 font-medium mb-1.5 focus-within:text-purple-400 transition-colors">Business Name</label>
                <input 
                  type="text" 
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  className="w-full bg-[#0f1117] border border-[#2a2d36] rounded-lg h-[48px] px-4 text-[14px] text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50"
                />
              </div>
              <div className="flex gap-5">
                <div className="flex-1">
                  <label className="block text-sm text-gray-300 font-medium mb-1.5 focus-within:text-purple-400 transition-colors">Your Email Address</label>
                  <input 
                    type="email" 
                    value={formData.business_email}
                    onChange={(e) => setFormData({...formData, business_email: e.target.value})}
                    className="w-full bg-[#0f1117] border border-[#2a2d36] rounded-lg h-[48px] px-4 text-[14px] text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div className="w-[150px]">
                  <label className="block text-sm text-gray-300 font-medium mb-1.5 focus-within:text-purple-400 transition-colors">Default Margin %</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1" max="100"
                      value={formData.default_margin_percent}
                      onChange={(e) => setFormData({...formData, default_margin_percent: e.target.value})}
                      className="w-full bg-[#0f1117] border border-[#2a2d36] rounded-lg h-[48px] pl-4 pr-9 text-[14px] text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-[#2a2d36] mb-8" />

          {/* SECTION 2 - Seller Info */}
          <div className="mb-8">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Seller Configuration</h3>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm text-gray-300 font-medium mb-1.5 focus-within:text-purple-400 transition-colors">Seller Name / Company</label>
                <input 
                  type="text" 
                  value={formData.seller_name}
                  onChange={(e) => setFormData({...formData, seller_name: e.target.value})}
                  className="w-full bg-[#0f1117] border border-[#2a2d36] rounded-lg h-[48px] px-4 text-[14px] text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 font-medium mb-1.5 focus-within:text-purple-400 transition-colors">Seller Email Address</label>
                <input 
                  type="email" 
                  value={formData.seller_email}
                  onChange={(e) => setFormData({...formData, seller_email: e.target.value})}
                  className="w-full bg-[#0f1117] border border-[#2a2d36] rounded-lg h-[48px] px-4 text-[14px] text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50"
                />
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-[#2a2d36] mb-8" />

          {/* SECTION 3 - Bot Connection */}
          <div className="mb-8">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">n8n Bot Connection</h3>
            <div>
              <label className="block text-sm text-gray-300 font-medium mb-1.5 focus-within:text-purple-400 transition-colors">n8n Webhook URL</label>
              <input 
                type="text" 
                value={formData.n8n_webhook_url}
                onChange={(e) => setFormData({...formData, n8n_webhook_url: e.target.value})}
                className="w-full bg-[#0f1117] border border-[#2a2d36] rounded-lg h-[48px] px-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm font-mono focus:ring-1 focus:ring-purple-500/50"
              />
            </div>
          </div>

          <div className="w-full h-px bg-[#2a2d36] mb-8" />

          {/* SECTION 4 - Danger Zone */}
          <div className="mb-10">
            <h3 className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-4">Danger Zone</h3>
            <button 
              onClick={resetSettings}
              className="px-6 h-[48px] border-2 border-red-500/40 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500/10 hover:border-red-500 hover:text-red-300 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/30 w-full tracking-wide"
            >
              Reset All Settings
            </button>
          </div>

          {/* SAVE BUTTON */}
          <button 
            id="save-settings-btn"
            onClick={handleSave}
            className="w-full h-[48px] bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wide rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-purple-500/40 shadow-lg shadow-purple-500/20 active:scale-[0.99]"
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed bottom-8 right-8 bg-emerald-500 text-white px-5 py-3.5 rounded-lg shadow-xl shadow-emerald-500/20 flex items-center gap-3 transform transition-all duration-300 border border-emerald-400/50 ${toastMsg ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="font-bold text-sm tracking-wide mr-1">{toastMsg}</span>
      </div>
    </div>
  );
}
