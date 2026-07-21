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

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{fullEmail.subject}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-200">{senderName}</span>
            <span className="text-gray-500 dark:text-gray-400">&lt;{senderEmail}&gt;</span>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {new Date(fullEmail.receivedDateTime).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleReplyClick}
            className={`p-2 rounded-md transition-colors ${
              activeMode === 'reply' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200'
            }`} 
            title="Reply"
          >
            <Reply className="w-5 h-5" />
          </button>
          <button 
            onClick={handleForwardClick}
            className={`p-2 rounded-md transition-colors ${
              activeMode === 'forward' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200'
            }`} 
            title="Forward"
          >
            <CornerUpRight className="w-5 h-5" />
          </button>
          <button className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors" title="Delete">
            <Trash className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-[#2a2d33] pt-6 flex-1 overflow-y-auto">
        {fullEmail.body?.contentType === 'html' ? (
          <div 
            className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: fullEmail.body.content }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 text-sm">
            {fullEmail.body?.content || fullEmail.bodyPreview}
          </pre>
        )}
      </div>

      {/* Reply/Forward Compose Form */}
      {activeMode !== 'none' && (
        <form onSubmit={handleSend} className="mt-6 border-t border-gray-200 dark:border-[#2a2d33] pt-6 bg-gray-50 dark:bg-[#14161d] -mx-6 -mb-6 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 capitalize">
              {activeMode} Email
            </h3>
            <button
              type="button"
              onClick={() => setActiveMode('none')}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
            >
              Cancel
            </button>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-md mb-4 text-sm flex items-center gap-2 ${
              statusType === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border dark:border-green-800' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border dark:border-red-800'
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
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">To</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={activeMode === 'reply' || sending}
                placeholder="recipient@example.com"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#0c0e12] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:dark:bg-gray-800 disabled:dark:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#0c0e12] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:dark:bg-gray-800 disabled:dark:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Message</label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sending}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#0c0e12] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 font-sans"
                placeholder="Type your message here..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveMode('none')}
                disabled={sending}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
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
