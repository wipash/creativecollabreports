import { useQuery } from '@tanstack/react-query';
import { Attendee } from '@/lib/db';

export function useAttendees(productId: string | null) {
  return useQuery({
    queryKey: ['attendees', productId],
    queryFn: async (): Promise<Attendee[]> => {
      if (!productId) return [];

      const response = await fetch(`/api/attendees/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendees');
      }
      return response.json();
    },
    enabled: !!productId, // Only run when productId exists
    staleTime: 2 * 60 * 1000, // Attendee data changes more frequently
  });
}