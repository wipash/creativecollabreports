import { NextResponse } from 'next/server';
import pool, { Product } from '@/lib/db';

type ProductRow = {
  id: number;
  title: string;
  description: string;
  attendee_count: number | string | null;
  checked_in_count: number | string | null;
};

export async function GET() {
  try {
    const query = `
      WITH attendee_counts AS (
        SELECT
          a.product_id,
          COUNT(*) AS total,
          COUNT(a.checked_in_at) AS checked_in
        FROM attendees a
        JOIN orders o ON a.order_id = o.id
        WHERE a.deleted_at IS NULL
          AND o.deleted_at IS NULL
          AND o.status = 'COMPLETED'
          AND a.product_id IN (
            SELECT id FROM products
            WHERE event_id = 2 AND deleted_at IS NULL
          )
        GROUP BY a.product_id
      )
      SELECT
        p.id,
        p.title,
        p.description,
        COALESCE(ac.total, 0) AS attendee_count,
        COALESCE(ac.checked_in, 0) AS checked_in_count
      FROM products p
      LEFT JOIN attendee_counts ac ON p.id = ac.product_id
      WHERE p.event_id = 2
        AND p.deleted_at IS NULL
      ORDER BY p.id
    `;

    const result = await pool.query<ProductRow>(query);

    const products: Product[] = result.rows.map(product => ({
      id: product.id.toString(),
      title: product.title,
      description: product.description,
      attendee_count: Number(product.attendee_count ?? 0),
      checked_in_count: Number(product.checked_in_count ?? 0)
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
