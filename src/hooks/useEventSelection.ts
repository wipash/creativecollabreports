'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Event } from '@/lib/db';

const STORAGE_KEY = 'selectedEventId';

function findDefaultEvent(events: Event[]): Event | undefined {
  if (events.length === 0) return undefined;

  // Priority 1: Current event (is_current flag from API)
  const currentEvent = events.find(e => e.is_current);
  if (currentEvent) return currentEvent;

  // Priority 2: Next upcoming event (start_date > today, closest to now)
  const now = new Date();
  const upcomingEvents = events
    .filter(e => e.start_date && new Date(e.start_date) > now)
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());
  if (upcomingEvents.length > 0) return upcomingEvents[0];

  // Priority 3: Most recent past event (fallback - first in list since sorted by start_date DESC)
  return events[0];
}

export function useEventSelection(events: Event[] | undefined) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);

  // Get event from URL
  const eventIdFromUrl = searchParams.get('event');
  const ticketIdFromUrl = searchParams.get('ticket');

  // Update URL with new params
  const updateUrl = useCallback((eventId: string | null, ticketId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (eventId) {
      params.set('event', eventId);
    } else {
      params.delete('event');
    }

    if (ticketId) {
      params.set('ticket', ticketId);
    } else {
      params.delete('ticket');
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  // Select event (updates URL and localStorage)
  const selectEvent = useCallback((eventId: string) => {
    // Clear ticket when switching events
    updateUrl(eventId, null);
    // Persist to localStorage as fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, eventId);
    }
  }, [updateUrl]);

  // Select ticket (updates URL)
  const selectTicket = useCallback((ticketId: string | null) => {
    updateUrl(eventIdFromUrl, ticketId);
  }, [updateUrl, eventIdFromUrl]);

  // Handle hydration and smart defaults
  useEffect(() => {
    if (!events || events.length === 0) return;

    // Already have event in URL - validate it exists
    if (eventIdFromUrl) {
      const validEvent = events.find(e => e.id === eventIdFromUrl);
      if (validEvent) {
        setIsHydrated(true);
        // Update localStorage in case URL was shared
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, eventIdFromUrl);
        }
        return;
      }
      // Invalid event in URL - fall through to defaults
    }

    // No event in URL - check localStorage
    if (typeof window !== 'undefined') {
      const storedEventId = localStorage.getItem(STORAGE_KEY);
      if (storedEventId) {
        const validEvent = events.find(e => e.id === storedEventId);
        if (validEvent) {
          updateUrl(storedEventId, null);
          setIsHydrated(true);
          return;
        }
        // Invalid stored event - clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Apply smart default
    const defaultEvent = findDefaultEvent(events);
    if (defaultEvent) {
      updateUrl(defaultEvent.id, null);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, defaultEvent.id);
      }
    }
    setIsHydrated(true);
  }, [events, eventIdFromUrl, updateUrl]);

  const selectedEvent = events?.find(e => e.id === eventIdFromUrl);

  return {
    selectedEventId: eventIdFromUrl,
    selectedTicketId: ticketIdFromUrl,
    selectedEvent,
    selectEvent,
    selectTicket,
    isHydrated,
  };
}
