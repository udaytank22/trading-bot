import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import { useSocket } from '../../context/SocketContext';
import { PageContainer } from '../../components/ui';

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

  const [toast, setToast] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchEmails(page, search, folder);
  }, [page, search, folder]);

  useEffect(() => {
    if (!socket) return;

    const handleNewEmailReceived = (data) => {
      const newMail = data.email;
      if (!newMail) return;

      // 1. Silently prepend to emails list if we are in inbox folder and it matches current search
      if (folder === 'inbox') {
        const matchesSearch = !search ||
          newMail.subject.toLowerCase().includes(search.toLowerCase()) ||
          (newMail.sender?.emailAddress?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (newMail.sender?.emailAddress?.address || '').toLowerCase().includes(search.toLowerCase()) ||
          (newMail.body?.content || '').toLowerCase().includes(search.toLowerCase());

        if (matchesSearch) {
          setEmails(prev => {
            if (prev.some(e => e.id === newMail.id)) return prev;
            return [newMail, ...prev];
          });
          setTotalCount(prev => prev + 1);
        }
      }

      // 2. Show beautiful floating toast notification
      setToast({
        id: newMail.id,
        sender: newMail.sender?.emailAddress?.name || newMail.sender?.emailAddress?.address || 'Unknown Sender',
        subject: newMail.subject || '(No Subject)',
        email: newMail
      });
    };

    socket.on('new_email_received', handleNewEmailReceived);
    return () => {
      socket.off('new_email_received', handleNewEmailReceived);
    };
  }, [socket, search, folder]);

  // Auto-dismiss toast after 8 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

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
    <PageContainer
      title="Inbox"
      subtitle="Supplier and buyer correspondence in one place."
    >

      {/* Tabs Row */}
      <div className="flex border-b border-stone-200/80 dark:border-stone-850 items-center justify-between mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => {
              setFolder('inbox');
              setPage(1);
            }}
            className={`pb-2 text-sm font-medium transition-all relative ${folder === 'inbox'
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
            className={`pb-2 text-sm font-medium transition-all relative ${folder === 'sent'
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

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-[#1e222b] border-l-4 border-emerald-500 dark:border-l-[#10b981] rounded-xl shadow-2xl p-4 flex gap-3 border border-stone-200 dark:border-stone-850 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold tracking-wider text-stone-400 dark:text-stone-500 uppercase">New Email Received</span>
            </div>
            <p className="text-xs font-bold text-stone-800 dark:text-stone-100 truncate mb-0.5">
              {toast.sender}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              {toast.subject}
            </p>
          </div>
          <div className="flex flex-col gap-1 justify-center shrink-0">
            <button
              onClick={() => {
                setSelectedEmail(toast.email);
                setToast(null);
              }}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-[#0a5c43] dark:text-[#34d399] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              View
            </button>
            <button
              onClick={() => setToast(null)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-xs py-1 transition-colors cursor-pointer font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default InboxPage;
