import React, { useEffect, useState } from 'react';
import api from '../../../services/apiClient';
import { Loader2, Reply, Trash, CornerUpRight, AlertCircle, Sparkles, Bot, CheckCircle, Workflow, ClipboardList, RefreshCw, Paperclip } from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';




const EmailDetail = ({ email }) => {
  const [fullEmail, setFullEmail] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reply/Forward Compose states
  const [activeMode, setActiveMode] = useState('none'); // 'none', 'reply', 'forward'
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('success'); // 'success', 'error'

  // AI assistant states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Auto-created inquiry states
  const [existingInquiry, setExistingInquiry] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);



  useEffect(() => {
    const fetchFullEmail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/email/emails/${email.id}`);
        setFullEmail(res.data);
      } catch (err) {
        console.error('Failed to load email details', err);
        // Fallback to what we have in list view
        setFullEmail(email);
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchFullEmail();
      setActiveMode('none');
      setStatusMessage(null);
      setAiResult(null);
      setAiError(null);
      setAiLoading(false);
      setExistingInquiry(null);
    }
  }, [email.id]);

  useEffect(() => {
    const checkExistingInquiry = async () => {
      setCheckingExisting(true);
      try {
        const res = await api.get(`/inquiries?emailId=${encodeURIComponent(email.id)}`);
        if (res.data && res.data.length > 0) {
          setExistingInquiry(res.data[0]);
        } else {
          setExistingInquiry(null);
        }
      } catch (err) {
        console.error('Failed to check existing inquiry', err);
        setExistingInquiry(null);
      } finally {
        setCheckingExisting(false);
      }
    };

    if (email?.id) {
      checkExistingInquiry();
    }
  }, [email.id]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !email?.id) return;

    const handleEmailProcessed = (data) => {
      if (data.emailId === email.id) {
        if (data.result && data.result.status === 'created') {
          setExistingInquiry(data.result.inquiry);
        }
      }
    };

    socket.on('email_processed', handleEmailProcessed);
    return () => {
      socket.off('email_processed', handleEmailProcessed);
    };
  }, [socket, email?.id]);


  if (loading || !fullEmail) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  const senderName = fullEmail.sender?.emailAddress?.name;
  const senderEmail = fullEmail.sender?.emailAddress?.address;

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await api.post('/email/process-ai', {
        emailId: fullEmail.id,
        subject: fullEmail.subject,
        body: fullEmail.body?.content || fullEmail.bodyPreview,
        senderEmail: senderEmail
      });
      setAiResult(res.data);
    } catch (err) {
      console.error('AI Analysis failed', err);
      setAiError(err.response?.data?.message || 'Failed to analyze email with AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAttachmentDownload = async (filename) => {
    try {
      const response = await api.get(
        `/email/emails/${encodeURIComponent(fullEmail.id)}/attachments/${encodeURIComponent(filename)}`,
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to download attachment', err);
    }
  };



  const handleReplyClick = () => {
    setActiveMode('reply');
    setTo(senderEmail || '');
    setSubject(fullEmail.subject.startsWith('Re:') ? fullEmail.subject : `Re: ${fullEmail.subject}`);

    // Generate draft body with original email details
    const originalDate = new Date(fullEmail.receivedDateTime).toLocaleString();
    const cleanText = (fullEmail.body?.content || fullEmail.bodyPreview || '')
      .replace(/<[^>]*>/g, '') // Strip HTML tags if HTML
      .trim();
    const draftBody = `\n\n\nOn ${originalDate}, ${senderName || senderEmail} wrote:\n> ` + cleanText.split('\n').join('\n> ');

    setBody(draftBody);
    setStatusMessage(null);
  };

  const handleForwardClick = () => {
    setActiveMode('forward');
    setTo('');
    setSubject(fullEmail.subject.startsWith('Fwd:') ? fullEmail.subject : `Fwd: ${fullEmail.subject}`);

    // Generate draft body with forwarded header and details
    const originalDate = new Date(fullEmail.receivedDateTime).toLocaleString();
    const cleanText = (fullEmail.body?.content || fullEmail.bodyPreview || '')
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .trim();
    const draftBody = `\n\n---------- Forwarded message ---------\nFrom: ${senderName ? `${senderName} <${senderEmail}>` : senderEmail}\nDate: ${originalDate}\nSubject: ${fullEmail.subject}\n\n${cleanText}`;

    setBody(draftBody);
    setStatusMessage(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!to.trim()) {
      setStatusType('error');
      setStatusMessage('Recipient email (To) is required.');
      return;
    }

    setSending(true);
    setStatusMessage(null);
    try {
      await api.post('/email/send', {
        to,
        subject,
        text: body
      });
      setStatusType('success');
      setStatusMessage('Email sent successfully!');
      setTimeout(() => {
        setActiveMode('none');
        setStatusMessage(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to send email', err);
      setStatusType('error');
      setStatusMessage(err.response?.data?.message || 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formattedDate = new Date(fullEmail.receivedDateTime).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#181a20]">
      {/* Header Container */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#1C2024] dark:text-stone-150 mb-2 tracking-tight">
            {fullEmail.subject}
          </h2>
          <div className="text-sm text-stone-500 dark:text-stone-400 font-medium">
            <span>{senderName} </span>
            <span className="text-stone-400 dark:text-stone-500">&lt;{senderEmail}&gt;</span>
            <span className="mx-2 text-stone-300 dark:text-stone-600">·</span>
            <span>{formattedDate}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReplyClick}
            className={`p-2 rounded-md transition-colors ${activeMode === 'reply' ? 'bg-[#EAF3EF] text-[#0A5C43] dark:bg-[#1a3328] dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-850'
              }`}
            title="Reply"
          >
            <Reply className="w-5 h-5" />
          </button>
          <button
            onClick={handleForwardClick}
            className={`p-2 rounded-md transition-colors ${activeMode === 'forward' ? 'bg-[#EAF3EF] text-[#0A5C43] dark:bg-[#1a3328] dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-850'
              }`}
            title="Forward"
          >
            <CornerUpRight className="w-5 h-5" />
          </button>
          <button className="p-2 text-red-500 dark:text-red-400 hover:bg-red-55 dark:hover:bg-red-950/40 rounded-md transition-colors" title="Delete">
            <Trash className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Separator line */}
      <div className="border-t border-stone-200/60 dark:border-stone-800 my-4" />

      {/* AI Assistant Section */}
      <div className="mb-6">
        {checkingExisting ? (
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/20 dark:bg-[#1a1d28] flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-stone-500" />
            <span className="text-xs text-stone-500">Checking for auto-created inquiries...</span>
          </div>
        ) : existingInquiry ? (
          <div className="p-5 rounded-xl border border-emerald-250 dark:border-emerald-800 bg-emerald-50/15 dark:bg-[#112a20]/30 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0A5C43] dark:text-emerald-400">
                <Bot className="w-5 h-5 animate-pulse" />
                <span className="font-bold text-sm tracking-wide">AI Sourcing Agent (Auto-Ingested)</span>
              </div>
              
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                existingInquiry.needsReview 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' 
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              }`}>
                {existingInquiry.needsReview ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Needs Manual Review
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Auto-Created (High Confidence)
                  </>
                )}
              </span>
            </div>

            <div className="text-xs text-stone-600 dark:text-stone-400">
              This email was automatically parsed and imported. Vessel matching was completed.
            </div>

            {/* Extracted Details Table */}
            <div className="text-xs border border-stone-200 dark:border-[#2a2e3a] rounded-lg p-4 bg-white dark:bg-[#12141c] space-y-3">
              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <span className="text-stone-400 block mb-0.5">Vessel Name</span>
                  <span className="font-bold text-stone-850 dark:text-stone-100">🚢 {existingInquiry.vesselName || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">IMO Number</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{existingInquiry.imoNumber || 'Not specified'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <span className="text-stone-400 block mb-0.5">Port / Location</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">📍 {existingInquiry.port || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">ETA / ETD</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {existingInquiry.eta ? `ETA: ${existingInquiry.eta}` : 'ETA: Not specified'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <span className="text-stone-400 block mb-0.5">RFQ Reference</span>
                  <span className="font-mono font-semibold text-stone-850 dark:text-stone-150">#{existingInquiry.rfqNumber || existingInquiry.inquiryNumber}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">Currency / Terms</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{existingInquiry.currency || 'USD'} | {existingInquiry.paymentTerms || 'COD'}</span>
                </div>
              </div>

              {existingInquiry.specialInstructions && (
                <div className="pb-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-stone-400 block mb-0.5">Special Instructions</span>
                  <p className="text-stone-700 dark:text-stone-300 italic">"{existingInquiry.specialInstructions}"</p>
                </div>
              )}

              {/* Items List */}
              <div>
                <span className="text-stone-400 block mb-1">Parsed Inquiry Items ({existingInquiry.items?.length || 0}):</span>
                {existingInquiry.items && existingInquiry.items.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1 text-stone-700 dark:text-stone-300">
                    {existingInquiry.items.map((item, idx) => (
                      <li key={idx}>
                        <span className="font-bold">{item.quantity} {item.unit || 'PCS'}</span> - {item.description}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-stone-500 italic">No line items parsed. Check attachments.</span>
                )}
              </div>
            </div>
            
            {existingInquiry.needsReview && (
              <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-200/50 dark:border-amber-900/40 rounded-lg text-xs text-amber-800 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Some metadata fields or line items have low confidence and require validation in the **Inquiries** module.</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {!aiResult && !aiLoading && !aiError && (
          <button
            onClick={handleAIAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            Analyze with TradeMind AI
          </button>
        )}

        {aiLoading && (
          <div className="p-4 rounded-xl border border-dashed border-violet-300 dark:border-violet-800 bg-violet-50/20 dark:bg-[#1f1d2b] flex items-center gap-4 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-violet-600 dark:text-violet-400" />
            <div>
              <p className="text-sm font-bold text-violet-905 dark:text-violet-200">AI Agent is analyzing email...</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Determining workflow context and extracting key entities</p>
            </div>
          </div>
        )}

        {aiError && (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-800/45 bg-red-50/50 dark:bg-red-950/10 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-650 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900 dark:text-red-200">AI analysis failed</p>
              <p className="text-xs text-red-700 dark:text-red-400">{aiError}</p>
            </div>
            <button
              onClick={handleAIAnalysis}
              className="text-xs px-3 py-1 bg-white hover:bg-stone-50 dark:bg-[#2c2f3c] dark:hover:bg-[#34384a] text-stone-750 dark:text-stone-300 rounded-md border border-stone-200 dark:border-stone-750 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {aiResult && (
          <div className="p-5 rounded-xl border border-stone-250 dark:border-stone-800 bg-stone-50/40 dark:bg-[#1a1d28] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 dark:text-white">
                <Bot className="w-5 h-5 text-violet-600 dark:text-violet-450 animate-bounce" />
                <span className="font-bold text-sm tracking-wide">TradeMind AI Recommendation</span>
              </div>
              
              {/* Category badges */}
              {aiResult.category === 'TASK' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" />
                  Task Created & Assigned
                </span>
              )}
              {aiResult.category === 'NEW_INQUIRY' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5" />
                  New Inquiry Initialized
                </span>
              )}
              {aiResult.category === 'INQUIRY_UPDATE' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Inquiry Status Updated
                </span>
              )}
              {aiResult.category === 'UNKNOWN' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 dark:bg-stone-850 dark:text-stone-400">
                  General correspondence
                </span>
              )}
            </div>

            <p className="text-xs text-stone-650 dark:text-stone-400 leading-relaxed font-serif italic border-l-2 border-stone-300 dark:border-stone-700 pl-3">
              "{aiResult.explanation}"
            </p>

            {/* Action status message */}
            <div className="p-3 bg-[#EAF3EF] dark:bg-[#112a20]/40 border border-[#b2dcd3]/30 dark:border-emerald-900/30 rounded-lg text-xs text-[#0A5C43] dark:text-emerald-400 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{aiResult.message}</span>
            </div>

            {/* Structured details display */}
            {aiResult.category === 'TASK' && aiResult.dbRecord && (
              <div className="text-xs border border-stone-200 dark:border-[#2a2e3a] rounded-lg p-3 bg-white dark:bg-[#12141c] space-y-2">
                <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                  <span className="text-stone-400">Task Title</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{aiResult.dbRecord.title}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                  <span className="text-stone-400">Assigned To</span>
                  <span className="font-semibold text-stone-805 dark:text-stone-100">
                    👤 {aiResult.dbRecord.assignedEmployee?.fullName || 'Unassigned'} ({aiResult.dbRecord.assignedEmployee?.designation || 'Staff'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Priority Level</span>
                  <span className={`font-black ${
                    aiResult.dbRecord.priority === 'HIGH' ? 'text-red-500' :
                    aiResult.dbRecord.priority === 'MEDIUM' ? 'text-amber-500' : 'text-stone-500'
                  }`}>
                    {aiResult.dbRecord.priority}
                  </span>
                </div>
              </div>
            )}

            {aiResult.category === 'NEW_INQUIRY' && aiResult.dbRecord && (
              <div className="text-xs border border-stone-200 dark:border-[#2a2e3a] rounded-lg p-3 bg-white dark:bg-[#12141c] space-y-2">
                <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                  <span className="text-stone-400">Inquiry Number</span>
                  <span className="font-mono font-bold text-[#0A5C43] dark:text-emerald-400">{aiResult.dbRecord.inquiryNumber}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                  <span className="text-stone-400">Client / Company</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {aiResult.aiResult.inquiryDetails?.clientName} ({aiResult.aiResult.inquiryDetails?.company || 'No Company'})
                  </span>
                </div>
                {aiResult.aiResult.inquiryDetails?.vesselName && (
                  <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                    <span className="text-stone-400">Vessel Reference</span>
                    <span className="font-semibold text-stone-850 dark:text-stone-150">🚢 {aiResult.aiResult.inquiryDetails.vesselName}</span>
                  </div>
                )}
                <div>
                  <span className="text-stone-400 block mb-1">Requested Items:</span>
                  <ul className="list-disc pl-4 space-y-1 text-stone-700 dark:text-stone-300">
                    {(aiResult.aiResult.inquiryDetails?.items || []).map((item, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{item.quantity} {item.unit}</span> - {item.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {aiResult.category === 'INQUIRY_UPDATE' && aiResult.dbRecord && (
              <div className="text-xs border border-stone-200 dark:border-[#2a2e3a] rounded-lg p-3 bg-white dark:bg-[#12141c] space-y-2">
                <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                  <span className="text-stone-400">Updated Inquiry</span>
                  <span className="font-mono font-bold text-sky-655 dark:text-sky-400">{aiResult.aiResult.inquiryUpdateDetails?.inquiryNumber}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-1">AI Extracted Update Summary:</span>
                  <p className="bg-stone-50 dark:bg-stone-900 p-2 rounded border border-stone-100 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-sans leading-tight">
                    {aiResult.aiResult.inquiryUpdateDetails?.remarks}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button 
                onClick={handleAIAnalysis}
                className="text-stone-500 hover:text-stone-700 dark:text-stone-450 dark:hover:text-stone-200 text-xs flex items-center gap-1 font-medium transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Re-classify
              </button>
            </div>
          </div>
        )}
      </>
    )}
  </div>



      {/* Body Content */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {fullEmail.body?.contentType === 'html' ? (
          <div
            className="prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 text-[15px] leading-relaxed font-sans"
            dangerouslySetInnerHTML={{ __html: fullEmail.body.content }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-stone-800 dark:text-stone-200 text-[15px] leading-relaxed">
            {fullEmail.body?.content || fullEmail.bodyPreview}
          </pre>
        )}

        {/* Attachments Section */}
        {fullEmail.attachments && fullEmail.attachments.length > 0 && (
          <div className="mt-8 pt-4 border-t border-stone-200/60 dark:border-stone-800">
            <div className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
              Attachments ({fullEmail.attachments.length})
            </div>
            <div className="flex flex-wrap gap-3">
              {fullEmail.attachments.map((att, index) => (
                <button 
                  key={index} 
                  onClick={() => handleAttachmentDownload(att.filename)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#fcfbfa] hover:bg-stone-50 dark:bg-[#1a1d23] dark:hover:bg-[#20242e] border border-[#e6e0d2] dark:border-[#2a2d33] rounded-xl text-xs font-medium text-[#1e293b] dark:text-white shadow-sm transition-all duration-150 cursor-pointer"
                  title="Click to download attachment"
                >
                  <Paperclip className="w-3.5 h-3.5 text-stone-400 dark:text-stone-550" />
                  <span>{att.filename || 'Unnamed Attachment'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reply/Forward Compose Form */}
      {activeMode !== 'none' && (
        <form onSubmit={handleSend} className="mt-6 border-t border-stone-200/80 dark:border-stone-800 pt-6 bg-stone-50/50 dark:bg-[#15171d] -mx-8 -mb-8 p-8 rounded-b-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 capitalize">
              {activeMode} Email
            </h3>
            <button
              type="button"
              onClick={() => setActiveMode('none')}
              className="text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 font-medium"
            >
              Cancel
            </button>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-md mb-4 text-sm flex items-center gap-2 ${statusType === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border dark:border-green-800' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border dark:border-red-800'
              }`}>
              {statusType === 'success' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {statusMessage}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">To</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={activeMode === 'reply' || sending}
                placeholder="recipient@example.com"
                className="w-full px-3 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0A5C43] focus:border-[#0A5C43] bg-white dark:bg-[#0c0e12] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 disabled:bg-stone-100 disabled:text-stone-500 disabled:dark:bg-stone-800 disabled:dark:text-stone-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
                className="w-full px-3 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0A5C43] focus:border-[#0A5C43] bg-white dark:bg-[#0c0e12] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 disabled:bg-stone-100 disabled:text-stone-500 disabled:dark:bg-stone-800 disabled:dark:text-stone-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">Message</label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sending}
                className="w-full px-3 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0A5C43] focus:border-[#0A5C43] bg-white dark:bg-[#0c0e12] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 font-sans"
                placeholder="Type your message here..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveMode('none')}
                disabled={sending}
                className="px-4 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-md hover:bg-stone-100 dark:hover:bg-stone-850 transition-colors text-stone-700 dark:text-stone-300"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 text-sm bg-[#0A5C43] hover:bg-[#084834] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Email'
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default EmailDetail;
