import { Product } from '@/lib/db';

export type ParsedTitle =
  | { type: 'date'; date: string; className: string; dayNum: number; month: string }
  | { type: 'term'; title: string };

// Date formats:
// - "Mon 22 Sep" or "Tue 20 Jan" (day name + date + month)
// - "20 Jan" or "3 February" (date + month)
const DAY_DATE_REGEX = /^(Mon|Tue|Tues|Wed|Thu|Thurs|Fri|Sat|Sun)\s+(\d+)\s+(\w+)/i;
const DATE_MONTH_REGEX = /^(\d+)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\b/i;

// Normalize month names to 3-letter abbreviation
function normalizeMonth(month: string): string {
  return month.slice(0, 3).toLowerCase();
}

export function parseProductTitle(title: string, description: string): ParsedTitle {
  const dayDateMatch = title.match(DAY_DATE_REGEX);
  const dateMonthMatch = title.match(DATE_MONTH_REGEX);

  if (dayDateMatch) {
    const descMatch = description.match(/<strong>(.*?)<\/strong>/);
    return {
      type: 'date',
      date: dayDateMatch[0],
      className: descMatch ? descMatch[1] : '',
      dayNum: parseInt(dayDateMatch[2], 10),
      month: normalizeMonth(dayDateMatch[3]),
    };
  }

  if (dateMonthMatch) {
    const descMatch = description.match(/<strong>(.*?)<\/strong>/);
    return {
      type: 'date',
      date: dateMonthMatch[0],
      className: descMatch ? descMatch[1] : '',
      dayNum: parseInt(dateMonthMatch[1], 10),
      month: normalizeMonth(dateMonthMatch[2]),
    };
  }

  // Non-date format (e.g., "Mon Term 1 2026")
  return {
    type: 'term',
    title: title,
  };
}

export function findCurrentDayProduct(products: Product[]): Product | null {
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();

  return products.find(product => {
    const parsed = parseProductTitle(product.title, product.description);
    if (parsed.type !== 'date') return false;
    return parsed.dayNum === todayDay && parsed.month === todayMonth;
  }) || null;
}