'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/db';
import ProductSelector from '@/components/ProductSelector';
import AttendeeList from '@/components/AttendeeList';
import { useProducts } from '@/hooks/useProducts';
import { useAttendees } from '@/hooks/useAttendees';
import { usePrefetchAttendees } from '@/hooks/usePrefetchAttendees';

export default function Home() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

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
