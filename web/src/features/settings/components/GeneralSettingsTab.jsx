import React, { useState, useEffect } from 'react';
import { mockSettings } from '@data/mockSettings';
import { refreshConfig } from '@/config.js';
import Toast from '@components/ui/toast';
import { useToast } from '@hooks/useToast';
import { confirmAction } from '@utils/swal';
import { Field, inputCls } from './shared';

const DEFAULT_FORM = {
  business_name: mockSettings.business_name,
  business_email: mockSettings.business_email,
  seller_email: mockSettings.seller_email,
  seller_name: 'Default Supplier Inc.',
  default_margin_percent: mockSettings.default_margin_percent,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function GeneralSettingsTab() {
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
