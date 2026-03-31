"use client";

import { useMemo, useState } from "react";

import { formatCents } from "@/lib/money";

type CartItem = {
  itemId: string;
  variantId: string;
  title: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

type Variant = {
  id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  priceCents: number;
  stockQty: number;
};

const STORAGE_KEY = "guest-cart";

// Icons
function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

export default function AddToCartForm({
  productTitle,
  imageUrl,
  variants,
}: {
  productTitle: string;
  imageUrl: string | null;
  variants: Variant[];
}) {
  const [variantId, setVariantId] = useState<string>(variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const selected = useMemo(
    () => variants.find((v) => v.id === variantId) ?? variants[0],
    [variantId, variants],
  );

  const canAdd = !!selected && selected.stockQty > 0;

  async function addToCart() {
    if (!canAdd || !selected) return;
    setError(null);
    setLoading(true);
    try {
      // Get existing cart from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      let cart: { items: CartItem[]; totalCents: number } = { items: [], totalCents: 0 };
      if (stored) {
        try {
          cart = JSON.parse(stored);
        } catch {
          cart = { items: [], totalCents: 0 };
        }
      }

      const existingItem = cart.items.find((i) => i.variantId === selected.id);
      const newQuantity = existingItem ? existingItem.quantity + qty : qty;
      const lineTotalCents = newQuantity * selected.priceCents;

      if (existingItem) {
        // Update existing item
        cart.items = cart.items.map((i) =>
          i.variantId === selected.id
            ? { ...i, quantity: newQuantity, lineTotalCents }
            : i
        );
      } else {
        // Add new item
        const label = [selected.size, selected.color].filter(Boolean).join(" / ") || selected.sku || "Default";
        const newItem: CartItem = {
          itemId: `${selected.id}-${Date.now()}`,
          variantId: selected.id,
          title: `${productTitle} - ${label}`,
          sku: selected.sku,
          size: selected.size,
          color: selected.color,
          imageUrl,
          quantity: newQuantity,
          unitPriceCents: selected.priceCents,
          lineTotalCents,
        };
        cart.items.push(newItem);
      }

      // Recalculate total
      cart.totalCents = cart.items.reduce((sum, i) => sum + i.lineTotalCents, 0);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      setError("Failed to add to cart");
    } finally {
      setLoading(false);
    }
  }

  const decreaseQty = () => setQty(Math.max(1, qty - 1));
  const increaseQty = () => setQty(Math.min(selected?.stockQty ?? 1, qty + 1));

  return (
    <div className="card p-5">
      {/* Price display */}
      <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-slate-800">
        <span className="text-sm font-medium text-slate-400">Price</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-400">{formatCents(selected?.priceCents ?? 0)}</span>
          <span className={`text-sm ${selected?.stockQty > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {selected?.stockQty > 0 ? `${selected.stockQty} in stock` : "Out of stock"}
          </span>
        </div>
      </div>

      {/* Variant selector */}
      {variants.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Select Option
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {variants.map((v) => {
              const label = [v.size, v.color].filter(Boolean).join(" / ") || v.sku || "Default";
              const isSelected = variantId === v.id;
              const isOutOfStock = v.stockQty <= 0;
              
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  disabled={isOutOfStock}
                  className={`relative flex flex-col items-start p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  } ${isOutOfStock ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className="font-medium text-sm text-slate-200">{label}</span>
                  <span className="text-xs text-slate-500">{formatCents(v.priceCents)}</span>
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity selector */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={decreaseQty}
            disabled={qty <= 1}
            className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-40 transition-colors"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <span className="w-12 text-center font-semibold text-white">{qty}</span>
          <button
            onClick={increaseQty}
            disabled={qty >= (selected?.stockQty ?? 1)}
            className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-40 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Add to cart button */}
      <button
        onClick={addToCart}
        disabled={!canAdd || loading}
        className="w-full btn-primary py-3 text-base"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Adding...
          </span>
        ) : added ? (
          <span className="flex items-center justify-center gap-2 text-emerald-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Added!
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <ShoppingBagIcon className="w-5 h-5" />
            {selected?.stockQty > 0 ? "Add to Cart" : "Out of Stock"}
          </span>
        )}
      </button>
    </div>
  );
}

