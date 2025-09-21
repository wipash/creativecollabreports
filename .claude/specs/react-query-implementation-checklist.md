# React Query Implementation Checklist

## Pre-Implementation
- [ ] Review current performance bottlenecks
- [ ] Confirm database indexes are optimal (✅ already verified)
- [ ] Backup current working state

## Step 1: Install Dependencies
```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

## Step 2: Setup Query Client Provider
- [ ] Create or update `app/layout.tsx` to wrap app in QueryClientProvider
- [ ] Configure optimal settings for internal app use:
  - [ ] `staleTime: 5 * 60 * 1000` (5 minutes)
  - [ ] `cacheTime: 10 * 60 * 1000` (10 minutes)
  - [ ] `refetchOnWindowFocus: false` (internal app)
  - [ ] `retry: 2`
- [ ] Add React Query DevTools for development

## Step 3: Create Custom Hooks
- [ ] Create `hooks/useProducts.ts`
  - [ ] Implement products query
  - [ ] Set longer staleTime (products change rarely)
  - [ ] Handle error states
- [ ] Create `hooks/useAttendees.ts`
  - [ ] Implement attendees query with productId dependency
  - [ ] Use `enabled: !!productId` to prevent unnecessary calls
  - [ ] Set appropriate staleTime for attendee data
- [ ] Create `hooks/usePrefetchAttendees.ts`
  - [ ] Implement background prefetching for all products
  - [ ] Use queryClient.prefetchQuery
  - [ ] Add delay before prefetching starts

## Step 4: Update Main Page Component
- [ ] Replace useState for products with useProducts hook
- [ ] Replace useState for attendees with useAttendees hook
- [ ] Remove manual fetch functions (fetchProducts, fetchAttendees)
- [ ] Update loading states to use query loading states
- [ ] Add error handling for both products and attendees
- [ ] Implement prefetching after first product selection
- [ ] Update auto-selection logic to work with React Query

## Step 5: Update AttendeeList Component
- [ ] Add error prop to component interface
- [ ] Implement error state UI with retry functionality
- [ ] Ensure loading states work properly
- [ ] Test error recovery

## Step 6: Optional Enhancements
- [ ] Add background refetch interval (e.g., 30 seconds)
- [ ] Implement optimistic updates for future check-in feature
- [ ] Add mutation for check-in functionality (future)
- [ ] Configure network retry strategies

## Step 7: Testing & Validation
- [ ] Test initial load performance
- [ ] Test switching between products (should be instant after cache)
- [ ] Test prefetching behavior
- [ ] Test network error scenarios
- [ ] Test offline behavior
- [ ] Test on mobile devices
- [ ] Verify DevTools show correct cache behavior
- [ ] Test with slow network throttling

## Step 8: Performance Measurement
- [ ] Measure initial load time (baseline)
- [ ] Measure subsequent product switches (<50ms target)
- [ ] Confirm prefetching works in background
- [ ] Verify memory usage is reasonable
- [ ] Test cache invalidation timing

## Step 9: Production Readiness
- [ ] Remove or configure DevTools for production
- [ ] Verify error boundaries work properly
- [ ] Test in production-like environment
- [ ] Document new behavior for users

## Rollback Plan
If issues arise:
- [ ] Keep current implementation in git branch
- [ ] Can quickly revert to useState approach
- [ ] Database queries remain unchanged (safe)

## Expected Performance Impact
**Before React Query:**
- Product switch: 500-1000ms (network request every time)
- No caching between switches
- Multiple requests for same data

**After React Query:**
- First product load: 500-1000ms (same as before)
- Subsequent switches: <50ms (instant from cache)
- Background prefetching loads all data
- Stale-while-revalidate keeps data fresh

## Files to Modify
1. `package.json` - add dependencies
2. `app/layout.tsx` - add QueryClientProvider
3. `hooks/useProducts.ts` - new file
4. `hooks/useAttendees.ts` - new file
5. `hooks/usePrefetchAttendees.ts` - new file
6. `app/page.tsx` - major refactor to use hooks
7. `components/AttendeeList.tsx` - add error handling

## Files to Create
- `hooks/` directory if it doesn't exist
- Custom hook files as listed above

## Key Implementation Notes
- Use `'use client'` directive for all files using React Query hooks
- Ensure proper TypeScript types for all queries
- Handle loading and error states consistently
- Use queryKey arrays for proper cache invalidation
- Configure appropriate staleTime for each query type

## Success Criteria
- ✅ App loads in same time as before
- ✅ Switching between products is near-instant after first load
- ✅ All data prefetches in background
- ✅ Network errors are handled gracefully
- ✅ DevTools show proper cache behavior
- ✅ Mobile performance is improved
- ✅ No regressions in functionality