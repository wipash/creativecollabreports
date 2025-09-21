import { useQuery } from '@tanstack/react-query';
import { Product } from '@/lib/db';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Products change rarely, cache for 10 min
  });
}