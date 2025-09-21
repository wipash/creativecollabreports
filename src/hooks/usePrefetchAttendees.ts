import { useQueryClient } from '@tanstack/react-query';
import { Product, Attendee } from '@/lib/db';

export function usePrefetchAttendees(products: Product[]) {
  const queryClient = useQueryClient();

  const prefetchAll = () => {
    products.forEach((product) => {
      queryClient.prefetchQuery({
        queryKey: ['attendees', product.id],
        queryFn: async (): Promise<Attendee[]> => {
          const response = await fetch(`/api/attendees/${product.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch attendees');
          }
          return response.json();
        },
        staleTime: 2 * 60 * 1000,
      });
    });
  };

  return { prefetchAll };
}