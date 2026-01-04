'use client';

import { Suspense, useEffect } from 'react';
import { Product } from '@/lib/db';
import ProductSelector from '@/components/ProductSelector';
import EventSelector from '@/components/EventSelector';
import AttendeeList from '@/components/AttendeeList';
import { useProducts } from '@/hooks/useProducts';
import { useAttendees } from '@/hooks/useAttendees';
import { usePrefetchAttendees } from '@/hooks/usePrefetchAttendees';
import { useEvents } from '@/hooks/useEvents';
import { useEventSelection } from '@/hooks/useEventSelection';
import { findCurrentDayProduct, parseProductTitle } from '@/utils/dateUtils';

function HomeContent() {
  // Fetch events using React Query
  const { data: events = [], isLoading: loadingEvents, error: eventsError } = useEvents();

  // Event selection with URL state and smart defaults
  const {
    selectedEventId,
    selectedTicketId,
    selectedEvent,
    selectEvent,
    selectTicket,
    isHydrated,
  } = useEventSelection(events);

  // Fetch products for selected event
  const {
    data: products = [],
    isLoading: loadingProducts,
    error: productsError
  } = useProducts(selectedEventId);

  // Fetch attendees for selected ticket
  const {
    data: attendees = [],
    isLoading: loadingAttendees,
    error: attendeesError
  } = useAttendees(selectedTicketId);

  // Prefetch hook
  const { prefetchAll } = usePrefetchAttendees(products);

  // Auto-select ticket and start prefetching when products load
  useEffect(() => {
    if (products.length > 0 && !selectedTicketId && isHydrated) {
      // Try to find today's class first
      const todayProduct = findCurrentDayProduct(products);
      const productToSelect = todayProduct || products[0];
      selectTicket(productToSelect.id);

      // Start prefetching other products after 1 second
      const timer = setTimeout(prefetchAll, 1000);
      return () => clearTimeout(timer);
    }
  }, [products, selectedTicketId, isHydrated, selectTicket, prefetchAll]);

  const selectedProduct = products.find(p => p.id === selectedTicketId);
  const parseClassInfo = (product: Product | undefined) => {
    if (!product) return { date: '', className: '' };

    const parsed = parseProductTitle(product.title, product.description);

    if (parsed.type === 'date') {
      return { date: parsed.date, className: parsed.className };
    }

    return { date: parsed.title, className: '' };
  };

  const { date, className } = parseClassInfo(selectedProduct);

  if (eventsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Error loading events. Please refresh the page.</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Error loading class days. Please refresh the page.</p>
      </div>
    );
  }

  const isLoading = loadingEvents || !isHydrated;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Creative Collab Attendance</h1>
              {selectedEvent && (
                <p className="text-sm text-gray-600 mt-0.5">{selectedEvent.title}</p>
              )}
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {date}{className && ` - ${className}`}
                </p>
              )}
            </div>
            {!isLoading && events.length > 0 && (
              <EventSelector
                events={events}
                selectedEventId={selectedEventId}
                onEventSelect={selectEvent}
              />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {isLoading || loadingProducts ? (
          <>
            {/* Skeleton for ProductSelector */}
            <div className="w-full">
              {/* Mobile skeleton */}
              <div className="sm:hidden">
                <div className="bg-white rounded-lg border shadow-sm p-4">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Desktop skeleton */}
              <div className="hidden sm:block">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skeleton for AttendeeList */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
                <div className="h-10 w-full sm:w-72 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <ProductSelector
              products={products}
              selectedProductId={selectedTicketId}
              onProductSelect={selectTicket}
            />

            {selectedTicketId && (
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
