import { Product } from '@/lib/db';

export type ParsedTitle =
  | { type: 'date'; date: string; className: string }
  | { type: 'term'; title: string };

// Date format: "Mon 22 Sep - Pizza Pillows" or "Tues 23 Sep"
const DATE_REGEX = /^(Mon|Tues|Wed|Thurs|Fri|Sat|Sun)\s+\d+\s+\w+/;

export function parseProductTitle(title: string, description: string): ParsedTitle {
  const dateMatch = title.match(DATE_REGEX);

  if (dateMatch) {
    // Extract class name from description HTML if available
    const descMatch = description.match(/<strong>(.*?)<\/strong>/);
    return {
      type: 'date',
      date: dateMatch[0],
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