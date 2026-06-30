import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  User, Mail, Phone, Building2, Ship, Calendar, FileText,
  Plus, Trash2, ArrowRight, ArrowLeft, Send, CheckCircle2,
  HelpCircle, AlertCircle, Search, Download, Upload
} from 'lucide-react';
import DatePicker from '../../components/ui/datePicker';
import ExcelImportModal from '../../components/ui/ExcelImportModal';
import Select from '../../components/ui/select';
import Button from '../../components/ui/button';
import * as XLSX from 'xlsx';

const UNIT_OPTIONS = [
  { value: 'MT', label: 'MT (Metric Tons)' },
  { value: 'PCS', label: 'PCS (Pieces)' },
  { value: 'KG', label: 'KG (Kilograms)' },
  { value: 'LTRS', label: 'LTRS (Liters)' },
  { value: 'M', label: 'M (Meters)' }
];

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001').trim();

export default function RequestProductPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const handleDownloadSample = () => {
    const sampleData = [
      { Description: 'Wire Rope 10mm', Quantity: 500, Unit: 'M' },
      { Description: 'Steel Plates', Quantity: 20, Unit: 'MT' }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample Items");
    XLSX.writeFile(wb, "Sample_Requirement_Items.xlsx");
  };

  const handleImport = (importedData) => {
    const newItems = importedData.map(row => ({
      description: row.Description || row.description || '',
      quantity: parseInt(row.Quantity || row.quantity) || 1,
      unit: row.Unit || row.unit || 'MT'
    })).filter(item => item.description);

    if (newItems.length > 0) {
      setFormData(prev => {
        const items = prev.items.length === 1 && !prev.items[0].description
          ? newItems
          : [...prev.items, ...newItems];
        return { ...prev, items };
      });
      setIsImportModalOpen(false);
      Swal.fire({
        title: 'Success',
        text: `Imported ${newItems.length} items successfully.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire('Error', 'No valid items found in Excel', 'error');
    }
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
              <p class="text-slate-600">Your requirement has been saved successfully.</p>
              <div class="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                <span class="text-xs font-bold text-slate-500 uppercase">Inquiry ID:</span>
                <span class="text-lg font-black text-indigo-600">${inqNumber}</span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed mt-2">
                Our global sourcing managers have been notified. We will verify stock availability, initiate supplier RFQs, and compile a finalized margin sheet shortly.
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          confirmButtonText: 'Track Status'
        }).then(() => {
          navigate('/track-inquiry');
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden font-sans">
      
      {/* LEFT SECTION - Search & Branding */}
      <div className="w-full lg:w-[40%] bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-8 lg:p-16 flex flex-col justify-center relative border-r border-slate-100">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Global Sourcing <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Portal</span>
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              Submit your product requirement specifications. Our automated desk matches logistics, verifies warehousing stocks, and generates custom RFQs.
            </p>
          </div>

          <div className="mt-12 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
             <h3 className="text-slate-800 font-bold mb-2">Already have an inquiry?</h3>
             <p className="text-slate-500 text-sm mb-4">Track the real-time status of your shipments and RFQs.</p>
             <button
               type="button"
               onClick={() => navigate('/track-inquiry')}
               className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-semibold text-sm transition-colors flex justify-center items-center group"
             >
               <Search className="w-4 h-4 mr-2" />
               Track Existing Request
               <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION - Multi-Step Form */}
      <div className="w-full lg:w-[60%] min-h-screen bg-slate-50/50 p-6 lg:p-12 flex flex-col relative overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto my-auto animate-in fade-in slide-in-from-right-8 duration-500">
          
          <div className="bg-white rounded-3xl p-6 lg:p-10 shadow-sm border border-slate-100 relative">
            {/* Stepper Header */}
            <div className="flex justify-between items-center mb-10 max-w-md mx-auto relative">
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
              <div className="absolute left-0 top-1/2 h-1 bg-indigo-500 -translate-y-1/2 transition-all duration-300 z-0 rounded-full" style={{ width: `${((step - 1) / 2) * 100}%` }} />

              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => step > num && setStep(num)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative z-10 transition-all duration-300 focus:outline-none ${step === num
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110 shadow-md shadow-indigo-500/20'
                    : step > num
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 border-2 border-white'
                    }`}
                >
                  {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
                  <span className={`absolute -bottom-6 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap hidden sm:block ${step === num ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {num === 1 ? 'Contact Details' : num === 2 ? 'Shipping & Specs' : 'Line Items'}
                  </span>
                </button>
              ))}
            </div>

            {/* Step Content */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">

              {/* STEP 1: CONTACT DETAILS */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900">Client Information</h3>
                    <p className="text-sm text-slate-500 mt-1">Please provide your corporate credentials for dealer validation.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-500" /> Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="clientName"
                        required
                        value={formData.clientName}
                        onChange={handleInputChange}
                        className={`block w-full px-4 py-3.5 bg-slate-50 border ${errors.clientName ? 'border-red-500' : 'border-slate-200'} rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium transition-all`}
                        placeholder="Enter your name"
                      />
                      {errors.clientName && <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.clientName}</p>}
                    </div>

                    {/* Client Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" /> Corporate Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="clientEmail"
                        required
                        value={formData.clientEmail}
                        onChange={handleInputChange}
                        className={`block w-full px-4 py-3.5 bg-slate-50 border ${errors.clientEmail ? 'border-red-500' : 'border-slate-200'} rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium transition-all`}
                        placeholder="name@company.com"
                      />
                      {errors.clientEmail && <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.clientEmail}</p>}
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Company Name
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium transition-all"
                        placeholder="Company Ltd"
                      />
                    </div>

                    {/* Client Phone */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-indigo-500" /> Contact Number
                      </label>
                      <input
                        type="tel"
                        name="clientPhone"
                        value={formData.clientPhone}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SHIPPING SPECS & DETAILS */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900">Shipping & Sourcing Details</h3>
                    <p className="text-sm text-slate-500 mt-1">Specify vessel context, expected delivery timelines, and special requirements.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vessel Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Ship className="w-3.5 h-3.5 text-indigo-500" /> Vessel Name
                      </label>
                      <input
                        type="text"
                        name="vesselName"
                        value={formData.vesselName}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium transition-all"
                        placeholder="e.g. Ever Given"
                      />
                    </div>

                    {/* IMO Number */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500" /> IMO Number
                      </label>
                      <input
                        type="text"
                        name="imoNumber"
                        value={formData.imoNumber}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium transition-all"
                        placeholder="e.g. IMO 9813838"
                      />
                    </div>

                    {/* Reference Number */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" /> Client RFQ Reference
                      </label>
                      <input
                        type="text"
                        name="referenceNumber"
                        value={formData.referenceNumber}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium transition-all"
                        placeholder="e.g. RFQ-2026-98"
                      />
                    </div>

                    {/* Expected Delivery Date */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Expected Delivery Date
                      </label>
                      <DatePicker
                        name="expectedDeliveryDate"
                        value={formData.expectedDeliveryDate}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3.5 h-auto bg-slate-50 border ${errors.expectedDeliveryDate ? 'border-red-500' : 'border-slate-200'} rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium transition-all`}
                        placeholder="dd-mm-yyyy"
                      />
                      {errors.expectedDeliveryDate && <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.expectedDeliveryDate}</p>}
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" /> Remarks / Custom Specs
                    </label>
                    <textarea
                      name="remarks"
                      rows="3"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium transition-all"
                      placeholder="Provide specifications, loading tolerances, or special delivery instructions..."
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: PRODUCT LINE ITEMS */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-slate-100 pb-5 mb-2">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-900">Requirement Items</h3>
                      <p className="text-sm text-slate-500 mt-1">List all products, quantities, and measurement units requested.</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleDownloadSample}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-purple-700 hover:bg-purple-50 rounded-lg text-sm font-semibold transition-all border border-purple-400 shadow-sm"
                          title="Download Sample Format"
                        >
                          <Download className="w-4 h-4" /> Sample
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsImportModalOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-semibold transition-all border border-emerald-400 shadow-sm"
                          title="Import from Excel"
                        >
                          <Upload className="w-4 h-4" /> Import
                        </button>
                      </div>
                      <Button
                        type="button"
                        onClick={addItemRow}
                        variant="primary"
                        className="px-5 py-2.5 rounded-lg"
                      >
                        <Plus className="w-4 h-4" /> Add Product
                      </Button>
                    </div>
                  </div>

                  {/* Dynamic Items List */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 relative group">

                        {/* Item Serial/Index badge */}
                        <div className="absolute top-2 left-2 text-[10px] font-black text-slate-400 select-none">
                          #{index + 1}
                        </div>

                        {/* Product Name / Description */}
                        <div className="flex-1 w-full space-y-1.5 mt-2 sm:mt-0">
                          <label className="text-[10px] uppercase font-bold text-slate-500 pl-1">Description</label>
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className={`block w-full px-4 py-3 bg-white border ${errors[`item_${index}_description`] ? 'border-red-500' : 'border-slate-200'} rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all shadow-sm`}
                            placeholder="e.g. Anchors, Wire Rope"
                          />
                          {errors[`item_${index}_description`] && (
                            <p className="text-[11px] font-semibold text-red-500 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {errors[`item_${index}_description`]}</p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="w-full sm:w-32 space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-500 pl-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className={`block w-full px-4 py-3 bg-white border ${errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-slate-200'} rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all shadow-sm`}
                            placeholder="Qty"
                          />
                          {errors[`item_${index}_quantity`] && (
                            <p className="text-[11px] font-semibold text-red-500 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {errors[`item_${index}_quantity`]}</p>
                          )}
                        </div>

                        {/* Unit */}
                        <div className="w-full sm:w-32 space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-500 pl-1">Unit</label>
                          <Select
                            value={item.unit}
                            onChange={(val) => handleItemChange(index, 'unit', val)}
                            options={UNIT_OPTIONS}
                            className="w-full px-4 py-3 h-auto bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all shadow-sm"
                            variant="form"
                          />
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          disabled={formData.items.length === 1}
                          onClick={() => removeItemRow(index)}
                          className="p-3 mt-5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all sm:self-center disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nav Controls */}
              <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-8">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-2 px-6 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold rounded-2xl transition-all text-sm uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div /> // Placeholder to keep Next button on the right
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all text-sm shadow-md hover:shadow-xl uppercase tracking-wider group"
                  >
                    Next <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all text-sm shadow-md hover:shadow-xl shadow-indigo-500/20 disabled:opacity-75 disabled:cursor-not-allowed uppercase tracking-widest relative overflow-hidden group"
                  >
                    <span className={loading ? 'opacity-0' : 'opacity-100 flex items-center gap-2'}>
                      Submit Request <Send className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
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
          
          <ExcelImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleImport}
            expectedColumns={['Description', 'Quantity', 'Unit']}
          />
        </div>
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
          background: #cbd5e1;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
