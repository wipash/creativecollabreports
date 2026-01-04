import { NextResponse } from 'next/server';
import pool, { Event } from '@/lib/db';

type EventRow = {
  id: number;
  title: string;
  start_date: Date | null;
  end_date: Date | null;
  is_current: boolean;
};

export async function GET() {
  try {
    // Query active events with computed is_current field
    // An event is "current" if:
    // - start_date is within the last 14 days AND
    // - (no end_date OR end_date >= today)
    const query = `
      SELECT
        id,
        title,
        start_date,
        end_date,
        CASE
          WHEN start_date >= NOW() - INTERVAL '14 days'
               AND (end_date IS NULL OR end_date >= NOW())
          THEN true
          ELSE false
        END as is_current
      FROM events
      WHERE deleted_at IS NULL
        AND status = 'LIVE'
      ORDER BY start_date DESC
    `;

    const result = await pool.query<EventRow>(query);

    const events: Event[] = result.rows.map(event => ({
      id: event.id.toString(),
      title: event.title,
      start_date: event.start_date?.toISOString() ?? null,
      end_date: event.end_date?.toISOString() ?? null,
      is_current: event.is_current,
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
