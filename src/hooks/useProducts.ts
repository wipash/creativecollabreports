import { useQuery } from '@tanstack/react-query';
import { Product } from '@/lib/db';

export function useProducts(eventId: string | null) {
  return useQuery({
    queryKey: ['products', eventId],
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch(`/api/products?eventId=${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000, // Products change rarely, cache for 10 min
  });
}