import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: false,
});

export default pool;

export interface Product {
  id: number;
  title: string;
  description: string;
}

export interface Attendee {
  id: number;
  child_first_name: string;
  child_last_name: string;
  child_age: string | null;
  parent_first_name: string;
  parent_last_name: string;
  parent_email: string;
  parent_phone: string | null;
  checked_in_at: Date | null;
  ticket_id: string;
}