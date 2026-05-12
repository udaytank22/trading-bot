// Centralized status badge component — used across Dashboard and Inquiries pages
export default function StatusBadge({ status }) {
  const styles = {
    PENDING:      'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25',
    RFQ_SENT:     'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/25',
    RFQ_RECEIVED: 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/25',
    QUOTE_SENT:   'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25',
    CONFIRMED:    'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/25',
    CLOSED:       'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/25',
  };
  const labels = {
    PENDING:      'PENDING',
    RFQ_SENT:     'RFQ SENT',
    RFQ_RECEIVED: 'RFQ RECEIVED',
    QUOTE_SENT:   'QUOTE SENT',
    CONFIRMED:    'CONFIRMED',
    CLOSED:       'CLOSED',
  };
  const cls = styles[status] ?? 'bg-gray-500/20 text-gray-500 border-gray-500/25';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide uppercase ${cls}`}>
      {labels[status] ?? status}
    </span>
  );
}
