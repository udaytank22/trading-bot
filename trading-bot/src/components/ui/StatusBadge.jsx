// Centralized status badge component — used across Dashboard and Inquiries pages
export default function StatusBadge({ status }) {
  const styles = {
    PENDING:    'bg-amber-500/20 text-amber-400 border-amber-500/25',
    RFQ_SENT:   'bg-blue-500/20 text-blue-400 border-blue-500/25',
    QUOTE_SENT: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/25',
    CLOSED:     'bg-gray-500/20 text-gray-400 border-gray-500/25',
  };
  const labels = {
    PENDING:    'PENDING',
    RFQ_SENT:   'RFQ SENT',
    QUOTE_SENT: 'QUOTE SENT',
    CLOSED:     'CLOSED',
  };
  const cls = styles[status] ?? 'bg-gray-500/20 text-gray-500 border-gray-500/25';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide uppercase ${cls}`}>
      {labels[status] ?? status}
    </span>
  );
}
