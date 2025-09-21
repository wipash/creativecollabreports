import { Product } from '@/lib/db';

export function findCurrentDayProduct(products: Product[]): Product | null {
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Try to match various date formats in product titles
  return products.find(product => {
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
  }) || null;
}