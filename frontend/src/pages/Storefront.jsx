import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import ChatWidget from '../components/ChatWidget';

const API_URL = import.meta.env.VITE_API_URL;

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetch(`${API_URL}/api/products`)
      .then(r => r.json())
      .then(data => {
        if (!ignore) {
          setProducts(data);
          setLoading(false);
        }
      });
    return () => { ignore = true; };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Glow & Co.</h1>
        <p className="text-sm text-ink-muted">Skincare, chosen for you by our AI shopping assistant.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading && <p className="text-sm text-ink-muted">Loading products...</p>}
          {!loading && products.map(p => <ProductCard key={p._id} product={p} />)}
        </div>

        <div className="lg:sticky lg:top-6">
          <ChatWidget />
        </div>
      </div>
    </div>
  );
}