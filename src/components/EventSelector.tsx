'use client';

import { Event } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EventSelectorProps {
  events: Event[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
}

function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate) return '';

  const start = new Date(startDate);
  const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

  if (!endDate) {
    return start.toLocaleDateString('en-AU', formatOptions);
  }

  const end = new Date(endDate);
  return `${start.toLocaleDateString('en-AU', formatOptions)} - ${end.toLocaleDateString('en-AU', formatOptions)}`;
}

export default function EventSelector({
  events,
  selectedEventId,
  onEventSelect
}: EventSelectorProps) {
  const selectedEvent = events.find(e => e.id === selectedEventId);

  if (events.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No active events found.
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Select
        value={selectedEventId ?? undefined}
        onValueChange={onEventSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an event">
            {selectedEvent && (
              <div className="flex items-center gap-2">
                <span className="truncate">{selectedEvent.title}</span>
                {selectedEvent.is_current && (
                  <Badge variant="secondary" className="text-xs shrink-0">Current</Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {events.map((event) => {
            const dateRange = formatDateRange(event.start_date, event.end_date);

            return (
              <SelectItem
                key={event.id}
                value={event.id}
                className="py-2"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{event.title}</span>
                    {event.is_current && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </div>
                  {dateRange && (
                    <span className="text-xs text-gray-500">{dateRange}</span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
