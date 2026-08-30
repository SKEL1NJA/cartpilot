import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import ChatWidget from '../components/ChatWidget';
import { useConversation } from '../hooks/useConversation';
import { openCheckout } from '../lib/checkout';

const API_URL = import.meta.env.VITE_API_URL;

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const [statusById, setStatusById] = useState({});
  const { messages, sending, conversationId, decisions, sendMessage } = useConversation();

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

  function approvedDiscountFor(productId) {
    return decisions
      .filter(d =>
        d.decisionType === 'discount' &&
        (d.productId?._id === productId || d.productId === productId) &&
        (d.status === 'approved' || d.status === 'auto_approved')
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }

  function handleBuyNow(product) {
    setBuyingId(product._id);
    setStatusById(prev => ({ ...prev, [product._id]: '' }));

    const approved = approvedDiscountFor(product._id);

    openCheckout({
      productId: product._id,
      conversationId,
      discountPercent: approved?.discountPercent,
      onStatus: (msg) => setStatusById(prev => ({ ...prev, [product._id]: msg })),
      onSuccess: () => {
        setStatusById(prev => ({ ...prev, [product._id]: 'Payment successful!' }));
        setBuyingId(null);
      },
      onFailure: (msg) => {
        setStatusById(prev => ({ ...prev, [product._id]: `Payment failed: ${msg}` }));
        setBuyingId(null);
      }
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Glow & Co.</h1>
        <p className="text-sm text-ink-muted">Skincare, chosen for you by our AI shopping assistant.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading && <p className="text-sm text-ink-muted">Loading products...</p>}
          {!loading && products.map(p => (
            <ProductCard
              key={p._id}
              product={p}
              approvedDiscount={approvedDiscountFor(p._id)}
              onBuyNow={() => handleBuyNow(p)}
              buying={buyingId === p._id}
              statusMessage={statusById[p._id]}
            />
          ))}
        </div>

        <div className="lg:sticky lg:top-6">
          <ChatWidget messages={messages} sending={sending} onSend={sendMessage} />
        </div>
      </div>
    </div>
  );
}