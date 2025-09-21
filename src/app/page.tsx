'use client';

import { useState, useEffect } from 'react';
import { Product, Attendee } from '@/lib/db';
import ProductSelector from '@/components/ProductSelector';
import AttendeeList from '@/components/AttendeeList';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchAttendees(selectedProductId);
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);

      // Auto-select first product if available
      if (data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchAttendees = async (productId: number) => {
    setLoadingAttendees(true);
    try {
      const response = await fetch(`/api/attendees/${productId}`);
      const data = await response.json();
      setAttendees(data);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      setAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Holiday Art Classes</h1>
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
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}