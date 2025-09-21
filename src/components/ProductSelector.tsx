'use client';

import { Product } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const renderCounts = (product: Product, highlight = false, className = '') => {
    if (typeof product.attendee_count !== 'number') {
      return null;
    }

    return (
      <div className={`inline-flex items-center gap-1 whitespace-nowrap ${className}`}>
        <Badge
          variant={highlight ? 'secondary' : 'outline'}
          className="text-xs"
        >
          {product.attendee_count} {product.attendee_count === 1 ? 'kid' : 'kids'}
        </Badge>
      </div>
    );
  };

  const buildAriaLabel = (date: string, className: string, product: Product) => {
    const labelParts = [date];
    if (className) {
      labelParts.push(className);
    }

    if (typeof product.attendee_count === 'number') {
      labelParts.push(`${product.attendee_count} ${product.attendee_count === 1 ? 'kid registered' : 'kids registered'}`);
    }

    return labelParts.join(', ');
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
              <SelectValue placeholder="Choose a class day" className="w-full flex-1">
                {selectedProduct && (
                  <div className="flex flex-col min-w-0 gap-1 w-full">
                    <div className="flex items-start justify-between gap-3">
                      <span className="block font-medium text-gray-900 leading-tight">
                        {selectedClassInfo.date}
                      </span>
                      {renderCounts(selectedProduct, true, 'shrink-0')}
                    </div>
                    {selectedClassInfo.className && (
                      <span className="block text-xs text-gray-500 leading-tight">
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
                const ariaLabel = buildAriaLabel(date, className, product);
                const isActive = selectedProductId === product.id;

                return (
                  <SelectItem
                    key={product.id}
                    value={product.id.toString()}
                    className="py-3 w-full"
                    aria-label={ariaLabel}
                  >
                    <div className="flex flex-col min-w-0 gap-1 w-full">
                      <div className="flex items-start justify-between gap-3">
                        <span className="block font-medium text-gray-900 leading-tight">{date}</span>
                        {renderCounts(product, isActive, 'shrink-0')}
                      </div>
                      {className && (
                        <span className="block text-xs text-gray-500 leading-tight">{className}</span>
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
            const ariaLabel = buildAriaLabel(date, className, product);

            return (
              <Button
                key={product.id}
                onClick={() => onProductSelect(product.id)}
                variant={isSelected ? "default" : "outline"}
                className="h-auto py-3 px-4 text-left"
                aria-label={ariaLabel}
              >
                <div className="flex flex-col min-w-0 gap-1 w-full">
                  <div className="flex items-start justify-between gap-3">
                    <span className="block font-semibold text-sm leading-tight">{date}</span>
                    {renderCounts(product, isSelected, 'shrink-0')}
                  </div>
                  <span className="block text-xs opacity-90 leading-tight">{className}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
