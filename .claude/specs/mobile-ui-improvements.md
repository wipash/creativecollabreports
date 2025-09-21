# Mobile UI Improvements Spec

## Problem
On mobile devices, the class day selection grid takes up too much vertical space, requiring users to scroll before seeing attendee data.

## Solution
Implement responsive design that shows a dropdown/select component on mobile while maintaining the button grid on larger screens.

## Implementation Details

### 1. Install Additional shadcn Components
```bash
pnpm dlx shadcn@latest add select
```

### 2. Create Mobile-Aware ProductSelector

```tsx
// ProductSelector.tsx
'use client';

import { Product } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const parseClassInfo = (title: string, description: string) => {
    const dateMatch = title.match(/^(Mon|Tues|Wed|Thurs|Fri|Sat|Sun)\s+\d+\s+\w+/);
    const descMatch = description.match(/<strong>(.*?)<\/strong>/);
    const className = descMatch ? descMatch[1] : '';

    return {
      date: dateMatch ? dateMatch[0] : title,
      className
    };
  };

  // Mobile: Dropdown
  if (isMobile) {
    const selectedProduct = products.find(p => p.id === selectedProductId);

    return (
      <div className="w-full space-y-2">
        <label className="text-sm font-medium">Select Class Day</label>
        <Select
          value={selectedProductId?.toString()}
          onValueChange={(value) => onProductSelect(parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a class day">
              {selectedProduct && (
                <div className="flex items-center justify-between w-full pr-2">
                  <span>
                    {parseClassInfo(selectedProduct.title, selectedProduct.description).date}
                  </span>
                  {selectedProduct.attendee_count !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedProduct.attendee_count}
                    </Badge>
                  )}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => {
              const { date, className } = parseClassInfo(product.title, product.description);
              return (
                <SelectItem key={product.id} value={product.id.toString()}>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{date}</span>
                      {product.attendee_count !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {product.attendee_count}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{className}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {selectedProduct && (
          <p className="text-xs text-muted-foreground">
            {parseClassInfo(selectedProduct.title, selectedProduct.description).className}
          </p>
        )}
      </div>
    );
  }

  // Desktop: Button Grid (existing implementation)
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
              className="h-auto py-3 px-4 flex flex-col items-start justify-start text-left relative"
            >
              <span className="font-semibold text-sm">{date}</span>
              <span className="text-xs mt-1 opacity-90">{className}</span>
              {product.attendee_count !== undefined && (
                <Badge
                  variant={isSelected ? "secondary" : "outline"}
                  className="absolute top-2 right-2 text-xs"
                >
                  {product.attendee_count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
```

### 3. Alternative: CSS-Only Approach
Use Tailwind's responsive utilities without JavaScript:

```tsx
// Two separate renders, one hidden on mobile, one hidden on desktop
return (
  <>
    {/* Mobile Dropdown - visible on small screens */}
    <div className="sm:hidden w-full">
      <Select>...</Select>
    </div>

    {/* Desktop Grid - hidden on small screens */}
    <div className="hidden sm:block w-full">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        ...
      </div>
    </div>
  </>
);
```

### 4. Additional Mobile Optimizations

#### Attendee Cards
- Stack vertically on mobile (already grid-cols-1 on mobile)
- Consider collapsible cards to save space
- Optimize font sizes for mobile readability

#### Header
- Ensure sticky header doesn't take too much space
- Consider collapsing class name to abbreviation on very small screens

#### Search Bar
- Full width on mobile
- Consider moving below count badges on mobile

## Breakpoint Strategy
- < 640px (mobile): Dropdown selector
- 640px-1024px (tablet): 2-column grid
- 1024px-1280px (laptop): 3-column grid
- > 1280px (desktop): 4-column grid

## Performance Considerations
- Use CSS-only approach if possible to avoid hydration issues
- Lazy load Select component only on mobile
- Minimize re-renders on window resize (debounce)

## Accessibility
- Maintain keyboard navigation in both views
- Ensure touch targets are at least 44x44px on mobile
- Test with mobile screen readers

## Testing Requirements
- Test on actual mobile devices (iOS Safari, Chrome Android)
- Test landscape orientation
- Test with different viewport sizes
- Verify no horizontal scroll on mobile
- Test select dropdown with long class names