import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';

const InboxPage = () => {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    fetchEmails();
    
    // Check if we just redirected back from auth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await api.get('/outlook/emails');
      setEmails(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.data?.message?.includes('authenticated')) {
        setIsAuthenticated(false);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch emails');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      const res = await api.get('/outlook/auth-url');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setError('Failed to get authentication URL');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
        <Mail className="w-16 h-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-800">Connect Your Inbox</h2>
        <p className="text-gray-600 text-center max-w-md">
          Authenticate with Microsoft Outlook to view and manage your emails directly within the Trading Bot platform.
        </p>
        <button
          onClick={handleAuthenticate}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Connect Outlook
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-white rounded-lg shadow overflow-hidden">
      <div className="flex border-b border-gray-200 p-4 items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-600" />
          Inbox
        </h1>
        <button 
          onClick={fetchEmails}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Email List Sidebar */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
          {loading && !emails.length ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="p-4 m-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          ) : (
            <EmailList 
              emails={emails} 
              selectedId={selectedEmail?.id} 
              onSelect={setSelectedEmail} 
            />
          )}
        </div>

        {/* Email Detail View */}
        <div className="w-2/3 overflow-y-auto bg-white p-6">
          {selectedEmail ? (
            <EmailDetail email={selectedEmail} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Mail className="w-12 h-12 mb-2 opacity-50" />
              <p>Select an email to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
