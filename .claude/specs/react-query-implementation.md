# React Query Implementation Plan

## Why React Query is Perfect for This Use Case

Given the excellent database indexing, the performance bottleneck is on the client side:
- Multiple API calls when switching between days
- No caching between page visits
- Loading states feel slow due to network round trips
- React Query solves all of these elegantly

## Benefits for Our App

1. **Automatic Background Caching** - Once data is fetched, it's cached
2. **Stale-While-Revalidate** - Show cached data instantly, refresh in background
3. **Prefetching** - Load all days' data proactively
4. **Deduplication** - Multiple calls to same endpoint are batched
5. **Error Handling** - Built-in retry logic
6. **Loading States** - Sophisticated loading/error states

## Implementation Steps

### 1. Install React Query
```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

### 2. Setup Query Client Provider
```tsx
// app/layout.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            retry: 2,
            refetchOnWindowFocus: false, // Don't refetch on tab focus for internal app
          },
        },
      })
  );

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### 3. Create Custom Hooks
```tsx
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { Product } from '@/lib/db';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Products change rarely, cache for 10 min
  });
}
```

```tsx
// hooks/useAttendees.ts
import { useQuery } from '@tanstack/react-query';
import { Attendee } from '@/lib/db';

export function useAttendees(productId: number | null) {
  return useQuery({
    queryKey: ['attendees', productId],
    queryFn: async (): Promise<Attendee[]> => {
      if (!productId) return [];

      const response = await fetch(`/api/attendees/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch attendees');
      return response.json();
    },
    enabled: !!productId, // Only run when productId exists
    staleTime: 2 * 60 * 1000, // Attendee data changes more frequently
  });
}
```

### 4. Add Prefetching Hook
```tsx
// hooks/usePrefetchAttendees.ts
import { useQueryClient } from '@tanstack/react-query';
import { Product } from '@/lib/db';

export function usePrefetchAttendees(products: Product[]) {
  const queryClient = useQueryClient();

  const prefetchAll = () => {
    products.forEach((product) => {
      queryClient.prefetchQuery({
        queryKey: ['attendees', product.id],
        queryFn: async () => {
          const response = await fetch(`/api/attendees/${product.id}`);
          if (!response.ok) throw new Error('Failed to fetch attendees');
          return response.json();
        },
        staleTime: 2 * 60 * 1000,
      });
    });
  };

  return { prefetchAll };
}
```

### 5. Update Main Page Component
```tsx
// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ProductSelector from '@/components/ProductSelector';
import AttendeeList from '@/components/AttendeeList';
import { useProducts } from '@/hooks/useProducts';
import { useAttendees } from '@/hooks/useAttendees';
import { usePrefetchAttendees } from '@/hooks/usePrefetchAttendees';

export default function Home() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Fetch products
  const { data: products = [], isLoading: loadingProducts, error: productsError } = useProducts();

  // Fetch attendees for selected product
  const {
    data: attendees = [],
    isLoading: loadingAttendees,
    error: attendeesError
  } = useAttendees(selectedProductId);

  // Prefetch hook
  const { prefetchAll } = usePrefetchAttendees(products);

  // Auto-select first product and start prefetching
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);

      // Start prefetching other products after 1 second
      const timer = setTimeout(prefetchAll, 1000);
      return () => clearTimeout(timer);
    }
  }, [products, selectedProductId, prefetchAll]);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const parseClassInfo = (product: Product | undefined) => {
    if (!product) return { date: '', className: '' };

    const dateMatch = product.title.match(/^(Mon|Tues|Wed|Thurs|Fri|Sat|Sun)\s+\d+\s+\w+/);
    const descMatch = product.description.match(/<strong>(.*?)<\/strong>/);

    return {
      date: dateMatch ? dateMatch[0] : product.title,
      className: descMatch ? descMatch[1] : ''
    };
  };

  const { date, className } = parseClassInfo(selectedProduct);

  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Error loading class days. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Creative Collab Attendance</h1>
          {selectedProduct && (
            <p className="text-sm text-gray-600 mt-1">
              {date} - {className}
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {loadingProducts ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading class days...</p>
          </div>
        ) : (
          <>
            <ProductSelector
              products={products}
              selectedProductId={selectedProductId}
              onProductSelect={setSelectedProductId}
            />

            {selectedProductId && (
              <AttendeeList
                attendees={attendees}
                loading={loadingAttendees}
                error={attendeesError?.message}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
```

### 6. Update AttendeeList to Handle Errors
```tsx
// components/AttendeeList.tsx - Add error prop
interface AttendeeListProps {
  attendees: Attendee[];
  loading: boolean;
  error?: string;
}

export default function AttendeeList({ attendees, loading, error }: AttendeeListProps) {
  // ... existing code ...

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading attendees: {error}</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // ... rest of component
}
```

## Advanced Optimizations

### 1. Optimistic Updates (Future Enhancement)
```tsx
// For when we add check-in functionality
const checkInMutation = useMutation({
  mutationFn: (attendeeId: number) =>
    fetch(`/api/attendees/${attendeeId}/checkin`, { method: 'POST' }),
  onMutate: async (attendeeId) => {
    // Optimistically update the UI
    await queryClient.cancelQueries(['attendees', selectedProductId]);
    const previousAttendees = queryClient.getQueryData(['attendees', selectedProductId]);

    queryClient.setQueryData(['attendees', selectedProductId], (old: Attendee[]) =>
      old.map(a => a.id === attendeeId ? { ...a, checked_in_at: new Date() } : a)
    );

    return { previousAttendees };
  },
  onError: (err, attendeeId, context) => {
    // Rollback on error
    queryClient.setQueryData(['attendees', selectedProductId], context?.previousAttendees);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['attendees', selectedProductId]);
  },
});
```

### 2. Background Sync
```tsx
// Auto-refresh data every 30 seconds when app is visible
const { data: attendees } = useAttendees(selectedProductId, {
  refetchInterval: 30 * 1000,
  refetchIntervalInBackground: false,
});
```

## Performance Impact

### Before React Query
- Switch between days: 500-1000ms (network request every time)
- No caching
- Multiple requests for same data

### After React Query
- First load: 500-1000ms (same as before)
- Subsequent switches: <50ms (instant from cache)
- Background prefetching loads all data
- Automatic stale-while-revalidate keeps data fresh

## Development Benefits

1. **DevTools**: See all queries, cache status, timings
2. **Error Handling**: Centralized error states
3. **Loading States**: Fine-grained loading indicators
4. **Retry Logic**: Automatic retries on network failures
5. **Memory Management**: Automatic garbage collection of unused data

## Mobile Considerations

- **Offline Resilience**: Cached data works offline
- **Background Sync**: Updates when app regains focus
- **Reduced Data Usage**: Less redundant requests
- **Better UX**: Instant switching between days

## Configuration for Internal App

```tsx
// Optimized for internal use
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min - data doesn't change often
      cacheTime: 10 * 60 * 1000, // 10 min - keep in memory
      retry: 2, // Retry failed requests
      refetchOnWindowFocus: false, // Don't refetch on focus (internal app)
      refetchOnReconnect: true, // Do refetch when network reconnects
    },
  },
});
```

This setup will make the app feel instantaneous after the initial load!
