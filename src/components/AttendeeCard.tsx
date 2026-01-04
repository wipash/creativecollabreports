'use client';

import { Attendee } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone } from 'lucide-react';

interface AttendeeCardProps {
  attendee: Attendee;
}

// Check if a value is valid (not null, empty, or N/A variants)
function isValidValue(value: string | null | undefined): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== '' && normalized !== 'n/a' && normalized !== 'na';
}

export default function AttendeeCard({ attendee }: AttendeeCardProps) {
  const hasValidPhone = isValidValue(attendee.parent_phone);
  const hasValidAge = isValidValue(attendee.child_age);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-semibold">
                {attendee.child_first_name} {attendee.child_last_name}
              </h3>
              {hasValidAge && (
                <Badge variant="secondary" className="text-xs">
                  Age {attendee.child_age}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Ticket: {attendee.ticket_id}
            </p>
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Parent / Guardian
          </span>
          <p className="text-sm font-medium">
            {attendee.parent_first_name} {attendee.parent_last_name}
          </p>
          <div className="mt-2 space-y-2">
            <a
              href={`mailto:${attendee.parent_email}`}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{attendee.parent_email}</span>
            </a>
            {hasValidPhone ? (
              <a
                href={`tel:${attendee.parent_phone}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span>{attendee.parent_phone}</span>
              </a>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 shrink-0" />
                <span>no phone</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
