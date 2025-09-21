# Attendee Count Feature Spec

## Problem
Users cannot see how many attendees are registered for each class day without clicking on each one individually.

## Solution
Display attendee count directly on each class day button in the ProductSelector component.

## Implementation Details

### 1. Update Product Type
```typescript
// In lib/db.ts
export interface Product {
  id: number;
  title: string;
  description: string;
  attendee_count?: number;
  checked_in_count?: number;
}
```

### 2. Enhance Products API
Update `/api/products/route.ts` to include attendee counts:

```typescript
const query = `
  WITH attendee_counts AS (
    SELECT
      a.product_id,
      COUNT(*) as total,
      COUNT(a.checked_in_at) as checked_in
    FROM attendees a
    JOIN orders o ON a.order_id = o.id
    WHERE a.deleted_at IS NULL
      AND o.deleted_at IS NULL
      AND o.status = 'COMPLETED'
      AND a.product_id IN (
        SELECT id FROM products
        WHERE event_id = 2 AND deleted_at IS NULL
      )
    GROUP BY a.product_id
  )
  SELECT
    p.id,
    p.title,
    p.description,
    COALESCE(ac.total, 0) as attendee_count,
    COALESCE(ac.checked_in, 0) as checked_in_count
  FROM products p
  LEFT JOIN attendee_counts ac ON p.id = ac.product_id
  WHERE p.event_id = 2
    AND p.deleted_at IS NULL
  ORDER BY p.id
`;
```

### 3. Update ProductSelector Component
Display count as a badge on each button:

```tsx
import { Badge } from '@/components/ui/badge';

// In the button render:
<Button
  key={product.id}
  onClick={() => onProductSelect(product.id)}
  variant={isSelected ? "default" : "outline"}
  className="h-auto py-3 px-4 flex flex-col items-start justify-start text-left relative"
>
  <span className="font-semibold text-sm">{date}</span>
  <span className="text-xs mt-1 opacity-90">{className}</span>
  {product.attendee_count !== undefined && (
    <div className="absolute top-2 right-2 flex items-center gap-1">
      <Badge variant={isSelected ? "secondary" : "outline"} className="text-xs">
        {product.attendee_count} {product.attendee_count === 1 ? 'child' : 'children'}
      </Badge>
      {product.checked_in_count > 0 && (
        <Badge variant="default" className="text-xs bg-green-600">
          {product.checked_in_count} ✓
        </Badge>
      )}
    </div>
  )}
</Button>
```

### 4. Real-time Updates (Optional)
When an attendee is fetched, update the count in the products array:

```typescript
// After fetching attendees for a product
const updatedProducts = products.map(p =>
  p.id === productId
    ? { ...p, attendee_count: attendees.length, checked_in_count: attendees.filter(a => a.checked_in_at).length }
    : p
);
setProducts(updatedProducts);
```

## Visual Design
- Show total count in a subtle badge
- Optionally show checked-in count in green if > 0
- Position: top-right corner of button
- Mobile: Ensure badges don't overlap with text

## Performance Consideration
- Single query fetches all counts at once
- Minimal overhead compared to products-only query
- Updates only when products are refreshed

## Alternative Designs

### Option A: Count Below Text
```
Mon 22 Sep
Pizza Pillows
━━━━━━━━━━
12 registered
```

### Option B: Progress Bar Style
```
Mon 22 Sep
Pizza Pillows
[████████░░] 8/10 checked in
```

### Option C: Simple Number
```
Mon 22 Sep (12)
Pizza Pillows
```

## Accessibility
- Include count in aria-label for screen readers
- Example: "Monday 22 September, Pizza Pillows, 12 children registered, 8 checked in"

## Testing Notes
- Verify counts are accurate
- Test with classes that have 0 attendees
- Ensure counts update if data changes