import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, ArrowLeft, Package, Clock, CheckCircle2,
  FileText, Navigation, Truck, User, Building2, ChevronRight, Plus
} from 'lucide-react';

const TrackInquiryPage = () => {
  const navigate = useNavigate();
  const [inquiryId, setInquiryId] = useState('');
  const [inquiryData, setInquiryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!inquiryId.trim()) return;

    setLoading(true);
    setError('');
    setInquiryData(null);

    try {
      const response = await axios.get(`http://localhost:5001/api/inquiries/public/track/${inquiryId.trim()}`);
      if (response.data.success) {
        setInquiryData(response.data.data);
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError(err.response?.data?.message || 'Could not find tracking details for this ID.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    if (!status) return 1;
    const flows = [
      { id: 1, label: 'Received', matches: ['PENDING'] },
      { id: 2, label: 'RFQ Ready', matches: ['RFQ_GENERATED', 'QUOTED_TO_CLIENT'] },
      { id: 3, label: 'Client Decision', matches: ['CLIENT_REJECTED', 'CLIENT_APPROVED'] },
      { id: 4, label: 'Order Confirmed', matches: ['CONFIRMED', 'ORDER_PLACED', 'ORDERED'] },
      { id: 5, label: 'In Transit', matches: ['VEHICLE_ALLOTTED', 'LOADING', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      { id: 6, label: 'Delivered', matches: ['DELIVERED', 'DELIVERED_TO_VESSEL', 'DELIVERED TO VESSEL', 'CHALLAN_RECEIVED', 'CLOSED'] },
    ];

    for (let i = 0; i < flows.length; i++) {
      if (flows[i].matches.includes(status)) {
        return flows[i].id;
      }
    }
    return 1;
  };

  const statusSteps = [
    { id: 1, label: 'Received', icon: <Package className="w-5 h-5" /> },
    { id: 2, label: 'RFQ Ready', icon: <FileText className="w-5 h-5" /> },
    { id: 3, label: 'Decision', icon: <Clock className="w-5 h-5" /> },
    { id: 4, label: 'Confirmed', icon: <CheckCircle2 className="w-5 h-5" /> },
    { id: 5, label: inquiryData?.inventoryFulfilled ? 'Dispatched' : 'In Transit', icon: <Navigation className="w-5 h-5" /> },
    { id: 6, label: 'Delivered', icon: <Truck className="w-5 h-5" /> }
  ];

  const currentStepId = getStatusStep(inquiryData?.currentStatus);

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
          <button 
            onClick={() => navigate('/request-product')}
            className="group flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Request Portal
          </button>

          <div className="mb-10">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Track Your <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Requirement</span>
            </h1>
            <p className="text-slate-500 text-lg mt-4">
              Enter your Inquiry ID to get real-time updates on your sourcing request and shipments.
            </p>
          </div>

          <form onSubmit={handleTrack} className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="e.g. INQ-1002"
                value={inquiryId}
                onChange={(e) => setInquiryId(e.target.value.toUpperCase())}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all text-lg font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !inquiryId.trim()}
              className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-2xl font-semibold text-lg transition-all shadow-md hover:shadow-xl disabled:shadow-none flex justify-center items-center group"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Tracking...</span>
                </div>
              ) : (
                <>
                  Track Request
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start animate-in fade-in slide-in-from-bottom-2">
              <div className="mr-3 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Bottom Left Add New Inquiry Button */}
        <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10">
          <button
            onClick={() => navigate('/request-product')}
            className="flex items-center text-sm font-semibold text-indigo-700 bg-white hover:bg-indigo-50 px-5 py-3 rounded-2xl shadow-sm border border-indigo-100 hover:shadow-md transition-all group"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 mr-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </span>
            Add New Inquiry
          </button>
        </div>
      </div>

      {/* RIGHT SECTION - Results & Timeline */}
      <div className="w-full lg:w-[60%] min-h-screen bg-slate-50 p-6 lg:p-12 flex flex-col relative overflow-y-auto">
        
        {!inquiryData && !loading && !error && (
          <div className="m-auto flex flex-col items-center justify-center text-center max-w-md opacity-60">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No active search</h3>
            <p className="text-slate-500">Enter your Inquiry ID on the left to see your request's timeline, details, and current status.</p>
          </div>
        )}

        {inquiryData && !loading && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-full space-y-6 lg:space-y-8 my-auto">
            
            {/* Header / Current Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Request Details</h2>
                <p className="text-slate-500 text-sm mt-1">Information for <span className="font-semibold text-slate-700">{inquiryData.inquiryNumber}</span></p>
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-semibold text-sm border border-indigo-100 shadow-sm self-start sm:self-auto">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></div>
                {inquiryData.currentStatus?.replace(/_/g, ' ')}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              
              {/* Left Column: Timeline (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
                  
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-8 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-indigo-500" />
                    Tracking Progress
                  </h3>
                  
                  <div className="relative pl-6">
                    {/* Vertical Line */}
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
                    
                    <div className="space-y-8 relative">
                      {statusSteps.map((step, idx) => {
                        const isCompleted = step.id <= currentStepId;
                        const isCurrent = step.id === currentStepId;
                        
                        return (
                          <div key={step.id} className="relative flex items-start group">
                            {/* Step Indicator */}
                            <div className={`absolute -left-[30px] flex items-center justify-center w-8 h-8 rounded-full border-4 border-white shadow-sm transition-all duration-300 z-10 ${
                              isCurrent ? 'bg-indigo-600 scale-110 shadow-indigo-200' :
                              isCompleted ? 'bg-indigo-500' : 'bg-slate-200'
                            }`}>
                              {isCompleted && !isCurrent ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              ) : (
                                <span className={`text-[10px] font-bold ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                                  {step.id}
                               </span>
                              )}
                            </div>

                            {/* Step Content */}
                            <div className={`ml-4 ${isCurrent ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'}`}>
                              <h4 className={`text-sm font-bold ${isCurrent ? 'text-indigo-600' : 'text-slate-800'}`}>
                                {step.label}
                              </h4>
                              {isCurrent && (
                                <p className="text-xs text-slate-500 mt-1 font-medium">Currently processing</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Info Cards (Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
                      <FileText className="w-4 h-4 mr-2 text-indigo-400" />
                      Inquiry Info
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">ID Number</p>
                        <p className="font-semibold text-slate-800">{inquiryData.inquiryNumber}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Date Submitted</p>
                        <p className="font-semibold text-slate-800">
                          {new Date(inquiryData.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
                      <User className="w-4 h-4 mr-2 text-blue-400" />
                      Client Info
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Requested By</p>
                        <p className="font-semibold text-slate-800">{inquiryData.client?.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Organization</p>
                        <div className="flex items-center mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400 mr-1.5" />
                          <p className="font-medium text-slate-600 text-sm">
                            {inquiryData.client?.company || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requested Items Card */}
                <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
                      <Package className="w-4 h-4 mr-2 text-indigo-500" />
                      Requested Items
                    </h3>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                      {inquiryData.items?.length || 0} Items
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {inquiryData.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold group-hover:border-indigo-200 group-hover:text-indigo-500">
                            {idx + 1}
                          </div>
                          <span className="font-semibold text-slate-700">{item.description}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-900">{item.quantity}</span>
                          <span className="text-xs text-slate-500 font-medium ml-1">{item.unit || 'PCS'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// Quick helper for missing icon above
const Activity = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
)

export default TrackInquiryPage;
