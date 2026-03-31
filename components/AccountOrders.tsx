"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { formatCents } from "@/lib/money";

type Order = {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string | Date;
  itemsCount: number;
  items: Array<{
    id: string;
    productTitle: string;
    variantSize: string | null;
    variantColor: string | null;
    variantSku: string | null;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};

function statusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/10 text-amber-400 ring-amber-500/20";
    case "PAID":
      return "bg-brand-500/10 text-brand-400 ring-brand-500/20";
    case "SHIPPED":
      return "bg-blue-500/10 text-blue-400 ring-blue-500/20";
    case "DELIVERED":
      return "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20";
    case "CANCELLED":
      return "bg-rose-500/10 text-rose-400 ring-rose-500/20";
    default:
      return "bg-slate-800 text-slate-400 ring-slate-700";
  }
}

export default function AccountOrders() {
  const searchParams = useSearchParams();
  const orderParam = searchParams.get("order");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/orders");
      if (!res.ok) {
        setError("Failed to load orders");
        return;
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Account</h1>
          <p className="mt-1 text-sm text-slate-400">Your orders and order status.</p>
        </div>
        <Link href="/shop" className="btn-secondary">
          Keep shopping
        </Link>
      </div>

      {orderParam ? (
        <div className="rounded-lg bg-brand-500/10 border border-brand-500/20 p-3 text-sm text-brand-400">
          Order placed successfully. It will appear below.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-10 text-sm text-slate-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="card p-5 text-sm text-slate-400">
          No orders yet.{" "}
          <Link href="/shop" className="font-semibold text-brand-400 hover:text-brand-300">
            Start shopping
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[240px]">
                  <div className="text-sm font-medium text-slate-400">Order</div>
                  <div className="mt-1 font-semibold text-slate-200">{o.id}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusColor(o.status)}`}>
                  {o.status}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {o.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-200">{it.productTitle}</div>
                      <div className="truncate text-xs text-slate-500">
                        {[it.variantSize, it.variantColor].filter(Boolean).join(" / ") || it.variantSku || "Default"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-200">
                        {it.quantity} × {formatCents(it.unitPriceCents)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Line: {formatCents(it.lineTotalCents)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                <div className="text-sm font-medium text-slate-400">
                  {o.itemsCount} item{o.itemsCount === 1 ? "" : "s"}
                </div>
                <div className="text-sm font-semibold text-brand-400">
                  Total: {formatCents(o.totalCents)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

