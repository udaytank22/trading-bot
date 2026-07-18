import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import { useSocket } from '../../context/SocketContext';

const InboxPage = () => {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('inbox'); // 'inbox', 'sent'
  const limit = 50;

  // Debounce search query to search state
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchQuery);
      setPage(1); // Reset page to 1 on new search
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const { socket } = useSocket();

  useEffect(() => {
    fetchEmails(page, search, folder);
  }, [page, search, folder]);

  useEffect(() => {
    if (!socket) return;

    const handleNewEmail = () => {
      // Refresh list to show new emails on page 1
      setPage(1);
      fetchEmails(1, search, folder);
    };

    socket.on('new_email', handleNewEmail);
    return () => {
      socket.off('new_email', handleNewEmail);
    };
  }, [socket, search, folder]);

  useEffect(() => {
    // Check if we just redirected back from auth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchEmails = async (pageNumber = page, currentSearch = search, currentFolder = folder) => {
    try {
      setLoading(true);
      setError(null);
      if (pageNumber === 1) {
        setEmails([]);
      }
      const res = await api.get(`/email/emails?page=${pageNumber}&limit=${limit}&search=${encodeURIComponent(currentSearch)}&folder=${currentFolder}`);
      const newEmails = res.data;
      
      setEmails(prev => {
        if (pageNumber === 1) return newEmails;
        const existingIds = new Set(prev.map(e => e.id));
        const uniqueNewEmails = newEmails.filter(e => !existingIds.has(e.id));
        return [...prev, ...uniqueNewEmails];
      });

      const total = parseInt(res.headers['x-total-count'] || '0', 10);
      setTotalCount(total);
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

  const handleScroll = (e) => {
    const container = e.currentTarget;
    if (loading || emails.length >= totalCount) return;

    // Detect if scrolled near bottom (within 100px)
    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    if (isNearBottom) {
      setPage(prev => prev + 1);
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setSearch('');
    setPage(1);
    fetchEmails(1, '', folder);
  };

  const handleAuthenticate = async () => {
    try {
      const res = await api.get('/email/auth-status');
      if (res.data.authenticated) {
        setSearchQuery('');
        setSearch('');
        setPage(1);
        fetchEmails(1, '', folder);
      } else {
        setError('Gmail is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in the backend .env file.');
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
          Authenticate with Gmail to view and manage your emails directly within the Trading Bot platform.
        </p>
        <button
          onClick={handleAuthenticate}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Connect Gmail
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
          onClick={handleRefresh}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Email List Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
          {/* Folder Tabs */}
          <div className="flex border-b border-gray-200 bg-white p-2">
            <button
              onClick={() => {
                setFolder('inbox');
                setPage(1);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                folder === 'inbox'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => {
                setFolder('sent');
                setPage(1);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                folder === 'sent'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sent Mail
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 bg-white border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <svg
                className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 h-5 w-5 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center focus:outline-none"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
            {loading && page === 1 && !emails.length ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="p-4 m-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No matching emails found.
              </div>
            ) : (
              <>
                <EmailList
                  emails={emails}
                  selectedId={selectedEmail?.id}
                  onSelect={setSelectedEmail}
                  folder={folder}
                />
                {loading && page > 1 && (
                  <div className="flex justify-center p-4 bg-white border-t border-gray-100">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                )}
                {!loading && emails.length >= totalCount && totalCount > 0 && (
                  <div className="p-4 text-center text-xs text-gray-400 bg-white border-t border-gray-100">
                    All emails loaded ({totalCount} total)
                  </div>
                )}
              </>
            )}
          </div>

          {/* Email Count Summary footer */}
          {totalCount > 0 && (
            <div className="p-3 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Showing {emails.length} of {totalCount} emails</span>
              {loading && page > 1 && <span className="text-blue-600 animate-pulse">Loading more...</span>}
            </div>
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
