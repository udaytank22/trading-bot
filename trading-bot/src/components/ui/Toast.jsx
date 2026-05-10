export default function Toast({ message, type = 'success' }) {
  if (!message) return null;

  const styles = {
    success: 'bg-emerald-500 border-emerald-400/50 shadow-emerald-500/20',
    error:   'bg-red-500 border-red-400/50 shadow-red-500/20',
  };
  const icons = {
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[200] text-white px-5 py-3.5 rounded-lg shadow-xl flex items-center gap-3 border transform transition-all duration-300 ${styles[type]} ${message ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
      {icons[type]}
      <span className="font-bold text-sm tracking-wide">{message}</span>
    </div>
  );
}
