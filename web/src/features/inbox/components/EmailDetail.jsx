import React, { useEffect, useState } from 'react';
import api from '../../../services/apiClient';
import { Loader2, Reply, Trash, CornerUpRight, AlertCircle } from 'lucide-react';

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
    }
  }, [email.id]);

  if (loading || !fullEmail) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  const senderName = fullEmail.sender?.emailAddress?.name;
  const senderEmail = fullEmail.sender?.emailAddress?.address;

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
