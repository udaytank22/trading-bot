import { useQuery } from '@tanstack/react-query';
import { api } from '@services/api';
import { useAuth } from '@context/AuthContext';

export function useAccounts() {
  const { currentUser } = useAuth();
  const isClient = currentUser?.role?.toLowerCase() === 'client';

  return useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      if (isClient) return [];
      const res = await api.bankAccounts.getBankAccounts({ pageSize: 500 });
      if (!res?.success) return [];
      
      return (res.data ?? []).map(acc => ({
        ...acc,
        accountName: acc.accountHolderName || acc.accountName || '',
        balance: acc.balance !== undefined ? acc.balance : 0.00,
        status: acc.status === 'ACTIVE' ? 'Active' : (acc.status === 'INACTIVE' ? 'Inactive' : (acc.status || 'Active'))
      }));
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });
}
