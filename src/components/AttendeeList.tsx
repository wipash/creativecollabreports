'use client';

import { useState, useMemo } from 'react';
import { Attendee } from '@/lib/db';
import AttendeeCard from './AttendeeCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface AttendeeListProps {
  attendees: Attendee[];
  loading: boolean;
  error?: string;
}

export default function AttendeeList({ attendees, loading, error }: AttendeeListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAttendees = useMemo(() => {
    if (!searchTerm) return attendees;

    const term = searchTerm.toLowerCase();
    return attendees.filter((attendee) => {
      const childName = `${attendee.child_first_name} ${attendee.child_last_name}`.toLowerCase();
      const parentName = `${attendee.parent_first_name} ${attendee.parent_last_name}`.toLowerCase();
      return childName.includes(term) || parentName.includes(term);
    });
  }, [attendees, searchTerm]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading attendees: {error}</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading attendees...</p>
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No attendees found for this day</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            Kids on this day: {attendees.length}
          </Badge>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAttendees.map((attendee) => (
          <AttendeeCard key={attendee.id} attendee={attendee} />
        ))}
      </div>

      {filteredAttendees.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No attendees match your search</p>
        </div>
      )}
    </div>
  );
}
