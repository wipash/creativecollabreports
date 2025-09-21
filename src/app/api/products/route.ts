import { NextResponse } from 'next/server';
import pool, { Product } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT id, title, description
      FROM products
      WHERE event_id = 2
        AND deleted_at IS NULL
      ORDER BY id
    `;

    const result = await pool.query<Product>(query);

    const products = result.rows.map(product => ({
      id: product.id.toString(),
      title: product.title,
      description: product.description
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}