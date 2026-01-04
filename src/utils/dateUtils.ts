import { Product } from '@/lib/db';

export type ParsedTitle =
  | { type: 'date'; date: string; className: string }
  | { type: 'term'; title: string };

// Date formats:
// - "Mon 22 Sep" or "Tue 20 Jan" (day name + date + month)
// - "20 Jan" or "3 February" (date + month)
const DAY_DATE_REGEX = /^(Mon|Tue|Tues|Wed|Thu|Thurs|Fri|Sat|Sun)\s+\d+\s+\w+/;
const DATE_MONTH_REGEX = /^\d+\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\b/i;

export function parseProductTitle(title: string, description: string): ParsedTitle {
  const dayDateMatch = title.match(DAY_DATE_REGEX);
  const dateMonthMatch = title.match(DATE_MONTH_REGEX);

  if (dayDateMatch || dateMonthMatch) {
    // Extract class name from description HTML if available
    const descMatch = description.match(/<strong>(.*?)<\/strong>/);
    return {
      type: 'date',
      date: dayDateMatch ? dayDateMatch[0] : dateMonthMatch![0],
      className: descMatch ? descMatch[1] : '',
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
  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Try to match date-format product titles to today
  const match = products.find(product => {
    const title = product.title.toLowerCase();
    const todayLower = todayFormatted.toLowerCase();

    // Extract day and month from both formats for comparison
    const dayRegex = /(\w+)\s+(\d+)\s+(\w+)/;
    const titleMatch = title.match(dayRegex);
    const todayMatch = todayLower.match(dayRegex);

    if (titleMatch && todayMatch) {
      // Compare weekday and day number
      return titleMatch[1] === todayMatch[1] && titleMatch[2] === todayMatch[2];
    }

    return false;
  });

  // For non-date format titles, return null (caller should use first product as default)
  return match || null;
}