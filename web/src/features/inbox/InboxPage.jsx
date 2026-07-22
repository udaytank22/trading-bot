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
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] w-[calc(100%+2rem)] md:w-[calc(100%+2.5rem)] bg-[#FAF8F5] dark:bg-[#12141C] -m-4 md:-m-5 p-8 space-y-4">
        <Mail className="w-16 h-16 text-[#0A5C43] opacity-80" />
        <h2 className="text-2xl font-serif text-[#1C2024] dark:text-white">Connect Your Inbox</h2>
        <p className="text-stone-600 dark:text-gray-400 text-center max-w-md text-sm">
          Authenticate with Gmail to view and manage your emails directly within the Trading Bot platform.
        </p>
        <button
          onClick={handleAuthenticate}
          className="px-6 py-2 bg-[#0A5C43] hover:bg-[#084834] text-white font-medium rounded-md shadow-sm transition-colors"
        >
          Connect Gmail
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] min-h-[500px] w-[calc(100%+2rem)] md:w-[calc(100%+2.5rem)] bg-[#FAF8F5] dark:bg-[#12141C] -m-4 md:-m-5 p-6 md:p-8 overflow-hidden font-sans">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-serif text-[#1C2024] dark:text-stone-100 mb-1 font-normal tracking-tight">Inbox</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Supplier and buyer correspondence in one place.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-stone-200/80 dark:border-stone-850 items-center justify-between mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => {
              setFolder('inbox');
              setPage(1);
            }}
            className={`pb-2 text-sm font-medium transition-all relative ${
              folder === 'inbox'
                ? 'text-[#0A5C43] dark:text-emerald-400 font-semibold'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Inbox
            {folder === 'inbox' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A5C43] dark:bg-emerald-400" />
            )}
          </button>
          <button
            onClick={() => {
              setFolder('sent');
              setPage(1);
            }}
            className={`pb-2 text-sm font-medium transition-all relative ${
              folder === 'sent'
                ? 'text-[#0A5C43] dark:text-emerald-400 font-semibold'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Sent mail
            {folder === 'sent' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A5C43] dark:bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Search & Refresh Actions (right side of tabs) */}
        <div className="flex items-center gap-3 pb-2">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-8 pr-8 py-1.5 text-xs bg-white dark:bg-[#1a1d23] border border-stone-250 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0A5C43] focus:border-[#0A5C43] transition-colors"
            />
            <svg
              className="absolute left-2.5 top-2 h-3.5 w-3.5 text-stone-400"
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
                className="absolute right-2.5 top-1.5 h-4 w-4 text-stone-400 hover:text-stone-600 rounded-full flex items-center justify-center focus:outline-none"
              >
                &times;
              </button>
            )}
          </div>
          <button
            onClick={handleRefresh}
            className="text-xs px-2.5 py-1.5 bg-white hover:bg-stone-50 dark:bg-[#1a1d23] dark:hover:bg-stone-800 rounded border border-stone-250 dark:border-stone-750 text-stone-750 dark:text-stone-300 transition-colors shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main Mail Card */}
      <div className="flex flex-1 overflow-hidden bg-white dark:bg-[#181a20] rounded-2xl shadow-sm border border-stone-200/70 dark:border-stone-850">
        {/* Email List Sidebar */}
        <div className="w-1/3 border-r border-stone-200/80 dark:border-[#2a2d33] flex flex-col bg-white dark:bg-[#14161d]">
          <div className="flex-1 overflow-y-auto custom-scrollbar" onScroll={handleScroll}>
            {loading && page === 1 && !emails.length ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#0A5C43] dark:text-emerald-400" />
              </div>
            ) : error ? (
              <div className="p-4 m-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center text-stone-500 dark:text-stone-400">
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
                  <div className="flex justify-center p-4 bg-white dark:bg-[#1a1d23] border-t border-stone-100 dark:border-[#2a2d33]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0A5C43] dark:text-emerald-400" />
                  </div>
                )}
                {!loading && emails.length >= totalCount && totalCount > 0 && (
                  <div className="p-4 text-center text-xs text-stone-400 dark:text-stone-500 bg-white dark:bg-[#1a1d23] border-t border-stone-100 dark:border-[#2a2d33]">
                    All emails loaded ({totalCount} total)
                  </div>
                )}
              </>
            )}
          </div>

          {/* Email Count Summary footer */}
          {totalCount > 0 && (
            <div className="p-3 border-t border-stone-150 dark:border-[#2a2d33] bg-[#FAFAF9] dark:bg-[#181a20] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
              <span>Showing {emails.length} of {totalCount} emails</span>
              {loading && page > 1 && <span className="text-[#0A5C43] dark:text-[#38bdf8] animate-pulse">Loading...</span>}
            </div>
          )}
        </div>

        {/* Email Detail View */}
        <div className="w-2/3 overflow-y-auto bg-white dark:bg-[#181a20] p-8 custom-scrollbar">
          {selectedEmail ? (
            <EmailDetail email={selectedEmail} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 dark:text-stone-500">
              <Mail className="w-12 h-12 mb-2 opacity-50 text-stone-300" />
              <p className="font-medium text-stone-600 dark:text-stone-400">Select an email to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
