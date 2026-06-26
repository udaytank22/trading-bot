import { useQuery } from '@tanstack/react-query';
import { api } from '@services/api';
import { useAuth } from '@context/AuthContext';

export function useProducts() {
  const { currentUser } = useAuth();
  const isClient = currentUser?.role?.toLowerCase() === 'client';

  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      if (isClient) return [];
      const res = await api.products.getProducts({ pageSize: 500 });
      if (!res?.success) return [];
      return res.data ?? [];
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });
}
