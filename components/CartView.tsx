"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";

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

const STORAGE_KEY = "guest-cart";

export default function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalCents, setTotalCents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const itemsCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  // Load cart from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed.items || []);
        setTotalCents(parsed.totalCents || 0);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, totalCents }));
    }
  }, [items, totalCents, isClient]);

  const updateCartItem = useCallback(async (variantId: string, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/variant/${variantId}`);
      if (!res.ok) {
        setError("Product not found");
        return;
      }
      const variant = await res.json();

      if (quantity > 0) {
        setItems((prev) => {
          const existing = prev.find((i) => i.variantId === variantId);
          if (existing) {
            return prev.map((i) =>
              i.variantId === variantId
                ? { ...i, quantity, lineTotalCents: quantity * i.unitPriceCents }
                : i
            );
          } else {
            const newItem: CartItem = {
              itemId: `${variantId}-${Date.now()}`,
              variantId,
              title: variant.productTitle || "Product",
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              imageUrl: variant.imageUrl,
              quantity,
              unitPriceCents: variant.priceCents,
              lineTotalCents: quantity * variant.priceCents,
            };
            return [...prev, newItem];
          }
        });
      }
    } catch {
      setError("Failed to update cart");
    } finally {
      setLoading(false);
    }
  }, []);

  async function updateQty(variantId: string, quantity: number) {
    if (quantity < 1) return;
    await updateCartItem(variantId, quantity);
  }

  async function removeItem(variantId: string) {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    setTotalCents((prev) => {
      const item = items.find((i) => i.variantId === variantId);
      return item ? prev - item.lineTotalCents : prev;
    });
  }

  if (!isClient) {
    return <div className="py-10 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Your cart</h1>
        <div className="text-sm text-slate-400">
          {itemsCount} item{itemsCount === 1 ? "" : "s"}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          {items.length === 0 ? (
            <div className="card p-5 text-sm text-slate-400">
              Your cart is empty.{" "}
              <Link href="/shop" className="font-semibold text-brand-400 hover:text-brand-300">
                Browse products
              </Link>
              .
            </div>
          ) : (
            items.map((it) => (
              <div key={it.itemId} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200">{it.title}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {[it.size, it.color, it.sku ? `SKU: ${it.sku}` : null]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                    <div className="mt-2 text-sm text-slate-400">
                      {formatCents(it.unitPriceCents)} each
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-brand-400">
                      {formatCents(it.lineTotalCents)}
                    </div>
                    <button
                      onClick={() => removeItem(it.variantId)}
                      disabled={loading}
                      className="mt-2 text-xs font-semibold text-rose-400 hover:text-rose-300 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-400">Qty</span>
                  <button
                    className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-60"
                    onClick={() => updateQty(it.variantId, Math.max(1, it.quantity - 1))}
                    disabled={loading}
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-white">{it.quantity}</span>
                  <button
                    className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-60"
                    onClick={() => updateQty(it.variantId, it.quantity + 1)}
                    disabled={loading}
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="card p-4 md:col-span-1">
          <div className="text-sm font-medium text-slate-300">Summary</div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-400">Subtotal</span>
            <span className="font-semibold text-white">{formatCents(totalCents)}</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Subtotal is the final total.
          </div>
          <Link
            href="/checkout"
            className="mt-4 block btn-primary text-center"
            aria-disabled={items.length === 0}
            onClick={(e) => {
              if (items.length === 0) e.preventDefault();
            }}
          >
            Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}

