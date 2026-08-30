export default function ProductCard({ product, approvedDiscount, onBuyNow, buying, statusMessage }) {
  const hasDiscount = Boolean(approvedDiscount?.discountPercent);
  const finalPrice = hasDiscount
    ? Math.round(product.price * (1 - approvedDiscount.discountPercent / 100))
    : product.price;

  return (
    <div className="bg-white border border-border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{product.name}</h3>
        <div className="text-right">
          {hasDiscount && (
            <span className="block text-xs text-ink-muted line-through">₹{(product.price / 100).toFixed(0)}</span>
          )}
          <span className="text-sm font-semibold text-ink whitespace-nowrap">
            ₹{(finalPrice / 100).toFixed(0)}
          </span>
        </div>
      </div>

      <p className="text-xs text-ink-muted line-clamp-2">{product.description}</p>

      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-[11px] uppercase tracking-wide text-ink-muted border border-border rounded-full px-2 py-0.5">
          {product.category}
        </span>
        {product.stock < 10 && <span className="text-[11px] text-warning">Low stock</span>}
        {hasDiscount && (
          <span className="text-[11px] text-success">{approvedDiscount.discountPercent}% off approved</span>
        )}
      </div>

      <button
        onClick={onBuyNow}
        disabled={buying}
        className="mt-2 rounded-md bg-accent text-white px-3 py-1.5 text-xs font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buying ? 'Processing...' : 'Buy Now'}
      </button>

      {statusMessage && <p className="text-[11px] text-ink-muted">{statusMessage}</p>}
    </div>
  );
}