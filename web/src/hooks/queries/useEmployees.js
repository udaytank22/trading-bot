import { useQuery } from '@tanstack/react-query';
import { api } from '@services/api';
import { useAuth } from '@context/AuthContext';

export function useEmployees() {
  const { currentUser } = useAuth();
  const isClient = currentUser?.role?.toLowerCase() === 'client';

  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      if (isClient) return [];
      const res = await api.employees.getEmployees({ pageSize: 500 });
      if (!res?.success) return [];
      
      return (res.data ?? []).map(emp => ({
        ...emp,
        name: emp.fullName || emp.name || '',
        role: emp.designation || emp.role || '',
        status: emp.status === 'ACTIVE' ? 'Active' : (emp.status === 'INACTIVE' ? 'Inactive' : (emp.status || 'Active')),
        avatar: (emp.fullName || emp.name || '')
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      }));
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });
}
