import { NextResponse } from 'next/server';
import pool, { Attendee } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId: productIdString } = await params;
    const productId = parseInt(productIdString);

    // Query that dynamically finds the correct question IDs for the event
    // by matching on question title patterns instead of hardcoded IDs
    const query = `
      WITH product_event AS (
        SELECT event_id FROM products WHERE id = $1
      ),
      age_question AS (
        SELECT q.id
        FROM questions q, product_event pe
        WHERE q.event_id = pe.event_id
          AND q.belongs_to = 'PRODUCT'
          AND q.title ILIKE '%age%'
          AND q.deleted_at IS NULL
        LIMIT 1
      ),
      phone_question AS (
        SELECT q.id
        FROM questions q, product_event pe
        WHERE q.event_id = pe.event_id
          AND q.belongs_to = 'ORDER'
          AND q.title ILIKE '%phone%'
          AND q.deleted_at IS NULL
        LIMIT 1
      )
      SELECT
        a.id,
        a.first_name as child_first_name,
        a.last_name as child_last_name,
        age_answer.answer::text as child_age,
        o.first_name as parent_first_name,
        o.last_name as parent_last_name,
        o.email as parent_email,
        phone_answer.answer::text as parent_phone,
        a.public_id as ticket_id
      FROM attendees a
      JOIN orders o ON a.order_id = o.id
      LEFT JOIN age_question aq ON true
      LEFT JOIN phone_question pq ON true
      LEFT JOIN question_answers age_answer ON (
        age_answer.attendee_id = a.id
        AND age_answer.question_id = aq.id
        AND age_answer.deleted_at IS NULL
      )
      LEFT JOIN question_answers phone_answer ON (
        phone_answer.order_id = o.id
        AND phone_answer.question_id = pq.id
        AND phone_answer.attendee_id IS NULL
        AND phone_answer.deleted_at IS NULL
      )
      WHERE a.product_id = $1
        AND a.deleted_at IS NULL
        AND o.deleted_at IS NULL
        AND o.status = 'COMPLETED'
      ORDER BY a.last_name, a.first_name
    `;

    const result = await pool.query<Attendee>(query, [productId]);

    const attendees = result.rows.map(row => ({
      ...row,
      child_age: row.child_age ? row.child_age.replace(/['"]/g, '') : null,
      parent_phone: row.parent_phone ? row.parent_phone.replace(/['"]/g, '') : null
    }));

    return NextResponse.json(attendees);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
  }
}
