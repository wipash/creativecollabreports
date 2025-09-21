'use client';

import { Attendee } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';

interface AttendeeCardProps {
  attendee: Attendee;
}

export default function AttendeeCard({ attendee }: AttendeeCardProps) {
  const isCheckedIn = !!attendee.checked_in_at;

  return (
    <Card className={`${isCheckedIn ? 'border-green-500 bg-green-50/50' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">
                {attendee.child_first_name} {attendee.child_last_name}
              </h3>
              {attendee.child_age && (
                <Badge variant="secondary" className="text-xs">
                  Age {attendee.child_age}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Ticket: {attendee.ticket_id}
            </p>
          </div>
          <div className="flex items-center">
            {isCheckedIn ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Circle className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-1">Parent/Guardian</p>
          <p className="text-sm">
            {attendee.parent_first_name} {attendee.parent_last_name}
          </p>
          <div className="mt-2 space-y-1">
            <a
              href={`mailto:${attendee.parent_email}`}
              className="text-sm text-blue-600 hover:underline block"
            >
              {attendee.parent_email}
            </a>
            {attendee.parent_phone && (
              <a
                href={`tel:${attendee.parent_phone}`}
                className="text-sm text-blue-600 hover:underline block"
              >
                {attendee.parent_phone}
              </a>
            )}
          </div>
        </div>

        {isCheckedIn && (
          <div className="text-xs text-green-600">
            Checked in at {new Date(attendee.checked_in_at!).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}