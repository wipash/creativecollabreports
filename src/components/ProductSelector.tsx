'use client';

import { Product } from '@/lib/db';
import { Button } from '@/components/ui/button';

interface ProductSelectorProps {
  products: Product[];
  selectedProductId: number | null;
  onProductSelect: (productId: number) => void;
}

export default function ProductSelector({
  products,
  selectedProductId,
  onProductSelect
}: ProductSelectorProps) {
  const parseClassInfo = (title: string, description: string) => {
    const dateMatch = title.match(/^(Mon|Tues|Wed|Thurs|Fri|Sat|Sun)\s+\d+\s+\w+/);
    const descMatch = description.match(/<strong>(.*?)<\/strong>/);
    const className = descMatch ? descMatch[1] : '';

    return {
      date: dateMatch ? dateMatch[0] : title,
      className
    };
  };

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4">Select a Class Day</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {products.map((product) => {
          const { date, className } = parseClassInfo(product.title, product.description);
          const isSelected = selectedProductId === product.id;

          return (
            <Button
              key={product.id}
              onClick={() => onProductSelect(product.id)}
              variant={isSelected ? "default" : "outline"}
              className="h-auto py-3 px-4 flex flex-col items-start justify-start text-left"
            >
              <span className="font-semibold text-sm">{date}</span>
              <span className="text-xs mt-1 opacity-90">{className}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}