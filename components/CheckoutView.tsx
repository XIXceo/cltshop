"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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

export default function CheckoutView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<CartItem[]>([]);
  const [totalCents, setTotalCents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const [shippingName, setShippingName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shippingName,
          phoneNumber,
          shippingAddress,
          items: items.map(it => ({
            variantId: it.variantId,
            quantity: it.quantity,
            unitPriceCents: it.unitPriceCents,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      // Clear cart after successful order
      localStorage.removeItem(STORAGE_KEY);
      setOrderComplete(true);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isClient) {
    return <div className="py-10 text-slate-400">Loading...</div>;
  }

  if (orderComplete) {
    return (
      <div className="card p-5 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Order Placed!</h1>
        <p className="text-slate-400 mb-6">
          Thank you for your order. We will contact you shortly to confirm delivery details.
        </p>
        <Link href="/shop" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <section className="md:col-span-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Checkout</h1>
          <p className="mt-1 text-sm text-slate-400">
            Complete your order below.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4 card p-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Full name
            </label>
            <input
              required
              value={shippingName}
              onChange={(e) => setShippingName(e.target.value)}
              className="mt-1 w-full input-field"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">
              Phone number
            </label>
            <input
              required
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 w-full input-field"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">
              Address
            </label>
            <input
              required
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="mt-1 w-full input-field"
              placeholder="Enter your delivery address"
            />
          </div>

          <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3 text-sm">
            <div className="font-semibold text-white">Payment</div>
            <div className="mt-1 text-slate-400">Payment will be collected at delivery.</div>
          </div>

          <button
            disabled={loading || items.length === 0}
            type="submit"
            className="w-full btn-primary py-3"
          >
            {loading ? "Processing..." : `Place order (${formatCents(totalCents)})`}
          </button>
        </form>
      </section>

      <aside className="card p-4 md:col-span-1">
        <div className="text-sm font-medium text-slate-300">
          Order summary
        </div>
        <div className="mt-3 text-sm text-slate-400">
          {itemsCount} item{itemsCount === 1 ? "" : "s"}
        </div>

        <div className="mt-3 space-y-2">
          {items.slice(0, 8).map((it) => (
            <div key={it.itemId} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-200">{it.title}</div>
                <div className="truncate text-xs text-slate-500">
                  {[it.size, it.color].filter(Boolean).join(" / ") || it.sku || "Default"}
                </div>
              </div>
              <div className="shrink-0 font-semibold text-slate-200">{it.quantity}×</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-sm">
          <span className="text-slate-400">Subtotal</span>
          <span className="font-semibold text-brand-400">{formatCents(totalCents)}</span>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          Total amount.
        </div>

        {searchParams.get("order") ? (
          <div className="mt-4 rounded-lg bg-slate-800/50 border border-slate-700 p-3 text-xs text-slate-400">
            Order placed. Check your <Link href="/account" className="font-semibold text-brand-400 hover:text-brand-300">account</Link>.
          </div>
        ) : null}

        <Link
          href="/cart"
          className="mt-4 block btn-secondary text-center"
        >
          Back to cart
        </Link>
      </aside>
    </div>
  );
}

