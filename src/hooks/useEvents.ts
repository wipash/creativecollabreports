import { useQuery } from '@tanstack/react-query';
import { Event } from '@/lib/db';

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // Events change rarely, cache for 30 min
  });
}
