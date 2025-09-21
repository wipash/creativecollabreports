# Attendee Count Feature Spec

## Problem
Users cannot see how many attendees are registered for each class day without clicking on each one individually.

## Solution
Display attendee count directly on each class selector control so staff can scan availability without drilling into each day.

## Implementation Details

### 1. Update Product Type
Add optional count fields to the shared `Product` contract while keeping IDs as strings (our API converts numeric IDs to strings for consistent client usage).

```typescript
// In lib/db.ts
export interface Product {
  id: string;
  title: string;
  description: string;
  attendee_count?: number;
  checked_in_count?: number;
}
```

### 2. Enhance Products API
Extend `/api/products/route.ts` so each row includes both total and checked-in counts. The handler should continue to stringify IDs before returning them to the client.

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

const result = await pool.query(query);

const products = result.rows.map(product => ({
  id: product.id.toString(),
  title: product.title,
  description: product.description,
  attendee_count: Number(product.attendee_count ?? 0),
  checked_in_count: Number(product.checked_in_count ?? 0),
}));
```

### 3. Update ProductSelector Component
Show counts on both the desktop button grid and the mobile dropdown. Use `Badge` from `@/components/ui/badge` so the styling stays consistent with the rest of the app. Position badges in the top-right corner and keep them readable on small screens.

```tsx
import { Badge } from '@/components/ui/badge';

// Desktop button example
<Button
  key={product.id}
  onClick={() => onProductSelect(product.id)}
  variant={isSelected ? 'default' : 'outline'}
  className="relative h-auto py-3 px-4 flex flex-col items-start text-left"
>
  <span className="font-semibold text-sm">{date}</span>
  <span className="text-xs mt-1 opacity-90">{className}</span>
  {renderCounts(product, isSelected)}
</Button>

// Mobile select item example
<SelectItem value={product.id} className="py-3">
  <div className="flex flex-col items-start gap-1">
    <div className="flex items-start justify-between gap-3 w-full">
      <span className="font-medium text-gray-900">{date}</span>
      {renderCounts(product)}
    </div>
    {className && <span className="text-xs text-gray-500">{className}</span>}
  </div>
</SelectItem>

// Helper (in component scope)
const renderCounts = (product: Product, highlight = false) => (
  product.attendee_count !== undefined ? (
    <div className="flex items-center gap-1">
      <Badge variant={highlight ? 'secondary' : 'outline'} className="text-xs">
        {product.attendee_count} {product.attendee_count === 1 ? 'child' : 'children'}
      </Badge>
      {product.checked_in_count ? (
        <Badge variant="default" className="text-xs bg-green-600">
          {product.checked_in_count} ✓
        </Badge>
      ) : null}
    </div>
  ) : null
);
```

### 4. Real-time Updates (Optional)
If we need the counts to reflect check-ins fetched via `/api/attendees/[productId]`, update the React Query cache after each attendee response rather than maintaining a separate `setProducts` state.

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

queryClient.setQueryData<Product[]>(['products'], (previous = []) =>
  previous.map(product =>
    product.id === productId
      ? {
          ...product,
          attendee_count: attendees.length,
          checked_in_count: attendees.filter(a => a.checked_in_at).length,
        }
      : product
  )
);
```

## Visual Design
- Show total count in a subtle badge
- Optionally show checked-in count in green if > 0
- Position: top-right corner of button
- Mobile: Ensure badges don't overlap with text

## Performance Consideration
- Single query fetches all counts at once; the CTE keeps the scan constrained to the selected event.
- Counts come back with the initial `/api/products` load, so there is no additional client round-trip.
- React Query caching means we only rerun the products query when the stale timer expires or when we manually invalidate it.

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
- Inject attendee totals into button and select item `aria-label`s so screen readers get the same context as visual users.
- Example: "Monday 22 September, Pizza Pillows, 12 children registered, 8 checked in".

## Testing Notes
- Verify counts are accurate
- Test with classes that have 0 attendees
- Ensure counts update if data changes
