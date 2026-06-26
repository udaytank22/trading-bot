import { useQuery } from '@tanstack/react-query';
import { api } from '@services/api';
import { useAuth } from '@context/AuthContext';

export function useSuppliers() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.suppliers.getSuppliers({ pageSize: 500 });
      if (!res?.success) return [];
      return res.data ?? [];
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });
}
