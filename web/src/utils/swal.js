import Swal from 'sweetalert2';

export const confirmAction = async ({
  title = 'Are you sure?',
  text = "You won't be able to revert this!",
  confirmButtonText = 'Yes, delete it!',
  isDanger = true
} = {}) => {
  const result = await Swal.fire({
    title,
    text,
    icon: isDanger ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    background: document.documentElement.classList.contains('dark') ? '#1a1d23' : '#ffffff',
    customClass: {
      popup: 'bg-white dark:bg-[#1a1d23] text-gray-900 dark:text-white rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-2xl',
      title: 'text-xl font-bold text-gray-900 dark:text-white',
      htmlContainer: 'text-gray-500 dark:text-gray-400 font-medium',
      confirmButton: `px-6 py-2.5 rounded-xl font-bold shadow-md transition-all border-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1a1d23] ${isDanger
        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20 focus:ring-red-500'
        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20 focus:ring-purple-500'
        }`,
      cancelButton: 'px-6 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all border-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1a1d23]',
      actions: 'flex gap-3 w-full justify-center mt-6',
      icon: isDanger ? 'border-red-500 text-red-500' : 'border-purple-500 text-purple-500'
    },
    buttonsStyling: false,
  });

  return result.isConfirmed;
};
