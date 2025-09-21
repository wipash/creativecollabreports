'use client';

import { Product } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductSelectorProps {
  products: Product[];
  selectedProductId: string | null;
  onProductSelect: (productId: string) => void;
}

export default function ProductSelector({
  products,
  selectedProductId,
  onProductSelect
}: ProductSelectorProps) {
  // Fixed mobile/desktop state sync issue with CSS-only approach
  const parseClassInfo = (title: string, description: string) => {
    const dateMatch = title.match(/^(Mon|Tues|Wed|Thurs|Fri|Sat|Sun)\s+\d+\s+\w+/);
    const descMatch = description.match(/<strong>(.*?)<\/strong>/);
    const className = descMatch ? descMatch[1] : '';

    return {
      date: dateMatch ? dateMatch[0] : title,
      className
    };
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedClassInfo = selectedProduct ? parseClassInfo(selectedProduct.title, selectedProduct.description) : { date: '', className: '' };

  return (
    <div className="w-full">
      {/* Mobile: Dropdown - visible on small screens */}
      <div className="sm:hidden space-y-3">
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">Class Day</label>
          <Select
            value={selectedProductId?.toString()}
            onValueChange={(value) => onProductSelect(value)}
          >
            <SelectTrigger className="w-full min-h-[60px] px-3 py-3 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="Choose a class day">
                {selectedProduct && (
                  <div className="flex flex-col items-start w-full py-1">
                    <span className="font-medium text-gray-900">
                      {selectedClassInfo.date}
                    </span>
                    {selectedClassInfo.className && (
                      <span className="text-xs text-gray-500 mt-1">
                        {selectedClassInfo.className}
                      </span>
                    )}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {products.map((product) => {
                const { date, className } = parseClassInfo(product.title, product.description);
                return (
                  <SelectItem key={product.id} value={product.id.toString()} className="py-3">
                    <div className="flex flex-col items-start w-full">
                      <span className="font-medium text-gray-900">{date}</span>
                      {className && (
                        <span className="text-xs text-gray-500 mt-1">{className}</span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop: Button Grid - hidden on small screens */}
      <div className="hidden sm:block">
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
    </div>
  );
}