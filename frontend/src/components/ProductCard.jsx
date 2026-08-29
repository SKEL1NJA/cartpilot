export default function ProductCard({ product }) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{product.name}</h3>
        <span className="text-sm font-semibold text-ink whitespace-nowrap">
          ₹{(product.price / 100).toFixed(0)}
        </span>
      </div>
      <p className="text-xs text-ink-muted line-clamp-2">{product.description}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[11px] uppercase tracking-wide text-ink-muted border border-border rounded-full px-2 py-0.5">
          {product.category}
        </span>
        {product.stock < 10 && <span className="text-[11px] text-warning">Low stock</span>}
      </div>
    </div>
  );
}