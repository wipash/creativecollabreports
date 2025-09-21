'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/db';
import ProductSelector from '@/components/ProductSelector';
import AttendeeList from '@/components/AttendeeList';
import { useProducts } from '@/hooks/useProducts';
import { useAttendees } from '@/hooks/useAttendees';
import { usePrefetchAttendees } from '@/hooks/usePrefetchAttendees';
import { findCurrentDayProduct } from '@/utils/dateUtils';

export default function Home() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Fetch products using React Query
  const { data: products = [], isLoading: loadingProducts, error: productsError } = useProducts();

  // Fetch attendees for selected product using React Query
  const {
    data: attendees = [],
    isLoading: loadingAttendees,
    error: attendeesError
  } = useAttendees(selectedProductId);

  // Prefetch hook
  const { prefetchAll } = usePrefetchAttendees(products);

  // Auto-select current day or first product and start prefetching
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      // Try to find today's class first
      const todayProduct = findCurrentDayProduct(products);
      const productToSelect = todayProduct || products[0];

      setSelectedProductId(productToSelect.id);

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
