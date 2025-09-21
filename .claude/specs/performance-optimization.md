# Performance Optimization Spec

## Problem
Loading attendee data when switching between class days is slow, causing poor user experience.

## Solution Approach

### 1. Client-Side Caching
- Implement a cache Map to store already-fetched attendee data
- Key: productId, Value: attendee array
- Check cache before making API call
- Clear cache on page refresh or after timeout (e.g., 5 minutes)

### 2. Prefetch Strategy
- After initial load, prefetch attendee data for all products in background
- Use low-priority fetch with AbortController for cancellation
- Store in same cache structure

### 3. Query Optimization
- Add database indexes if not present:
  ```sql
  CREATE INDEX idx_attendees_product_deleted ON attendees(product_id, deleted_at);
  CREATE INDEX idx_orders_status_deleted ON orders(status, deleted_at);
  CREATE INDEX idx_question_answers_attendee ON question_answers(attendee_id, question_id, deleted_at);
  CREATE INDEX idx_question_answers_order ON question_answers(order_id, question_id, deleted_at);
  ```
- Consider combining products and attendee counts into single query

### 4. React Query Implementation (Optional Enhancement)
- Use @tanstack/react-query for sophisticated caching
- Benefits: automatic background refetch, optimistic updates, cache invalidation
- Config: staleTime: 5 minutes, cacheTime: 10 minutes

## Implementation Details

### Simple Cache Implementation
```typescript
// In page.tsx
const [attendeeCache, setAttendeeCache] = useState<Map<number, Attendee[]>>(new Map());

const fetchAttendees = async (productId: number) => {
  // Check cache first
  if (attendeeCache.has(productId)) {
    setAttendees(attendeeCache.get(productId)!);
    return;
  }

  setLoadingAttendees(true);
  try {
    const response = await fetch(`/api/attendees/${productId}`);
    const data = await response.json();

    // Store in cache
    setAttendeeCache(prev => new Map(prev).set(productId, data));
    setAttendees(data);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    setAttendees([]);
  } finally {
    setLoadingAttendees(false);
  }
};
```

### Prefetch Implementation
```typescript
useEffect(() => {
  // Prefetch all attendee data after initial load
  const prefetchAttendees = async () => {
    for (const product of products) {
      if (!attendeeCache.has(product.id)) {
        // Low priority fetch
        fetch(`/api/attendees/${product.id}`, { priority: 'low' })
          .then(res => res.json())
          .then(data => {
            setAttendeeCache(prev => new Map(prev).set(product.id, data));
          })
          .catch(() => {}); // Silent fail for prefetch
      }
    }
  };

  if (products.length > 0) {
    // Start prefetching after 1 second delay
    const timer = setTimeout(prefetchAttendees, 1000);
    return () => clearTimeout(timer);
  }
}, [products]);
```

## Alternative: Server-Side Optimization

### Batch Query Approach
Create new endpoint `/api/all-attendees` that fetches all attendee data in one query:

```sql
WITH attendee_counts AS (
  SELECT
    product_id,
    COUNT(*) as total,
    COUNT(checked_in_at) as checked_in
  FROM attendees a
  JOIN orders o ON a.order_id = o.id
  WHERE a.deleted_at IS NULL
    AND o.deleted_at IS NULL
    AND o.status = 'COMPLETED'
  GROUP BY product_id
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
ORDER BY p.id;
```

## Performance Metrics
- Target: < 100ms for cached data retrieval
- Target: < 500ms for fresh data fetch
- Measure: Time between click and UI update

## Dependencies
- No new packages for simple cache
- Optional: `@tanstack/react-query` for advanced caching

## Testing Considerations
- Test with slow network throttling
- Verify cache invalidation works correctly
- Ensure memory usage stays reasonable with large datasets