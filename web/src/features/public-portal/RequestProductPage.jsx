import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  User, Mail, Phone, Building2, Ship, Calendar, FileText, 
  Plus, Trash2, ArrowRight, ArrowLeft, Send, CheckCircle2, 
  HelpCircle, AlertCircle
} from 'lucide-react';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001').trim();

export default function RequestProductPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    company: '',
    vesselName: '',
    imoNumber: '',
    referenceNumber: '',
    expectedDeliveryDate: '',
    remarks: '',
    items: [{ description: '', quantity: 1, unit: 'MT' }]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Items Management
  const handleItemChange = (index, field, value) => {
    const nextItems = [...formData.items];
    nextItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: nextItems }));
    
    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`item_${index}_${field}`];
        return next;
      });
    }
  };

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit: 'MT' }]
    }));
  };

  const removeItemRow = (index) => {
    if (formData.items.length === 1) return;
    const nextItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: nextItems }));
  };

  // Step Validation
  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.clientName.trim()) newErrors.clientName = 'Full name is required';
      if (!formData.clientEmail.trim()) {
        newErrors.clientEmail = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
        newErrors.clientEmail = 'Enter a valid email address';
      }
    } else if (currentStep === 2) {
      // Shipping specs are optional, but if date is filled it must be in the future
      if (formData.expectedDeliveryDate) {
        const selected = new Date(formData.expectedDeliveryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected < today) {
          newErrors.expectedDeliveryDate = 'Delivery date cannot be in the past';
        }
      }
    } else if (currentStep === 3) {
      formData.items.forEach((item, index) => {
        if (!item.description.trim()) {
          newErrors[`item_${index}_description`] = 'Description is required';
        }
        if (!item.quantity || parseInt(item.quantity) <= 0) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/inquiries/public`, formData);
      setLoading(false);

      if (response.data?.success) {
        const inqNumber = response.data.data?.inquiryNumber || 'Request';
        
        Swal.fire({
          title: 'Requirement Registered!',
          html: `
            <div class="text-left space-y-3 font-sans">
              <p class="text-slate-600 dark:text-slate-300">Your requirement has been saved successfully.</p>
              <div class="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between border border-slate-200">
                <span class="text-xs font-bold text-slate-500 uppercase">Inquiry ID:</span>
                <span class="text-lg font-black text-indigo-600 dark:text-indigo-400">${inqNumber}</span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed mt-2">
                Our global sourcing managers have been notified. We will verify stock availability, initiate supplier RFQs, and compile a finalized margin sheet shortly.
              </p>
            </div>
          `,
          icon: 'success',
          background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937',
          confirmButtonColor: '#4f46e5',
          confirmButtonText: 'Sourcing Hub Access'
        }).then(() => {
          navigate('/login');
        });
      } else {
        throw new Error(response.data?.message || 'Failed to submit request');
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      Swal.fire({
        title: 'Submission Error',
        text: err.response?.data?.message || err.message || 'An error occurred while submitting your requirement. Please check the inputs.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-tr from-[#05070e] via-[#0d122b] to-[#080a18] relative overflow-hidden select-none">
      
      {/* Decorative Blur Spheres */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00d2ff]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#4f46e5]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Portal Header */}
      <div className="w-full max-w-4xl text-center mb-8 z-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase bg-gradient-to-r from-cyan-400 via-indigo-400 to-indigo-500 bg-clip-text text-transparent">
          Global Sourcing Portal
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
          Submit your product requirement specifications. Our automated desk matches logistics, verifies warehousing stocks, and generates custom RFQs.
        </p>
      </div>

      {/* Main Glass Card Form */}
      <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 z-10 transition-all duration-300 relative">
        
        {/* Stepper Header */}
        <div className="flex justify-between items-center mb-10 max-w-md mx-auto relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
          <div className="absolute left-0 top-1/2 h-0.5 bg-indigo-500 -translate-y-1/2 transition-all duration-300 z-0" style={{ width: `${((step - 1) / 2) * 100}%` }} />

          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => step > num && setStep(num)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative z-10 transition-all duration-300 focus:outline-none ${
                step === num 
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 scale-110 shadow-lg shadow-indigo-500/20' 
                  : step > num
                  ? 'bg-indigo-500 text-white shadow'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
              <span className="absolute -bottom-6 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap text-slate-400 hidden sm:inline">
                {num === 1 ? 'Contact Details' : num === 2 ? 'Shipping & Specs' : 'Line Items'}
              </span>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          
          {/* STEP 1: CONTACT DETAILS */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-semibold text-white">Client Information</h3>
                <p className="text-xs text-slate-400">Please provide your corporate credentials for dealer validation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Client Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    required
                    value={formData.clientName}
                    onChange={handleInputChange}
                    className={`block w-full px-4 py-3.5 bg-slate-950/80 border ${errors.clientName ? 'border-red-500' : 'border-slate-800'} rounded-2xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all`}
                    placeholder="Enter your name"
                  />
                  {errors.clientName && <p className="text-xs font-semibold text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.clientName}</p>}
                </div>

                {/* Client Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" /> Corporate Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="clientEmail"
                    required
                    value={formData.clientEmail}
                    onChange={handleInputChange}
                    className={`block w-full px-4 py-3.5 bg-slate-950/80 border ${errors.clientEmail ? 'border-red-500' : 'border-slate-800'} rounded-2xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all`}
                    placeholder="name@company.com"
                  />
                  {errors.clientEmail && <p className="text-xs font-semibold text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.clientEmail}</p>}
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Company Name
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                    placeholder="Company Ltd"
                  />
                </div>

                {/* Client Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" /> Contact Number
                  </label>
                  <input
                    type="tel"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SHIPPING SPECS & DETAILS */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-semibold text-white">Shipping & Sourcing Details</h3>
                <p className="text-xs text-slate-400">Specify vessel context, expected delivery timelines, and special requirements.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Vessel Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5 text-indigo-400" /> Vessel Name
                  </label>
                  <input
                    type="text"
                    name="vesselName"
                    value={formData.vesselName}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                    placeholder="e.g. Ever Given"
                  />
                </div>

                {/* IMO Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> IMO Number
                  </label>
                  <input
                    type="text"
                    name="imoNumber"
                    value={formData.imoNumber}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                    placeholder="e.g. IMO 9813838"
                  />
                </div>

                {/* Reference Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Client RFQ Reference
                  </label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                    placeholder="e.g. RFQ-2026-98"
                  />
                </div>

                {/* Expected Delivery Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    name="expectedDeliveryDate"
                    value={formData.expectedDeliveryDate}
                    onChange={handleInputChange}
                    className={`block w-full px-4 py-3.5 bg-slate-950/80 border ${errors.expectedDeliveryDate ? 'border-red-500' : 'border-slate-800'} rounded-2xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all`}
                  />
                  {errors.expectedDeliveryDate && <p className="text-xs font-semibold text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.expectedDeliveryDate}</p>}
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Remarks / Custom Specs
                </label>
                <textarea
                  name="remarks"
                  rows="3"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                  placeholder="Provide specifications, loading tolerances, or special delivery instructions..."
                />
              </div>
            </div>
          )}

          {/* STEP 3: PRODUCT LINE ITEMS */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Requirement Items</h3>
                  <p className="text-xs text-slate-400">List all products, quantities, and measurement units requested.</p>
                </div>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/30 text-indigo-400 hover:bg-indigo-600/40 hover:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-500/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </button>
              </div>

              {/* Dynamic Items List */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-start bg-slate-950/40 p-4 rounded-2xl border border-slate-850 relative group">
                    
                    {/* Item Serial/Index badge */}
                    <div className="absolute top-2 left-2 text-[10px] font-black text-slate-600 select-none">
                      #{index + 1}
                    </div>

                    {/* Product Name / Description */}
                    <div className="flex-1 w-full space-y-1 mt-2 sm:mt-0">
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className={`block w-full px-4 py-3 bg-slate-950 border ${errors[`item_${index}_description`] ? 'border-red-500' : 'border-slate-800'} rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all`}
                        placeholder="Product name/description (e.g. Anchors, Wire Rope)"
                      />
                      {errors[`item_${index}_description`] && (
                        <p className="text-[11px] font-semibold text-red-400 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {errors[`item_${index}_description`]}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-full sm:w-32 space-y-1">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className={`block w-full px-4 py-3 bg-slate-950 border ${errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-slate-800'} rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all`}
                        placeholder="Qty"
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className="text-[11px] font-semibold text-red-400 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {errors[`item_${index}_quantity`]}</p>
                      )}
                    </div>

                    {/* Unit */}
                    <div className="w-full sm:w-32">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="block w-full px-3 py-3 bg-slate-955 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all"
                      >
                        <option value="MT">MT (Metric Tons)</option>
                        <option value="PCS">PCS (Pieces)</option>
                        <option value="KG">KG (Kilograms)</option>
                        <option value="LTRS">LTRS (Liters)</option>
                        <option value="M">M (Meters)</option>
                      </select>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      disabled={formData.items.length === 1}
                      onClick={() => removeItemRow(index)}
                      className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all sm:self-center disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nav Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-5 py-3 text-slate-400 hover:text-white font-semibold rounded-2xl hover:bg-slate-800/40 transition-all text-sm uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors uppercase tracking-wider"
              >
                ← Back to Login
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm shadow-lg shadow-indigo-500/10 uppercase tracking-wider"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black rounded-2xl hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm shadow-xl shadow-indigo-500/20 disabled:opacity-75 disabled:cursor-not-allowed uppercase tracking-widest relative"
              >
                <span className={loading ? 'opacity-0' : 'opacity-100 flex items-center gap-2'}>
                  Submit Request <Send className="w-4 h-4" />
                </span>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Style tweaks */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
